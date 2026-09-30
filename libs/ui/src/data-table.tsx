import React, { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Icon } from './icons'
import { useI18n } from './i18n'
import { Body, Button, Card, elevation, layout, radius, tokens } from './operations'

export const PAGE_SIZE = 15

export function paginate<T>(items: readonly T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, page), pages)
  return {
    pages,
    page: current,
    items: items.slice((current - 1) * size, current * size),
  }
}

// `color` is a getter so it follows the active theme instead of the palette at import time.
const cellText = {
  fontFamily: 'Inter',
  fontSize: 14,
  lineHeight: 20,
  get color() {
    return tokens.text
  },
} as const

/** Below this window width the "three dots" column is dropped and the whole row is the button. */
export const COMPACT_TABLE_WIDTH = 640

export interface Column<T> {
  key: string
  title: string
  /** Relative width (flex). Defaults to 1. */
  flex?: number
  render: (row: T) => React.ReactNode
}

/**
 * Clean table: header row, one text row per record, pagination footer and, when
 * `onRowAction` is set, a "three dots" button per row that opens the row's action modal.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  noun,
  empty,
  loading = false,
  rowActionLabel,
  onRowAction,
  resetKey = '',
  pageSize = PAGE_SIZE,
}: {
  columns: readonly Column<T>[]
  rows: readonly T[]
  rowKey: (row: T) => string
  /** Plural noun for the footer, e.g. "users". */
  noun: string
  empty: string
  loading?: boolean
  /** Accessible name of the row button, e.g. `Actions for ${email}`. */
  rowActionLabel?: (row: T) => string
  onRowAction?: (row: T) => void
  /** Changing this value (for instance the active filters) returns to the first page. */
  resetKey?: string
  pageSize?: number
}) {
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [resetKey])
  const view = paginate(rows, page, pageSize)
  const { t } = useI18n()
  const compact = useWindowDimensions().width < COMPACT_TABLE_WIDTH
  const actionLabel = (row: T) => rowActionLabel?.(row) ?? t('rowActions')
  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="none" style={{ width: '100%' }}>
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: 8,
            borderBottomWidth: 2,
            borderColor: tokens.border,
          }}
        >
          {columns.map((column) => (
            <Text
              key={column.key}
              style={[
                cellText,
                {
                  flex: column.flex ?? 1,
                  minWidth: 0,
                  fontWeight: '700',
                  paddingHorizontal: 4,
                },
              ]}
            >
              {column.title}
            </Text>
          ))}
          {onRowAction && !compact && <View style={{ width: 44 }} />}
        </View>
        {!loading &&
          view.items.map((row) => {
            const cells = columns.map((column) => {
              const content = column.render(row)
              return (
                <View
                  key={column.key}
                  style={{ flex: column.flex ?? 1, minWidth: 0, paddingHorizontal: 4 }}
                >
                  {typeof content === 'string' ? (
                    <Text style={cellText}>{content}</Text>
                  ) : (
                    content
                  )}
                </View>
              )
            })
            const rowStyle = {
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 48,
              paddingVertical: 4,
              borderBottomWidth: 1,
              borderColor: tokens.border,
            } as const
            // On a narrow screen the row itself opens the modal; otherwise the dots button does.
            if (onRowAction && compact)
              return (
                <Pressable
                  key={rowKey(row)}
                  accessibilityRole="button"
                  accessibilityLabel={actionLabel(row)}
                  onPress={() => onRowAction(row)}
                  style={({ pressed }) => [
                    rowStyle,
                    { backgroundColor: pressed ? tokens.surfaceLow : 'transparent' },
                  ]}
                >
                  {cells}
                </Pressable>
              )
            return (
              <View key={rowKey(row)} style={rowStyle}>
                {cells}
                {onRowAction && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel(row)}
                    onPress={() => onRowAction(row)}
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radius.pill,
                      backgroundColor: pressed ? tokens.surfaceLow : 'transparent',
                    })}
                  >
                    <Icon name="more" size={20} color={tokens.muted} />
                  </Pressable>
                )}
              </View>
            )
          })}
      </View>
      {!loading && rows.length === 0 && <Body>{empty}</Body>}
      <Pagination
        page={view.page}
        pages={view.pages}
        total={rows.length}
        noun={noun}
        onPage={setPage}
      />
    </View>
  )
}

export function Pagination({
  page,
  pages,
  total,
  noun,
  onPage,
}: {
  page: number
  pages: number
  total: number
  noun: string
  onPage: (page: number) => void
}) {
  const { t } = useI18n()
  const arrow = (
    name: 'chevronLeft' | 'chevronRight',
    label: string,
    disabled: boolean,
    to: number,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onPage(to)}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: pressed ? tokens.surfaceLow : tokens.surface,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name={name} size={18} color={tokens.primary} />
    </Pressable>
  )
  return (
    <View style={[layout.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
      {arrow('chevronLeft', t('previousPage'), page <= 1, page - 1)}
      <Text
        style={[cellText, { color: tokens.muted, flexShrink: 1, textAlign: 'center' }]}
      >
        {t('pageOf', { page, pages, total, noun })}
      </Text>
      {arrow('chevronRight', t('nextPage'), page >= pages, page + 1)}
    </View>
  )
}

/** Modal card with a close "X" and Confirm / Cancel buttons; row actions happen here. */
export function ActionModal({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled = false,
  confirmVariant = 'primary',
  children,
}: {
  title: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'danger'
  children?: React.ReactNode
}) {
  const { t, dirStyle } = useI18n()
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View
        style={[
          {
            flex: 1,
            padding: 20,
            backgroundColor: tokens.scrim,
            justifyContent: 'center',
          },
          dirStyle,
        ]}
      >
        <View
          accessibilityViewIsModal
          style={{ maxWidth: 480, width: '100%', alignSelf: 'center', maxHeight: '100%' }}
        >
          <Card title={title}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('close')}
              onPress={onClose}
              style={{ position: 'absolute', top: 8, end: 8, padding: 8, zIndex: 1 }}
            >
              <Icon name="x" size={20} color={tokens.primary} />
            </Pressable>
            <ScrollView
              contentContainerStyle={layout.stack}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            <View style={layout.row}>
              <Button
                label={confirmLabel ?? t('confirm')}
                variant={confirmVariant}
                disabled={confirmDisabled}
                onPress={onConfirm}
              />
              <Button label={t('cancel')} variant="secondary" onPress={onClose} />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  )
}

/** Labelled check box (role checkbox) for choices that replace a row of toggle buttons. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? tokens.primaryContainer : tokens.outline,
          backgroundColor: checked ? tokens.primaryContainer : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && <Icon name="check" size={14} color={tokens.onFill} strokeWidth={3} />}
      </View>
      <Text style={cellText}>{label}</Text>
    </Pressable>
  )
}

export interface SelectOption {
  value: string
  label: string
}
/** Dropdown: a single field-like button that opens a list of options. */
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { t, dirStyle } = useI18n()
  const current = options.find((option) => option.value === value)
  return (
    <View style={{ gap: 4, flexGrow: 1, flexBasis: 160 }}>
      <Text style={[cellText, { fontWeight: '700', fontSize: 12, color: tokens.muted }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? ''}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          minHeight: 48,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: pressed ? tokens.surfaceLow : tokens.surface,
        })}
      >
        <Text style={cellText}>{current?.label ?? ''}</Text>
        <Icon name="chevronDown" size={18} color={tokens.muted} />
      </Pressable>
      {open && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('closeSelect', { label })}
            onPress={() => setOpen(false)}
            style={[
              {
                flex: 1,
                padding: 20,
                justifyContent: 'center',
                backgroundColor: tokens.backdrop,
              },
              dirStyle,
            ]}
          >
            <View
              accessibilityLabel={label}
              style={[
                {
                  maxWidth: 360,
                  width: '100%',
                  maxHeight: '80%',
                  alignSelf: 'center',
                  overflow: 'hidden',
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  backgroundColor: tokens.surface,
                },
                elevation.xl,
              ]}
            >
              <ScrollView>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: option.value === value }}
                    onPress={() => {
                      setOpen(false)
                      onChange(option.value)
                    }}
                    style={({ pressed }) => ({
                      minHeight: 48,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: pressed ? tokens.surfaceLow : 'transparent',
                    })}
                  >
                    <Text
                      style={[
                        cellText,
                        { fontWeight: option.value === value ? '700' : '400' },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {option.value === value && (
                      <Icon name="check" size={16} color={tokens.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  )
}
