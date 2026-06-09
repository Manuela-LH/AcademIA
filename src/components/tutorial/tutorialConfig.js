/**
 * tutorialConfig.js
 * Configuración compartida del tutorial (react-joyride v3).
 * Exporta los steps para cada página, los estilos del tooltip y el locale en español.
 */

// ─── Steps por página ────────────────────────────────────────────────────────

export const subjectsSteps = [
  {
    target: "body",
    content:
      "Aquí aparecerán tus materias. Puedes crear nuevas materias haciendo clic en 'Nueva Materia' para asignarles un nombre, una descripción y un color único. Al hacer clic en cualquiera de ellas, entrarás a estudiar y podrás chatear con la IA, subir documentos y resolver cuestionarios.",
    title: "Tus Materias (1/3)",
    placement: "center",
  },
  {
    target: "#nav-center-links",
    content:
      "Usa estos enlaces para moverte por la aplicación. Aquí puedes ir al Dashboard para ver tus estadísticas y rendimiento global.",
    title: "Navegación Principal (2/3)",
    disableBeacon: true,
  },
  {
    target: "#user-menu-btn",
    content:
      "Haz clic en tu foto de perfil para acceder a tus ajustes, relanzar este tutorial en cualquier momento, o cerrar sesión.",
    title: "Menú de Usuario (3/3)",
    disableBeacon: true,
  },
];

export const dashboardSteps = [
  {
    target: "body",
    content:
      "En esta página estarán tus métricas generales de todas las materias que tengas. Al elegir una materia en específico, se mostrarán las métricas de esta y también habrá una sección para generar sugerencias por la IA usando tus métricas.",
    title: "Dashboard de Estudio (1/1)",
    placement: "center",
  },
];

export const chatSteps = [
  {
    target: "#chatbot-area",
    content:
      "Aquí puedes hablar con la IA y hacer preguntas sobre tu material de estudio. También puedes ajustar cómo la IA responde a tus preguntas a través de diferentes técnicas de estudio.",
    title: "Chat con la IA (1/4)",
    disableBeacon: false,
    placement: "center",
  },
  {
    target: "#material-section",
    content:
      "Aquí puedes subir y ver tus materiales de estudio (documentos).",
    title: "Material de Estudio (2/4)",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: "#quizzes-section",
    content:
      "Aquí puedes entrar a la página de cuestionarios, donde puedes crear y resolver quizzes basados en tus materiales de estudio.",
    title: "Cuestionarios (3/4)",
    disableBeacon: true,
  },
  {
    target: "#suggestions-section",
    content:
      "Aquí puedes observar la sugerencia generada para esta materia, y puedes volver a generar una nueva sugerencia basada en tu progreso.",
    title: "Sugerencias de la IA (4/4)",
    disableBeacon: true,
  },
];

export const quizzesSteps = [
  {
    target: "body",
    content:
      "Aquí podrás crear cuestionarios usando el botón 'Nuevo Cuestionario', el cual se genera dependiendo de la cantidad de material subido. También podrás ver los cuestionarios creados, su calificación y el tiempo que tardaste en completarlos.",
    title: "Tus Cuestionarios (1/1)",
    placement: "center",
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
    backgroundColor: "#DB93B0",
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
  primaryColor: "#DB93B0",
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
