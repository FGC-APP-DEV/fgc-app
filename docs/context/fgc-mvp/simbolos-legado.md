# Símbolos e validações extraídos do legado

Índice estrutural complementar ao catálogo funcional; não substitui revisão semântica de cada implementação.

## src/app/(auth)/sign-in/actions.ts

- L7: `export async function signInAction(formData: FormData) {`
- L46: `export async function verifyCodeAction(formData: FormData) {`
- L67: `export async function signOutAction() {`

## src/app/(auth)/sign-in/page.tsx

- L9: `export default async function SignInPage({`

## src/app/admin/page.tsx

- L12: `export const dynamic = "force-dynamic";`
- L34: `export default async function AdminPage({`
- L42: `await requireRole("admin", event.id);`

## src/app/api/cron/sync-matches/route.ts

- L26: `export const maxDuration = 60;`
- L28: `export async function GET(request: Request) {`

## src/app/api/health/route.ts

- L6: `export function GET() {`

## src/app/auth/callback/actions.ts

- L19: `export async function confirmSignIn(formData: FormData) {`

## src/app/auth/callback/page.tsx

- L19: `export default async function AuthCallbackPage({`

## src/app/complete-profile/actions.ts

- L8: `const saveProfileSchema = z.object({`
- L12: `export async function saveProfileAction(formData: FormData) {`

## src/app/complete-profile/page.tsx

- L5: `export default async function CompleteProfilePage() {`

## src/app/filming/page.tsx

- L25: `export const dynamic = "force-dynamic";`
- L27: `export default async function FilmingPage() {`
- L31: `await requireRole("filmmaker", event.id);`

## src/app/judges/advisor/page.tsx

- L14: `export const dynamic = "force-dynamic";`
- L22: `export default async function JudgeAdvisorPage({`
- L30: `await requireRole("judge_advisor", event.id);`

## src/app/judges/page.tsx

- L24: `export const dynamic = "force-dynamic";`
- L26: `export default async function JudgesPage() {`
- L30: `const user = await requireRole("judge", event.id);`

## src/app/layout.tsx

- L20: `export const metadata: Metadata = {`
- L46: `export default function RootLayout({`

## src/app/manifest.ts

- L7: `export default function manifest(): MetadataRoute.Manifest {`

## src/app/mentor/page.tsx

- L22: `export const metadata: Metadata = {`
- L41: `export default async function MentorPage({`

## src/app/opengraph-image.tsx

- L11: `export const alt = "FIRST Global Ops";`
- L12: `export const size = { width: 1200, height: 630 };`
- L13: `export const contentType = "image/png";`
- L15: `export default async function Image() {`

## src/app/page.tsx

- L42: `export default async function Home({ searchParams }: Props) {`

## src/app/pit-admin/page.tsx

- L14: `export const dynamic = "force-dynamic";`
- L16: `export default async function PitAdminPage() {`
- L20: `await requireRole("pit_admin", event.id);`

## src/app/twitter-image.tsx

- L1: `export { alt, size, contentType, default } from "./opengraph-image";`

## src/components/admin/add-users-panel.tsx

- L19: `export function AddUsersPanel({ eventId, roles }: Props) {`

## src/components/admin/admin-dashboard.tsx

- L35: `export function AdminDashboard({`

## src/components/admin/confirm-admin-dialog.tsx

- L25: `export function ConfirmAdminDialog({ open, onOpenChange, emails, pending, onConfirm }: Props) {`

## src/components/admin/pending-approved-list.tsx

- L32: `export function PendingApprovedList({`

## src/components/admin/users-list.tsx

- L25: `export interface AdminUserRow {`
- L40: `export function UsersList({ eventId, users, roles, editMode }: Props) {`

## src/components/announcement/recent-announcements-list.tsx

- L43: `export interface RecentAnnouncementsListItem {`
- L101: `export function RecentAnnouncementsList({ announcements }: Props) {`

## src/components/announcement/send-to-all-button.tsx

- L12: `export function SendToAllButton({ eventId, teamCount }: Props) {`

## src/components/announcement/send-to-all-dialog.tsx

- L32: `export function SendToAllDialog({ eventId, teamCount, onClose }: Props) {`

## src/components/filming/mark-shot-dialog.tsx

- L28: `export function MarkShotDialog({ team, templateId, eventId, onClose }: Props) {`

## src/components/filming/shot-list.tsx

- L40: `export function ShotList({ categories, eventId }: Props) {`

## src/components/filming/step-and-repeat-tracker.tsx

- L38: `export function StepAndRepeatTracker({ teams, templateId, eventId }: Props) {`

## src/components/judges/advisor-dashboard.tsx

- L57: `export function AdvisorDashboard({`

## src/components/judges/evaluation-dialog.tsx

- L25: `export interface EvalDialogTeam {`
- L32: `export interface EvalDialogPriorEval {`
- L61: `export function EvaluationDialog({`

## src/components/judges/judges-tabs.tsx

- L54: `export function JudgesTabs({`

## src/components/judges/match-list.tsx

- L31: `export function MatchList({ matches }: Props) {`

## src/components/judges/panel-view.tsx

- L35: `export function PanelView({`

## src/components/locator/team-map.tsx

- L12: `export interface TeamMapTeam {`
- L22: `export type TeamMapStatus = "captured" | "skipped" | "active" | "neutral";`
- L102: `export function TeamMap({ teams, statusFn, onCellClick, positions }: Props) {`

## src/components/mentor/code-entry-form.tsx

- L27: `export function MentorCodeEntry({`

## src/components/mentor/day-picker.tsx

- L18: `export function dayKeyOf(d: Date): string {`
- L28: `export function DayPicker({`

## src/components/mentor/filming-view.tsx

- L9: `export function MentorFilmingView({ items }: { items: TeamShotStatusItem[] }) {`

## src/components/mentor/home-view.tsx

- L26: `export function MentorHomeView({ pages, announcements }: Props) {`

## src/components/mentor/live-refresh.tsx

- L25: `export function LiveRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {`

## src/components/mentor/matches-view.tsx

- L21: `export function MentorMatchesView({`

## src/components/mentor/mentor-announcements-list.tsx

- L6: `export interface MentorAnnouncementItem {`
- L18: `export function MentorAnnouncementsList({ announcements }: Props) {`

## src/components/mentor/mentor-pages-list.tsx

- L14: `export interface MentorPageItem {`
- L33: `export function MentorPagesList({ pages }: Props) {`

## src/components/mentor/pull-to-refresh.tsx

- L14: `export function PullToRefresh({ children }: { children: ReactNode }) {`

## src/components/mentor/schedule-view.tsx

- L34: `export function MentorScheduleView({ entries }: { entries: EntryItem[] }) {`

## src/components/mentor/shell.tsx

- L8: `export type MentorViewDef = AppViewDef;`
- L9: `export { ViewLink } from "@/components/ui/app-shell";`
- L11: `export function MentorShell({`

## src/components/page-team/page-team-button.tsx

- L8: `export type PageTeamSource = "pit_admin" | "filming" | "production" | "judges";`
- L22: `export function PageTeamButton({`

## src/components/page-team/page-team-dialog.tsx

- L24: `export interface PageTeamDialogTeam {`
- L68: `export function PageTeamDialog({`

## src/components/page-team/recent-pages-list.tsx

- L22: `export interface RecentPagesListItem {`
- L40: `export function RecentPagesList({ pages }: Props) {`

## src/components/pit-admin/mentor-codes-panel.tsx

- L29: `export function MentorCodesPanel({ eventId, teams }: Props) {`

## src/components/pit-admin/pit-admin-tabs.tsx

- L29: `export function PitAdminTabs({`

## src/components/ui/app-shell.tsx

- L22: `export interface AppViewDef {`
- L37: `export function AppShell({`
- L105: `export function ViewLink({`

## src/components/ui/badge.tsx

- L52: `export { Badge, badgeVariants }`

## src/components/ui/button.tsx

- L78: `export { Button, buttonVariants }`

## src/components/ui/card.tsx

- L95: `export {`

## src/components/ui/checkbox.tsx

- L33: `export { Checkbox }`

## src/components/ui/command.tsx

- L144: `export {`

## src/components/ui/dialog.tsx

- L149: `export {`

## src/components/ui/input-otp.tsx

- L77: `export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }`

## src/components/ui/input.tsx

- L20: `export { Input }`

## src/components/ui/label.tsx

- L20: `export { Label }`

## src/components/ui/popover.tsx

- L43: `export { Popover, PopoverTrigger, PopoverContent }`

## src/components/ui/progress.tsx

- L39: `export { Progress }`

## src/components/ui/separator.tsx

- L25: `export { Separator }`

## src/components/ui/sonner.tsx

- L52: `export { Toaster }`

## src/components/ui/table.tsx

- L107: `export {`

## src/components/ui/tabs.tsx

- L14: `export interface Tab {`
- L44: `export function TabsClient({`

## src/components/ui/textarea.tsx

- L18: `export { Textarea }`

## src/lib/admin/actions.ts

- L23: `const BulkUsersInput = z.object({`
- L32: `export async function bulkApproveUsers(input: z.infer<typeof BulkUsersInput>) {`
- L34: `const user = await requireRole("admin", data.eventId);`
- L57: `const UpdateApprovedEmailRolesInput = z.object({`
- L68: `export async function updateApprovedEmailRoles(`
- L72: `const user = await requireRole("admin", data.eventId);`
- L109: `const UpdateUserRolesInput = z.object({`
- L122: `export async function updateUserRoles(input: z.infer<typeof UpdateUserRolesInput>) {`
- L124: `const admin = await requireRole("admin", data.eventId);`
- L159: `const RemoveUserRolesInput = z.object({`
- L170: `export async function removeUserRoles(input: z.infer<typeof RemoveUserRolesInput>) {`
- L172: `const admin = await requireRole("admin", data.eventId);`
- L196: `const AddRolesToUsersInput = z.object({`
- L206: `export async function addRolesToUsers(input: z.infer<typeof AddRolesToUsersInput>) {`
- L208: `const admin = await requireRole("admin", data.eventId);`

## src/lib/admin/approve-emails.ts

- L11: `export async function approveEmailsWithRoles({`

## src/lib/announcements/list.ts

- L4: `export async function getRecentAnnouncementsByEvent(`
- L27: `export async function getAnnouncementsForMentors(eventId: number, limit = 20) {`

## src/lib/announcements/presets.ts

- L1: `export interface AnnouncementPreset {`
- L11: `export const ANNOUNCEMENT_PRESETS: AnnouncementPreset[] = [`

## src/lib/announcements/send.ts

- L10: `const sendAnnouncementInput = z.object({`
- L18: `export type SendAnnouncementInput = z.input<typeof sendAnnouncementInput>;`
- L24: `export async function sendAnnouncement(input: SendAnnouncementInput) {`
- L26: `const user = await requireRole("pit_admin", data.eventId);`

## src/lib/auth.ts

- L7: `export async function getCurrentClaims() {`
- L21: `export async function getCurrentUser() {`
- L83: `export async function requireUser() {`
- L92: `export async function requireUserWithName() {`
- L105: `export async function requireRole(roleKey: string, eventId: number) {`

## src/lib/db.ts

- L10: `export const prisma =`

## src/lib/events.ts

- L19: `export async function getCurrentEvent() {`
- L25: `export async function requireCurrentEvent() {`

## src/lib/filming/categories.ts

- L8: `const AddCategoryInput = z.object({`
- L13: `export async function addCategory(input: z.infer<typeof AddCategoryInput>) {`
- L15: `await requireRole("filmmaker", data.eventId);`

## src/lib/filming/list.ts

- L4: `export type TeamShotStatus = "captured" | "skipped";`
- L6: `export interface TeamWithStepAndRepeatStatus {`
- L20: `export async function getStepAndRepeatTemplate(eventId: number) {`
- L28: `export async function getTeamsWithStepAndRepeatStatus(`
- L66: `export interface ShotItem {`
- L73: `export interface CategoryWithItems {`
- L80: `export async function getCategoriesWithItems(`

## src/lib/filming/mark-shot.ts

- L8: `const MarkShotInput = z.object({`
- L16: `export async function markTeamShot(input: z.infer<typeof MarkShotInput>) {`
- L18: `const user = await requireRole("filmmaker", data.eventId);`
- L47: `const ClearShotInput = z.object({`
- L53: `export async function clearTeamShot(input: z.infer<typeof ClearShotInput>) {`
- L55: `await requireRole("filmmaker", data.eventId);`

## src/lib/filming/shot-items.ts

- L8: `const AddInput = z.object({`
- L14: `export async function addShotItem(input: z.infer<typeof AddInput>) {`
- L16: `const user = await requireRole("filmmaker", data.eventId);`
- L35: `const ToggleInput = z.object({`
- L41: `export async function toggleShotItem(input: z.infer<typeof ToggleInput>) {`
- L43: `const user = await requireRole("filmmaker", data.eventId);`
- L62: `const DeleteInput = z.object({`
- L67: `export async function deleteShotItem(input: z.infer<typeof DeleteInput>) {`
- L69: `await requireRole("filmmaker", data.eventId);`

## src/lib/filming/team-status.ts

- L7: `export interface TeamShotStatusItem {`
- L16: `export async function getTeamShotStatus(`

## src/lib/format.ts

- L16: `export const EVENT_TIMEZONE =`
- L19: `export function formatTime(value: Date | string): string {`
- L33: `export function formatDateTime(value: Date | string): string {`

## src/lib/geo.ts

- L7: `export type Continent = "Africa" | "Asia" | "Europe" | "Oceania" | "Americas";`
- L9: `export const CONTINENTS: Continent[] = [`
- L65: `export function countryCodeToContinent(code: string): Continent | null {`
- L80: `export function teamContinent(`

## src/lib/judges/advisor-actions.ts

- L15: `const CreatePanelInput = z.object({`
- L20: `export async function createPanel(input: z.infer<typeof CreatePanelInput>) {`
- L22: `const user = await requireRole("judge_advisor", data.eventId);`
- L39: `const MemberInput = z.object({`
- L45: `export async function addJudgeToPanel(input: z.infer<typeof MemberInput>) {`
- L47: `await requireRole("judge_advisor", data.eventId);`
- L65: `export async function removeJudgeFromPanel(input: z.infer<typeof MemberInput>) {`
- L67: `await requireRole("judge_advisor", data.eventId);`
- L78: `const EventInput = z.object({ eventId: z.number().int().positive() });`
- L85: `export async function distributeRound1(input: z.infer<typeof EventInput>) {`
- L87: `const user = await requireRole("judge_advisor", data.eventId);`
- L133: `const PanelInput = z.object({`
- L142: `export async function deletePanel(input: z.infer<typeof PanelInput>) {`
- L144: `const user = await requireRole("judge_advisor", data.eventId);`
- L177: `const AssignInput = z.object({`
- L184: `export async function assignTeam(input: z.infer<typeof AssignInput>) {`
- L186: `await requireRole("judge_advisor", data.eventId);`
- L208: `export async function clearRound1Split(input: z.infer<typeof EventInput>) {`
- L210: `const user = await requireRole("judge_advisor", data.eventId);`
- L233: `const BulkEmailsInput = z.object({`
- L242: `export async function bulkApproveJudges(input: z.infer<typeof BulkEmailsInput>) {`
- L244: `const user = await requireRole("judge_advisor", data.eventId);`
- L269: `export async function createAwardPanels(input: z.infer<typeof EventInput>) {`
- L271: `await requireRole("judge_advisor", data.eventId);`
- L291: `const ReassignInput = z.object({`
- L297: `export async function reassignTeam(input: z.infer<typeof ReassignInput>) {`
- L299: `await requireRole("judge_advisor", data.eventId);`
- L320: `const RoundInput = z.object({`
- L325: `export async function setJudgingRound(input: z.infer<typeof RoundInput>) {`
- L327: `const user = await requireRole("judge_advisor", data.eventId);`
- L346: `const Round2Input = z.object({`
- L358: `export async function createRound2(input: z.infer<typeof Round2Input>) {`
- L360: `const user = await requireRole("judge_advisor", data.eventId);`

## src/lib/judges/advisor.ts

- L7: `export interface AdvisorPanel {`
- L17: `export interface AdvisorTeamRow {`
- L26: `export interface AdvisorFlag {`
- L34: `export interface AdvisorCandidacyRow {`
- L44: `export async function getAdvisorDashboard(eventId: number) {`

## src/lib/judges/evaluation-actions.ts

- L22: `const UpsertInput = z.object({`
- L33: `export async function upsertEvaluation(input: z.infer<typeof UpsertInput>) {`
- L35: `const user = await requireRole("judge", data.eventId);`
- L89: `const SetStatusInput = z.object({`
- L100: `export async function setAssignmentStatus(input: z.infer<typeof SetStatusInput>) {`
- L102: `const user = await requireRole("judge", data.eventId);`

## src/lib/judges/labels.ts

- L6: `export const AWARDS_RANKED: { key: AwardKey; label: string; short: string }[] = [`
- L19: `export const AWARD_LABEL_BY_KEY: Record<AwardKey, string> = Object.fromEntries(`
- L23: `export const STATUS_LABELS = {`

## src/lib/judges/list.ts

- L6: `export async function getPanelsForJudge(userId: number, eventId: number) {`
- L22: `export interface PanelAssignedTeam {`
- L39: `export async function getPanelAssignedTeams(`
- L69: `export interface TeamEvalSummary {`
- L81: `export async function getEvaluationsForTeam(`
- L106: `export async function getMyEvaluation(`

## src/lib/judges/match-list.ts

- L3: `export interface JudgeMatchRow {`
- L24: `export async function getMatchesForEvent(`

## src/lib/labels.ts

- L5: `export const SOURCE_AREA_LABELS: Record<string, string> = {`
- L12: `export function sourceAreaLabel(sourceArea: string): string {`
- L34: `export const SOURCE_AREA_STYLES: Record<`
- L91: `export function sourceAreaStyle(sourceArea: string) {`
- L111: `export function moduleGridStyle(accentColor: string): CSSProperties {`
- L129: `export const ANNOUNCEMENT_CATEGORY_STYLES: Record<`
- L160: `export function announcementCategoryStyle(category: string) {`
- L171: `export const PAGE_RESPONSE_STYLES: Record<string, string> = {`
- L177: `export function pageResponseStyle(response: string): string {`
- L195: `export function shortTeamName(name: string): string {`
- L202: `export function countryCodeToFlag(`

## src/lib/mentor/code-format.ts

- L7: `export const CODE_LENGTH = 6;`
- L12: `export function normalizeMentorCode(raw: string): string {`

## src/lib/mentor/codes.ts

- L15: `export function generateMentorCode(): string {`
- L26: `export function hashMentorCode(raw: string): string {`

## src/lib/mentor/issue.ts

- L8: `const issueMentorCodeInput = z.object({`
- L13: `export type IssueMentorCodeInput = z.input<typeof issueMentorCodeInput>;`
- L24: `export async function issueMentorCode(input: IssueMentorCodeInput) {`
- L26: `const user = await requireRole("pit_admin", data.eventId);`

## src/lib/mentor/list.ts

- L6: `export async function getMentorCodeStatusByEvent(eventId: number) {`
- L33: `export type MentorCodeStatusItem = Awaited<`

## src/lib/mentor/redeem.ts

- L15: `const redeemInput = z.object({`
- L19: `export type RedeemMentorCodeInput = z.input<typeof redeemInput>;`
- L25: `export async function redeemMentorCode(`
- L82: `export async function redeemMentorCodeFromForm(formData: FormData): Promise<void> {`

## src/lib/mentor/respond.ts

- L8: `const respondInput = z.object({`
- L13: `export type RespondToPageInput = z.input<typeof respondInput>;`
- L22: `export async function respondToPageFromForm(formData: FormData): Promise<void> {`
- L44: `export async function respondToPage(input: RespondToPageInput) {`

## src/lib/mentor/session.ts

- L16: `export const MENTOR_COOKIE_NAME = "fgc_mentor_session";`
- L19: `export const MENTOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;`
- L42: `export function buildMentorCookieValue(sessionId: number): string {`
- L64: `export type MentorContext = {`
- L75: `export async function getMentorSession(): Promise<MentorContext | null> {`
- L121: `export async function requireMentorSession(): Promise<MentorContext> {`

## src/lib/pages/list.ts

- L28: `export async function getRecentPagesByEvent(eventId: number, limit = 50) {`
- L58: `export async function getPagesForTeam(teamId: number, eventId: number) {`

## src/lib/pages/presets.ts

- L1: `export interface PagerPreset {`
- L6: `export interface QuickScheduleOffset {`
- L16: `export const PAGER_PRESETS_BY_SOURCE: Record<string, PagerPreset[]> = {`
- L73: `export function getPagerPresets(sourceArea: string): PagerPreset[] {`
- L81: `export const PAGE_RESPONSE_PRESETS = [`
- L87: `export type PageResponsePreset = (typeof PAGE_RESPONSE_PRESETS)[number];`
- L97: `export const QUICK_SCHEDULE_OFFSETS_BY_SOURCE: Record<`
- L108: `export function getQuickScheduleOffsets(`

## src/lib/pages/queries.ts

- L12: `export async function getRecentPagesForTeam(`

## src/lib/pages/send.ts

- L17: `const sendPageInput = z.object({`
- L38: `export type SendPageInput = z.input<typeof sendPageInput>;`
- L44: `export async function sendPage(input: SendPageInput) {`
- L48: `const user = await requireRole(requiredRole, data.eventId);`

## src/lib/schedule/matches.ts

- L10: `export async function getScheduleEntries(eventId: number) {`
- L17: `export async function getMatchesForEvent(eventId: number) {`

## src/lib/schedule/sync.ts

- L91: `export interface SyncCounts {`
- L164: `export interface SyncEvent {`
- L171: `export async function syncMatches(`
- L318: `export async function syncRankings(`
- L408: `export async function resolveEventForSync(`
- L429: `export function formatCounts(label: string, c: SyncCounts): string {`

## src/lib/supabase/client.ts

- L4: `export function createSupabaseBrowserClient() {`

## src/lib/supabase/server.ts

- L7: `export async function createSupabaseServerClient() {`

## src/lib/utils.ts

- L4: `export function cn(...inputs: ClassValue[]) {`

## src/proxy.ts

- L10: `export async function proxy(request: NextRequest) {`
- L41: `export const config = {`
