import type { ConfigContext, ExpoConfig } from 'expo/config'

function normalizeDomain(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const domain = normalizeDomain(process.env.FGC_APP_LINK_DOMAIN)
  const easProjectId = process.env.FGC_EAS_PROJECT_ID
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission: 'Allow FGC to protect your signed-in session.',
      },
    ],
    ['expo-notifications', { defaultChannel: 'pager' }],
  ]
  if (process.env.FGC_ENABLE_IOS_SCENE_SUPPORT === 'true') {
    plugins.push(['expo-build-properties', { ios: { enableSceneSupport: true } }])
  }
  return {
    ...config,
    name: config.name ?? 'FGC',
    slug: config.slug ?? 'fgc-mobile',
    version: config.version ?? '1.0.0',
    orientation: config.orientation ?? 'portrait',
    userInterfaceStyle: 'light',
    scheme: process.env.FGC_APP_SCHEME,
    plugins,
    experiments: { ...config.experiments, autolinkingModuleResolution: true },
    extra: {
      ...config.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      eas: easProjectId ? { projectId: easProjectId } : undefined,
    },
    ios: {
      ...config.ios,
      deploymentTarget: '16.4',
      bundleIdentifier: process.env.FGC_IOS_BUNDLE_IDENTIFIER,
      associatedDomains: domain ? ['applinks:' + domain] : undefined,
    },
    android: {
      ...config.android,
      package: process.env.FGC_ANDROID_PACKAGE,
      intentFilters: domain
        ? [
            {
              action: 'VIEW',
              autoVerify: true,
              data: [{ scheme: 'https', host: domain }],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ]
        : undefined,
    },
  }
}
