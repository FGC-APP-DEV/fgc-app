import React, { useMemo } from 'react'
import { SafeAreaView, StatusBar, StyleSheet, Text, Pressable, View } from 'react-native'
import { ApolloProvider } from '@apollo/client/react'
import { createApolloClient } from '@fgc/graphql'
import { AuthProvider, useAuth } from '@fgc/auth'
import type { AppRole } from '@fgc/shared'
import { TRANSLATIONS } from '@fgc/shared'
import {
  JudgeAdvisorDashboard,
  JudgeDashboard,
  MentorDashboard,
  PublicDashboard,
} from '@fgc/judging'
import { ThemeProvider, useTheme } from '@fgc/ui'

const API_URL = 'http://localhost:4000'

const apolloClient = createApolloClient({
  uri: API_URL,
})

function RolePicker() {
  const { colors } = useTheme()
  const { setViewingRole } = useAuth()
  const dict = TRANSLATIONS.en

  const roles: { id: AppRole; label: string }[] = [
    { id: 'judge', label: dict.judge },
    { id: 'judgeAdvisor', label: dict.judgeAdvisor },
    { id: 'mentor', label: dict.mentor },
    { id: 'public', label: dict.public },
  ]

  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{dict.appName}</Text>
      <Text style={{ color: colors.textMuted, marginBottom: 24 }}>{dict.selectRole}</Text>
      {roles.map(r => (
        <Pressable
          key={r.id}
          onPress={() => setViewingRole(r.id)}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: pressed ? colors.accentDim : colors.bgElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>{r.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function Shell() {
  const { colors, isDark, toggle } = useTheme()
  const { viewingRole, setViewingRole } = useAuth()
  const dict = useMemo(() => TRANSLATIONS.en, [])

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.top, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>{dict.appName}</Text>
        <Pressable onPress={toggle} style={styles.topBtn}>
          <Text style={{ color: colors.accent }}>{isDark ? dict.lightMode : dict.darkMode}</Text>
        </Pressable>
        {viewingRole ? (
          <Pressable onPress={() => setViewingRole(null)} style={styles.topBtn}>
            <Text style={{ color: colors.accent }}>{dict.logout}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        {!viewingRole ? <RolePicker /> : null}
        {viewingRole === 'judge' ? <JudgeDashboard t={dict} /> : null}
        {viewingRole === 'judgeAdvisor' ? <JudgeAdvisorDashboard t={dict} /> : null}
        {viewingRole === 'mentor' ? <MentorDashboard t={dict} /> : null}
        {viewingRole === 'public' ? <PublicDashboard t={dict} /> : null}
      </View>
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  btn: {
    width: '100%',
    maxWidth: 360,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
})
