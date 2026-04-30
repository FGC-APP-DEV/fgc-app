import { gql } from '@apollo/client/core'

export {
  useQuery,
  useMutation,
  useLazyQuery,
} from '@apollo/client/react'

export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      panel
      status
      score
      notebookStatus
      divergence
      flag
    }
  }
`

export const GET_INTERVIEWS = gql`
  query GetInterviews {
    interviews {
      id
      teamId
      teamName
      scheduleTime
      room
      status
      minutesUntil
    }
  }
`

export const GET_ANNOUNCEMENTS = gql`
  query GetAnnouncements {
    announcements {
      id
      type
      text
      timeDisplay
      createdAt
    }
  }
`

export const GET_EVENT_SCHEDULE = gql`
  query GetEventSchedule {
    eventSchedule {
      id
      timeDisplay
      eventName
      status
      sortOrder
    }
  }
`

export const GET_JUDGES = gql`
  query GetJudges {
    judges {
      id
      name
      panel
      completed
      total
      status
    }
  }
`

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      expiresAt
      user {
        id
        email
        name
        role
        panel
      }
    }
  }
`
