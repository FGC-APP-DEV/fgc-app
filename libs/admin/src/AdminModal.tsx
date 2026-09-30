import React from 'react'
import { Modal, Pressable, View } from 'react-native'
import { Card, Icon, tokens } from '@fgc/ui'

/** Modal card with a close "X" in the top-right corner. */
export function AdminModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ position: 'absolute', top: 8, right: 8, padding: 8, zIndex: 1 }}
            >
              <Icon name="x" size={20} color={tokens.primary} />
            </Pressable>
            {children}
          </Card>
        </View>
      </View>
    </Modal>
  )
}
