# Modelos, campos e constraints do legado

Extração integral dos blocos Prisma para referência; destino SQL Supabase proposto, não migration executável.

| Modelo/enum | Destino proposto | Tratamento |
| --- | --- | --- |
| Event (model) | `core.events` | Preservar semântica; adaptar SQL/RLS/FKs. |
| ScheduleEntry (model) | `sem destino operacional no MVP` | Mapeado para evolução; link provisório continua no MVP. |
| Team (model) | `core.teams` | Preservar semântica; adaptar SQL/RLS/FKs. |
| User (model) | `core.users` | Preservar semântica; adaptar SQL/RLS/FKs. |
| Role (model) | `core.roles` | Preservar semântica; adaptar SQL/RLS/FKs. |
| UserEventRole (model) | `core.user_event_roles` | Preservar semântica; adaptar SQL/RLS/FKs. |
| ApprovedEmail (model) | `core.approved_emails` | Preservar semântica; adaptar SQL/RLS/FKs. |
| ApprovedEmailRole (model) | `core.approved_email_roles` | Preservar semântica; adaptar SQL/RLS/FKs. |
| MentorCode (model) | `private.mentor_codes` | Preservar semântica; adaptar SQL/RLS/FKs. |
| MentorSession (model) | `private.mentor_sessions` | Preservar semântica; adaptar SQL/RLS/FKs. |
| AuditLog (model) | `audit.audit_log` | Preservar semântica; adaptar SQL/RLS/FKs. |
| Match (model) | `sem destino operacional no MVP` | Mapeado para evolução; link provisório continua no MVP. |
| MatchParticipant (model) | `sem destino operacional no MVP` | Mapeado para evolução; link provisório continua no MVP. |
| Ranking (model) | `sem destino operacional no MVP` | Mapeado para evolução; link provisório continua no MVP. |
| TeamPitLocation (model) | `core.team_pit_locations` | Preservar semântica; adaptar SQL/RLS/FKs. |
| TeamResource (model) | `sem destino operacional no MVP` | Estrutura legada inventariada; upload/portfolio não aprovado no MVP, ativação adiada. |
| AwardKey (enum) | `sem destino operacional no MVP` | Fora do MVP aprovado; não migrar para uso operacional. |
| PanelTeamStatus (enum) | `judging.panel_team_status` | Substituir por pending/evaluated + active/withdrawn. |
| JudgePanel (model) | `judging.judge_panels` | Adicionar líder obrigatório e ciclo de Judging; remover award. |
| PanelMember (model) | `judging.panel_members` | Unicidade juiz/ciclo; líder deve ser membro. |
| PanelTeamAssignment (model) | `judging.panel_team_assignments` | Separar participação, estado e flags; sem round. |
| TeamEvaluation (model) | `judging.team_evaluations` | Converter em observações; sem round/prêmios; manter autoria e painel. |
| TeamAwardCandidacy (model) | `sem destino operacional no MVP` | Fora do MVP aprovado; não migrar para uso operacional. |
| FilmingCategory (model) | `filming.filming_categories` | Preservar semântica; adaptar SQL/RLS/FKs. |
| FilmingShotItem (model) | `filming.filming_shot_items` | Preservar semântica; adaptar SQL/RLS/FKs. |
| TeamShotTemplate (model) | `filming.team_shot_templates` | Preservar semântica; adaptar SQL/RLS/FKs. |
| TeamShot (model) | `filming.team_shots` | Preservar semântica; adaptar SQL/RLS/FKs. |
| Announcement (model) | `sem destino operacional no MVP` | Fora do recorte atual; preservar fonte para evolução, sem migrar anúncios completos. |
| AnnouncementRead (model) | `sem destino operacional no MVP` | Fora do recorte atual; preservar fonte para evolução, sem migrar anúncios completos. |
| Page (model) | `messaging.pages` | Preservar semântica; adaptar SQL/RLS/FKs. |
| PageResponse (model) | `messaging.page_responses` | Preservar semântica; adaptar SQL/RLS/FKs. |
| ProductionInterview (model) | `sem destino operacional no MVP` | Modelo existe sem módulo completo; não criar produto especulativo. |

## Event

```prisma
model Event {
  id        Int       @id @default(autoincrement())
  eventKey  String    @unique @map("event_key")
  year      Int
  name      String
  location  String?
  startDate DateTime? @map("start_date") @db.Date
  endDate   DateTime? @map("end_date") @db.Date
  // Which judging round panels are working (1 or 2). The JA flips it
  // from the advisor dashboard; the judge view reads it.
  judgingRound Int      @default(1) @map("judging_round")
  createdAt    DateTime @default(now()) @map("created_at")

  userEventRoles       UserEventRole[]
  approvedEmails       ApprovedEmail[]
  mentorCodes          MentorCode[]
  auditLogs            AuditLog[]
  matches              Match[]
  rankings             Ranking[]
  teamPitLocations     TeamPitLocation[]
  teamResources        TeamResource[]
  judgePanels          JudgePanel[]
  teamEvaluations      TeamEvaluation[]
  filmingCategories    FilmingCategory[]
  teamShotTemplates    TeamShotTemplate[]
  teamShots            TeamShot[]
  announcements        Announcement[]
  pages                Page[]
  productionInterviews ProductionInterview[]
  scheduleEntries      ScheduleEntry[]

  @@map("events")
}
```

## ScheduleEntry

```prisma
model ScheduleEntry {
  id        Int       @id @default(autoincrement())
  eventId   Int       @map("event_id")
  title     String
  // ceremony | meal | matches | logistics | social — drives styling.
  category  String
  startsAt  DateTime  @map("starts_at")
  endsAt    DateTime? @map("ends_at")
  createdAt DateTime  @default(now()) @map("created_at")

  event Event @relation(fields: [eventId], references: [id])

  @@index([eventId, startsAt])
  @@map("schedule_entries")
}
```

## Team

```prisma
model Team {
  id          Int      @id @default(autoincrement())
  teamKey     Int      @unique @map("team_key")
  country     String
  countryCode String   @map("country_code") @db.VarChar(2)
  name        String
  shortName   String?  @map("short_name")
  cardStatus  Int      @default(0) @map("card_status")
  hasCard     Boolean  @default(false) @map("has_card")
  syncedAt    DateTime @default(now()) @map("synced_at")
  createdAt   DateTime @default(now()) @map("created_at")

  mentorCodes          MentorCode[]
  matchParticipants    MatchParticipant[]
  rankings             Ranking[]
  teamPitLocations     TeamPitLocation[]
  teamResources        TeamResource[]
  panelTeamAssignments PanelTeamAssignment[]
  teamEvaluations      TeamEvaluation[]
  teamShots            TeamShot[]
  pages                Page[]
  productionInterviews ProductionInterview[]

  @@map("teams")
}
```

## User

```prisma
model User {
  id           Int      @id @default(autoincrement())
  supabaseId   String   @unique @map("supabase_id") @db.Uuid
  email        String   @unique
  // Nullable: new users may sign in before completing their profile. We
  // gate routes that need attribution on this being set.
  fullName     String?  @map("full_name")
  isSuperAdmin Boolean  @default(false) @map("is_super_admin")
  createdAt    DateTime @default(now()) @map("created_at")

  userEventRoles                UserEventRole[]
  approvedEmailsAdded           ApprovedEmail[]       @relation("ApprovedEmailAddedBy")
  mentorCodesIssued             MentorCode[]
  auditLogs                     AuditLog[]
  teamPitLocationsUpdated       TeamPitLocation[]
  teamResourcesAdded            TeamResource[]
  panelMemberships              PanelMember[]
  teamEvaluationsAuthored       TeamEvaluation[]
  filmingShotItemsCreated       FilmingShotItem[]     @relation("FilmingShotItemCreated")
  filmingShotItemsDone          FilmingShotItem[]     @relation("FilmingShotItemDone")
  teamShotsCaptured             TeamShot[]
  announcementsSent             Announcement[]
  announcementReads             AnnouncementRead[]
  pagesSent                     Page[]
  productionInterviewsScheduled ProductionInterview[]

  @@map("users")
}
```

## Role

```prisma
model Role {
  id    Int    @id @default(autoincrement())
  key   String @unique
  label String

  userEventRoles     UserEventRole[]
  approvedEmailRoles ApprovedEmailRole[]

  @@map("roles")
}
```

## UserEventRole

```prisma
model UserEventRole {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  eventId   Int      @map("event_id")
  roleId    Int      @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id])
  role  Role  @relation(fields: [roleId], references: [id])

  @@unique([userId, eventId, roleId])
  @@map("user_event_roles")
}
```

## ApprovedEmail

```prisma
model ApprovedEmail {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  eventId   Int      @map("event_id")
  addedById Int      @map("added_by")
  notes     String?
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  event   Event               @relation(fields: [eventId], references: [id])
  addedBy User                @relation("ApprovedEmailAddedBy", fields: [addedById], references: [id])
  roles   ApprovedEmailRole[]

  @@map("approved_emails")
}
```

## ApprovedEmailRole

```prisma
model ApprovedEmailRole {
  id              Int @id @default(autoincrement())
  approvedEmailId Int @map("approved_email_id")
  roleId          Int @map("role_id")

  approvedEmail ApprovedEmail @relation(fields: [approvedEmailId], references: [id], onDelete: Cascade)
  role          Role          @relation(fields: [roleId], references: [id])

  @@unique([approvedEmailId, roleId])
  @@map("approved_email_roles")
}
```

## MentorCode

```prisma
model MentorCode {
  id         Int       @id @default(autoincrement())
  teamId     Int       @map("team_id")
  eventId    Int       @map("event_id")
  codeHash   String    @map("code_hash")
  expiresAt  DateTime? @map("expires_at")
  issuedById Int       @map("issued_by")
  createdAt  DateTime  @default(now()) @map("created_at")

  team     Team            @relation(fields: [teamId], references: [id])
  event    Event           @relation(fields: [eventId], references: [id])
  issuedBy User            @relation(fields: [issuedById], references: [id])
  sessions MentorSession[]

  @@unique([teamId, eventId])
  @@map("mentor_codes")
}
```

## MentorSession

```prisma
model MentorSession {
  id                Int       @id @default(autoincrement())
  mentorCodeId      Int       @map("mentor_code_id")
  deviceFingerprint String    @map("device_fingerprint")
  startedAt         DateTime  @default(now()) @map("started_at")
  lastSeenAt        DateTime  @map("last_seen_at")
  revokedAt         DateTime? @map("revoked_at")

  mentorCode        MentorCode         @relation(fields: [mentorCodeId], references: [id])
  pageResponses     PageResponse[]
  announcementReads AnnouncementRead[]

  @@map("mentor_sessions")
}
```

## AuditLog

```prisma
model AuditLog {
  id         Int      @id @default(autoincrement())
  userId     Int?     @map("user_id")
  eventId    Int      @map("event_id")
  action     String
  targetType String?  @map("target_type")
  targetId   Int?     @map("target_id")
  metadata   Json?
  createdAt  DateTime @default(now()) @map("created_at")

  user  User? @relation(fields: [userId], references: [id])
  event Event @relation(fields: [eventId], references: [id])

  @@index([userId, createdAt])
  @@index([eventId, createdAt])
  @@map("audit_log")
}
```

## Match

```prisma
model Match {
  id            Int       @id @default(autoincrement())
  eventId       Int       @map("event_id")
  fgcMatchId    Int       @map("fgc_match_id")
  tournamentKey String    @map("tournament_key")
  name          String
  scheduledTime DateTime? @map("scheduled_time")
  startTime     DateTime? @map("start_time")
  fieldNumber   Int?      @map("field_number")
  redScore      Int?      @map("red_score")
  blueScore     Int?      @map("blue_score")
  redMinPen     Int?      @map("red_min_pen")
  redMajPen     Int?      @map("red_maj_pen")
  blueMinPen    Int?      @map("blue_min_pen")
  blueMajPen    Int?      @map("blue_maj_pen")
  result        Int?
  details       Json?
  played        Boolean   @default(false)
  syncedAt      DateTime  @default(now()) @map("synced_at")

  event        Event              @relation(fields: [eventId], references: [id])
  participants MatchParticipant[]

  @@unique([eventId, tournamentKey, fgcMatchId])
  @@map("matches")
}
```

## MatchParticipant

```prisma
model MatchParticipant {
  id       Int    @id @default(autoincrement())
  matchId  Int    @map("match_id")
  teamId   Int    @map("team_id")
  alliance String
  station  Int

  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  team  Team  @relation(fields: [teamId], references: [id])

  @@unique([matchId, teamId])
  @@map("match_participants")
}
```

## Ranking

```prisma
model Ranking {
  id               Int      @id @default(autoincrement())
  eventId          Int      @map("event_id")
  tournamentKey    String   @map("tournament_key")
  teamId           Int      @map("team_id")
  rank             Int
  rankChange       Int?     @map("rank_change")
  played           Int
  wins             Int
  losses           Int
  ties             Int
  rankingScore     Float    @map("ranking_score")
  highestScore     Int      @map("highest_score")
  protectionPoints Int?     @map("protection_points")
  syncedAt         DateTime @default(now()) @map("synced_at")

  event Event @relation(fields: [eventId], references: [id])
  team  Team  @relation(fields: [teamId], references: [id])

  @@unique([eventId, tournamentKey, teamId])
  @@map("rankings")
}
```

## TeamPitLocation

```prisma
model TeamPitLocation {
  id          Int      @id @default(autoincrement())
  teamId      Int      @map("team_id")
  eventId     Int      @map("event_id")
  pitLabel    String   @map("pit_label")
  xCoord      Float?   @map("x_coord")
  yCoord      Float?   @map("y_coord")
  updatedById Int?     @map("updated_by")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")

  team      Team  @relation(fields: [teamId], references: [id])
  event     Event @relation(fields: [eventId], references: [id])
  updatedBy User? @relation(fields: [updatedById], references: [id])

  @@unique([teamId, eventId])
  @@map("team_pit_locations")
}
```

## TeamResource

```prisma
model TeamResource {
  id          Int      @id @default(autoincrement())
  teamId      Int      @map("team_id")
  eventId     Int      @map("event_id")
  kind        String
  title       String
  url         String?
  storagePath String?  @map("storage_path")
  addedById   Int      @map("added_by")
  createdAt   DateTime @default(now()) @map("created_at")

  team    Team  @relation(fields: [teamId], references: [id])
  event   Event @relation(fields: [eventId], references: [id])
  addedBy User  @relation(fields: [addedById], references: [id])

  @@map("team_resources")
}
```

## AwardKey

```prisma
enum AwardKey {
  einstein
  zhang_heng
  lahori
  jemison
  cherkaoui
  caldas
  johnson
  bezos
  outstanding_mentor
  judges

  @@map("award_key")
}
```

## PanelTeamStatus

```prisma
enum PanelTeamStatus {
  not_started
  in_progress
  completed
  flagged

  @@map("panel_team_status")
}
```

## JudgePanel

```prisma
model JudgePanel {
  id        Int      @id @default(autoincrement())
  eventId   Int      @map("event_id")
  name      String
  // Round 1 panels are generic ("Panel 1..N", award = null). Round 2
  // panels each evaluate ONE award — award set means "this panel judges
  // that award" and Round 2 assignment routes candidates to it.
  award     AwardKey?
  createdAt DateTime  @default(now()) @map("created_at")

  event           Event                 @relation(fields: [eventId], references: [id])
  members         PanelMember[]
  assignments     PanelTeamAssignment[]
  teamEvaluations TeamEvaluation[]

  @@unique([eventId, name])
  @@map("judge_panels")
}
```

## PanelMember

```prisma
model PanelMember {
  id      Int @id @default(autoincrement())
  panelId Int @map("panel_id")
  userId  Int @map("user_id")

  panel JudgePanel @relation(fields: [panelId], references: [id], onDelete: Cascade)
  user  User       @relation(fields: [userId], references: [id])

  @@unique([panelId, userId])
  @@map("panel_members")
}
```

## PanelTeamAssignment

```prisma
model PanelTeamAssignment {
  id          Int             @id @default(autoincrement())
  panelId     Int             @map("panel_id")
  teamId      Int             @map("team_id")
  round       Int             @default(1)
  status      PanelTeamStatus @default(not_started)
  // Free text — populated only when status=flagged.
  flagReason  String?         @map("flag_reason")
  evaluatedAt DateTime?       @map("evaluated_at")
  createdAt   DateTime        @default(now()) @map("created_at")

  panel JudgePanel @relation(fields: [panelId], references: [id], onDelete: Cascade)
  team  Team       @relation(fields: [teamId], references: [id])

  @@unique([panelId, teamId, round])
  @@index([teamId, round])
  @@map("panel_team_assignments")
}
```

## TeamEvaluation

```prisma
model TeamEvaluation {
  id        Int      @id @default(autoincrement())
  panelId   Int      @map("panel_id")
  teamId    Int      @map("team_id")
  eventId   Int      @map("event_id")
  judgeId   Int      @map("judge_id")
  round     Int
  notes     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  panel       JudgePanel           @relation(fields: [panelId], references: [id], onDelete: Cascade)
  team        Team                 @relation(fields: [teamId], references: [id])
  event       Event                @relation(fields: [eventId], references: [id])
  judge       User                 @relation(fields: [judgeId], references: [id])
  candidacies TeamAwardCandidacy[]

  @@unique([teamId, judgeId, round])
  @@index([teamId, round])
  @@map("team_evaluations")
}
```

## TeamAwardCandidacy

```prisma
model TeamAwardCandidacy {
  id           Int      @id @default(autoincrement())
  evaluationId Int      @map("evaluation_id")
  award        AwardKey
  createdAt    DateTime @default(now()) @map("created_at")

  evaluation TeamEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)

  @@unique([evaluationId, award])
  @@index([award])
  @@map("team_award_candidacies")
}
```

## FilmingCategory

```prisma
model FilmingCategory {
  id          Int     @id @default(autoincrement())
  eventId     Int     @map("event_id")
  name        String
  description String?

  event Event             @relation(fields: [eventId], references: [id])
  items FilmingShotItem[]

  @@map("filming_categories")
}
```

## FilmingShotItem

```prisma
model FilmingShotItem {
  id          Int       @id @default(autoincrement())
  categoryId  Int       @map("category_id")
  title       String
  doneAt      DateTime? @map("done_at")
  doneById    Int?      @map("done_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  // Nullable so the seed can create starter items without a real user FK.
  createdById Int?      @map("created_by")

  category  FilmingCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  doneBy    User?           @relation("FilmingShotItemDone", fields: [doneById], references: [id])
  createdBy User?           @relation("FilmingShotItemCreated", fields: [createdById], references: [id])

  @@index([categoryId])
  @@map("filming_shot_items")
}
```

## TeamShotTemplate

```prisma
model TeamShotTemplate {
  id          Int     @id @default(autoincrement())
  eventId     Int     @map("event_id")
  name        String
  description String?
  required    Boolean @default(true)

  event Event      @relation(fields: [eventId], references: [id])
  shots TeamShot[]

  @@map("team_shot_templates")
}
```

## TeamShot

```prisma
model TeamShot {
  id           Int       @id @default(autoincrement())
  templateId   Int       @map("template_id")
  teamId       Int       @map("team_id")
  eventId      Int       @map("event_id")
  status       String
  storagePath  String?   @map("storage_path")
  capturedById Int?      @map("captured_by")
  capturedAt   DateTime? @map("captured_at")
  notes        String?

  template   TeamShotTemplate @relation(fields: [templateId], references: [id])
  team       Team             @relation(fields: [teamId], references: [id])
  event      Event            @relation(fields: [eventId], references: [id])
  capturedBy User?            @relation(fields: [capturedById], references: [id])

  @@unique([templateId, teamId])
  @@map("team_shots")
}
```

## Announcement

```prisma
model Announcement {
  id        Int       @id @default(autoincrement())
  eventId   Int       @map("event_id")
  sentById  Int       @map("sent_by")
  category  String
  title     String
  body      String
  audience  String
  expiresAt DateTime? @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")

  event  Event              @relation(fields: [eventId], references: [id])
  sentBy User               @relation(fields: [sentById], references: [id])
  reads  AnnouncementRead[]

  @@index([eventId, createdAt])
  @@map("announcements")
}
```

## AnnouncementRead

```prisma
model AnnouncementRead {
  id              Int      @id @default(autoincrement())
  announcementId  Int      @map("announcement_id")
  userId          Int?     @map("user_id")
  mentorSessionId Int?     @map("mentor_session_id")
  readAt          DateTime @default(now()) @map("read_at")

  announcement  Announcement   @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user          User?          @relation(fields: [userId], references: [id])
  mentorSession MentorSession? @relation(fields: [mentorSessionId], references: [id])

  @@map("announcement_reads")
}
```

## Page

```prisma
model Page {
  id           Int       @id @default(autoincrement())
  eventId      Int       @map("event_id")
  teamId       Int       @map("team_id")
  sentById     Int       @map("sent_by")
  sourceArea   String    @map("source_area")
  message      String?
  scheduledFor DateTime? @map("scheduled_for")
  sentAt       DateTime? @map("sent_at")
  expiresAt    DateTime? @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  event     Event          @relation(fields: [eventId], references: [id])
  team      Team           @relation(fields: [teamId], references: [id])
  sentBy    User           @relation(fields: [sentById], references: [id])
  responses PageResponse[]

  @@index([teamId, createdAt])
  @@index([scheduledFor, sentAt])
  @@map("pages")
}
```

## PageResponse

```prisma
model PageResponse {
  id              Int      @id @default(autoincrement())
  pageId          Int      @map("page_id")
  mentorSessionId Int      @map("mentor_session_id")
  response        String
  createdAt       DateTime @default(now()) @map("created_at")

  page          Page          @relation(fields: [pageId], references: [id], onDelete: Cascade)
  mentorSession MentorSession @relation(fields: [mentorSessionId], references: [id])

  @@map("page_responses")
}
```

## ProductionInterview

```prisma
model ProductionInterview {
  id            Int      @id @default(autoincrement())
  eventId       Int      @map("event_id")
  teamId        Int      @map("team_id")
  scheduledTime DateTime @map("scheduled_time")
  location      String
  status        String
  scheduledById Int      @map("scheduled_by")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  event       Event @relation(fields: [eventId], references: [id])
  team        Team  @relation(fields: [teamId], references: [id])
  scheduledBy User  @relation(fields: [scheduledById], references: [id])

  @@map("production_interviews")
}
```
