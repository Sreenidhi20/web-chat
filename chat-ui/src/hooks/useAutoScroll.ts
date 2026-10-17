import { useCallback, useLayoutEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD_PX = 120;

export function useAutoScroll(
  conversationId: number | null,
  messageCount: number,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousConversationRef = useRef(conversationId);
  const previousMessageCountRef = useRef(messageCount);
  const nearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToLatest = useCallback((smooth = false) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (smooth && !reducedMotion && typeof container.scrollTo === "function") {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    } else {
      container.scrollTop = container.scrollHeight;
    }
    nearBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    nearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      BOTTOM_THRESHOLD_PX;
    if (nearBottomRef.current) {
      setShowScrollButton(false);
    }
  }, []);

  useLayoutEffect(() => {
    const conversationChanged =
      previousConversationRef.current !== conversationId;
    const newMessagesArrived = messageCount > previousMessageCountRef.current;

    if (conversationChanged) {
      previousConversationRef.current = conversationId;
      nearBottomRef.current = true;
      scrollToLatest();
    } else if (newMessagesArrived) {
      if (nearBottomRef.current) {
        scrollToLatest();
      } else {
        setShowScrollButton(true);
      }
    }

    previousMessageCountRef.current = messageCount;
  }, [conversationId, messageCount, scrollToLatest]);

  return {
    containerRef,
    handleScroll,
    scrollToLatest: () => scrollToLatest(true),
    showScrollButton,
  };
}
