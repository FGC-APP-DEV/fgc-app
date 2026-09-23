import {
  DeliveryDeduplicator,
  type NotificationAdapter,
  type NotificationCapabilities,
} from './notifications-core'

const WEB_CAPABILITIES: NotificationCapabilities = {
  localNotifications: false,
  remotePush: false,
  appLinks: true,
  reason: 'Web push is outside the FGC MVP; keep foreground polling active.',
}

export function createNotificationAdapter(): NotificationAdapter {
  const deduplicator = new DeliveryDeduplicator()
  return {
    capabilities: WEB_CAPABILITIES,
    async requestPermission() {
      return 'unsupported'
    },
    async registerDevice() {
      return { status: 'unsupported', permission: 'unsupported' }
    },
    subscribe() {
      return () => undefined
    },
    acceptDelivery(deliveryId) {
      return deduplicator.accept(deliveryId)
    },
    dispose() {
      deduplicator.clear()
    },
  }
}
