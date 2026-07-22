import React from "react";

interface Props {
  show: boolean;
  text?: string;
  subtext?: string;
}

export default function LoadingOverlay({ show, text = "جاري التحميل...", subtext = "يرجى الانتظار" }: Props) {
  return (
    <div className={`loading-screen ${show ? "show" : ""}`}>
      <div className="loading-content">
        <div className="loading-dots">
          <div />
          <div />
          <div />
        </div>
        <div className="loading-text">{text}</div>
        <div className="loading-subtext">{subtext}</div>
      </div>
    </div>
  );
}
