import React, { useState } from "react";
import { useLocation } from "wouter";
import InsuranceHeader from "@/components/InsuranceHeader";
import InsuranceStepper from "@/components/InsuranceStepper";
import LoadingOverlay from "@/components/LoadingOverlay";
import StepLoadingScreen from "@/components/StepLoadingScreen";
import { trpc } from "@/lib/trpc";
import { useVisitorSession } from "@/hooks/useVisitorSession";
import { useVisitorGuard } from "@/hooks/useVisitorGuard";

type InsurancePlan = {
  name: string;
  price: number;
};

type InsuranceCompany = {
  company: string;
  logo: string;
  rating?: string;
  badge?: string;
  highlight?: boolean;
  plans: InsurancePlan[];
  descriptions: Record<string, string>;
};

const COMPANIES: InsuranceCompany[] = [
  {
    company: "التعاونية للتأمين",
    logo: "/company-logos/IMG_5257.PNG",
    rating: "4.8",
    badge: "الأكثر طلباً",
    highlight: true,
    plans: [
      { name: "ضد الغير", price: 540 },
      { name: "تأمين شامل", price: 1800 },
    ],
    descriptions: {
      "ضد الغير": "يغطي أضرار الطرف الثالث فقط حسب وثيقة التأمين.",
      "تأمين شامل": "يغطي أضرار سيارتك + أضرار الغير + بعض المخاطر الأخرى (سرقة، حريق) حسب الشروط.",
    },
  },
  {
    company: "ميدغلف",
    logo: "/company-logos/IMG_5267.PNG",
    plans: [
      { name: "ضد الغير", price: 468 },
      { name: "تأمين شامل", price: 1600 },
    ],
    descriptions: {
      "ضد الغير": "تغطية المسؤولية تجاه الغير فقط.",
      "تأمين شامل": "تغطية أوسع لحوادث المركبة مع الطرف الثالث.",
    },
  },
  {
    company: "شركة ولاء للتأمين",
    logo: "/company-logos/IMG_5268.PNG",
    plans: [
      { name: "ضد الغير", price: 492 },
      { name: "تأمين شامل", price: 1700 },
    ],
    descriptions: {
      "ضد الغير": "أضرار الغير فقط (ممتلكات أو أشخاص).",
      "تأمين شامل": "تغطية أوسع لحوادث التصادم والأضرار الجزئية.",
    },
  },
  {
    company: "سلامة للتأمين",
    logo: "/company-logos/IMG_5271.WEBP",
    plans: [
      { name: "ضد الغير", price: 432 },
      { name: "تأمين شامل", price: 1500 },
    ],
    descriptions: {
      "ضد الغير": "يغطي تعويضات الطرف الثالث.",
      "تأمين شامل": "يشمل أضرار المركبة المؤمن عليها.",
    },
  },
  {
    company: "أسيج للتأمين",
    logo: "/company-logos/IMG_5264.PNG",
    plans: [
      { name: "ضد الغير", price: 408 },
      { name: "تأمين شامل", price: 1450 },
    ],
    descriptions: {
      "ضد الغير": "تغطية أساسية حسب الأنظمة.",
      "تأمين شامل": "تغطية موسعة داخل حدود الوثيقة.",
    },
  },
  {
    company: "الدرع العربي للتأمين",
    logo: "/company-logos/IMG_5265.PNG",
    plans: [
      { name: "ضد الغير", price: 504 },
      { name: "تأمين شامل", price: 1650 },
    ],
    descriptions: {
      "ضد الغير": "يحمي من مطالبات الغير فقط.",
      "تأمين شامل": "يشمل أضرار المركبة المؤمن عليها.",
    },
  },
  {
    company: "ملاذ للتأمين",
    logo: "/company-logos/IMG_5269.PNG",
    plans: [
      { name: "ضد الغير", price: 516 },
      { name: "تأمين شامل", price: 1700 },
    ],
    descriptions: {
      "ضد الغير": "التزام قانوني تجاه الغير.",
      "تأمين شامل": "تغطية أوسع لحوادث وتلفيات المركبة.",
    },
  },
  {
    company: "بروج للتأمين التعاوني",
    logo: "/company-logos/IMG_5260.PNG",
    plans: [
      { name: "ضد الغير", price: 480 },
      { name: "تأمين شامل", price: 1600 },
    ],
    descriptions: {
      "ضد الغير": "يغطي فقط ما تلزم به تجاه الآخرين.",
      "تأمين شامل": "يغطي مركبتك والغير ضمن حدود الوثيقة.",
    },
  },
  {
    company: "اتحاد الخليج الأهلية للتأمين",
    logo: "/company-logos/IMG_5262.PNG",
    plans: [
      { name: "ضد الغير", price: 456 },
      { name: "تأمين شامل", price: 1500 },
    ],
    descriptions: {
      "ضد الغير": "يغطي أضرار الغير الناتجة عن الحوادث.",
      "تأمين شامل": "يشمل أضرار مركبتك كذلك حسب البوليصة.",
    },
  },
  {
    company: "تكافل الراجحي",
    logo: "/company-logos/IMG_5258.PNG",
    badge: "الأكثر توفيراً",
    highlight: true,
    plans: [
      { name: "ضد الغير", price: 504 },
      { name: "تأمين شامل", price: 1750 },
    ],
    descriptions: {
      "ضد الغير": "يغطي التزامك النظامي تجاه الغير.",
      "تأمين شامل": "يغطي أضرار مركبتك مع مزايا إضافية حسب الشروط.",
    },
  },
  {
    company: "أكسا للتأمين",
    logo: "/company-logos/IMG_5259.PNG",
    plans: [
      { name: "ضد الغير", price: 480 },
      { name: "تأمين شامل", price: 1650 },
    ],
    descriptions: {
      "ضد الغير": "يغطي الأضرار للطرف الثالث.",
      "تأمين شامل": "يغطي مركبتك والغير حسب الوثيقة.",
    },
  },
  {
    company: "بوبا للتأمين",
    logo: "/company-logos/IMG_5270.PNG",
    badge: "الأعلى تغطية",
    highlight: true,
    plans: [
      { name: "ضد الغير", price: 444 },
      { name: "تأمين شامل", price: 1550 },
    ],
    descriptions: {
      "ضد الغير": "تغطية أساسية للغير.",
      "تأمين شامل": "تغطية إضافية للمركبة.",
    },
  },
  {
    company: "مجموعة الخليج للتأمين (جي آي جي)",
    logo: "/company-logos/IMG_5263.PNG",
    plans: [
      { name: "ضد الغير", price: 456 },
      { name: "تأمين شامل", price: 1580 },
    ],
    descriptions: {
      "ضد الغير": "يغطي أضرار الغير.",
      "تأمين شامل": "تغطية موسعة للمركبة.",
    },
  },
  {
    company: "الصقر للتأمين",
    logo: "/company-logos/IMG_5261.PNG",
    plans: [
      { name: "ضد الغير", price: 432 },
      { name: "تأمين شامل", price: 1520 },
    ],
    descriptions: {
      "ضد الغير": "يغطي المسؤولية تجاه الغير.",
      "تأمين شامل": "يشمل تغطية مركبتك كذلك.",
    },
  },
];

function getPlanId(company: string, planName: string) {
  return `${company}::${planName}`;
}

export default function Step3Plans() {
  const [, navigate] = useLocation();
  const { sessionId, visitorIp, saveData } = useVisitorSession();
  const guard = useVisitorGuard(visitorIp);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState("");
  const upsertMutation = trpc.insurance.upsert.useMutation();

  const selectedPlan = COMPANIES.flatMap((company) =>
    company.plans.map((plan) => ({ company: company.company, ...plan })),
  ).find((plan) => getPlanId(plan.company, plan.name) === selectedPlanId);

  async function handleContinue(company: string, name: string, price: number) {
    if (isLoading) return;

    setError("");
    setIsLoading(true);
    saveData({ planCompany: company, planName: name, planPrice: price });
    await upsertMutation.mutateAsync({
      sessionId,
      visitorIp,
      planCompany: company,
      planName: name,
      planPrice: price,
      currentStep: 4,
    });
    setTimeout(() => {
      setIsLoading(false);
      navigate("/insurance/step4");
    }, 800);
  }

  function handleCompanyNext(company: InsuranceCompany) {
    const plan = company.plans.find(
      (item) => getPlanId(company.company, item.name) === selectedPlanId,
    );

    if (!plan) {
      setError("الرجاء اختيار خطة لهذه الشركة قبل المتابعة.");
      return;
    }

    void handleContinue(company.company, plan.name, plan.price);
  }

  function handleMainNext() {
    if (!selectedPlan) {
      setError("الرجاء اختيار شركة وخطة.");
      return;
    }

    void handleContinue(selectedPlan.company, selectedPlan.name, selectedPlan.price);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen flex flex-col">
        <InsuranceHeader />
        <InsuranceStepper currentStep={3} />
        <main className="flex-1 px-4 py-5">
          <h2 className="text-base font-bold mb-4 text-gray-800">اختر خطة التأمين</h2>

          <div className="prices-plans">
            {COMPANIES.map((company) => (
              <div
                key={company.company}
                className={`plan-card${company.highlight ? " highlight-card" : ""}`}
              >
                {company.badge && <div className="best-badge">{company.badge}</div>}

                <div className="company-name">
                  <img
                    alt={company.company}
                    className="company-logo"
                    src={company.logo}
                  />
                  <span>{company.company}</span>
                </div>

                {company.rating && (
                  <div className="rating-line">
                    تقييم العملاء ⭐⭐⭐⭐⭐ ({company.rating})
                  </div>
                )}

                {company.plans.map((plan) => {
                  const id = getPlanId(company.company, plan.name);
                  return (
                    <div className="plan-row" key={id}>
                      <div className="plan-info">
                        <span className="plan-title">{plan.name}</span>
                        <span className="plan-price">
                          {plan.price.toLocaleString("ar-SA")} ريال / سنة
                        </span>
                      </div>
                      <label className="plan-choice" htmlFor={id}>
                        <input
                          checked={selectedPlanId === id}
                          className="plan-radio"
                          id={id}
                          name="plan"
                          onChange={() => {
                            setSelectedPlanId(id);
                            setError("");
                          }}
                          type="radio"
                        />
                        اختيار
                      </label>
                    </div>
                  );
                })}

                <div className="plan-features">
                  {Object.entries(company.descriptions).map(([name, description]) => (
                    <p key={name}>
                      <strong>{name}:</strong> {description}
                    </p>
                  ))}
                </div>

                <button
                  className="plan-next-btn"
                  disabled={isLoading}
                  onClick={() => handleCompanyNext(company)}
                  type="button"
                >
                  التالي
                </button>
              </div>
            ))}
          </div>

          {error && <div className="plan-error">{error}</div>}

          <div className="plan-buttons-row">
            <button
              className="plan-page-btn plan-page-btn-secondary"
              disabled={isLoading}
              onClick={() => navigate("/insurance/step2")}
              type="button"
            >
              السابق
            </button>
            <button
              className="plan-page-btn plan-page-btn-primary"
              disabled={isLoading}
              onClick={handleMainNext}
              type="button"
            >
              التالي
            </button>
          </div>
        </main>
        <LoadingOverlay
          show={guard.loading}
          text={guard.loadingText}
          subtext={guard.loadingSubtext}
        />
        <StepLoadingScreen show={isLoading} />
      </div>
    </div>
  );
}
