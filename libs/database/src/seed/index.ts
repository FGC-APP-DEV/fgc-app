/**
 * Seed database with prototype-equivalent demo data.
 * Run: npm run db:seed (from workspace root)
 */
import { db, pool } from '../client'
import {
  announcements,
  eventSchedule,
  interviews,
  teams,
  users,
} from '../schema'

const demoTeams = [
  {
    id: '4821',
    name: 'Iron Coders',
    panel: 'A',
    status: 'complete',
    score: 87,
    notebookStatus: 'submitted',
    divergence: false,
    flag: false,
  },
  {
    id: '3305',
    name: 'Quantum Bots',
    panel: 'A',
    status: 'inProgress',
    score: 74,
    notebookStatus: 'submitted',
    divergence: true,
    flag: false,
  },
  {
    id: '7712',
    name: 'Steel Minds',
    panel: 'B',
    status: 'pending',
    score: null,
    notebookStatus: 'notSubmitted',
    divergence: false,
    flag: true,
  },
  {
    id: '2241',
    name: 'Nova Robotics',
    panel: 'B',
    status: 'flagged',
    score: 61,
    notebookStatus: 'submitted',
    divergence: true,
    flag: true,
  },
  {
    id: '9900',
    name: 'Circuit Breakers',
    panel: 'A',
    status: 'complete',
    score: 92,
    notebookStatus: 'submitted',
    divergence: false,
    flag: false,
  },
  {
    id: '5534',
    name: 'Pixel Pilots',
    panel: 'C',
    status: 'pending',
    score: null,
    notebookStatus: 'notSubmitted',
    divergence: false,
    flag: false,
  },
]

async function main() {
  console.log('Seeding FGC database...')
  const existing = await db.select({ id: teams.id }).from(teams).limit(1)
  if (existing.length > 0) {
    console.log('Teams already present — skipping seed.')
    await pool.end()
    return
  }

  await db
    .insert(users)
    .values([
      {
        email: 'sarah.chen@fgc.local',
        name: 'Dr. Sarah Chen',
        role: 'judge',
        panel: 'A',
      },
      {
        email: 'marcus.williams@fgc.local',
        name: 'Marcus Williams',
        role: 'judge',
        panel: 'A',
      },
      {
        email: 'ana.rodrigues@fgc.local',
        name: 'Ana Rodrigues',
        role: 'judge',
        panel: 'B',
      },
      {
        email: 'james.okafor@fgc.local',
        name: 'James Okafor',
        role: 'judge',
        panel: 'B',
      },
      {
        email: 'yuki.tanaka@fgc.local',
        name: 'Yuki Tanaka',
        role: 'judge',
        panel: 'C',
      },
    ])

  await db.insert(users).values({
    email: 'advisor@fgc.local',
    name: 'Lead Advisor',
    role: 'judgeAdvisor',
    panel: null,
  })

  await db.insert(users).values({
    email: 'mentor@fgc.local',
    name: 'Demo Mentor',
    role: 'mentor',
    panel: null,
  })

  await db.insert(teams).values(demoTeams)

  await db.insert(announcements).values([
    {
      type: 'critical',
      text: 'Field 2 delay — match schedule pushed 15 min',
      timeDisplay: '10:42',
    },
    {
      type: 'info',
      text: 'Pit area open for robot inspection until 12:00',
      timeDisplay: '09:15',
    },
    {
      type: 'good',
      text: 'Team 4821 - Inspire Award nominee confirmed',
      timeDisplay: '08:55',
    },
  ])

  await db.insert(eventSchedule).values([
    {
      sortOrder: 0,
      timeDisplay: '08:00',
      eventName: 'Registration & Pit Setup',
      status: 'done',
    },
    { sortOrder: 1, timeDisplay: '09:30', eventName: 'Opening Ceremony', status: 'done' },
    {
      sortOrder: 2,
      timeDisplay: '10:00',
      eventName: 'Qualification Matches - Round 1',
      status: 'done',
    },
    {
      sortOrder: 3,
      timeDisplay: '11:30',
      eventName: 'Robot Judging Interviews Begin',
      status: 'active',
    },
    { sortOrder: 4, timeDisplay: '13:00', eventName: 'Lunch Break', status: 'upcoming' },
    {
      sortOrder: 5,
      timeDisplay: '14:00',
      eventName: 'Qualification Matches - Round 2',
      status: 'upcoming',
    },
    {
      sortOrder: 6,
      timeDisplay: '16:30',
      eventName: 'Alliance Selection',
      status: 'upcoming',
    },
    {
      sortOrder: 7,
      timeDisplay: '17:30',
      eventName: 'Awards Ceremony',
      status: 'upcoming',
    },
  ])

  await db.insert(interviews).values([
    {
      teamId: '4821',
      teamName: 'Iron Coders',
      scheduleTime: '09:00',
      room: 'Room 101',
      status: 'done',
      minutesUntil: null,
      judgeId: null,
    },
    {
      teamId: '3305',
      teamName: 'Quantum Bots',
      scheduleTime: '10:30',
      room: 'Room 102',
      status: 'active',
      minutesUntil: null,
      judgeId: null,
    },
    {
      teamId: '7712',
      teamName: 'Steel Minds',
      scheduleTime: '11:45',
      room: 'Room 101',
      status: 'upcoming',
      minutesUntil: 42,
      judgeId: null,
    },
    {
      teamId: '2241',
      teamName: 'Nova Robotics',
      scheduleTime: '13:00',
      room: 'Room 103',
      status: 'upcoming',
      minutesUntil: 97,
      judgeId: null,
    },
    {
      teamId: '9900',
      teamName: 'Circuit Breakers',
      scheduleTime: '14:15',
      room: 'Room 102',
      status: 'upcoming',
      minutesUntil: 172,
      judgeId: null,
    },
    {
      teamId: '5534',
      teamName: 'Pixel Pilots',
      scheduleTime: '15:30',
      room: 'Room 101',
      status: 'upcoming',
      minutesUntil: 257,
      judgeId: null,
    },
  ])

  console.log('Seed complete.')
  await pool.end()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
