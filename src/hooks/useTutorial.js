"use client";

/**
 * useTutorial.js
 * Custom hook para manejar el tutorial por página con react-joyride v3.
 *
 * Uso:
 *   const { runTour, handleJoyrideEvent } = useTutorial("subjects");
 *
 * - Muestra el tutorial automáticamente la primera vez que el usuario
 *   visita la página (usando localStorage con la key `tutorial_{key}_done`).
 * - Escucha el evento global "run-page-tutorial" para relanzar el tutorial
 *   desde el botón del navbar.
 * - handleJoyrideEvent maneja el callback onEvent de react-joyride v3
 *   y guarda en localStorage cuando el tour termina o se omite.
 */

import { useState, useEffect, useCallback } from "react";

/**
 * @param {string} key - Identificador único de la página (p.ej. "subjects")
 * @returns {{ runTour: boolean, handleJoyrideEvent: function }}
 */
export default function useTutorial(key, ready = true) {
  const storageKey = `tutorial_${key}_done`;
  const [runTour, setRunTour] = useState(false);

  // Al montarse en el cliente, verificar si ya se vio el tutorial
  useEffect(() => {
    if (!ready) return;

    const alreadyDone = localStorage.getItem(storageKey);
    if (!alreadyDone) {
      // Pequeño delay para asegurarnos de que los targets del DOM estén listos
      const timer = setTimeout(() => setRunTour(true), 400);
      return () => clearTimeout(timer);
    }
  }, [storageKey, ready]);

  // Escuchar el evento global para relanzar el tutorial desde el navbar
  useEffect(() => {
    const handleStart = () => {
      // Reiniciar el tour siempre que se dispare el evento (incluso si ya lo vio)
      setRunTour(false);
      // Pequeño tick para que Joyride detecte el cambio de false → true
      setTimeout(() => setRunTour(true), 100);
    };

    window.addEventListener("run-page-tutorial", handleStart);
    return () => window.removeEventListener("run-page-tutorial", handleStart);
  }, []);

  /**
   * Callback para el prop `onEvent` de react-joyride v3.
   * Se llama en cada evento del tour.
   *
   * @param {import("react-joyride").EventData} data
   */
  const handleJoyrideEvent = useCallback(
    (data) => {
      const { status } = data;
      // STATUS.FINISHED = "finished" | STATUS.SKIPPED = "skipped"
      if (status === "finished" || status === "skipped") {
        setRunTour(false);
        localStorage.setItem(storageKey, "true");
      }
    },
    [storageKey]
  );

  return { runTour, handleJoyrideEvent };
}