import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Pressable, Text, View } from 'react-native'
import { Icon } from './icons'
import { elevation, radius, tokens } from './operations'

export type ToastTone = 'success' | 'error'
interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}
interface ToastApi {
  success: (text: string) => void
  error: (text: string) => void
}

export const TOAST_DURATION_MS = 5000
export const MAX_TOASTS = 3
const noop = () => undefined
const ToastContext = createContext<ToastApi>({ success: noop, error: noop })

/** Confirmation / failure toasts for actions: `const toast = useToast(); toast.success('Saved')`. */
export function useToast(): ToastApi {
  return useContext(ToastContext)
}

/**
 * Shows a toast whenever `message` becomes a non-empty string. Screens that already keep the
 * outcome of an action in state (`error`, `notice`) use this instead of an inline notice.
 */
export function useToastOn(message: string | null | undefined, tone: ToastTone) {
  const toast = useToast()
  useEffect(() => {
    if (message) toast[tone](message)
    // The message is the trigger; the toast API is stable.
  }, [message, tone])
}

/** Owns the toast stack (bottom centre, newest last, auto-dismissed, tap to close). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const next = useRef(1)
  const dismiss = useCallback(
    (id: number) => setItems((list) => list.filter((item) => item.id !== id)),
    [],
  )
  const push = useCallback((tone: ToastTone, text: string) => {
    const id = next.current++
    setItems((list) => [...list, { id, tone, text }].slice(-MAX_TOASTS))
  }, [])
  const api = useMemo<ToastApi>(
    () => ({
      success: (text) => push('success', text),
      error: (text) => push('error', text),
    }),
    [push],
  )
  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 88,
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 16,
        }}
      >
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [item.id, onDismiss])
  const error = item.tone === 'error'
  return (
    <Pressable
      accessibilityRole={error ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
      onPress={() => onDismiss(item.id)}
      style={[
        {
          maxWidth: 480,
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: error ? tokens.dangerBorder : tokens.border,
          backgroundColor: error ? tokens.dangerSurface : tokens.surface,
        },
        elevation.xl,
      ]}
    >
      <Icon
        name={error ? 'alertTriangle' : 'check'}
        size={18}
        color={error ? tokens.dangerInk : tokens.successInk}
      />
      <Text
        style={{
          flexShrink: 1,
          fontFamily: 'Inter',
          fontSize: 14,
          lineHeight: 20,
          color: error ? tokens.dangerText : tokens.text,
        }}
      >
        {item.text}
      </Text>
    </Pressable>
  )
}
