import React from "react";
import { Link } from "wouter";

interface Props {
  showLogin?: boolean;
}

export default function InsuranceHeader({ showLogin = false }: Props) {
  return (
    <header className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-white">
      <Link href="/" className="flex items-center gap-2">
        <img src="/assets/logo/logo-180.png" alt="تأميني" className="w-9 h-9 rounded-lg object-cover" />
        <span className="font-bold text-blue-600 text-lg">تأميني</span>
      </Link>
      {showLogin && (
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          تسجيل الدخول
        </Link>
      )}
    </header>
  );
}
