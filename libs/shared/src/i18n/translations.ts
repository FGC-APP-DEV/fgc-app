export type Locale = 'en' | 'pt' | 'es' | 'fr' | 'ar'

export type TranslationDict = Record<string, string>

const en: TranslationDict = {
  appName: 'FGC Judges',
  tagline: 'Judging Operations Platform',
  selectRole: 'Select your role to continue',
  judge: 'Judge',
  judgeAdvisor: 'Judge Advisor',
  mentor: 'Mentor',
  public: 'Public Visitor',
  logout: 'Switch Role',
  darkMode: 'Dark',
  lightMode: 'Light',
  judgeDashboard: 'Judge Dashboard',
  judgeAdvisorDashboard: 'Advisor Dashboard',
  mentorDashboard: 'Mentor Dashboard',
  publicDashboard: 'Public Dashboard',
  assignedTeams: 'Assigned Teams',
  evaluations: 'Evaluations',
  completionProgress: 'Completion Progress',
  missingEvals: 'Missing Evaluations',
  divergenceWarnings: 'Divergence Warnings',
  interviewNotices: 'Interview Notices',
  reEvalNotices: 'Re-Evaluation Notices',
  uploadMedia: 'Upload Robot Media',
  notebookStatus: 'Notebook / Portfolio',
  scoringForms: 'Scoring Forms',
  teamCode: 'Team',
  status: 'Status',
  score: 'Score',
  action: 'Action',
  complete: 'Complete',
  pending: 'Pending',
  inProgress: 'In Progress',
  flagged: 'Flagged',
  viewForm: 'View Form',
  reEval: 'Re-Evaluate',
  submitted: 'Submitted',
  today: 'Today',
  refresh: 'Refresh',
  announcements: 'Announcements',
  schedule: 'Schedule',
  loading: 'Loading…',
  errorLoad: 'Could not load data',
}

function mirrorEn(): TranslationDict {
  return { ...en }
}

export const TRANSLATIONS: Record<Locale, TranslationDict> = {
  en,
  pt: mirrorEn(),
  es: mirrorEn(),
  fr: mirrorEn(),
  ar: mirrorEn(),
}
