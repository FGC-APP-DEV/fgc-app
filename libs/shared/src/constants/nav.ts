import type { AppRole } from '../types/roles'

export const NAV_BY_ROLE: Record<AppRole, { id: string; labelKey: string }[]> = {
  judge: [
    { id: 'dashboard', labelKey: 'judgeDashboard' },
    { id: 'teams', labelKey: 'assignedTeams' },
    { id: 'notices', labelKey: 'interviewNotices' },
  ],
  judgeAdvisor: [
    { id: 'dashboard', labelKey: 'judgeAdvisorDashboard' },
    { id: 'coordination', labelKey: 'evaluations' },
    { id: 'announcements', labelKey: 'divergenceWarnings' },
  ],
  mentor: [
    { id: 'dashboard', labelKey: 'mentorDashboard' },
    { id: 'notices', labelKey: 'interviewNotices' },
  ],
  public: [
    { id: 'dashboard', labelKey: 'publicDashboard' },
    { id: 'schedule', labelKey: 'today' },
  ],
}
