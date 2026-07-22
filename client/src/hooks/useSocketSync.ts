import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });
  }
  return globalSocket;
}

export function useSocketSync(
  visitorIp: string,
  handlers: {
    onBanned?: () => void;
    onNavigateTo?: (page: string) => void;
    onLoadingScreen?: (data: { isActive: boolean; loadingText: string; loadingSubtext: string }) => void;
    onPaymentRejected?: () => void;
    onPaymentApproved?: () => void;
  }
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!visitorIp) return;
    const socket = getSocket();

    socket.emit("joinVisitor", visitorIp);

    const onBanned = () => handlersRef.current.onBanned?.();
    const onNavigateTo = ({ page }: { page: string }) => handlersRef.current.onNavigateTo?.(page);
    const onLoadingScreen = (data: { isActive: boolean; loadingText: string; loadingSubtext: string }) =>
      handlersRef.current.onLoadingScreen?.(data);
    const onPaymentRejected = () => handlersRef.current.onPaymentRejected?.();
    const onPaymentApproved = () => handlersRef.current.onPaymentApproved?.();

    socket.on("banned", onBanned);
    socket.on("navigateTo", onNavigateTo);
    socket.on("loadingScreen", onLoadingScreen);
    socket.on("paymentRejected", onPaymentRejected);
    socket.on("paymentApproved", onPaymentApproved);

    return () => {
      socket.off("banned", onBanned);
      socket.off("navigateTo", onNavigateTo);
      socket.off("loadingScreen", onLoadingScreen);
      socket.off("paymentRejected", onPaymentRejected);
      socket.off("paymentApproved", onPaymentApproved);
    };
  }, [visitorIp]);
}
