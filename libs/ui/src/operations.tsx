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
export function Badge({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: tokens.surfaceLow,
      }}
    >
      <Text style={{ color: tokens.primaryContainer, fontWeight: '700', fontSize: 12 }}>
        {label}
      </Text>
    </View>
  )
}
export function Loading() {
  return (
    <View accessibilityLabel="Loading" style={{ padding: 24 }}>
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
