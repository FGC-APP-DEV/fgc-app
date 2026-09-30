import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
} from 'react-native'
import { Icon, type IconName } from './icons'
import { BrandLogo } from './logo'
import { useTheme } from './theme'
import { useI18n } from './i18n'
import { LanguageMenu } from './language-menu'

export type ThemeMode = 'light' | 'dark'
const lightTokens = {
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
  /** Accent ink for text and icons that sit on the surface fills. */
  link: '#0B1F3A',
  successInk: '#166534',
  warningInk: '#92400E',
  dangerInk: '#B91C1C',
  dangerSurface: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerText: '#991B1B',
  scrim: '#00061588',
}
const darkTokens: typeof lightTokens = {
  primary: '#E6EBF5',
  primaryContainer: '#3A55A6',
  secondary: '#8FA6E8',
  background: '#0B0F17',
  surface: '#151B26',
  surfaceLow: '#1D2431',
  surfaceHigh: '#283040',
  text: '#E6E8EC',
  muted: '#B4B9C4',
  outline: '#8A909C',
  border: '#2C3546',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  link: '#A9BBF0',
  successInk: '#4ADE80',
  warningInk: '#FBBF24',
  dangerInk: '#F87171',
  dangerSurface: '#2A1618',
  dangerBorder: '#5B2A2E',
  dangerText: '#FCA5A5',
  scrim: '#000000AA',
}
/**
 * Live colour tokens. The object is mutated in place by `applyTheme`, so components read the
 * active palette at render time; `ThemeProvider` remounts its subtree after each switch.
 */
export const tokens: typeof lightTokens = { ...lightTokens }
let themeMode: ThemeMode = 'light'
export function getThemeMode(): ThemeMode {
  return themeMode
}
/** Corner radii from the reference: badge 4, tile 8, control 12, card 16. */
export const radius = { badge: 4, tile: 8, control: 12, card: 16, pill: 999 }
/** Elevation recipes matching the reference's shadow-sm / shadow-md / shadow-xl. */
const nativeElevation = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  xl: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const
// react-native-web deprecates the shadow* props; the same shadows are expressed as boxShadow.
const webElevation = {
  sm: { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)' },
  md: { boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' },
  xl: { boxShadow: '0px 12px 20px rgba(0, 0, 0, 0.12)' },
} as const
export const elevation: typeof nativeElevation =
  Platform.OS === 'web'
    ? (webElevation as unknown as typeof nativeElevation)
    : nativeElevation
/** Window width from which shells switch to the desktop layout (side rail, wider content). */
export const WIDE_BREAKPOINT = 900
const createLayout = () =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: tokens.background },
    contentWide: { maxWidth: 1152, padding: 32, gap: 24 },
    content: {
      width: '100%',
      maxWidth: 896,
      alignSelf: 'center',
      padding: 20,
      gap: 20,
      paddingBottom: 40,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
    stack: { gap: 12 },
    title: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: 'InterBold',
      fontWeight: '700',
      color: tokens.primary,
    },
    text: { color: tokens.text, fontFamily: 'Inter', fontSize: 14, lineHeight: 20 },
    muted: { color: tokens.muted, fontFamily: 'Inter', fontSize: 13, lineHeight: 18 },
  })
export const layout = createLayout()
/** Switches the live palette (tokens and layout styles) to `mode`. */
export function applyTheme(mode: ThemeMode) {
  themeMode = mode
  Object.assign(tokens, mode === 'dark' ? darkTokens : lightTokens)
  Object.assign(layout, createLayout())
}
/** "camelCase" or "snake_case" identifiers as sentence-case display text. */
export function humanize(value: string) {
  const words = value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}
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
/** State colour for the 4 px side stripe and the 2 px emphasis outline of a Card. */
export type Accent = 'success' | 'warning' | 'danger' | 'neutral'
function accentColor(accent: Accent) {
  switch (accent) {
    case 'success':
      return tokens.success
    case 'warning':
      return tokens.warning
    case 'danger':
      return tokens.danger
    default:
      return tokens.outline
  }
}
export function Card({
  title,
  children,
  accent,
  emphasis,
}: {
  title?: string
  children: React.ReactNode
  accent?: Accent
  emphasis?: Exclude<Accent, 'neutral'>
}) {
  return (
    <View
      style={[
        {
          backgroundColor: tokens.surface,
          borderRadius: radius.card,
          borderWidth: emphasis ? 2 : 1,
          borderColor: emphasis ? accentColor(emphasis) : tokens.border,
          padding: 20,
          gap: 14,
          overflow: 'hidden',
        },
        elevation.sm,
      ]}
    >
      {!!accent && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: accentColor(accent),
          }}
        />
      )}
      {Boolean(title) && (
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 18,
            lineHeight: 26,
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
/** Compact module entry point: icon, title and one-line hint in a small tappable card. */
export function ModuleCard({
  title,
  hint,
  label,
  icon,
  onPress,
}: {
  title: string
  hint?: string
  /** Accessible name; defaults to the title. */
  label?: string
  icon: IconName
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          flexBasis: 150,
          minHeight: 88,
          padding: 12,
          gap: 6,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.surface,
          opacity: pressed ? 0.85 : 1,
        },
        elevation.sm,
      ]}
    >
      <Icon name={icon} size={22} color={tokens.primary} />
      <Text
        style={{
          fontFamily: 'InterBold',
          fontWeight: '700',
          fontSize: 15,
          lineHeight: 20,
          color: tokens.primary,
        }}
      >
        {title}
      </Text>
      {Boolean(hint) && <Text style={layout.muted}>{hint}</Text>}
    </Pressable>
  )
}
export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  icon,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: IconName
}) {
  const fill =
    variant === 'primary'
      ? tokens.primaryContainer
      : variant === 'danger'
        ? '#B91C1C'
        : tokens.surface
  const ink = variant === 'secondary' ? tokens.link : '#FFFFFF'
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
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: variant === 'secondary' ? tokens.border : fill,
        backgroundColor: fill,
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      {icon && <Icon name={icon} size={16} color={ink} />}
      <Text
        style={{
          color: ink,
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
export function Field({
  label,
  icon,
  ...props
}: TextInputProps & { label: string; icon?: IconName }) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: 'Inter',
          fontSize: 13,
          color: tokens.muted,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <View style={{ justifyContent: 'center' }}>
        {icon && (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 14, zIndex: 1, opacity: 0.6 }}
          >
            <Icon name={icon} size={18} color={tokens.outline} />
          </View>
        )}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={tokens.outline}
          {...props}
          onFocus={(event) => {
            setFocused(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            props.onBlur?.(event)
          }}
          style={[
            {
              minHeight: 48,
              borderColor: focused ? tokens.secondary : tokens.border,
              borderWidth: 1,
              borderRadius: radius.control,
              paddingVertical: 12,
              paddingRight: 12,
              paddingLeft: icon ? 44 : 12,
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
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: error ? tokens.dangerBorder : tokens.border,
        backgroundColor: error ? tokens.dangerSurface : tokens.surfaceLow,
      }}
    >
      <Text
        style={{
          color: error ? tokens.dangerText : tokens.muted,
          fontFamily: 'Inter',
          fontSize: 14,
          lineHeight: 20,
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
function toneColors(tone: Tone) {
  switch (tone) {
    case 'success':
      return { fill: '#22C55E1A', text: tokens.successInk }
    case 'warning':
      return { fill: '#F59E0B1A', text: tokens.warningInk }
    case 'danger':
      return { fill: '#EF44441A', text: tokens.dangerInk }
    default:
      return { fill: tokens.surfaceLow, text: tokens.link }
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
        borderRadius: radius.badge,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: fill,
      }}
    >
      <Text
        style={{
          color: text,
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
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
  const { width } = useWindowDimensions()
  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={[
        layout.content,
        width >= WIDE_BREAKPOINT && layout.contentWide,
      ]}
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
          backgroundColor: tokens.scrim,
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

type TileTone = 'success' | 'danger' | 'warning' | 'primary'
function tileColors(tone: TileTone) {
  switch (tone) {
    case 'success':
      return { fill: '#15803D', border: '#15803D', ink: '#FFFFFF' }
    case 'danger':
      return { fill: '#B91C1C', border: '#B91C1C', ink: '#FFFFFF' }
    case 'warning':
      return { fill: tokens.surface, border: tokens.warning, ink: tokens.warningInk }
    default:
      return { fill: tokens.surface, border: tokens.primary, ink: tokens.primary }
  }
}
/** Large quick-response tile: icon above the label, 2 px outline, tall touch target. */
export function ActionTile({
  label,
  icon,
  tone,
  onPress,
  disabled = false,
}: {
  label: string
  icon: IconName
  tone: TileTone
  onPress: () => void
  disabled?: boolean
}) {
  const { fill, border, ink } = tileColors(tone)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          flexBasis: 140,
          minHeight: 104,
          padding: 16,
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.card,
          borderWidth: 2,
          borderColor: border,
          backgroundColor: fill,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
        },
        elevation.sm,
      ]}
    >
      <Icon name={icon} size={28} color={ink} />
      <Text
        style={{
          fontFamily: 'InterBold',
          fontWeight: '700',
          fontSize: 13,
          textAlign: 'center',
          color: ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdMJs3wIxGGTpTpWAYV4had6j1bdPDGzabNC6bF3wG_k3X46A/viewform?usp=header'
export const OFFICIAL_INFORMATION_URL = 'https://first.global/event/'
/** Opens the official event page in a new tab (web) or the system browser (native), keeping the session. */
export function openOfficialInformation() {
  if (Platform.OS === 'web') {
    window.open(OFFICIAL_INFORMATION_URL, '_blank', 'noopener,noreferrer')
    return
  }
  void Linking.openURL(OFFICIAL_INFORMATION_URL)
}
export const BUG_REPORT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfl2jOim05arwe98f2KHM0r0NwProcq2RossMktqWB_MmKhIA/viewform?usp=header'

/**
 * Top bar shared by the web and native shells: 64 px, surface fill, hairline border,
 * brand on the left and the account menu (identity + sign out) on the right.
 */
export function AppHeader({
  onSignOut,
  userName,
  userRole,
}: {
  onSignOut: () => void
  userName?: string
  userRole?: string
}) {
  const { t, dirStyle } = useI18n()
  const anchor = useRef<View>(null)
  const { mode, toggle } = useTheme()
  const { width } = useWindowDimensions()
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null)
  const openMenu = () =>
    anchor.current?.measureInWindow((x, y, w, h) =>
      setMenu({ top: y + h + 8, right: Math.max(8, width - (x + w)) }),
    )
  return (
    <View
      style={[
        {
          minHeight: 64,
          backgroundColor: tokens.surface,
          borderBottomWidth: 1,
          borderColor: tokens.border,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
        },
        elevation.sm,
      ]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <BrandLogo height={32} />
      </View>
      <LanguageMenu />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          mode === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')
        }
        onPress={toggle}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? tokens.surfaceLow : 'transparent',
        })}
      >
        <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={20} color={tokens.muted} />
      </Pressable>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={t('accountMenu')}
        accessibilityState={{ expanded: menu !== null }}
        onPress={openMenu}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: menu || pressed ? tokens.surfaceLow : 'transparent',
        })}
      >
        <Icon name="user" size={20} color={tokens.muted} />
      </Pressable>
      {menu && (
        <Modal
          transparent
          animationType="fade"
          statusBarTranslucent
          visible
          onRequestClose={() => setMenu(null)}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('closeAccountMenu')}
            onPress={() => setMenu(null)}
            style={[{ flex: 1, backgroundColor: '#00000010' }, dirStyle]}
          >
            <View
              style={[
                {
                  position: 'absolute',
                  top: menu.top,
                  right: menu.right,
                  width: 208,
                  overflow: 'hidden',
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  backgroundColor: tokens.surface,
                },
                elevation.xl,
              ]}
            >
              {Boolean(userName || userRole) && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 2,
                    borderBottomWidth: 1,
                    borderColor: tokens.border,
                    backgroundColor: tokens.surfaceLow,
                  }}
                >
                  {Boolean(userName) && (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'InterBold',
                        fontWeight: '700',
                        fontSize: 13,
                        color: tokens.primary,
                      }}
                    >
                      {userName}
                    </Text>
                  )}
                  {Boolean(userRole) && (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        color: tokens.muted,
                      }}
                    >
                      {userRole}
                    </Text>
                  )}
                </View>
              )}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={t('feedback')}
                onPress={() => {
                  setMenu(null)
                  void Linking.openURL(FEEDBACK_FORM_URL)
                }}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: pressed ? tokens.surfaceLow : 'transparent',
                })}
              >
                <Icon name="message" size={16} color={tokens.muted} />
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: '700',
                    color: tokens.text,
                  }}
                >
                  {t('feedback')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={t('reportBug')}
                onPress={() => {
                  setMenu(null)
                  void Linking.openURL(BUG_REPORT_FORM_URL)
                }}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: pressed ? tokens.surfaceLow : 'transparent',
                })}
              >
                <Icon name="alertTriangle" size={16} color={tokens.muted} />
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: '700',
                    color: tokens.text,
                  }}
                >
                  {t('reportBug')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('signOut')}
                onPress={() => {
                  setMenu(null)
                  onSignOut()
                }}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: pressed ? '#EF44440D' : 'transparent',
                })}
              >
                <Icon name="logOut" size={16} color={tokens.dangerInk} />
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: '700',
                    color: tokens.dangerInk,
                  }}
                >
                  {t('signOut')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  )
}

export interface NavItem {
  id: string
  label: string
  icon: IconName
}
/** Bottom navigation: 64 px bar, 48 px items, active item as a filled primary-container pill. */
export function BottomNav({
  items,
  active,
  onSelect,
  side = false,
}: {
  items: readonly NavItem[]
  active: string
  onSelect: (id: string) => void
  /** Vertical rail for wide screens instead of the bottom bar. */
  side?: boolean
}) {
  const { t } = useI18n()
  return (
    <View
      role="navigation"
      accessibilityLabel={t('workspaces')}
      style={
        side
          ? {
              width: 112,
              backgroundColor: tokens.surface,
              borderEndWidth: 1,
              borderColor: tokens.border,
              padding: 12,
              gap: 8,
              alignItems: 'stretch',
            }
          : {
              minHeight: 64,
              backgroundColor: tokens.surface,
              borderTopWidth: 1,
              borderColor: tokens.border,
              paddingHorizontal: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
            }
      }
    >
      {items.map((item) => {
        const on = item.id === active
        const ink = on ? '#FFFFFF' : tokens.muted
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              {
                minWidth: 72,
                height: side ? 64 : 48,
                paddingHorizontal: 12,
                borderRadius: radius.control,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: on
                  ? tokens.primaryContainer
                  : pressed
                    ? tokens.surfaceLow
                    : 'transparent',
                transform: [{ scale: pressed && !on ? 0.92 : 1 }],
              },
              on && elevation.md,
            ]}
          >
            <Icon name={item.icon} size={20} color={ink} strokeWidth={on ? 2.5 : 2} />
            <Text
              style={{
                fontFamily: 'InterBold',
                fontWeight: '700',
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: ink,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        )
      })}
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
        borderRadius: radius.pill,
        backgroundColor: tokens.surfaceHigh,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: tokens.primary,
        }}
      />
    </View>
  )
}
