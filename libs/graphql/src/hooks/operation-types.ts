/** Minimal result shapes for untyped documents (until graphql-codegen is wired). */

export interface TeamGql {
  id: string
  name: string
  panel: string
  status: string
  score: number | null
  notebookStatus: string
  divergence: boolean
  flag: boolean
}

export interface InterviewGql {
  id: string
  teamId: string
  teamName: string
  scheduleTime: string
  room: string
  status: string
  minutesUntil: number | null
}

export interface JudgeProgressGql {
  id: string
  name: string
  panel: string | null
  completed: number
  total: number
  status: string
}

export interface AnnouncementGql {
  id: string
  type: string
  text: string
  timeDisplay: string
  createdAt: string
}

export interface ScheduleEventGql {
  id: string
  timeDisplay: string
  eventName: string
  status: string
  sortOrder: number
}

export interface GetTeamsQueryData {
  teams: TeamGql[]
}

export interface GetInterviewsQueryData {
  interviews: InterviewGql[]
}

export interface GetJudgesQueryData {
  judges: JudgeProgressGql[]
}

export interface GetAnnouncementsQueryData {
  announcements: AnnouncementGql[]
}

export interface GetEventScheduleQueryData {
  eventSchedule: ScheduleEventGql[]
}

export interface LoginMutationData {
  login: {
    token: string
    expiresAt: string
    user: {
      id: string
      email: string
      name: string
      role: string
      panel: string | null
    }
  }
}

export interface LoginMutationVariables {
  input: { email: string; password?: string }
}
