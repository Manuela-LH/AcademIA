import { useState, useEffect, useRef, useCallback } from "react";

export default function useActiveTimer({ showDisplay = true, autoStart = true } = {}) {
  const startTimeRef = useRef(null);
  const elapsedMsRef = useRef(0);
  const intervalIdRef = useRef(null);
  const isActiveRef = useRef(autoStart);
  const [displayTime, setDisplayTime] = useState("00:00");

  const updateDisplay = useCallback((totalMs) => {
    if (!showDisplay) return;
    const totalSeconds = Math.floor(totalMs / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    setDisplayTime(`${m}:${s}`);
  }, [showDisplay]);

  const setInitialElapsed = useCallback((ms) => {
    elapsedMsRef.current = ms;
    updateDisplay(ms);
  }, [updateDisplay]);

  const startInterval = useCallback(() => {
    isActiveRef.current = true;
    if (intervalIdRef.current !== null) return;
    startTimeRef.current = performance.now();
    intervalIdRef.current = setInterval(() => {
      const currentElapsed = elapsedMsRef.current + (performance.now() - startTimeRef.current);
      updateDisplay(currentElapsed);
    }, 1000);
  }, [updateDisplay]);

  const stopInterval = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
      elapsedMsRef.current += performance.now() - startTimeRef.current;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopInterval();
    isActiveRef.current = false;
    elapsedMsRef.current = 0;
    updateDisplay(0);
  }, [stopInterval, updateDisplay]);

  useEffect(() => {
    if (autoStart) {
      startInterval();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) stopInterval();
      else if (isActiveRef.current) startInterval();
    };

    const handleFocus = () => {
      if (!intervalIdRef.current && !document.hidden && isActiveRef.current) startInterval();
    };

    const handleBlur = () => stopInterval();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [autoStart, startInterval, stopInterval]);

  const getTotalSeconds = useCallback(() => {
    const totalMs = intervalIdRef.current !== null && startTimeRef.current !== null
      ? elapsedMsRef.current + (performance.now() - startTimeRef.current)
      : elapsedMsRef.current;
    return Math.floor(totalMs / 1000);
  }, []);

  return { displayTime, getTotalSeconds, setInitialElapsed, resetTimer, startInterval, stopInterval };
}
