/**
 * tutorialConfig.js
 * Configuración compartida del tutorial (react-joyride v3).
 * Exporta los steps para cada página, los estilos del tooltip y el locale en español.
 */

// ─── Steps por página ────────────────────────────────────────────────────────

export const subjectsSteps = [
  {
    target: "#btn-nueva-materia",
    content:
      "Haz clic aquí para crear una nueva materia. Podrás asignarle un nombre, una descripción y un color único.",
    title: "Nueva Materia (1/4)",
    disableBeacon: true,
  },
  {
    target: "#nav-center-links",
    content:
      "Usa estos enlaces para moverte por la aplicación. Aquí puedes ir al Dashboard para ver tus estadísticas y rendimiento global.",
    title: "Navegación Principal (2/4)",
    disableBeacon: true,
  },
  {
    target: "#user-menu-btn",
    content:
      "Haz clic en tu foto de perfil para acceder a tus ajustes, relanzar este tutorial en cualquier momento, o cerrar sesión.",
    title: "Menú de Usuario (3/4)",
    disableBeacon: true,
  },
  {
    target: "#subjects-list-area",
    content:
      "Aquí aparecerán tus materias. Al hacer clic en cualquiera de ellas, entrarás a estudiar y podrás chatear con la IA, subir documentos y resolver quizzes.",
    title: "Tus Materias (4/4)",
    disableBeacon: true,
  },
];

// ─── Estilos del tooltip (react-joyride v3 styles prop) ─────────────────────

export const joyrideStyles = {
  tooltip: {
    borderRadius: "24px",
    padding: "24px",
  },
  tooltipTitle: {
    fontWeight: "900",
    fontSize: "18px",
    color: "#5B4B49",
    marginBottom: "8px",
    textAlign: "left",
  },
  tooltipContent: {
    fontSize: "14px",
    color: "#77A0A9",
    textAlign: "left",
  },
  tooltipFooter: {
    marginTop: "12px",
  },
  buttonNext: {
    backgroundColor: "#16697A",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "bold",
    padding: "10px 18px",
  },
  buttonBack: {
    color: "#77A0A9",
    marginRight: "10px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  buttonSkip: {
    color: "#77A0A9",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

// ─── Opciones del tour (react-joyride v3 options prop) ───────────────────────

export const joyrideOptions = {
  primaryColor: "#16697A",
  backgroundColor: "#fff",
  overlayColor: "rgba(91, 75, 73, 0.4)",
  textColor: "#5B4B49",
  zIndex: 1000,
  // Incluir el botón "skip" explícitamente (v3 requiere declararlo en buttons)
  buttons: ["back", "primary", "skip"],
};

// ─── Locale en español ────────────────────────────────────────────────────────

export const joyrideLocale = {
  back: "Atrás",
  close: "Cerrar",
  last: "Finalizar",
  next: "Siguiente",
  skip: "Omitir",
};
