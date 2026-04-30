import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AuthProvider, useAuth } from '@fgc/auth'
import type { AppRole } from '@fgc/shared'
import { TRANSLATIONS, type Locale } from '@fgc/shared'
import {
  JudgeAdvisorDashboard,
  JudgeDashboard,
  MentorDashboard,
  PublicDashboard,
} from '@fgc/judging'
import { ThemeProvider, useTheme } from '@fgc/ui'

function RolePicker() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { setViewingRole } = useAuth()

  const roles: { id: AppRole; label: string }[] = [
    { id: 'judge', label: t('judge') },
    { id: 'judgeAdvisor', label: t('judgeAdvisor') },
    { id: 'mentor', label: t('mentor') },
    { id: 'public', label: t('public') },
  ]

  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('appName')}</Text>
      <Text style={{ color: colors.textMuted, marginBottom: 24 }}>{t('selectRole')}</Text>
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
  const { i18n } = useTranslation()
  const { colors, isDark, toggle } = useTheme()
  const { viewingRole, setViewingRole } = useAuth()

  const dict = useMemo(
    () => TRANSLATIONS[(i18n.language as Locale) || 'en'] || TRANSLATIONS.en,
    [i18n.language],
  )

  return (
    <View style={[styles.shell, { backgroundColor: colors.bg }]}>
      <View style={[styles.top, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>
          {dict.appName}
        </Text>
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
    </View>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100vh' as unknown as number },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  btn: {
    width: '100%',
    maxWidth: 360,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
})
