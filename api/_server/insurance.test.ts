import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertInsuranceRequest: vi.fn().mockResolvedValue({
    id: 1,
    sessionId: "test-session",
    visitorIp: "1.2.3.4",
    userName: "أحمد محمد",
    phoneNumber: "0512345678",
    idNumber: "1234567890",
    status: "in_progress",
    currentStep: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getAllInsuranceRequests: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  getInsuranceRequestById: vi.fn().mockResolvedValue(null),
  getInsuranceStats: vi.fn().mockResolvedValue({ total: 0, today: 0, totalAmount: 0, topPlans: [] }),
  isIpBanned: vi.fn().mockResolvedValue(false),
  banIp: vi.fn().mockResolvedValue(undefined),
  unbanIp: vi.fn().mockResolvedValue(undefined),
  getAllBannedIps: vi.fn().mockResolvedValue([]),
  getLoadingScreenSetting: vi.fn().mockResolvedValue(null),
  setLoadingScreenSetting: vi.fn().mockResolvedValue(undefined),
  createNavigationCommand: vi.fn().mockResolvedValue(undefined),
  getPendingNavigationCommand: vi.fn().mockResolvedValue(null),
  markNavigationCommandExecuted: vi.fn().mockResolvedValue(undefined),
}));

// Mock socket module
vi.mock("./socket", () => ({
  emitToAdmins: vi.fn(),
  emitToVisitor: vi.fn(),
  emitToAll: vi.fn(),
  getIO: vi.fn(),
  initSocketIO: vi.fn(),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin",
      email: "admin@test.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("insurance.upsert", () => {
  it("يجب أن يحفظ بيانات الطلب بنجاح", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.insurance.upsert({
      sessionId: "test-session",
      visitorIp: "1.2.3.4",
      userName: "أحمد محمد",
      phoneNumber: "0512345678",
      idNumber: "1234567890",
      currentStep: 1,
    });
    expect(result).toBeTruthy();
    expect(result?.sessionId).toBe("test-session");
  });
});

describe("insurance.checkBanned", () => {
  it("يجب أن يعيد false للـ IP غير المحظور", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.insurance.checkBanned({ ip: "1.2.3.4" });
    expect(result.banned).toBe(false);
  });
});

describe("insurance.getLoadingScreen", () => {
  it("يجب أن يعيد الإعدادات الافتراضية عند عدم وجود إعداد", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.insurance.getLoadingScreen({ ip: "1.2.3.4" });
    expect(result.isActive).toBe(false);
    expect(result.loadingText).toBeDefined();
  });
});

describe("admin.getStats", () => {
  it("يجب أن يعيد الإحصائيات للمشرف", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.getStats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("today");
    expect(result).toHaveProperty("totalAmount");
  });
});

describe("admin.listRequests", () => {
  it("يجب أن يعيد قائمة الطلبات للمشرف", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.listRequests({});
    expect(result).toHaveProperty("rows");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.rows)).toBe(true);
  });
});

describe("admin.banIp", () => {
  it("يجب أن يحظر IP بنجاح", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.banIp({ ip: "1.2.3.4", reason: "اختبار" });
    expect(result.success).toBe(true);
  });
});

describe("admin.navigateTo", () => {
  it("يجب أن يرسل أمر التوجيه بنجاح", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.navigateTo({ ip: "1.2.3.4", page: "/insurance/step1" });
    expect(result.success).toBe(true);
  });
});

describe("admin.setLoadingScreen", () => {
  it("يجب أن يحدث شاشة التحميل بنجاح", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.admin.setLoadingScreen({ ip: "1.2.3.4", isActive: true, loadingText: "جاري...", loadingSubtext: "انتظر" });
    expect(result.success).toBe(true);
  });
});

describe("auth.logout", () => {
  it("يجب أن يمسح الـ cookie ويعيد success", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
