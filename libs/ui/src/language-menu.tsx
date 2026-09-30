import React, { useRef, useState } from 'react'
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native'
import { APP_LOCALES, LOCALE_INFO } from '@fgc/shared'
import { Icon } from './icons'
import { useI18n } from './i18n'
import { elevation, radius, tokens } from './operations'

/** Header globe button that opens a dropdown of the supported languages with their flags. */
export function LanguageMenu() {
  const { locale, setLocale, t, dirStyle } = useI18n()
  const anchor = useRef<View>(null)
  const { width } = useWindowDimensions()
  const [menu, setMenu] = useState<{ top: number; right: number } | null>(null)
  const open = () =>
    anchor.current?.measureInWindow((x, y, w, h) =>
      setMenu({ top: y + h + 8, right: Math.max(8, width - (x + w)) }),
    )
  return (
    <>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={t('language')}
        accessibilityState={{ expanded: menu !== null }}
        onPress={open}
        style={({ pressed }) => ({
          height: 44,
          minWidth: 44,
          paddingHorizontal: 8,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: menu || pressed ? tokens.surfaceLow : 'transparent',
        })}
      >
        <Icon name="globe" size={20} color={tokens.muted} />
        <Text
          style={{
            fontFamily: 'InterBold',
            fontWeight: '700',
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: tokens.muted,
          }}
        >
          {locale}
        </Text>
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
            accessibilityLabel={t('closeLanguageMenu')}
            onPress={() => setMenu(null)}
            style={[{ flex: 1, backgroundColor: '#00000010' }, dirStyle]}
          >
            <View
              accessibilityRole="menu"
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
              {APP_LOCALES.map((code) => {
                const info = LOCALE_INFO[code]
                const on = code === locale
                return (
                  <Pressable
                    key={code}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={info.label}
                    onPress={() => {
                      setLocale(code)
                      setMenu(null)
                    }}
                    style={({ pressed }) => ({
                      minHeight: 48,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: pressed || on ? tokens.surfaceLow : 'transparent',
                    })}
                  >
                    <Text style={{ fontSize: 20 }}>{info.flag}</Text>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: 'Inter',
                        fontSize: 14,
                        fontWeight: '700',
                        color: tokens.text,
                      }}
                    >
                      {info.label}
                    </Text>
                    {on && <Icon name="check" size={16} color={tokens.primary} />}
                  </Pressable>
                )
              })}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  )
}
