export type TeamStatus = 'complete' | 'inProgress' | 'pending' | 'flagged'

export type NotebookStatus = 'submitted' | 'notSubmitted'

export interface TeamDto {
  id: string
  name: string
  panel: string
  status: TeamStatus
  score: number | null
  notebookStatus: NotebookStatus
  divergence: boolean
  flag: boolean
}

export interface InterviewDto {
  id: string
  teamId: string
  teamName: string
  scheduleTime: string
  room: string
  status: string
  minutesUntil: number | null
}

export interface JudgeProgressDto {
  id: string
  name: string
  panel: string | null
  completed: number
  total: number
  status: 'good' | 'warning' | 'critical'
}

export interface AnnouncementDto {
  id: string
  type: string
  text: string
  timeDisplay: string
}

export interface ScheduleEventDto {
  id: string
  timeDisplay: string
  eventName: string
  status: string
}
