import React from "react";

interface Props {
  show: boolean;
}

export default function StepLoadingScreen({ show }: Props) {
  return (
    <div className={`loading-screen ${show ? "show" : ""}`}>
      <div className="loading-content">
        <div className="loading-dots">
          <div />
          <div />
          <div />
        </div>
        <div className="loading-text">جاري التحميل...</div>
        <div className="loading-subtext">يرجى الانتظار</div>
      </div>
    </div>
  );
}
