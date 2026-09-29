import { MentorNotifications } from './MentorNotifications'
import React, { useEffect, useState, useCallback } from 'react'
import { BackHandler, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthProvider, useAuth } from '@fgc/auth'
import { capabilities, type PageSource } from '@fgc/contracts'
import { AdminScreen } from '@fgc/admin'
import { ImportScreen } from '@fgc/imports'
import { FilmingScreen } from '@fgc/filming'
import { JudgingScreen } from '@fgc/judging'
import { PagerScreen } from '@fgc/messaging'
import { MentorScreen } from '@fgc/mentor'
import { ScheduleScreen } from '@fgc/schedule'
import {
  Body,
  Button,
  AppHeader,
  BottomNav,
  Card,
  Confirm,
  Field,
  Heading,
  I18nProvider,
  humanize,
  useI18n,
  type LocaleStorage,
  Loading,
  LoginCard,
  LoginShell,
  Notice,
  Screen,
  layout,
  MockAccounts,
  type NavItem,
} from '@fgc/ui'
import { runtime, pickFile } from './runtime'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'

const localeStorage: LocaleStorage = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
}
type Route = 'home' | 'admin' | 'imports' | 'filming' | 'judging' | 'pager' | 'schedule'
const mockInfoUrl =
  process.env.EXPO_PUBLIC_FGC_MOCK === '1' && process.env.EXPO_PUBLIC_API_BASE_URL
    ? process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, '') + '/__mock/info'
    : undefined
function Login() {
  const auth = useAuth()
  const [mode, setMode] = useState<'staff' | 'mentor'>('staff')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try {
      await work()
    } catch {
      /* Auth context presents the error. */
    } finally {
      setBusy(false)
    }
  }
  const quickStaff = (address: string, otp: string) =>
    void run(async () => {
      await auth.sendEmail(address)
      await auth.verify(otp)
    })
  return (
    <LoginShell>
      <LoginCard
        title="Welcome to FGC-Ops"
        subtitle="Sign in to continue to competition operations."
      >
        {auth.error && <Notice text={auth.error} error />}
        {auth.hasAuthLink && (
          <Button
            label="Confirm email sign-in"
            disabled={busy}
            onPress={() => void run(auth.confirmLink)}
          />
        )}
        <View style={layout.row}>
          <Button
            label="Staff sign-in"
            variant={mode === 'staff' ? 'primary' : 'secondary'}
            onPress={() => {
              setMode('staff')
              setCode('')
            }}
          />
          <Button
            label="Mentor access"
            variant={mode === 'mentor' ? 'primary' : 'secondary'}
            onPress={() => {
              setMode('mentor')
              setCode('')
            }}
          />
        </View>
        {mode === 'staff' ? (
          <>
            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Button
              label={busy ? 'Please wait…' : 'Send sign-in email'}
              disabled={busy || !email.trim()}
              onPress={() =>
                void run(async () => {
                  await auth.sendEmail(email)
                  setSent(true)
                })
              }
            />
            {sent && (
              <>
                <Notice text="Check your email. Enter the code on this device or confirm the sign-in link." />
                <Field
                  label="Email code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                />
                <Button
                  label="Verify code"
                  disabled={busy || !code}
                  onPress={() => void run(() => auth.verify(code))}
                />
              </>
            )}
          </>
        ) : (
          <>
            <Field
              label="Mentor access code"
              icon="lock"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              style={{
                minHeight: 56,
                textAlign: 'center',
                fontSize: 20,
                letterSpacing: 2,
              }}
            />
            <Button
              label="Open team messages"
              disabled={busy || !code || !auth.installationId}
              onPress={() => void run(() => auth.redeem(code))}
            />
          </>
        )}
      </LoginCard>
      <MockAccounts
        infoUrl={mockInfoUrl}
        disabled={busy || !auth.installationId}
        onStaff={quickStaff}
        onMentor={(value) => void run(() => auth.redeem(value))}
      />
    </LoginShell>
  )
}
function Shell() {
  const { t } = useI18n()
  const [messageRevision, setMessageRevision] = useState(0)
  const onMessage = useCallback(() => setMessageRevision((value) => value + 1), [])
  const auth = useAuth()
  const [route, setRoute] = useState<Route>('home')
  const [pageSource, setSource] = useState<PageSource>('filming')
  const [teamId, setTeam] = useState<string>()
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const navigate = (next: Route) => {
    const go = () => {
      setDirty(false)
      setRoute(next)
    }
    if (dirty) setPending(() => go)
    else go()
  }
  useEffect(() => {
    const event = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route === 'home') return false
      navigate('home')
      return true
    })
    return () => event.remove()
  }, [route, dirty])
  useEffect(() => {
    if (!auth.user && !auth.mentor) {
      setRoute('home')
      setDirty(false)
    }
  }, [auth.user, auth.mentor])
  const logout = () => {
    const perform = () => {
      void auth.logout().catch((e) => setError(e.message))
    }
    if (dirty) setPending(() => perform)
    else perform()
  }
  if (auth.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  if (!auth.user && !auth.mentor) return <Login />
  const caps = capabilities(auth.user?.roles ?? [])
  const navItems: NavItem[] = [
    { id: 'home', label: t('navHome'), icon: 'dashboard' },
    ...(caps.admin ? [{ id: 'admin', label: t('navAdmin'), icon: 'admin' } as const] : []),
    ...(caps.judging
      ? [{ id: 'judging', label: t('navJudging'), icon: 'judging' } as const]
      : []),
    ...(caps.filming
      ? [{ id: 'filming', label: t('navFilming'), icon: 'video' } as const]
      : []),
    ...(caps.schedule
      ? [{ id: 'schedule', label: t('navSchedule'), icon: 'calendar' } as const]
      : []),
  ]
  const activeNav =
    route === 'imports'
      ? 'admin'
      : route === 'pager'
        ? pageSource === 'judges'
          ? 'judging'
          : 'filming'
        : route
  const page = (source: PageSource, id?: string) => {
    setSource(source)
    setTeam(id)
    navigate('pager')
  }
  return (
    <View style={layout.screen}>
      <AppHeader
        onSignOut={logout}
        userName={auth.user?.name ?? auth.mentor?.team.name}
        userRole={auth.user ? auth.user.roles.map(humanize).join(' · ') : t('mentor')}
      />
      {error && <Notice text={error} error />}
      {auth.mentor ? (
        <>
          <MentorNotifications onMessage={onMessage} />
          <MentorScreen refreshSignal={messageRevision} />
        </>
      ) : !auth.user?.name ? (
        <Screen>
          <Card title={t('completeProfile')}>
            <Field label={t('fullName')} value={name} onChangeText={setName} />
            <Button
              label={t('saveProfile')}
              disabled={!name.trim()}
              onPress={() => {
                void auth.api
                  .command(
                    '/me/profile',
                    { name, expectedVersion: auth.user!.version },
                    { method: 'PATCH' },
                  )
                  .then(auth.reloadProfile)
                  .catch((e) => setError(e.message))
              }}
            />
          </Card>
        </Screen>
      ) : (
        <>
          {route === 'home' && (
            <Screen>
              <Heading>{t('welcome', { name: auth.user.name })}</Heading>
              <Body>{t('chooseWorkspace')}</Body>
              {!caps.schedule && (
                <Notice text={t('noAccess')} />
              )}
              {caps.admin && (
                <Card title={t('administration')}>
                  <Body>{t('administrationBody')}</Body>
                  <Button label={t('openAdministration')} onPress={() => navigate('admin')} />
                </Card>
              )}
              {caps.judging && (
                <Card title={t('judging')}>
                  <Body>
                    {caps.advisor
                      ? t('judgingBodyAdvisor')
                      : t('judgingBodyJudge')}
                  </Body>
                  <Button label={t('openJudging')} onPress={() => navigate('judging')} />
                </Card>
              )}
              {caps.filming && (
                <Card title={t('filming')}>
                  <Body>{t('filmingBody')}</Body>
                  <Button label={t('openFilming')} onPress={() => navigate('filming')} />
                </Card>
              )}
              {caps.schedule && (
                <Button
                  label={t('officialSchedule')}
                  variant="secondary"
                  onPress={() => navigate('schedule')}
                />
              )}
            </Screen>
          )}
          {route === 'admin' && caps.admin && (
            <AdminScreen onImports={() => navigate('imports')} />
          )}
          {route === 'imports' && caps.admin && (
            <ImportScreen pickFile={pickFile} onBack={() => navigate('admin')} />
          )}
          {route === 'filming' && caps.filming && (
            <FilmingScreen onPage={(id) => page('filming', id)} />
          )}
          {route === 'judging' && caps.judging && (
            <JudgingScreen onPage={(id) => page('judges', id)} onDirtyChange={setDirty} />
          )}
          {route === 'pager' &&
            (pageSource === 'judges' ? caps.judging : caps.filming) && (
              <PagerScreen
                source={pageSource}
                initialTeamId={teamId}
                onBack={() => navigate(pageSource === 'judges' ? 'judging' : 'filming')}
              />
            )}
          {route === 'schedule' && caps.schedule && <ScheduleScreen />}
          <BottomNav
            items={navItems}
            active={activeNav}
            onSelect={(id) => navigate(id as Route)}
          />
        </>
      )}
      {pending && (
        <Confirm
          title="Unsaved observations"
          description="Your changes have not been saved. Continue editing or discard them before leaving."
          confirmLabel="Discard changes"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            pending()
            setPending(null)
          }}
        />
      )}
    </View>
  )
}
function SessionShell() {
  const { user, mentor } = useAuth()
  return <Shell key={user?.id ?? mentor?.team.id ?? 'signed-out'} />
}
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    InterBold: Inter_700Bold,
  })
  if (!fontsLoaded && !fontError) return <Loading />
  if (!runtime.baseUrl)
    return (
      <Screen>
        <Notice
          text="Configure EXPO_PUBLIC_API_BASE_URL with a reachable API endpoint before signing in."
          error
        />
      </Screen>
    )
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <I18nProvider storage={localeStorage}>
          <AuthProvider runtime={runtime}>
            <SessionShell />
          </AuthProvider>
        </I18nProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
