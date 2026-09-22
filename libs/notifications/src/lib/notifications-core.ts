export const GENERIC_NOTIFICATION_CONTENT = {
  title: 'FGC',
  body: 'You have a new message.',
} as const;

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface NotificationCapabilities {
  localNotifications: boolean;
  remotePush: boolean;
  appLinks: boolean;
  reason?: string;
}

export interface PushDeviceRegistration {
  installationId: string;
  expoPushToken: string;
  platform: 'android' | 'ios';
  permission: 'granted';
}

export type RegisterPushDevice = (registration: PushDeviceRegistration) => Promise<void>;

export interface DeviceRegistrationOptions {
  installationId: string;
  projectId?: string;
  register: RegisterPushDevice;
}

export type DeviceRegistrationResult =
  | { status: 'registered'; permission: 'granted'; expoPushToken: string }
  | { status: 'denied' | 'unsupported'; permission: NotificationPermission; reason?: string };

export interface NotificationEvent {
  deliveryId: string;
  source: 'received' | 'opened';
}

export interface NotificationSubscription {
  onEvent(event: NotificationEvent): void;
}

export interface NotificationAdapter {
  readonly capabilities: NotificationCapabilities;
  requestPermission(): Promise<NotificationPermission>;
  registerDevice(options: DeviceRegistrationOptions): Promise<DeviceRegistrationResult>;
  subscribe(subscription: NotificationSubscription): () => void;
  acceptDelivery(deliveryId: string): boolean;
  dispose(): void;
}

export class DeliveryDeduplicator {
  private readonly seen = new Set<string>();
  private readonly order: string[] = [];

  constructor(private readonly capacity = 256) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('Delivery deduplication capacity must be a positive integer');
    }
  }

  accept(deliveryId: string): boolean {
    if (!deliveryId || this.seen.has(deliveryId)) return false;
    this.seen.add(deliveryId);
    this.order.push(deliveryId);
    if (this.order.length > this.capacity) {
      const oldest = this.order.shift();
      if (oldest) this.seen.delete(oldest);
    }
    return true;
  }

  clear(): void {
    this.seen.clear();
    this.order.length = 0;
  }
}

export class NotificationEventDeduplicator {
  private readonly received: DeliveryDeduplicator;
  private readonly opened: DeliveryDeduplicator;

  constructor(capacity = 256) {
    this.received = new DeliveryDeduplicator(capacity);
    this.opened = new DeliveryDeduplicator(capacity);
  }

  accept(event: NotificationEvent): boolean {
    const deliveries = event.source === 'opened' ? this.opened : this.received;
    return deliveries.accept(event.deliveryId);
  }

  clear(): void {
    this.received.clear();
    this.opened.clear();
  }
}

export function notificationCapabilities(input: {
  native: boolean;
  physicalDevice: boolean;
  expoGo: boolean;
}): NotificationCapabilities {
  if (!input.native) {
    return {
      localNotifications: false,
      remotePush: false,
      appLinks: true,
      reason: 'Web push is outside the FGC MVP; keep foreground polling active.',
    };
  }
  if (input.expoGo) {
    return {
      localNotifications: true,
      remotePush: false,
      appLinks: false,
      reason: 'Remote push and app links require an FGC development build.',
    };
  }
  if (!input.physicalDevice) {
    return {
      localNotifications: true,
      remotePush: false,
      appLinks: true,
      reason: 'Remote push registration requires a physical device.',
    };
  }
  return { localNotifications: true, remotePush: true, appLinks: true };
}
