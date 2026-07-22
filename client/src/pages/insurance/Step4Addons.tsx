import React, { useState } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import InsuranceStepper from "@/components/InsuranceStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import StepLoadingScreen from "@/components/StepLoadingScreen";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";

const ADDONS = [
  { name: "مساعدة على الطريق", price: 75 },
  { name: "إصلاح لدى الوكيل", price: 150 },
  { name: "سيارة بديلة أثناء الإصلاح", price: 120 },
  { name: "تغطية زجاج المركبة", price: 50 },
];

export default function Step4Addons() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, saveData, getStoredData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const upsertMutation = trpc.insurance.upsert.useMutation();
  const stored = getStoredData();
  const planPrice = (stored.planPrice as number) ?? 0;

  function toggleAddon(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  const addonsTotal = ADDONS.filter(a => selected.includes(a.name)).reduce((s, a) => s + a.price, 0);
  const total = planPrice + addonsTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const addonsData = ADDONS.filter(a => selected.includes(a.name));
    const addonsStr = JSON.stringify(addonsData);
    saveData({ addons: addonsStr, addonsTotal, total });
    await upsertMutation.mutateAsync({ sessionId, visitorIp, addons: addonsStr, addonsTotal, total, currentStep: 5 });
    setTimeout(() => {
      setIsLoading(false);
      navigate("/insurance/step5");
    }, 800);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader />
        <InsuranceStepper currentStep={4} />
        <main className="flex-1 px-4 py-5">
          <h2 className="text-base font-bold mb-1 text-gray-800">الإضافات على الوثيقة</h2>
          <p className="text-sm text-gray-500 mb-4">اختر الإضافات التي ترغب بها (اختياري).</p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-2 mb-6">
              {ADDONS.map(addon => (
                <label key={addon.name} className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${selected.includes(addon.name) ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selected.includes(addon.name)} onChange={() => toggleAddon(addon.name)} className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{addon.name}</span>
                  </div>
                  <span className="text-sm text-blue-600 font-bold">+ {addon.price} ريال</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/insurance/step3")} className="flex-1 py-3.5 border border-gray-300 text-gray-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all">السابق</button>
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
