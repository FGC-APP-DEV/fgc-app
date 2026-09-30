import React, { useEffect, useState } from 'react'
import { BackHandler, View, useWindowDimensions } from 'react-native'
import { AuthProvider, classifyLoginInput, loginFailureMessage, useAuth } from '@fgc/auth'
import { capabilities, type PageSource } from '@fgc/contracts'
import { AdminScreen } from '@fgc/admin'
import { ImportScreen } from '@fgc/imports'
import { FilmingScreen } from '@fgc/filming'
import { JudgingScreen } from '@fgc/judging'
import { PagerScreen } from '@fgc/messaging'
import { MentorScreen } from '@fgc/mentor'
import {
  Body,
  Button,
  AppHeader,
  BottomNav,
  Card,
  Confirm,
  EventFrame,
  ModuleCard,
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
  ThemeProvider,
  layout,
  MockAccounts,
  openOfficialInformation,
  WIDE_BREAKPOINT,
  type NavItem,
} from '@fgc/ui'
import { runtime, pickFile } from './runtime'

type Route = 'home' | 'admin' | 'imports' | 'filming' | 'judging' | 'pager'
const mockInfoUrl = process.env.FGC_MOCK ? '/__mock/info' : undefined
function Login() {
  const auth = useAuth()
  const { t } = useI18n()
  const [identifier, setIdentifier] = useState('')
  const [problem, setProblem] = useState('')
  const input = classifyLoginInput(identifier)
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const run = async (work: () => Promise<void>) => {
    setBusy(true)
    try {
      await work()
    } catch (e) {
      // Operational errors come from the auth context; unmatched credentials get one generic message.
      setProblem(loginFailureMessage(e) ? t('loginNotRegistered') : '')
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
      <LoginCard title={t('loginWelcome')} subtitle={t('loginSubtitle')}>
        {(problem || auth.error) && <Notice text={problem || auth.error} error />}
        {auth.hasAuthLink && (
          <Button
            label={t('loginConfirmLink')}
            disabled={busy}
            onPress={() => void run(auth.confirmLink)}
          />
        )}
        <Field
          label={t('loginIdentifier')}
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value)
            setProblem('')
            setSent(false)
            setCode('')
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {input.kind === 'email' && !input.valid && (
          <Notice text={t('loginInvalidEmail')} error />
        )}
        <Button
          label={
            busy
              ? t('loginWait')
              : input.kind === 'code'
                ? t('loginOpenMessages')
                : t('loginSendEmail')
          }
          disabled={
            busy ||
            input.kind === 'empty' ||
            (input.kind === 'email' && !input.valid) ||
            (input.kind === 'code' && !auth.installationId)
          }
          onPress={() =>
            void run(async () => {
              if (input.kind === 'email') {
                await auth.sendEmail(input.email)
                setSent(true)
              } else if (input.kind === 'code') await auth.redeem(input.code)
            })
          }
        />
        {sent && input.kind === 'email' && (
          <>
            <Notice text={t('loginCheckEmail')} />
            <Field
              label={t('loginCode')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
            <Button
              label={t('loginVerify')}
              disabled={busy || !code}
              onPress={() => void run(() => auth.verify(code))}
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
  const auth = useAuth()
  const wide = useWindowDimensions().width >= WIDE_BREAKPOINT
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
    ...(caps.admin
      ? [{ id: 'admin', label: t('navAdmin'), icon: 'admin' } as const]
      : []),
    ...(caps.judging
      ? [{ id: 'judging', label: t('navJudging'), icon: 'judging' } as const]
      : []),
    ...(caps.filming
      ? [{ id: 'filming', label: t('navFilming'), icon: 'video' } as const]
      : []),
    ...(caps.schedule
      ? [
          {
            id: 'official-information',
            label: t('navSchedule'),
            icon: 'calendar',
          } as const,
        ]
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
        <MentorScreen />
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
        <View style={{ flex: 1, flexDirection: wide ? 'row-reverse' : 'column' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {route === 'home' && (
              <Screen>
                <Heading>{t('welcome', { name: auth.user.name })}</Heading>
                <Body>{t('chooseWorkspace')}</Body>
                {!caps.schedule && <Notice text={t('noAccess')} />}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {caps.admin && (
                    <ModuleCard
                      title={t('administration')}
                      label={t('openAdministration')}
                      hint={t('moduleHintAdministration')}
                      icon="admin"
                      onPress={() => navigate('admin')}
                    />
                  )}
                  {caps.judging && (
                    <ModuleCard
                      title={t('judging')}
                      label={t('openJudging')}
                      hint={t(
                        caps.advisor
                          ? 'moduleHintJudgingAdvisor'
                          : 'moduleHintJudgingJudge',
                      )}
                      icon="judging"
                      onPress={() => navigate('judging')}
                    />
                  )}
                  {caps.filming && (
                    <ModuleCard
                      title={t('filming')}
                      label={t('openFilming')}
                      hint={t('moduleHintFilming')}
                      icon="video"
                      onPress={() => navigate('filming')}
                    />
                  )}
                  {caps.schedule && (
                    <ModuleCard
                      title={t('officialSchedule')}
                      hint={t('moduleHintOfficial')}
                      icon="calendar"
                      onPress={openOfficialInformation}
                    />
                  )}
                </View>
                <EventFrame />
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
              <JudgingScreen
                onPage={(id) => page('judges', id)}
                onDirtyChange={setDirty}
              />
            )}
            {route === 'pager' &&
              (pageSource === 'judges' ? caps.judging : caps.filming) && (
                <PagerScreen
                  source={pageSource}
                  initialTeamId={teamId}
                  onBack={() => navigate(pageSource === 'judges' ? 'judging' : 'filming')}
                />
              )}
          </View>
          <BottomNav
            side={wide}
            items={navItems}
            active={activeNav}
            onSelect={(id) =>
              id === 'official-information'
                ? openOfficialInformation()
                : navigate(id as Route)
            }
          />
        </View>
      )}
      {pending && (
        <Confirm
          title={t('unsavedTitle')}
          description={t('unsavedBody')}
          confirmLabel={t('discardChanges')}
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
const themeStorage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) => localStorage.setItem(key, value),
}
const localeStorage: LocaleStorage = {
  get: async (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* Storage unavailable: the choice lasts for this session only. */
    }
  },
}
const syncPageTheme = (mode: 'light' | 'dark') => {
  document.documentElement.style.colorScheme = mode
  document.documentElement.dataset.theme = mode
}
export default function App() {
  return (
    <I18nProvider storage={localeStorage}>
      <AuthProvider runtime={runtime}>
        <ThemeProvider storage={themeStorage} onChange={syncPageTheme}>
          <SessionShell />
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  )
}
