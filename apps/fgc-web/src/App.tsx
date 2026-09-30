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
  Field,
  Heading,
  humanize,
  Loading,
  LoginCard,
  LoginShell,
  Notice,
  Screen,
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
      setProblem(loginFailureMessage(e) ?? '')
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
        {(problem || auth.error) && <Notice text={problem || auth.error} error />}
        {auth.hasAuthLink && (
          <Button
            label="Confirm email sign-in"
            disabled={busy}
            onPress={() => void run(auth.confirmLink)}
          />
        )}
        <Field
          label="Email or mentor access code"
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
          <Notice text="Enter a valid email address." error />
        )}
        <Button
          label={
            busy
              ? 'Please wait…'
              : input.kind === 'code'
                ? 'Open team messages'
                : 'Send sign-in email'
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
            <Notice text="Check your email. Enter the code on this device or confirm the sign-in link. If no email arrives, this address may not be registered: contact an administrator." />
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
    { id: 'home', label: 'Home', icon: 'dashboard' },
    ...(caps.admin ? [{ id: 'admin', label: 'Admin', icon: 'admin' } as const] : []),
    ...(caps.judging
      ? [{ id: 'judging', label: 'Judging', icon: 'judging' } as const]
      : []),
    ...(caps.filming
      ? [{ id: 'filming', label: 'Filming', icon: 'video' } as const]
      : []),
    ...(caps.schedule
      ? [
          {
            id: 'official-information',
            label: 'Official information',
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
        userRole={auth.user ? auth.user.roles.map(humanize).join(' · ') : 'Mentor'}
      />
      {error && <Notice text={error} error />}
      {auth.mentor ? (
        <MentorScreen />
      ) : !auth.user?.name ? (
        <Screen>
          <Card title="Complete your profile">
            <Field label="Full name" value={name} onChangeText={setName} />
            <Button
              label="Save profile"
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
                <Heading>Welcome, {auth.user.name}</Heading>
                <Body>Choose your workspace.</Body>
                {!caps.schedule && (
                  <Notice text="Your email is verified. Ask an administrator to enable access." />
                )}
                {caps.admin && (
                  <Card title="Administration">
                    <Body>Staff access, shared team register and mentor codes.</Body>
                    <Button
                      label="Open administration"
                      onPress={() => navigate('admin')}
                    />
                  </Card>
                )}
                {caps.judging && (
                  <Card title="Judging">
                    <Body>
                      {caps.advisor
                        ? 'Manage panels and competition progress.'
                        : 'Your panel, teams and observations.'}
                    </Body>
                    <Button label="Open judging" onPress={() => navigate('judging')} />
                  </Card>
                )}
                {caps.filming && (
                  <Card title="Filming">
                    <Body>Step & Repeat coverage, shot list and team pager.</Body>
                    <Button label="Open filming" onPress={() => navigate('filming')} />
                  </Card>
                )}
                {caps.schedule && (
                  <Button
                    label="Official information"
                    variant="secondary"
                    onPress={openOfficialInformation}
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
  return (
    <AuthProvider runtime={runtime}>
      <SessionShell />
    </AuthProvider>
  )
}
