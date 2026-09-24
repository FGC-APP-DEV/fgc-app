import React from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'

export const tokens = {
  primary: '#000615',
  primaryContainer: '#0B1F3A',
  secondary: '#4059AA',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLow: '#F5F3F6',
  surfaceHigh: '#E9E7EA',
  text: '#1B1B1E',
  muted: '#44474D',
  outline: '#75777E',
  border: '#E5E7EB',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
}
export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.background },
  content: {
    width: '100%',
    maxWidth: 896,
    alignSelf: 'center',
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  stack: { gap: 12 },
  title: {
    fontSize: 26,
    fontFamily: 'InterBold',
    fontWeight: '700',
    color: tokens.primary,
  },
  text: { color: tokens.text, fontFamily: 'Inter', fontSize: 16 },
  muted: { color: tokens.muted, fontFamily: 'Inter', fontSize: 14 },
})
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={layout.title}>
      {children}
    </Text>
  )
}
export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={layout.text}>{children}</Text>
}
export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: tokens.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.border,
        padding: 20,
        gap: 14,
      }}
    >
      {title && (
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 18,
            fontWeight: '700',
            fontFamily: 'InterBold',
            color: tokens.primary,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  )
}
export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const fill =
    variant === 'primary'
      ? tokens.primaryContainer
      : variant === 'danger'
        ? '#B91C1C'
        : tokens.surface
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: variant === 'secondary' ? tokens.border : fill,
        backgroundColor: fill,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text
        style={{
          color: variant === 'secondary' ? tokens.primaryContainer : '#FFFFFF',
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 14,
          color: tokens.muted,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={tokens.outline}
        {...props}
        style={[
          {
            minHeight: 48,
            borderColor: tokens.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            fontFamily: 'Inter',
            fontSize: 16,
            color: tokens.text,
            backgroundColor: tokens.surface,
            textAlignVertical: 'top',
          },
          props.multiline && { minHeight: 128 },
          props.style,
        ]}
      />
    </View>
  )
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: error ? '#FEF2F2' : tokens.surfaceLow,
      }}
    >
      <Text
        style={{
          color: error ? '#991B1B' : tokens.muted,
          fontFamily: 'Inter',
          fontSize: 14,
        }}
      >
        {text}
      </Text>
    </View>
  )
}
type Tone = 'neutral' | 'success' | 'warning' | 'danger'
// Text colours are darkened variants of the state tokens: the raw success/warning/danger
// fills do not reach 4.5:1 as small text (design-system.md, section 12).
const neutralTone = { fill: tokens.surfaceLow, text: tokens.primaryContainer }
function toneColors(tone: Tone) {
  switch (tone) {
    case 'success':
      return { fill: '#22C55E1A', text: '#166534' }
    case 'warning':
      return { fill: '#F59E0B1A', text: '#92400E' }
    case 'danger':
      return { fill: '#EF44441A', text: '#B91C1C' }
    default:
      return neutralTone
  }
}
const toneByLabel = new Map<string, Tone>([
  ['captured', 'success'],
  ['complete', 'success'],
  ['evaluated', 'success'],
  ['active', 'success'],
  ['responded', 'success'],
  ['accepted', 'success'],
  ['skipped', 'warning'],
  ['absent', 'warning'],
  ['online', 'warning'],
  ['other', 'warning'],
  ['withdrawn', 'warning'],
  ['scheduled', 'warning'],
  ['queued', 'warning'],
  ['failed', 'danger'],
  ['cancelled', 'danger'],
  ['no_devices', 'danger'],
])
/** Compact status badge; the tone follows the domain state unless overridden. */
export function Badge({ label, tone }: { label: string; tone?: Tone }) {
  const { fill, text } = toneColors(
    tone ?? toneByLabel.get(label.toLowerCase()) ?? 'neutral',
  )
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: fill,
      }}
    >
      <Text style={{ color: text, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </View>
  )
}
export function Loading() {
  return (
    <View
      accessibilityLabel="Loading"
      style={{ padding: 24, alignItems: 'center', gap: 8 }}
    >
      <ActivityIndicator color={tokens.secondary} />
      <Text style={layout.muted}>Loading…</Text>
    </View>
  )
}
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={layout.content}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  )
}
export function Confirm({
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
}: {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: '#00061588',
          justifyContent: 'center',
        }}
      >
        <View
          accessibilityViewIsModal
          style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}
        >
          <Card title={title}>
            <Body>{description}</Body>
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </Card>
        </View>
      </View>
    </Modal>
  )
}

/** Top bar shared by the web and native shells: 64 px, surface fill, hairline border. */
export function AppHeader({
  onHome,
  onSignOut,
}: {
  onHome: () => void
  onSignOut: () => void
}) {
  return (
    <View
      style={{
        minHeight: 64,
        backgroundColor: tokens.surface,
        borderBottomWidth: 1,
        borderColor: tokens.border,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    >
      <View style={{ flex: 1, minWidth: 140 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: 'InterBold',
            fontWeight: '700',
            fontSize: 18,
            color: tokens.primary,
          }}
        >
          FIRST GLOBAL
        </Text>
        <Text
          style={{
            fontFamily: 'Inter',
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: tokens.outline,
          }}
        >
          Operations
        </Text>
      </View>
      <Button label="Home" variant="secondary" onPress={onHome} />
      <Button label="Sign out" variant="secondary" onPress={onSignOut} />
    </View>
  )
}

/** Progress track (surface-container-high) with a primary fill, exposed as a progressbar. */
export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const percent =
    max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={{
        height: 16,
        borderRadius: 8,
        backgroundColor: tokens.surfaceHigh,
        overflow: 'hidden',
      }}
    >
      <View
        style={{ width: `${percent}%`, height: '100%', backgroundColor: tokens.primary }}
      />
    </View>
  )
}
