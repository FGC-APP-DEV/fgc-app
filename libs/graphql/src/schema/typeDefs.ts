import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime

  enum AppRole {
    judge
    judgeAdvisor
    mentor
    public
  }

  type Team {
    id: ID!
    name: String!
    panel: String!
    status: String!
    score: Int
    notebookStatus: String!
    divergence: Boolean!
    flag: Boolean!
  }

  type Interview {
    id: ID!
    teamId: String!
    teamName: String!
    scheduleTime: String!
    room: String!
    status: String!
    minutesUntil: Int
  }

  type JudgeProgress {
    id: ID!
    name: String!
    panel: String
    completed: Int!
    total: Int!
    status: String!
  }

  type Announcement {
    id: ID!
    type: String!
    text: String!
    timeDisplay: String!
    createdAt: DateTime!
  }

  type ScheduleEvent {
    id: ID!
    timeDisplay: String!
    eventName: String!
    status: String!
    sortOrder: Int!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: AppRole!
    panel: String
  }

  type AuthPayload {
    token: String!
    user: User!
    expiresAt: DateTime!
  }

  input LoginInput {
    email: String!
    password: String
  }

  type Query {
    healthCheck: String!
    teams: [Team!]!
    interviews: [Interview!]!
    announcements: [Announcement!]!
    eventSchedule: [ScheduleEvent!]!
    judges: [JudgeProgress!]!
    me: User
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
  }
`
