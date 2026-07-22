import React from "react";

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white px-6">
        <img src="/manus-storage/logo_941d1a40.png" alt="تأميني" className="w-20 h-20 mx-auto mb-4 rounded-xl object-cover" />
        <h1 className="text-2xl font-bold mb-3">تم حظر وصولك</h1>
        <p className="text-gray-400 text-sm">لقد تم حظر وصولك إلى هذه الخدمة. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم.</p>
      </div>
    </div>
  );
}

