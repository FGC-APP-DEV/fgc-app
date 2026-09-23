import {
  DeliveryDeduplicator,
  NotificationEventDeduplicator,
  notificationCapabilities,
} from './notifications-core'

describe('notification delivery deduplication', () => {
  it('accepts a delivery once while it remains in the bounded memory window', () => {
    const deliveries = new DeliveryDeduplicator(2)
    expect(deliveries.accept('delivery-1')).toBe(true)
    expect(deliveries.accept('delivery-1')).toBe(false)
    expect(deliveries.accept('')).toBe(false)
  })

  it('evicts the oldest delivery rather than growing without a bound', () => {
    const deliveries = new DeliveryDeduplicator(2)
    deliveries.accept('delivery-1')
    deliveries.accept('delivery-2')
    deliveries.accept('delivery-3')
    expect(deliveries.accept('delivery-1')).toBe(true)
    expect(deliveries.accept('delivery-3')).toBe(false)
  })
})

describe('notification lifecycle event deduplication', () => {
  it('allows an opened event after the same delivery was received', () => {
    const events = new NotificationEventDeduplicator()

    expect(events.accept({ deliveryId: 'delivery-1', source: 'received' })).toBe(true)
    expect(events.accept({ deliveryId: 'delivery-1', source: 'received' })).toBe(false)
    expect(events.accept({ deliveryId: 'delivery-1', source: 'opened' })).toBe(true)
    expect(events.accept({ deliveryId: 'delivery-1', source: 'opened' })).toBe(false)
  })
})

describe('notification capabilities', () => {
  it('marks remote push and app links unsupported in Expo Go', () => {
    expect(
      notificationCapabilities({
        native: true,
        physicalDevice: true,
        expoGo: true,
      }),
    ).toEqual({
      localNotifications: true,
      remotePush: false,
      appLinks: false,
      reason: 'Remote push and app links require an FGC development build.',
    })
  })

  it('allows native capabilities only in an owned build on a physical device', () => {
    expect(
      notificationCapabilities({
        native: true,
        physicalDevice: true,
        expoGo: false,
      }),
    ).toEqual({
      localNotifications: true,
      remotePush: true,
      appLinks: true,
    })
  })
})
