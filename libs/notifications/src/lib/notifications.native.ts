import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import {
  DeliveryDeduplicator,
  GENERIC_NOTIFICATION_CONTENT,
  NotificationEventDeduplicator,
  notificationCapabilities,
  type DeviceRegistrationOptions,
  type NotificationAdapter,
  type NotificationEvent,
  type NotificationPermission,
} from './notifications-core'

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

function permissionFrom(status: Notifications.PermissionStatus): NotificationPermission {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted'
  if (status === Notifications.PermissionStatus.DENIED) return 'denied'
  return 'undetermined'
}

function deliveryIdFrom(notification: Notifications.Notification): string | undefined {
  const value = notification.request.content.data?.['deliveryId']
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function createNotificationAdapter(): NotificationAdapter {
  const deduplicator = new DeliveryDeduplicator()
  const eventDeduplicator = new NotificationEventDeduplicator()
  const nativeSubscriptions = new Set<Notifications.EventSubscription>()

  async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return
    await Notifications.setNotificationChannelAsync('pager', {
      name: 'Pager',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  async function requestPermission(): Promise<NotificationPermission> {
    if (isExpoGo) return 'unsupported'
    await ensureAndroidChannel()
    const existing = await Notifications.getPermissionsAsync()
    if (existing.status === Notifications.PermissionStatus.GRANTED) return 'granted'
    if (!existing.canAskAgain) return permissionFrom(existing.status)
    return permissionFrom((await Notifications.requestPermissionsAsync()).status)
  }

  async function registerDevice({
    installationId,
    projectId,
    register,
  }: DeviceRegistrationOptions) {
    const capabilities = notificationCapabilities({
      native: true,
      physicalDevice: Device.isDevice,
      expoGo: isExpoGo,
    })
    if (!capabilities.remotePush) {
      return {
        status: 'unsupported' as const,
        permission: 'unsupported' as const,
        reason: capabilities.reason,
      }
    }
    const permission = await requestPermission()
    if (permission !== 'granted') {
      return {
        status: 'denied' as const,
        permission,
        reason: 'Notifications remain available in the in-app pager.',
      }
    }
    const eas = Constants.expoConfig?.extra?.['eas'] as { projectId?: string } | undefined
    const resolvedProjectId = projectId ?? eas?.projectId
    if (!resolvedProjectId) {
      return {
        status: 'unsupported' as const,
        permission: 'unsupported' as const,
        reason: 'An EAS project ID is required to register remote push.',
      }
    }
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    const acquireAndRegisterExpoToken = async (): Promise<string> => {
      const expoPushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId: resolvedProjectId })
      ).data
      await register({
        installationId,
        expoPushToken,
        platform,
        permission: 'granted',
      })
      return expoPushToken
    }
    const expoPushToken = await acquireAndRegisterExpoToken()
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      // The listener receives an APNs/FCM token, not an Expo push token.
      // Reacquire the Expo token and leave retry to the next explicit registration.
      void acquireAndRegisterExpoToken().catch(() => undefined)
    })
    nativeSubscriptions.add(tokenSubscription)
    return { status: 'registered' as const, permission, expoPushToken }
  }

  function emit(
    source: NotificationEvent['source'],
    notification: Notifications.Notification,
    onEvent: (event: NotificationEvent) => void,
  ) {
    const deliveryId = deliveryIdFrom(notification)
    const event = deliveryId ? { deliveryId, source } : undefined
    if (event && eventDeduplicator.accept(event)) onEvent(event)
  }

  function subscribe({ onEvent }: { onEvent(event: NotificationEvent): void }) {
    const received = Notifications.addNotificationReceivedListener((notification) => {
      emit('received', notification, onEvent)
    })
    const opened = Notifications.addNotificationResponseReceivedListener((response) => {
      emit('opened', response.notification, onEvent)
    })
    nativeSubscriptions.add(received)
    nativeSubscriptions.add(opened)
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) emit('opened', response.notification, onEvent)
    })
    return () => {
      received.remove()
      opened.remove()
      nativeSubscriptions.delete(received)
      nativeSubscriptions.delete(opened)
    }
  }

  return {
    capabilities: notificationCapabilities({
      native: true,
      physicalDevice: Device.isDevice,
      expoGo: isExpoGo,
    }),
    requestPermission,
    registerDevice,
    subscribe,
    acceptDelivery: (deliveryId) => deduplicator.accept(deliveryId),
    dispose() {
      for (const subscription of nativeSubscriptions) subscription.remove()
      nativeSubscriptions.clear()
      deduplicator.clear()
      eventDeduplicator.clear()
    },
  }
}

export { GENERIC_NOTIFICATION_CONTENT }
