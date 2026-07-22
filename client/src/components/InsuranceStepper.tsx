import React from "react";

const STEPS = [
  { id: 1, label: "البيانات الأساسية" },
  { id: 2, label: "بيانات التأمين" },
  { id: 3, label: "قائمة الأسعار" },
  { id: 4, label: "الإضافات" },
  { id: 5, label: "الملخص والدفع" },
];

interface Props {
  currentStep: number;
}

export default function InsuranceStepper({ currentStep }: Props) {
  return (
    <div className="flex justify-between px-4 py-3 text-xs border-b border-gray-100 bg-white">
      {STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        return (
          <div key={step.id} className="stepper-step flex-1 text-center">
            <div
              className={`step-circle mx-auto mb-1 ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              {isCompleted ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span className={`step-label block ${isActive ? "active" : ""}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
