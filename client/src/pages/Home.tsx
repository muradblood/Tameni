import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      title: "مقارنة الأسعار",
      desc: "قارن بين عروض أفضل شركات التأمين واختر الأنسب لك",
      color: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "إصدار فوري",
      desc: "احصل على وثيقة التأمين خلال دقائق بشكل إلكتروني",
      color: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: "أفضل الشركات",
      desc: "نعاون مع أكبر شركات التأمين المعتمدة في المملكة",
      color: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "دعم فوري",
      desc: "فريق دعم متخصص جاهز لمساعدتك على مدار الساعة",
      color: "from-orange-500 to-orange-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  const partners = [
    { name: "التعاونية للتأمين", logo: "/company-logos/IMG_5257.PNG" },
    { name: "تكافل الراجحي", logo: "/company-logos/IMG_5258.PNG" },
    { name: "ميدغلف", logo: "/company-logos/IMG_5267.PNG" },
    { name: "الدرع العربي للتأمين", logo: "/company-logos/IMG_5265.PNG" },
    { name: "أسيج للتأمين", logo: "/company-logos/IMG_5264.PNG" },
    { name: "سلامة للتأمين", logo: "/company-logos/IMG_5271.WEBP" },
  ];

  const faqs = [
    {
      q: "كيف أحصل على عرض تأمين؟",
      a: "اضغط على زر 'ابدأ الآن' واتبع الخطوات الخمس: أدخل بياناتك الأساسية، بيانات المركبة، اختر الخطة المناسبة، أضف أي خدمات إضافية، ثم أكمل الدفع.",
    },
    {
      q: "كم يستغرق إصدار وثيقة التأمين؟",
      a: "يتم إصدار وثيقة التأمين بشكل فوري بعد إتمام عملية الدفع، وستصلك عبر البريد الإلكتروني أو رقم الهاتف المسجل.",
    },
    {
      q: "هل يمكنني تجديد التأمين؟",
      a: "نعم، يمكنك تجديد التأمين بسهولة من خلال نفس الخطوات. نوصي ببدء عملية التجديد قبل 30 يوماً من انتهاء التأمين الحالي.",
    },
    {
      q: "ما هي طرق الدفع المتاحة؟",
      a: "نقبل الدفع عبر بطاقات مدى و Visa و Mastercard بشكل آمن ومشفر.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="container max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/manus-storage/logo_941d1a40.png" alt="تأميني" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-gray-800">تأميني</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-gray-100">
        <div className="container max-w-lg mx-auto px-4 py-2 flex items-center gap-4 overflow-x-auto">
          <button className="flex items-center gap-1.5 text-gray-400 whitespace-nowrap text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            الصحي
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 whitespace-nowrap text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            الأخطاء الطبية
          </button>
          <button className="flex items-center gap-1.5 text-blue-600 font-bold whitespace-nowrap text-sm border-b-2 border-blue-600 pb-0.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            السيارات
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="container max-w-lg mx-auto px-4 mt-3">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/logo_941d1a40.png" alt="" className="w-6 h-6 rounded" />
            <div>
              <p className="text-xs font-bold text-gray-800">بلـس</p>
              <p className="text-[10px] text-gray-500">بواسطة زودا</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-700">إكسسوارات والعناية بالسيارة في</p>
            <p className="text-xs text-gray-700">مكان واحد.</p>
          </div>
          <button className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">جميع العروض</button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container max-w-lg mx-auto px-4 mt-4">
        <div className="relative bg-gradient-to-b from-blue-50 to-white rounded-2xl overflow-hidden">
          <div className="relative z-10 p-6 pb-4">
            <h2 className="text-2xl font-black text-gray-800 mb-3 leading-relaxed">
              توكل على الله.. وأمّن من تأميني
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              جميع وأفضل شركات التأمين... في مكان واحد، لمجموعة واسعة من الخيارات وإصدار فوري لوثائق التأمين.
            </p>
          </div>
          <div className="relative w-full h-[220px] -mt-4">
            <img
              src="/manus-storage/hero-image_8d346c36.webp"
              alt="تأمين المركبات"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50 to-transparent" />
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="container max-w-lg mx-auto px-4 mt-4">
        <button
          onClick={() => navigate("/insurance/step1")}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          ابدأ الآن
        </button>
      </div>

      {/* Features Section */}
      <div className="container max-w-lg mx-auto px-4 mt-10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">لماذا تأميني؟</h3>
          <p className="text-sm text-gray-500 mt-1">نوفر لك أفضل تجربة تأمين مركبات</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`${feature.bgLight} rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow`}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgLight} flex items-center justify-center mb-3 ${feature.textColor}`}>
                {feature.icon}
              </div>
              <h4 className="font-bold text-sm text-gray-800 mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partners Section */}
      <div className="container max-w-lg mx-auto px-4 mt-10">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">شركاؤنا في التأمين</h3>
          <p className="text-sm text-gray-500 mt-1">نعاون مع أفضل شركات التأمين المعتمدة</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow hover:border-blue-200"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-2 overflow-hidden">
                <img
                  src={partner.logo}
                  alt={`شعار ${partner.name}`}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </div>
              <span className="text-xs text-gray-600 font-medium text-center">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container max-w-lg mx-auto px-4 mt-10" id="faq">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">الأسئلة الشائعة</h3>
          <p className="text-sm text-gray-500 mt-1">إجابات لأكثر الأسئلة شيوعاً</p>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-right"
              >
                <span className="font-semibold text-sm text-gray-800">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${faqOpen === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${faqOpen === i ? "max-h-40 pb-3" : "max-h-0"}`}
              >
                <p className="px-4 text-xs text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="container max-w-lg mx-auto px-4 mt-10" id="contact">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-bold mb-2">تحتاج مساعدة؟</h3>
          <p className="text-sm text-blue-100 mb-4">فريقنا جاهز لمساعدتك في أي وقت</p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="mailto:support@tameeni.com"
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              اتصل بنا
            </a>
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-500/80 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-500 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              واتساب
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-100" id="privacy">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/manus-storage/logo_941d1a40.png" alt="تأميني" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-gray-800">تأميني</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-6">
            <a href="#faq" className="text-sm text-gray-500 hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}>الأسئلة الشائعة</a>
            <a href="#contact" className="text-sm text-gray-500 hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>اتصل بنا</a>
            <a href="#privacy" className="text-sm text-gray-500 hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' }); }}>سياسة الخصوصية</a>
            <a href="#terms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors" onClick={(e) => { e.preventDefault(); document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' }); }}>الشروط والأحكام</a>
          </div>
          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">جميع الحقوق محفوظة © 2025 تأميني</p>
            <p className="text-[10px] text-gray-300 mt-1">منصة تأمين المركبات الذكية في المملكة العربية السعودية</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
