import { useState, useEffect, useRef } from "react";

// ─── useBreakpoint ────────────────────────────────────────────────────────────
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

// ─── i18n ────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    appName: "FGC Judges",
    tagline: "Judging Operations Platform",
    selectRole: "Select your role to continue",
    judge: "Judge",
    judgeAdvisor: "Judge Advisor",
    mentor: "Mentor",
    public: "Public Visitor",
    logout: "Switch Role",
    darkMode: "Dark",
    lightMode: "Light",
    // Judge Dashboard
    judgeDashboard: "Judge Dashboard",
    assignedTeams: "Assigned Teams",
    evaluations: "Evaluations",
    completionProgress: "Completion Progress",
    missingEvals: "Missing Evaluations",
    divergenceWarnings: "Divergence Warnings",
    rankingSuggestions: "Ranking Suggestions",
    interviewNotices: "Interview Notices",
    reEvalNotices: "Re-Evaluation Notices",
    uploadMedia: "Upload Robot Media",
    notebookStatus: "Notebook / Portfolio",
    scoringForms: "Scoring Forms",
    teamCode: "Team",
    status: "Status",
    score: "Score",
    action: "Action",
    complete: "Complete",
    pending: "Pending",
    inProgress: "In Progress",
    flagged: "Flagged",
    viewForm: "View Form",
    reEval: "Re-Evaluate",
    submitted: "Submitted",
    notSubmitted: "Not Submitted",
    divergence: "Divergence",
    panelAssignment: "Panel Assignment",
    // JA Dashboard
    jaDashboard: "Judge Advisor Dashboard",
    judgesOverview: "Judges Overview",
    completionRate: "Completion Rate",
    activeJudges: "Active Judges",
    pendingReviews: "Pending Reviews",
    criticalAlerts: "Critical Alerts",
    teamInterviews: "Team Interviews",
    allPanels: "All Panels",
    exportReport: "Export Report",
    // Mentor Dashboard
    mentorDashboard: "Mentor Dashboard",
    upcomingInterviews: "Upcoming Interviews",
    teamSchedule: "Team Schedule",
    warnings: "Warnings",
    timeUntil: "Time Until",
    room: "Room",
    interviewTime: "Interview Time",
    prepReminder: "Preparation Reminder",
    // Public Dashboard
    publicDashboard: "Event Dashboard",
    liveNow: "Live Now",
    schedule: "Event Schedule",
    eventMap: "Venue Map",
    livestream: "Livestream",
    results: "Results",
    announcements: "Announcements",
    fieldStatus: "Field Status",
    watchLive: "Watch Live",
    // Common
    search: "Search...",
    filter: "Filter",
    allTeams: "All Teams",
    today: "Today",
    refresh: "Refresh",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    good: "Good",
    warning: "Warning",
    critical: "Critical",
    teamName: "Team Name",
    time: "Time",
    location: "Location",
    notes: "Notes",
  },
  pt: {
    appName: "FGC Juízes",
    tagline: "Plataforma de Julgamento",
    selectRole: "Selecione sua função para continuar",
    judge: "Juiz",
    judgeAdvisor: "Assessor de Juízes",
    mentor: "Mentor",
    public: "Visitante Público",
    logout: "Trocar Função",
    darkMode: "Escuro",
    lightMode: "Claro",
    judgeDashboard: "Painel do Juiz",
    assignedTeams: "Equipes Atribuídas",
    evaluations: "Avaliações",
    completionProgress: "Progresso",
    missingEvals: "Avaliações Pendentes",
    divergenceWarnings: "Avisos de Divergência",
    rankingSuggestions: "Sugestões de Ranking",
    interviewNotices: "Avisos de Entrevista",
    reEvalNotices: "Avisos de Reavaliação",
    uploadMedia: "Upload de Mídia",
    notebookStatus: "Caderno / Portfólio",
    scoringForms: "Formulários de Pontuação",
    teamCode: "Equipe",
    status: "Status",
    score: "Pontuação",
    action: "Ação",
    complete: "Completo",
    pending: "Pendente",
    inProgress: "Em Progresso",
    flagged: "Sinalizado",
    viewForm: "Ver Formulário",
    reEval: "Reavaliar",
    submitted: "Enviado",
    notSubmitted: "Não Enviado",
    divergence: "Divergência",
    panelAssignment: "Atribuição de Painel",
    jaDashboard: "Painel do Assessor",
    judgesOverview: "Visão dos Juízes",
    completionRate: "Taxa de Conclusão",
    activeJudges: "Juízes Ativos",
    pendingReviews: "Revisões Pendentes",
    criticalAlerts: "Alertas Críticos",
    teamInterviews: "Entrevistas de Equipes",
    allPanels: "Todos os Painéis",
    exportReport: "Exportar Relatório",
    mentorDashboard: "Painel do Mentor",
    upcomingInterviews: "Próximas Entrevistas",
    teamSchedule: "Agenda da Equipe",
    warnings: "Avisos",
    timeUntil: "Tempo Restante",
    room: "Sala",
    interviewTime: "Hora da Entrevista",
    prepReminder: "Lembrete de Preparação",
    publicDashboard: "Painel do Evento",
    liveNow: "Ao Vivo",
    schedule: "Programação",
    eventMap: "Mapa do Evento",
    livestream: "Transmissão",
    results: "Resultados",
    announcements: "Anúncios",
    fieldStatus: "Status do Campo",
    watchLive: "Assistir ao Vivo",
    search: "Buscar...",
    filter: "Filtrar",
    allTeams: "Todas as Equipes",
    today: "Hoje",
    refresh: "Atualizar",
    save: "Salvar",
    cancel: "Cancelar",
    submit: "Enviar",
    good: "Bom",
    warning: "Aviso",
    critical: "Crítico",
    teamName: "Nome da Equipe",
    time: "Hora",
    location: "Local",
    notes: "Notas",
  },
  es: {
    appName: "FGC Jueces",
    tagline: "Plataforma de Juzgamiento",
    selectRole: "Selecciona tu rol para continuar",
    judge: "Juez",
    judgeAdvisor: "Asesor de Jueces",
    mentor: "Mentor",
    public: "Visitante Público",
    logout: "Cambiar Rol",
    darkMode: "Oscuro",
    lightMode: "Claro",
    judgeDashboard: "Panel del Juez",
    assignedTeams: "Equipos Asignados",
    evaluations: "Evaluaciones",
    completionProgress: "Progreso",
    missingEvals: "Evaluaciones Faltantes",
    divergenceWarnings: "Advertencias de Divergencia",
    rankingSuggestions: "Sugerencias de Ranking",
    interviewNotices: "Avisos de Entrevista",
    reEvalNotices: "Avisos de Re-Evaluación",
    uploadMedia: "Subir Medios del Robot",
    notebookStatus: "Cuaderno / Portafolio",
    scoringForms: "Formularios de Puntuación",
    teamCode: "Equipo",
    status: "Estado",
    score: "Puntaje",
    action: "Acción",
    complete: "Completo",
    pending: "Pendiente",
    inProgress: "En Progreso",
    flagged: "Marcado",
    viewForm: "Ver Formulario",
    reEval: "Re-Evaluar",
    submitted: "Enviado",
    notSubmitted: "No Enviado",
    divergence: "Divergencia",
    panelAssignment: "Asignación de Panel",
    jaDashboard: "Panel del Asesor",
    judgesOverview: "Vista de Jueces",
    completionRate: "Tasa de Completado",
    activeJudges: "Jueces Activos",
    pendingReviews: "Revisiones Pendientes",
    criticalAlerts: "Alertas Críticas",
    teamInterviews: "Entrevistas de Equipos",
    allPanels: "Todos los Paneles",
    exportReport: "Exportar Informe",
    mentorDashboard: "Panel del Mentor",
    upcomingInterviews: "Próximas Entrevistas",
    teamSchedule: "Agenda del Equipo",
    warnings: "Advertencias",
    timeUntil: "Tiempo Restante",
    room: "Sala",
    interviewTime: "Hora de Entrevista",
    prepReminder: "Recordatorio de Preparación",
    publicDashboard: "Panel del Evento",
    liveNow: "En Vivo",
    schedule: "Programa",
    eventMap: "Mapa del Evento",
    livestream: "Transmisión en Vivo",
    results: "Resultados",
    announcements: "Anuncios",
    fieldStatus: "Estado del Campo",
    watchLive: "Ver en Vivo",
    search: "Buscar...",
    filter: "Filtrar",
    allTeams: "Todos los Equipos",
    today: "Hoy",
    refresh: "Actualizar",
    save: "Guardar",
    cancel: "Cancelar",
    submit: "Enviar",
    good: "Bueno",
    warning: "Advertencia",
    critical: "Crítico",
    teamName: "Nombre del Equipo",
    time: "Hora",
    location: "Ubicación",
    notes: "Notas",
  },
  fr: {
    appName: "FGC Juges",
    tagline: "Plateforme de Jugement",
    selectRole: "Sélectionnez votre rôle pour continuer",
    judge: "Juge",
    judgeAdvisor: "Conseiller Juge",
    mentor: "Mentor",
    public: "Visiteur Public",
    logout: "Changer de Rôle",
    darkMode: "Sombre",
    lightMode: "Clair",
    judgeDashboard: "Tableau de Bord Juge",
    assignedTeams: "Équipes Assignées",
    evaluations: "Évaluations",
    completionProgress: "Progression",
    missingEvals: "Évaluations Manquantes",
    divergenceWarnings: "Avertissements de Divergence",
    rankingSuggestions: "Suggestions de Classement",
    interviewNotices: "Avis d'Entretien",
    reEvalNotices: "Avis de Ré-évaluation",
    uploadMedia: "Télécharger Médias",
    notebookStatus: "Cahier / Portfolio",
    scoringForms: "Formulaires de Score",
    teamCode: "Équipe",
    status: "Statut",
    score: "Score",
    action: "Action",
    complete: "Complet",
    pending: "En Attente",
    inProgress: "En Cours",
    flagged: "Signalé",
    viewForm: "Voir Formulaire",
    reEval: "Ré-évaluer",
    submitted: "Soumis",
    notSubmitted: "Non Soumis",
    divergence: "Divergence",
    panelAssignment: "Assignation de Panel",
    jaDashboard: "Tableau Conseiller",
    judgesOverview: "Vue d'ensemble Juges",
    completionRate: "Taux de Complétion",
    activeJudges: "Juges Actifs",
    pendingReviews: "Révisions en Attente",
    criticalAlerts: "Alertes Critiques",
    teamInterviews: "Entretiens d'Équipes",
    allPanels: "Tous les Panels",
    exportReport: "Exporter Rapport",
    mentorDashboard: "Tableau Mentor",
    upcomingInterviews: "Prochains Entretiens",
    teamSchedule: "Planning Équipe",
    warnings: "Avertissements",
    timeUntil: "Temps Restant",
    room: "Salle",
    interviewTime: "Heure d'Entretien",
    prepReminder: "Rappel de Préparation",
    publicDashboard: "Tableau de l'Événement",
    liveNow: "En Direct",
    schedule: "Programme",
    eventMap: "Plan du Lieu",
    livestream: "Diffusion en Direct",
    results: "Résultats",
    announcements: "Annonces",
    fieldStatus: "Statut du Terrain",
    watchLive: "Regarder en Direct",
    search: "Rechercher...",
    filter: "Filtrer",
    allTeams: "Toutes les Équipes",
    today: "Aujourd'hui",
    refresh: "Actualiser",
    save: "Sauvegarder",
    cancel: "Annuler",
    submit: "Soumettre",
    good: "Bon",
    warning: "Avertissement",
    critical: "Critique",
    teamName: "Nom d'Équipe",
    time: "Heure",
    location: "Lieu",
    notes: "Notes",
  },
  ar: {
    appName: "FGC القضاة",
    tagline: "منصة إدارة التحكيم",
    selectRole: "اختر دورك للمتابعة",
    judge: "قاضٍ",
    judgeAdvisor: "مستشار القضاة",
    mentor: "مرشد",
    public: "زائر عام",
    logout: "تغيير الدور",
    darkMode: "داكن",
    lightMode: "فاتح",
    judgeDashboard: "لوحة القاضي",
    assignedTeams: "الفرق المعينة",
    evaluations: "التقييمات",
    completionProgress: "تقدم الإنجاز",
    missingEvals: "تقييمات مفقودة",
    divergenceWarnings: "تحذيرات التباين",
    rankingSuggestions: "اقتراحات الترتيب",
    interviewNotices: "إشعارات المقابلات",
    reEvalNotices: "إشعارات إعادة التقييم",
    uploadMedia: "رفع وسائط الروبوت",
    notebookStatus: "الدفتر / المحفظة",
    scoringForms: "نماذج التسجيل",
    teamCode: "الفريق",
    status: "الحالة",
    score: "النتيجة",
    action: "الإجراء",
    complete: "مكتمل",
    pending: "معلق",
    inProgress: "قيد التنفيذ",
    flagged: "مُعلَّم",
    viewForm: "عرض النموذج",
    reEval: "إعادة التقييم",
    submitted: "مُرسَل",
    notSubmitted: "غير مُرسَل",
    divergence: "تباين",
    panelAssignment: "تعيين اللجنة",
    jaDashboard: "لوحة المستشار",
    judgesOverview: "نظرة عامة على القضاة",
    completionRate: "معدل الإنجاز",
    activeJudges: "القضاة النشطون",
    pendingReviews: "المراجعات المعلقة",
    criticalAlerts: "تنبيهات حرجة",
    teamInterviews: "مقابلات الفرق",
    allPanels: "كل اللجان",
    exportReport: "تصدير التقرير",
    mentorDashboard: "لوحة المرشد",
    upcomingInterviews: "المقابلات القادمة",
    teamSchedule: "جدول الفريق",
    warnings: "تحذيرات",
    timeUntil: "الوقت المتبقي",
    room: "الغرفة",
    interviewTime: "وقت المقابلة",
    prepReminder: "تذكير بالتحضير",
    publicDashboard: "لوحة الحدث",
    liveNow: "مباشر الآن",
    schedule: "الجدول الزمني",
    eventMap: "خريطة الموقع",
    livestream: "البث المباشر",
    results: "النتائج",
    announcements: "الإعلانات",
    fieldStatus: "حالة الملعب",
    watchLive: "شاهد البث",
    search: "بحث...",
    filter: "تصفية",
    allTeams: "كل الفرق",
    today: "اليوم",
    refresh: "تحديث",
    save: "حفظ",
    cancel: "إلغاء",
    submit: "إرسال",
    good: "جيد",
    warning: "تحذير",
    critical: "حرج",
    teamName: "اسم الفريق",
    time: "الوقت",
    location: "الموقع",
    notes: "ملاحظات",
  },
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TEAMS = [
  { id: "4821", name: "Iron Coders", status: "complete", score: 87, notebook: "submitted", divergence: false, flag: false, panel: "A" },
  { id: "3305", name: "Quantum Bots", status: "inProgress", score: 74, notebook: "submitted", divergence: true, flag: false, panel: "A" },
  { id: "7712", name: "Steel Minds", status: "pending", score: null, notebook: "notSubmitted", divergence: false, flag: true, panel: "B" },
  { id: "2241", name: "Nova Robotics", status: "flagged", score: 61, notebook: "submitted", divergence: true, flag: true, panel: "B" },
  { id: "9900", name: "Circuit Breakers", status: "complete", score: 92, notebook: "submitted", divergence: false, flag: false, panel: "A" },
  { id: "5534", name: "Pixel Pilots", status: "pending", score: null, notebook: "notSubmitted", divergence: false, flag: false, panel: "C" },
];

const INTERVIEWS = [
  { team: "4821", name: "Iron Coders", time: "09:00", room: "Room 101", status: "done" },
  { team: "3305", name: "Quantum Bots", time: "10:30", room: "Room 102", status: "active" },
  { team: "7712", name: "Steel Minds", time: "11:45", room: "Room 101", status: "upcoming", minutesUntil: 42 },
  { team: "2241", name: "Nova Robotics", time: "13:00", room: "Room 103", status: "upcoming", minutesUntil: 97 },
  { team: "9900", name: "Circuit Breakers", time: "14:15", room: "Room 102", status: "upcoming", minutesUntil: 172 },
  { team: "5534", name: "Pixel Pilots", time: "15:30", room: "Room 101", status: "upcoming", minutesUntil: 257 },
];

const JUDGES = [
  { name: "Dr. Sarah Chen", panel: "A", completed: 3, total: 4, status: "good" },
  { name: "Marcus Williams", panel: "A", completed: 2, total: 4, status: "warning" },
  { name: "Ana Rodrigues", panel: "B", completed: 4, total: 4, status: "good" },
  { name: "James Okafor", panel: "B", completed: 1, total: 4, status: "critical" },
  { name: "Yuki Tanaka", panel: "C", completed: 3, total: 3, status: "good" },
];

const ANNOUNCEMENTS = [
  { id: 1, type: "critical", text: "Field 2 delay — match schedule pushed 15 min", time: "10:42" },
  { id: 2, type: "info", text: "Pit area open for robot inspection until 12:00", time: "09:15" },
  { id: 3, type: "good", text: "Team 4821 - Inspire Award nominee confirmed", time: "08:55" },
];

const EVENT_SCHEDULE = [
  { time: "08:00", event: "Registration & Pit Setup", status: "done" },
  { time: "09:30", event: "Opening Ceremony", status: "done" },
  { time: "10:00", event: "Qualification Matches - Round 1", status: "done" },
  { time: "11:30", event: "Robot Judging Interviews Begin", status: "active" },
  { time: "13:00", event: "Lunch Break", status: "upcoming" },
  { time: "14:00", event: "Qualification Matches - Round 2", status: "upcoming" },
  { time: "16:30", event: "Alliance Selection", status: "upcoming" },
  { time: "17:30", event: "Awards Ceremony", status: "upcoming" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (isDark) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base: ${isDark ? "#080c10" : "#f0f2f5"};
    --bg-surface: ${isDark ? "#0d1117" : "#ffffff"};
    --bg-card: ${isDark ? "#111720" : "#ffffff"};
    --bg-card-hover: ${isDark ? "#161e2a" : "#f8f9fb"};
    --bg-elevated: ${isDark ? "#1a2332" : "#edf0f4"};
    --bg-input: ${isDark ? "#0d1117" : "#f5f7fa"};
    --border: ${isDark ? "#1e2d3d" : "#dde2ea"};
    --border-accent: ${isDark ? "#0ea5e9" : "#0284c7"};
    --text-primary: ${isDark ? "#e8f0fe" : "#0f1923"};
    --text-secondary: ${isDark ? "#6b8099" : "#64748b"};
    --text-muted: ${isDark ? "#3d5166" : "#94a3b8"};
    --accent: #0ea5e9;
    --accent-dim: ${isDark ? "#0c3a52" : "#bae6fd"};
    --accent-glow: rgba(14, 165, 233, 0.15);
    --green: #10b981;
    --green-dim: ${isDark ? "#064e3b" : "#d1fae5"};
    --yellow: #f59e0b;
    --yellow-dim: ${isDark ? "#451a03" : "#fef3c7"};
    --red: #ef4444;
    --red-dim: ${isDark ? "#450a0a" : "#fee2e2"};
    --orange: #f97316;
    --purple: #8b5cf6;
    --radius: 8px;
    --radius-lg: 12px;
    --shadow: ${isDark ? "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)" : "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"};
    --shadow-lg: ${isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.12)"};
    --font-display: 'Syne', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --bottom-nav-h: 60px;
  }

  html, body { height: 100%; }

  body {
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.5;
    -webkit-tap-highlight-color: transparent;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* ─── App Shell ─────────────────────────────────────── */
  .app-shell {
    display: flex;
    height: 100dvh;
    overflow: hidden;
  }

  /* ─── Sidebar backdrop (mobile / tablet) ────────────── */
  .sidebar-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 40;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
  .sidebar-backdrop.open { display: block; }

  /* ─── Sidebar ───────────────────────────────────────── */
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 50;
    flex-shrink: 0;
    transition: transform 0.26s cubic-bezier(.4,0,.2,1);
  }

  /* Tablet & mobile: sidebar becomes a left-edge drawer */
  @media (max-width: 1023px) {
    .sidebar {
      position: fixed;
      top: 0; bottom: 0; left: 0;
      transform: translateX(-100%);
      box-shadow: var(--shadow-lg);
    }
    .sidebar.drawer-open { transform: translateX(0); }
  }

  .sidebar-logo { padding: 20px 18px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .logo-mark { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .logo-icon {
    width: 30px; height: 30px; border-radius: 7px;
    background: linear-gradient(135deg, #0ea5e9, #0369a1);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #fff;
    font-family: var(--font-display); letter-spacing: -0.5px; flex-shrink: 0;
    box-shadow: 0 0 16px rgba(14,165,233,0.3);
  }
  .logo-text { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text-primary); letter-spacing: -0.3px; }
  .logo-sub { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 0.5px; text-transform: uppercase; }

  .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
  .nav-section-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text-muted); padding: 8px 8px 4px; font-family: var(--font-mono); }
  .nav-item {
    display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 6px;
    cursor: pointer; transition: background 0.15s, color 0.15s; color: var(--text-secondary);
    font-size: 13px; font-weight: 500; border: none; background: none; width: 100%; text-align: left;
    min-height: 38px; /* touch-friendly */
  }
  .nav-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
  .nav-item.active { background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent-dim); }
  .nav-item .nav-icon { width: 18px; text-align: center; font-size: 14px; flex-shrink: 0; }
  .nav-badge { margin-left: auto; background: var(--red-dim); color: var(--red); border-radius: 10px; padding: 1px 6px; font-size: 10px; font-family: var(--font-mono); font-weight: 600; }

  .sidebar-footer { padding: 12px 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
  .role-badge { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--bg-elevated); border-radius: 6px; border: 1px solid var(--border); }
  .role-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
  .role-info { flex: 1; min-width: 0; }
  .role-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .role-label { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }

  /* ─── Main Content ──────────────────────────────────── */
  .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  /* ─── Top Bar ───────────────────────────────────────── */
  .topbar {
    height: 52px; background: var(--bg-surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 16px; gap: 10px; flex-shrink: 0;
  }

  /* Hamburger — hidden on desktop, shown on tablet & mobile */
  .topbar-hamburger {
    display: none;
    align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 6px; flex-shrink: 0;
    border: 1px solid var(--border); background: var(--bg-elevated);
    cursor: pointer; font-size: 16px; color: var(--text-secondary); transition: all 0.15s;
  }
  .topbar-hamburger:hover { border-color: var(--accent); color: var(--accent); }
  @media (max-width: 1023px) { .topbar-hamburger { display: flex; } }

  .topbar-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .topbar-meta { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); background: var(--bg-elevated); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border); white-space: nowrap; flex-shrink: 0; }
  .topbar-spacer { flex: 1; min-width: 0; }
  .topbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* Hide non-essential topbar items progressively */
  @media (max-width: 767px) {
    .topbar-meta { display: none; }
    .topbar-title { font-size: 13px; }
    .topbar { padding: 0 12px; gap: 8px; }
  }

  /* ─── Search ────────────────────────────────────────── */
  .search-box {
    display: flex; align-items: center; gap: 6px;
    background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
    padding: 5px 10px; font-size: 12px; color: var(--text-secondary); cursor: text; width: 160px;
  }
  .search-box input { background: none; border: none; outline: none; font-size: 12px; color: var(--text-primary); font-family: var(--font-body); width: 100%; }
  .search-box input::placeholder { color: var(--text-muted); }
  @media (max-width: 767px) { .search-box { display: none; } }
  @media (max-width: 1100px) { .search-box { width: 120px; } }

  /* ─── Buttons ───────────────────────────────────────── */
  .btn {
    display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 6px;
    font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--border);
    background: var(--bg-elevated); color: var(--text-primary); transition: all 0.15s;
    font-family: var(--font-body); white-space: nowrap; min-height: 34px;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
  .btn-primary:hover { background: #0284c7; border-color: #0284c7; color: #fff; }
  .btn-ghost { background: none; border-color: transparent; color: var(--text-secondary); }
  .btn-ghost:hover { background: var(--bg-elevated); color: var(--text-primary); border-color: var(--border); }
  .btn-sm { padding: 4px 9px; font-size: 11px; min-height: 28px; }
  .btn-danger { background: var(--red-dim); border-color: var(--red); color: var(--red); }

  /* ─── Lang & Theme controls ─────────────────────────── */
  .lang-selector { display: flex; gap: 2px; background: var(--bg-elevated); padding: 3px; border-radius: 6px; border: 1px solid var(--border); }
  .lang-btn { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-family: var(--font-mono); font-weight: 600; cursor: pointer; border: none; background: none; color: var(--text-muted); transition: all 0.12s; }
  .lang-btn:hover { color: var(--text-primary); }
  .lang-btn.active { background: var(--accent); color: #fff; }
  /* Collapse lang selector to icon-only on small phones */
  @media (max-width: 480px) { .lang-selector { display: none; } }

  .theme-toggle { display: flex; align-items: center; gap: 5px; padding: 5px 9px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); transition: all 0.15s; white-space: nowrap; }
  .theme-toggle:hover { border-color: var(--accent); color: var(--accent); }
  /* Hide text label on small screens — keep just the icon */
  @media (max-width: 639px) { .theme-toggle .theme-label { display: none; } }

  .icon-btn { position: relative; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; font-size: 15px; color: var(--text-secondary); transition: all 0.15s; flex-shrink: 0; }
  .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
  .notification-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); position: absolute; top: 4px; right: 4px; animation: pulse 1.2s infinite; }

  /* ─── Bottom Nav (mobile ≤ 639px) ───────────────────── */
  .bottom-nav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0;
    height: var(--bottom-nav-h); z-index: 30;
    background: var(--bg-surface); border-top: 1px solid var(--border);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    align-items: center; justify-content: space-around;
    padding: 0 4px;
  }
  @media (max-width: 639px) { .bottom-nav { display: flex; } }

  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 8px; border-radius: 8px; cursor: pointer; border: none; background: none;
    color: var(--text-muted); font-size: 9px; font-family: var(--font-mono); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.3px; flex: 1; min-width: 0;
    transition: color 0.15s, background 0.15s; position: relative;
  }
  .bottom-nav-item .bn-icon { font-size: 19px; line-height: 1; }
  .bottom-nav-item.active { color: var(--accent); background: var(--accent-glow); border-radius: 8px; }
  .bottom-nav-item .bn-badge { position: absolute; top: 2px; right: calc(50% - 18px); background: var(--red); color: #fff; width: 14px; height: 14px; border-radius: 50%; font-size: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; }

  /* ─── Page Content ──────────────────────────────────── */
  .page-content {
    flex: 1; overflow-y: auto; padding: 16px;
    display: flex; flex-direction: column; gap: 14px;
  }
  /* Extra bottom padding on mobile to clear bottom nav */
  @media (max-width: 639px) {
    .page-content { padding: 12px 12px calc(var(--bottom-nav-h) + 12px); }
  }

  /* ─── Stat Grid ─────────────────────────────────────── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  @media (max-width: 1023px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px)  { .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

  .stat-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 14px; box-shadow: var(--shadow); position: relative; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { border-color: var(--border-accent); box-shadow: 0 0 0 1px var(--accent-dim), var(--shadow); }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--stat-accent, var(--accent)); border-radius: 2px 2px 0 0; }
  .stat-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 6px; }
  .stat-value { font-family: var(--font-display); font-size: 26px; font-weight: 800; color: var(--text-primary); line-height: 1; letter-spacing: -1px; margin-bottom: 3px; }
  .stat-sub { font-size: 10px; color: var(--text-secondary); }
  .stat-trend { font-size: 10px; font-family: var(--font-mono); padding: 2px 6px; border-radius: 3px; display: inline-block; margin-top: 4px; }

  /* ─── Section / Card ────────────────────────────────── */
  .section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); overflow: hidden; }
  .section-header { display: flex; align-items: center; gap: 8px; padding: 13px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .section-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.1px; flex: 1; min-width: 0; }
  .section-body { padding: 14px; }

  /* ─── Table — horizontally scrollable on small screens  */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .data-table { width: 100%; border-collapse: collapse; min-width: 500px; }
  .data-table th { text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); padding: 10px 12px; border-bottom: 1px solid var(--border); font-family: var(--font-mono); white-space: nowrap; }
  .data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text-primary); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: var(--bg-card-hover); }

  /* ─── Chips ─────────────────────────────────────────── */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; }
  .chip-complete  { background: var(--green-dim);   color: var(--green);   }
  .chip-pending   { background: var(--yellow-dim);  color: var(--yellow);  }
  .chip-inProgress{ background: var(--accent-dim);  color: var(--accent);  }
  .chip-flagged   { background: var(--red-dim);     color: var(--red);     }
  .chip-good      { background: var(--green-dim);   color: var(--green);   }
  .chip-warning   { background: var(--yellow-dim);  color: var(--yellow);  }
  .chip-critical  { background: var(--red-dim);     color: var(--red);     }
  .chip-info      { background: var(--accent-dim);  color: var(--accent);  }
  .chip-neutral   { background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border); }

  /* ─── Progress ──────────────────────────────────────── */
  .progress-track { height: 5px; background: var(--bg-elevated); border-radius: 3px; overflow: hidden; }
  .progress-fill  { height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.4s ease; }
  .progress-fill.green  { background: var(--green);  }
  .progress-fill.yellow { background: var(--yellow); }
  .progress-fill.red    { background: var(--red);    }

  /* ─── Alert ─────────────────────────────────────────── */
  .alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: var(--radius); border-left: 3px solid; font-size: 12px; }
  .alert-critical { background: var(--red-dim);    border-color: var(--red);    color: var(--red);    }
  .alert-warning  { background: var(--yellow-dim); border-color: var(--yellow); color: var(--yellow); }
  .alert-info     { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
  .alert-good     { background: var(--green-dim);  border-color: var(--green);  color: var(--green);  }
  .alert-text { color: var(--text-primary); }
  .alert-time { font-family: var(--font-mono); color: var(--text-muted); font-size: 10px; margin-top: 2px; }

  /* ─── Timeline ──────────────────────────────────────── */
  .timeline { display: flex; flex-direction: column; }
  .timeline-item { display: flex; gap: 12px; padding: 10px 0; position: relative; }
  .timeline-item:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 28px; bottom: -10px; width: 1px; background: var(--border); }
  .timeline-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--border); background: var(--bg-card); margin-top: 5px; flex-shrink: 0; position: relative; z-index: 1; margin-left: 11px; }
  .timeline-dot.done   { background: var(--green);  border-color: var(--green);  }
  .timeline-dot.active { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 8px var(--accent); }
  .timeline-dot.upcoming { background: var(--bg-elevated); border-color: var(--border); }
  .timeline-time { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); min-width: 40px; margin-top: 3px; }
  .timeline-content { flex: 1; min-width: 0; }
  .timeline-event { font-size: 13px; color: var(--text-primary); font-weight: 500; }
  .timeline-status { font-size: 10px; color: var(--text-muted); margin-top: 1px; font-family: var(--font-mono); }

  /* ─── Interview / Judge rows ────────────────────────── */
  .interview-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .interview-row:last-child { border-bottom: none; }
  .judge-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .judge-row:last-child { border-bottom: none; }

  /* ─── Forms ─────────────────────────────────────────── */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); font-family: var(--font-mono); }
  .form-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); padding: 9px 10px; font-size: 13px; color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.15s; width: 100%; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text-muted); }
  .form-range { width: 100%; accent-color: var(--accent); height: 4px; }
  .range-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px; }
  textarea.form-input { resize: vertical; min-height: 80px; }

  /* ─── Upload Zone ───────────────────────────────────── */
  .upload-zone { border: 2px dashed var(--border); border-radius: var(--radius-lg); padding: 24px; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .upload-zone:hover { border-color: var(--accent); background: var(--accent-glow); }
  .upload-icon { font-size: 24px; margin-bottom: 8px; }
  .upload-text { font-size: 13px; color: var(--text-secondary); }
  .upload-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; font-family: var(--font-mono); }

  /* ─── Venue Map ─────────────────────────────────────── */
  .venue-map { background: var(--bg-elevated); border-radius: var(--radius-lg); height: 200px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); flex-direction: column; gap: 8px; color: var(--text-muted); }

  /* ─── Live Badge ────────────────────────────────────── */
  .live-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--red-dim); color: var(--red); border: 1px solid var(--red); border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 700; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.5px; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); animation: pulse 1.2s ease-in-out infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.8); }
  }

  /* ─── Stream ────────────────────────────────────────── */
  .stream-card { background: var(--bg-elevated); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }
  .stream-preview { background: linear-gradient(135deg, #0a1628 0%, #0c2040 50%, #071428 100%); height: 160px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
  .stream-icon { font-size: 32px; opacity: 0.5; }
  .stream-info { padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }

  /* ─── Countdown ─────────────────────────────────────── */
  .countdown-chip { font-family: var(--font-mono); font-size: 11px; font-weight: 500; background: var(--accent-dim); color: var(--accent); padding: 3px 8px; border-radius: 4px; white-space: nowrap; }

  /* ─── Responsive layout grids ───────────────────────── */
  .two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .grid-2-3  { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }

  @media (max-width: 1023px) {
    .two-col, .three-col, .grid-2-3 { grid-template-columns: 1fr; }
  }

  /* ─── Login Screen ──────────────────────────────────── */
  .login-screen { min-height: 100dvh; display: flex; align-items: center; justify-content: center; background: var(--bg-base); background-image: radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.08) 0%, transparent 60%); padding: 16px; }
  .login-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 36px 32px; width: 100%; max-width: 440px; box-shadow: var(--shadow-lg); }
  @media (max-width: 480px) { .login-card { padding: 24px 18px; border-radius: 12px; } }

  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .login-logo-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #0ea5e9, #0369a1); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #fff; font-family: var(--font-display); box-shadow: 0 0 24px rgba(14,165,233,0.4); flex-shrink: 0; }
  .login-logo-text { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--text-primary); }
  .login-logo-sub { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: 0.5px; }
  .login-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.3px; }
  .login-subtitle { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

  .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .role-card { border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px 14px; cursor: pointer; transition: all 0.15s; background: var(--bg-card); text-align: left; }
  .role-card:hover { border-color: var(--accent); background: var(--accent-glow); }
  .role-card.selected { border-color: var(--accent); background: var(--accent-glow); box-shadow: 0 0 0 1px var(--accent); }
  .role-card-icon { font-size: 22px; margin-bottom: 8px; }
  .role-card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; font-family: var(--font-display); }
  .role-card-desc { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .login-footer { font-size: 10px; color: var(--text-muted); text-align: center; font-family: var(--font-mono); margin-top: 16px; }

  /* ─── Misc ──────────────────────────────────────────── */
  .divider { height: 1px; background: var(--border); margin: 4px 0; }
  .toolbar-strip { display: flex; align-items: center; gap: 8px; padding: 10px 0; flex-wrap: wrap; }
  .text-accent { color: var(--accent); }
  .text-green { color: var(--green); }
  .text-yellow { color: var(--yellow); }
  .text-red { color: var(--red); }
  .text-muted { color: var(--text-muted); }
  .text-secondary { color: var(--text-secondary); }
  .text-mono { font-family: var(--font-mono); }
  .font-display { font-family: var(--font-display); }
  .fw-700 { font-weight: 700; }
  .fw-600 { font-weight: 600; }
  .flex { display: flex; }
  .flex-1 { flex: 1; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .gap-6  { gap: 6px; }
  .gap-8  { gap: 8px; }
  .gap-12 { gap: 12px; }
  .mt-4  { margin-top: 4px; }
  .mt-8  { margin-top: 8px; }
  .mb-12 { margin-bottom: 12px; }
  .w-full { width: 100%; }
  .min-w-0 { min-width: 0; }
  .text-sm { font-size: 12px; }
  .text-xs { font-size: 11px; }

  .empty-state { text-align: center; padding: 32px; color: var(--text-muted); font-family: var(--font-mono); font-size: 12px; }
  .empty-icon { font-size: 28px; margin-bottom: 8px; }

  .field-live-indicator { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); font-size: 12px; }

  .notification-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); position: absolute; top: 4px; right: 4px; animation: pulse 1.2s infinite; }

  .select-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-size: 12px; color: var(--text-primary); font-family: var(--font-body); outline: none; cursor: pointer; }
  .select-input:focus { border-color: var(--accent); }

  .panel-tag { font-family: var(--font-mono); font-size: 10px; font-weight: 700; background: var(--accent-dim); color: var(--accent); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--accent); }
  .score-display { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
`;

// ─── Components ───────────────────────────────────────────────────────────────
const StatusChip = ({ status, label }) => (
  <span className={`chip chip-${status}`}>
    {status === "complete" && "✓ "}
    {status === "flagged" && "⚑ "}
    {status === "critical" && "⚠ "}
    {label}
  </span>
);

const ProgressBar = ({ value, max, color = "" }) => {
  const pct = Math.round((value / max) * 100);
  const c = pct >= 80 ? "green" : pct >= 50 ? "" : pct >= 30 ? "yellow" : "red";
  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `var(--${color || c})` }} />
      </div>
    </div>
  );
};

const SectionHeader = ({ title, icon, children }) => (
  <div className="section-header">
    {icon && <span>{icon}</span>}
    <div className="section-title">{title}</div>
    {children}
  </div>
);

// ─── Dashboards ───────────────────────────────────────────────────────────────
const JudgeDashboard = ({ t, isArabic }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [scoreValues, setScoreValues] = useState({ innovation: 75, design: 80, programming: 70, impact: 85, presentation: 78 });

  const completed = TEAMS.filter(t => t.status === "complete").length;
  const missing = TEAMS.filter(t => t.status === "pending").length;
  const flagged = TEAMS.filter(t => t.flag).length;
  const divergent = TEAMS.filter(t => t.divergence).length;

  const tabs = [
    { key: "overview", label: t.assignedTeams, icon: "👥" },
    { key: "scoring", label: t.scoringForms, icon: "📋" },
    { key: "media", label: t.uploadMedia, icon: "📷" },
    { key: "notices", label: t.interviewNotices, icon: "🔔" },
  ];

  return (
    <>
      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: t.completionProgress, value: `${completed}/${TEAMS.length}`, sub: `${Math.round((completed/TEAMS.length)*100)}% done`, accent: "var(--accent)", trend: "On Track" },
          { label: t.missingEvals, value: missing, sub: t.pending, accent: "var(--yellow)", trend: "⚠ Action Needed" },
          { label: t.divergenceWarnings, value: divergent, sub: "Teams flagged", accent: "var(--orange)" },
          { label: t.interviewNotices, value: 1, sub: "Active now", accent: "var(--green)", trend: "✓ Room 102" },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ "--stat-accent": s.accent }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
            {s.trend && <div className="stat-trend" style={{ background: `${s.accent}20`, color: s.accent }}>{s.trend}</div>}
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="section">
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 16px", gap: "4px" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="nav-item"
              style={{
                borderRadius: "0", borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--accent)" : "var(--text-secondary)",
                background: "none", border: "none", borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                padding: "12px 12px", fontWeight: activeTab === tab.key ? 600 : 400, fontSize: 12
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.teamCode}</th>
                  <th>{t.teamName}</th>
                  <th>Panel</th>
                  <th>{t.notebookStatus}</th>
                  <th>{t.status}</th>
                  <th>{t.score}</th>
                  <th>{t.divergence}</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {TEAMS.map(team => (
                  <tr key={team.id}>
                    <td><span className="text-mono text-accent fw-600">#{team.id}</span></td>
                    <td><span className="fw-600">{team.name}</span></td>
                    <td><span className="panel-tag">{team.panel}</span></td>
                    <td>
                      <span className={`chip ${team.notebook === "submitted" ? "chip-complete" : "chip-warning"}`}>
                        {team.notebook === "submitted" ? `✓ ${t.submitted}` : `✗ ${t.notSubmitted}`}
                      </span>
                    </td>
                    <td><StatusChip status={team.status} label={t[team.status] || team.status} /></td>
                    <td>
                      {team.score ? <span className="score-display text-accent">{team.score}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {team.divergence ? <span className="chip chip-flagged">⚑ {t.divergence}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-sm" onClick={() => { setSelectedTeam(team); setActiveTab("scoring"); }}>
                          {t.viewForm}
                        </button>
                        {team.flag && <button className="btn btn-sm btn-danger">{t.reEval}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "scoring" && (
          <div className="section-body">
            <div className="flex gap-8 items-center mb-12">
              <span className="text-secondary text-sm">{t.teamCode}:</span>
              <select className="select-input" value={selectedTeam?.id || ""} onChange={e => setSelectedTeam(TEAMS.find(t => t.id === e.target.value))}>
                <option value="">— {t.allTeams} —</option>
                {TEAMS.map(team => <option key={team.id} value={team.id}>{team.name} #{team.id}</option>)}
              </select>
              {selectedTeam && <span className="chip chip-inProgress">{t.inProgress}</span>}
            </div>

            {selectedTeam && (
              <div className="form-grid">
                {[
                  { key: "innovation", label: "Innovation & Design" },
                  { key: "design", label: "Robot Design" },
                  { key: "programming", label: "Programming & Control" },
                  { key: "impact", label: "Community Impact" },
                  { key: "presentation", label: "Team Interview" },
                ].map(({ key, label }) => (
                  <div className="form-group" key={key}>
                    <div className="flex items-center gap-8">
                      <label className="form-label flex-1">{label}</label>
                      <span className="text-mono text-accent fw-600" style={{ fontSize: 14 }}>{scoreValues[key]}</span>
                    </div>
                    <input type="range" className="form-range" min={0} max={100} value={scoreValues[key]}
                      onChange={e => setScoreValues(prev => ({ ...prev, [key]: +e.target.value }))} />
                    <div className="range-labels"><span>0</span><span>50</span><span>100</span></div>
                  </div>
                ))}
                <div className="form-group full">
                  <label className="form-label">{t.notes}</label>
                  <textarea className="form-input" placeholder="Add evaluation notes..." />
                </div>
                <div className="form-group full" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn">{t.cancel}</button>
                  <button className="btn btn-primary">{t.submit} Evaluation</button>
                </div>
              </div>
            )}

            {!selectedTeam && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div>Select a team to open the scoring form</div>
              </div>
            )}
          </div>
        )}

        {activeTab === "media" && (
          <div className="section-body">
            <div className="flex gap-8 items-center mb-12">
              <span className="text-secondary text-sm">{t.teamCode}:</span>
              <select className="select-input">
                {TEAMS.map(team => <option key={team.id}>{team.name} #{team.id}</option>)}
              </select>
            </div>
            <div className="upload-zone">
              <div className="upload-icon">📷</div>
              <div className="upload-text">{t.uploadMedia}</div>
              <div className="upload-sub">Drag & drop or click · MP4, JPG, PNG · Max 500MB</div>
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {["robot_front.jpg", "robot_side.mp4", "notebook_p1.jpg"].map((f, i) => (
                <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 20, marginBottom: 6, textAlign: "center" }}>{f.endsWith("mp4") ? "🎬" : "🖼️"}</div>
                  <div className="text-mono" style={{ fontSize: 10, color: "var(--text-secondary)", textAlign: "center" }}>{f}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notices" && (
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="alert alert-info">
              <span>🕐</span>
              <div>
                <div className="alert-text">Interview with <strong>Quantum Bots #3305</strong> is active now in Room 102</div>
                <div className="alert-time">10:30 — Panel A</div>
              </div>
            </div>
            <div className="alert alert-warning">
              <span>⚑</span>
              <div>
                <div className="alert-text">Re-evaluation requested for <strong>Nova Robotics #2241</strong> — divergence detected</div>
                <div className="alert-time">Requested at 09:52 by JA</div>
              </div>
            </div>
            <div className="alert alert-critical">
              <span>⚠</span>
              <div>
                <div className="alert-text"><strong>Steel Minds #7712</strong> — Notebook not submitted, interview in 42 min</div>
                <div className="alert-time">Panel B · Room 101 · 11:45</div>
              </div>
            </div>
            <div className="alert alert-good">
              <span>✓</span>
              <div>
                <div className="alert-text"><strong>Iron Coders #4821</strong> evaluation complete and submitted</div>
                <div className="alert-time">09:15</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ranking + Progress */}
      <div className="two-col">
        <div className="section">
          <SectionHeader title={t.rankingSuggestions} icon="🏅" />
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>#</th><th>{t.teamName}</th><th>{t.score}</th><th>Award Signal</th></tr></thead>
              <tbody>
                {[...TEAMS].filter(t => t.score).sort((a, b) => b.score - a.score).map((team, i) => (
                  <tr key={team.id}>
                    <td><span className="text-mono" style={{ color: i === 0 ? "var(--yellow)" : "var(--text-muted)" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span></td>
                    <td className="fw-600">{team.name}</td>
                    <td><span className="score-display text-accent">{team.score}</span></td>
                    <td>{i === 0 ? <span className="chip chip-good">Inspire</span> : i === 1 ? <span className="chip chip-info">Design</span> : <span className="chip chip-neutral">Consider</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <SectionHeader title={t.panelAssignment} icon="📌" />
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["A", "B", "C"].map(panel => {
              const pTeams = TEAMS.filter(t => t.panel === panel);
              const done = pTeams.filter(t => t.status === "complete").length;
              return (
                <div key={panel} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-elevated)" }}>
                  <div className="flex items-center gap-8 mb-12">
                    <span className="panel-tag">Panel {panel}</span>
                    <span className="text-secondary text-sm flex-1">{pTeams.length} teams</span>
                    <span className="text-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{done}/{pTeams.length}</span>
                  </div>
                  <ProgressBar value={done} max={pTeams.length} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const JudgeAdvisorDashboard = ({ t }) => {
  const totalCompleted = JUDGES.reduce((a, j) => a + j.completed, 0);
  const totalEvals = JUDGES.reduce((a, j) => a + j.total, 0);
  const criticalJudges = JUDGES.filter(j => j.status === "critical").length;

  return (
    <>
      <div className="stat-grid">
        {[
          { label: t.completionRate, value: `${Math.round((totalCompleted / totalEvals) * 100)}%`, sub: `${totalCompleted} of ${totalEvals} evaluations`, accent: "var(--accent)" },
          { label: t.activeJudges, value: JUDGES.length, sub: "3 panels active", accent: "var(--green)" },
          { label: t.pendingReviews, value: totalEvals - totalCompleted, sub: "Remaining evals", accent: "var(--yellow)" },
          { label: t.criticalAlerts, value: criticalJudges, sub: "Judges behind", accent: "var(--red)" },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ "--stat-accent": s.accent }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="alert alert-critical">
        <span>⚠</span>
        <div>
          <div className="alert-text fw-600">James Okafor (Panel B) has only completed 1 of 4 evaluations — intervention may be needed</div>
          <div className="alert-time">Last update: 09:47</div>
        </div>
      </div>

      <div className="two-col">
        <div className="section">
          <SectionHeader title={t.judgesOverview} icon="⚖️">
            <button className="btn btn-sm">{t.allPanels}</button>
            <button className="btn btn-sm btn-primary">{t.exportReport}</button>
          </SectionHeader>
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {JUDGES.map((judge, i) => {
              const pct = Math.round((judge.completed / judge.total) * 100);
              return (
                <div className="judge-row" key={i}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {judge.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-8">
                      <span className="fw-600" style={{ fontSize: 13 }}>{judge.name}</span>
                      <span className="panel-tag">{judge.panel}</span>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={judge.completed} max={judge.total} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="text-mono fw-600" style={{ fontSize: 13, color: pct === 100 ? "var(--green)" : pct < 40 ? "var(--red)" : "var(--text-primary)" }}>{pct}%</div>
                    <div className="text-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{judge.completed}/{judge.total}</div>
                  </div>
                  <StatusChip status={judge.status} label={t[judge.status] || judge.status} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="section">
          <SectionHeader title={t.teamInterviews} icon="🎤" />
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {INTERVIEWS.map((interview, i) => (
              <div className="interview-row" key={i}>
                <div style={{ flexShrink: 0 }}>
                  <div className="text-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{interview.time}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-6">
                    <span className="fw-600" style={{ fontSize: 12 }}>{interview.name}</span>
                    <span className="text-mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>#{interview.team}</span>
                  </div>
                  <div className="text-secondary" style={{ fontSize: 11 }}>{interview.room}</div>
                </div>
                <span className={`chip ${interview.status === "done" ? "chip-complete" : interview.status === "active" ? "chip-inProgress" : "chip-neutral"}`}>
                  {interview.status === "done" ? `✓ Done` : interview.status === "active" ? "● Active" : "Upcoming"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <SectionHeader title="Teams Overview" icon="🤖">
          <div className="flex gap-6">
            <select className="select-input"><option>All Panels</option><option>Panel A</option><option>Panel B</option><option>Panel C</option></select>
            <select className="select-input"><option>All Status</option><option>Complete</option><option>Pending</option><option>Flagged</option></select>
          </div>
        </SectionHeader>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.teamCode}</th>
                <th>{t.teamName}</th>
                <th>Panel</th>
                <th>{t.notebookStatus}</th>
                <th>{t.status}</th>
                <th>{t.score}</th>
                <th>{t.divergence}</th>
              </tr>
            </thead>
            <tbody>
              {TEAMS.map(team => (
                <tr key={team.id}>
                  <td><span className="text-mono text-accent fw-600">#{team.id}</span></td>
                  <td className="fw-600">{team.name}</td>
                  <td><span className="panel-tag">{team.panel}</span></td>
                  <td><span className={`chip ${team.notebook === "submitted" ? "chip-complete" : "chip-warning"}`}>{team.notebook === "submitted" ? "✓ OK" : "✗ Missing"}</span></td>
                  <td><StatusChip status={team.status} label={team.status} /></td>
                  <td>{team.score ? <span className="text-mono text-accent fw-600">{team.score}</span> : <span className="text-muted">—</span>}</td>
                  <td>{team.divergence ? <span className="chip chip-flagged">⚑ Yes</span> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const MentorDashboard = ({ t }) => {
  const myTeam = TEAMS[0]; // Mentor's team
  const myInterviews = INTERVIEWS.slice(0, 3);

  return (
    <>
      <div className="stat-grid">
        {[
          { label: "My Team", value: myTeam.name, sub: `#${myTeam.id}`, accent: "var(--accent)" },
          { label: "Next Interview", value: "10:30", sub: "Room 102 · In 12 min", accent: "var(--yellow)" },
          { label: "Eval Status", value: myTeam.status === "complete" ? "Done" : "Pending", sub: `Score: ${myTeam.score || "TBD"}`, accent: myTeam.status === "complete" ? "var(--green)" : "var(--orange)" },
          { label: "Notebook", value: myTeam.notebook === "submitted" ? "✓ OK" : "✗ Missing", sub: myTeam.notebook === "submitted" ? "Submitted" : "Upload required", accent: myTeam.notebook === "submitted" ? "var(--green)" : "var(--red)" },
        ].map((s, i) => (
          <div className="stat-card" key={i} style={{ "--stat-accent": s.accent }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: s.label === "My Team" ? 18 : 28, marginTop: s.label === "My Team" ? 4 : 0 }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="alert alert-warning">
        <span>🕐</span>
        <div>
          <div className="alert-text fw-600">Interview in <strong>12 minutes</strong> — ensure your team is in the waiting area by Room 102</div>
          <div className="alert-time">{t.prepReminder}</div>
        </div>
      </div>

      <div className="grid-2-3">
        <div className="section">
          <SectionHeader title={t.upcomingInterviews} icon="📅" />
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {INTERVIEWS.map((interview, i) => (
              <div className="interview-row" key={i} style={{ background: interview.status === "active" ? "var(--accent-glow)" : "transparent", borderRadius: 6, padding: "10px 8px", marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: interview.status === "done" ? "var(--green)" : interview.status === "active" ? "var(--accent)" : "var(--border)", flexShrink: 0 }} />
                <div className="flex-1">
                  <div className="flex items-center gap-6">
                    <span className="text-mono" style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 36 }}>{interview.time}</span>
                    <span className="fw-600" style={{ fontSize: 13 }}>{interview.name}</span>
                  </div>
                  <div style={{ marginLeft: 42, fontSize: 11, color: "var(--text-secondary)" }}>{interview.room}</div>
                </div>
                {interview.status === "upcoming" && interview.minutesUntil < 60 && (
                  <span className="countdown-chip">{interview.minutesUntil}m</span>
                )}
                {interview.status === "active" && (
                  <div className="live-badge"><div className="live-dot" />Live</div>
                )}
                {interview.status === "done" && (
                  <span className="chip chip-complete">✓ Done</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section">
            <SectionHeader title={t.warnings} icon="⚠️" />
            <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="alert alert-warning">
                <span>📔</span>
                <div>
                  <div className="alert-text">Engineering Notebook must be delivered to judging room by <strong>11:00</strong></div>
                </div>
              </div>
              <div className="alert alert-info">
                <span>ℹ️</span>
                <div>
                  <div className="alert-text">Ensure all team members wear safety glasses in pit area</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <SectionHeader title="Team Checklist" icon="✅" />
            <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { done: true, text: "Robot passed inspection" },
                { done: true, text: "Notebook submitted" },
                { done: false, text: "Pre-interview briefing" },
                { done: false, text: "Practice Q&A session" },
              ].map((item, i) => (
                <div key={i} className="flex gap-8 items-center">
                  <span style={{ color: item.done ? "var(--green)" : "var(--border)", fontSize: 14 }}>{item.done ? "✓" : "○"}</span>
                  <span style={{ fontSize: 13, color: item.done ? "var(--text-secondary)" : "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <SectionHeader title={t.teamSchedule} icon="🗓️" />
        <div className="section-body">
          <div className="timeline">
            {EVENT_SCHEDULE.map((item, i) => (
              <div className="timeline-item" key={i}>
                <div className={`timeline-dot ${item.status}`} />
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-content">
                  <div className="timeline-event">{item.event}</div>
                  <div className="timeline-status">{item.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const PublicDashboard = ({ t }) => {
  const activeEvent = EVENT_SCHEDULE.find(e => e.status === "active");

  return (
    <>
      {/* Live status banner */}
      <div style={{ padding: "14px 18px", background: "linear-gradient(90deg, rgba(14,165,233,0.12) 0%, transparent 100%)", border: "1px solid var(--accent-dim)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div className="live-badge"><div className="live-dot" />{t.liveNow}</div>
        <span className="fw-600">{activeEvent?.event || "Event in Progress"}</span>
        <span className="text-secondary text-sm flex-1">FGC Regional Championship 2025 · Field 1 & 2</span>
        <button className="btn btn-primary">{t.watchLive} →</button>
      </div>

      <div className="two-col">
        {/* Livestream */}
        <div className="section">
          <SectionHeader title={t.livestream} icon="📺">
            <div className="live-badge"><div className="live-dot" />{t.liveNow}</div>
          </SectionHeader>
          <div className="stream-card">
            <div className="stream-preview">
              <div className="stream-icon">📺</div>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "var(--font-mono)" }}>Field 1 — Match 24 in progress</span>
              <div className="live-badge"><div className="live-dot" />LIVE</div>
            </div>
            <div className="stream-info">
              <div>
                <div className="fw-600" style={{ fontSize: 13 }}>Field 1 — Qualification Matches</div>
                <div className="text-secondary text-sm">3,241 watching</div>
              </div>
              <button className="btn btn-primary">{t.watchLive}</button>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="section">
          <SectionHeader title={t.announcements} icon="📢" />
          <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ANNOUNCEMENTS.map(a => (
              <div key={a.id} className={`alert alert-${a.type === "critical" ? "critical" : a.type === "good" ? "good" : "info"}`}>
                <div>
                  <div className="alert-text">{a.text}</div>
                  <div className="alert-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Schedule */}
        <div className="section">
          <SectionHeader title={t.schedule} icon="🗓️" />
          <div className="section-body">
            <div className="timeline">
              {EVENT_SCHEDULE.map((item, i) => (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${item.status}`} />
                  <div className="timeline-time">{item.time}</div>
                  <div className="timeline-content">
                    <div className="timeline-event">{item.event}</div>
                    <div className="timeline-status">{item.status}</div>
                  </div>
                  {item.status === "active" && <div className="live-badge" style={{ marginLeft: "auto" }}><div className="live-dot" />Now</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map + Field Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="section">
            <SectionHeader title={t.eventMap} icon="🗺️" />
            <div className="section-body">
              <div className="venue-map">
                <span style={{ fontSize: 36 }}>🗺️</span>
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>Interactive Venue Map</span>
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Tap to expand · Convention Hall A</span>
              </div>
            </div>
          </div>

          <div className="section">
            <SectionHeader title={t.fieldStatus} icon="🤖" />
            <div className="section-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { field: "Field 1", status: "active", match: "Match 24", teams: "4821 vs 3305" },
                { field: "Field 2", status: "pending", match: "Match 25 — prep", teams: "7712 vs 2241" },
                { field: "Pit Area", status: "complete", match: "Open", teams: "All teams" },
              ].map((f, i) => (
                <div key={i} className="field-live-indicator">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.status === "active" ? "var(--green)" : f.status === "pending" ? "var(--yellow)" : "var(--border)", flexShrink: 0, boxShadow: f.status === "active" ? "0 0 8px var(--green)" : "none" }} />
                  <div className="flex-1">
                    <span className="fw-600" style={{ fontSize: 12 }}>{f.field}</span>
                    <span className="text-muted" style={{ fontSize: 11, marginLeft: 8 }}>{f.match}</span>
                  </div>
                  <span className="text-mono" style={{ fontSize: 10, color: "var(--text-secondary)" }}>{f.teams}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="section">
        <SectionHeader title={t.results} icon="🏆">
          <span className="chip chip-neutral">After Match 23</span>
        </SectionHeader>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Rank</th><th>{t.teamName}</th><th>W / L</th><th>OPR</th><th>RP</th></tr></thead>
            <tbody>
              {[
                { rank: 1, name: "Circuit Breakers #9900", w: 7, l: 0, opr: 94.2, rp: 18 },
                { rank: 2, name: "Iron Coders #4821", w: 6, l: 1, opr: 88.1, rp: 15 },
                { rank: 3, name: "Quantum Bots #3305", w: 5, l: 2, opr: 74.8, rp: 12 },
                { rank: 4, name: "Nova Robotics #2241", w: 4, l: 3, opr: 66.3, rp: 9 },
                { rank: 5, name: "Steel Minds #7712", w: 3, l: 4, opr: 58.7, rp: 6 },
                { rank: 6, name: "Pixel Pilots #5534", w: 1, l: 6, opr: 41.2, rp: 2 },
              ].map(r => (
                <tr key={r.rank}>
                  <td><span className="text-mono fw-600" style={{ color: r.rank <= 3 ? "var(--yellow)" : "var(--text-muted)" }}>{r.rank <= 3 ? ["🥇","🥈","🥉"][r.rank-1] : `#${r.rank}`}</span></td>
                  <td className="fw-600">{r.name}</td>
                  <td><span className="text-mono"><span className="text-green">{r.w}W</span> / <span className="text-red">{r.l}L</span></span></td>
                  <td><span className="text-mono text-accent">{r.opr}</span></td>
                  <td><span className="text-mono">{r.rp}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState("en");
  const [role, setRole] = useState(null);
  const [tempRole, setTempRole] = useState(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isArabic = lang === "ar";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Close drawer when resizing to desktop
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const ROLES = [
    { key: "judge",        icon: "⚖️", label: t.judge,        desc: "Evaluate · Score · Review"   },
    { key: "judgeAdvisor", icon: "🎯", label: t.judgeAdvisor, desc: "Oversee · Coordinate · Alert" },
    { key: "mentor",       icon: "🤝", label: t.mentor,       desc: "Guide · Track · Prepare"      },
    { key: "public",       icon: "🌐", label: t.public,       desc: "Watch · Explore · Follow"      },
  ];

  const NAV_BY_ROLE = {
    judge:        [{ key:"dashboard",label:t.judgeDashboard,icon:"⚖️"},{ key:"teams",label:t.assignedTeams,icon:"👥",badge:TEAMS.filter(x=>x.status==="pending").length},{ key:"notices",label:t.interviewNotices,icon:"🔔",badge:2}],
    judgeAdvisor: [{ key:"dashboard",label:t.jaDashboard,icon:"🎯"},{ key:"judges",label:t.judgesOverview,icon:"⚖️",badge:1},{ key:"alerts",label:t.criticalAlerts,icon:"⚠️",badge:1}],
    mentor:       [{ key:"dashboard",label:t.mentorDashboard,icon:"🤝"},{ key:"schedule",label:t.teamSchedule,icon:"📅"},{ key:"warnings",label:t.warnings,icon:"⚠️",badge:1}],
    public:       [{ key:"dashboard",label:t.publicDashboard,icon:"🌐"},{ key:"schedule",label:t.schedule,icon:"📅"},{ key:"results",label:t.results,icon:"🏆"}],
  };

  const DASHBOARD_TITLE = {
    judge: t.judgeDashboard, judgeAdvisor: t.jaDashboard,
    mentor: t.mentorDashboard, public: t.publicDashboard,
  };

  const handleNav = (key) => {
    setActiveNav(key);
    if (!isDesktop) setSidebarOpen(false);
  };

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!role) {
    return (
      <>
        <style>{createStyles(isDark)}</style>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-logo">
              <div className="login-logo-icon">FGC</div>
              <div>
                <div className="login-logo-text">{t.appName}</div>
                <div className="login-logo-sub">{t.tagline}</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginBottom:20, flexWrap:"wrap" }}>
              <div className="lang-selector">
                {["en","pt","es","fr","ar"].map(l => (
                  <button key={l} className={`lang-btn ${lang===l?"active":""}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
                ))}
              </div>
              <button className="theme-toggle" onClick={() => setIsDark(d => !d)}>
                {isDark ? "☀️" : "🌙"} <span className="theme-label">{isDark ? t.lightMode : t.darkMode}</span>
              </button>
            </div>

            <div className="login-title">{t.selectRole}</div>
            <div className="login-subtitle">FGC Regional Championship · 2025</div>

            <div className="role-grid">
              {ROLES.map(r => (
                <div key={r.key} className={`role-card ${tempRole===r.key?"selected":""}`} onClick={() => setTempRole(r.key)}>
                  <div className="role-card-icon">{r.icon}</div>
                  <div className="role-card-title">{r.label}</div>
                  <div className="role-card-desc">{r.desc}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ justifyContent:"center", padding:"10px", fontSize:14 }}
              onClick={() => tempRole && setRole(tempRole)}
              disabled={!tempRole}
            >
              Continue →
            </button>

            <div className="login-footer">
              FGC Judges App v1.0 · Secure Session · {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </>
    );
  }

  const navItems = NAV_BY_ROLE[role] || [];
  const roleObj  = ROLES.find(r => r.key === role);

  return (
    <>
      <style>{createStyles(isDark)}</style>
      <div className="app-shell" style={{ direction: isArabic ? "rtl" : "ltr" }}>

        {/* ── Backdrop for drawer (tablet / mobile) ── */}
        {!isDesktop && (
          <div
            className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${!isDesktop && sidebarOpen ? "drawer-open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon">FGC</div>
              <div className="logo-text">{t.appName}</div>
            </div>
            <div className="logo-sub">{t.tagline}</div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Navigation</div>
            {navItems.map(item => (
              <button key={item.key} className={`nav-item ${activeNav===item.key?"active":""}`} onClick={() => handleNav(item.key)}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
            <div className="nav-section-label" style={{ marginTop:8 }}>General</div>
            <button className="nav-item"><span className="nav-icon">⚙️</span>Settings</button>
            <button className="nav-item"><span className="nav-icon">❓</span>Help</button>
          </nav>

          <div className="sidebar-footer">
            <div className="role-badge">
              <div className="role-avatar">{roleObj?.icon}</div>
              <div className="role-info">
                <div className="role-name">{roleObj?.label}</div>
                <div className="role-label">Active Session</div>
              </div>
            </div>
            <button className="btn btn-ghost w-full" style={{ justifyContent:"center", fontSize:11 }}
              onClick={() => { setRole(null); setTempRole(null); setSidebarOpen(false); }}>
              ← {t.logout}
            </button>
          </div>
        </aside>

        {/* ── Main Area ── */}
        <div className="main-area">

          {/* Top Bar */}
          <header className="topbar">
            {/* Hamburger — only rendered on tablet + mobile */}
            {!isDesktop && (
              <button className="topbar-hamburger" onClick={() => setSidebarOpen(s => !s)}>☰</button>
            )}

            <div className="topbar-title">{DASHBOARD_TITLE[role]}</div>
            <div className="topbar-meta">FGC Regional 2025</div>
            <div className="topbar-meta text-mono">{timeStr}</div>
            <div className="topbar-spacer" />

            <div className="topbar-actions">
              <div className="search-box">
                🔍 <input placeholder={t.search} />
              </div>

              <div className="lang-selector">
                {["en","pt","es","fr","ar"].map(l => (
                  <button key={l} className={`lang-btn ${lang===l?"active":""}`} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
                ))}
              </div>

              <button className="theme-toggle" onClick={() => setIsDark(d => !d)}>
                {isDark ? "☀️" : "🌙"} <span className="theme-label">{isDark ? t.lightMode : t.darkMode}</span>
              </button>

              <div className="icon-btn" style={{ position:"relative" }}>
                🔔
                <div className="notification-dot" />
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="page-content">
            {role === "judge"        && <JudgeDashboard t={t} isArabic={isArabic} />}
            {role === "judgeAdvisor" && <JudgeAdvisorDashboard t={t} />}
            {role === "mentor"       && <MentorDashboard t={t} />}
            {role === "public"       && <PublicDashboard t={t} />}
          </main>

          {/* ── Bottom Nav — mobile only ── */}
          {isMobile && (
            <nav className="bottom-nav">
              {navItems.map(item => (
                <button key={item.key} className={`bottom-nav-item ${activeNav===item.key?"active":""}`}
                  onClick={() => handleNav(item.key)}>
                  {item.badge > 0 && <span className="bn-badge">{item.badge}</span>}
                  <span className="bn-icon">{item.icon}</span>
                  <span>{item.label.split(" ")[0]}</span>
                </button>
              ))}
              {/* Theme toggle as last bottom nav item on mobile */}
              <button className="bottom-nav-item" onClick={() => setIsDark(d => !d)}>
                <span className="bn-icon">{isDark ? "☀️" : "🌙"}</span>
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
