# `@fgc/notifications`

Platform notification boundary for FGC clients.

- `createNotificationAdapter()` selects the native or web implementation.
- `NotificationAdapter` exposes capabilities, permission, injected registration, lifecycle events, deduplication, and cleanup.
- `RegisterPushDevice` is supplied by the app shell; this package does not import auth, API client, or messaging.
- `GENERIC_NOTIFICATION_CONTENT` is the only approved external message copy.

Expo Go reports remote push and app links as unsupported. Denied permission returns a result and leaves the in-app pager usable.
