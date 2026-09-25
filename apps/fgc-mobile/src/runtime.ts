import { AppState } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import * as Linking from 'expo-linking'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
import type { AuthRuntime } from '@fgc/auth'
import type { ImportFile } from '@fgc/imports'

let link: { attemptId: string; tokenHash: string } | null = null
const linkListeners = new Set<() => void>()
function capture(url: string | null) {
  if (!url) return
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return
  }
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''))
  const attemptId = fragment.get('attemptId') ?? parsed.searchParams.get('attemptId')
  const tokenHash = fragment.get('tokenHash') ?? fragment.get('token_hash')
  if (attemptId && tokenHash) {
    link = { attemptId, tokenHash }
    linkListeners.forEach((notify) => notify())
  }
}
void Linking.getInitialURL().then(capture)
Linking.addEventListener('url', (event) => capture(event.url))
export const runtime: AuthRuntime = {
  platform: 'mobile',
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  randomId: () => Crypto.randomUUID(),
  store: {
    get: (key) => SecureStore.getItemAsync(key),
    set: (key, value) => SecureStore.setItemAsync(key, value),
    remove: (key) => SecureStore.deleteItemAsync(key),
  },
  pkce: async () => {
    const verifier = `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '')
    const encoded = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    )
    return {
      verifier,
      challenge: encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    }
  },
  subscribeResume: (callback) => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') callback()
    })
    return () => subscription.remove()
  },
  getAuthLink: () => link,
  subscribeAuthLink: (callback) => {
    linkListeners.add(callback)
    return () => {
      linkListeners.delete(callback)
    }
  },
}
export async function pickFile(): Promise<ImportFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  })
  if (result.canceled) return null
  const selected = result.assets[0]
  const file = new File(selected.uri)
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file smaller than 5 MiB.')
    return {
      fileName: selected.name,
      content: selected.name.toLowerCase().endsWith('.xlsx')
        ? await file.base64()
        : await file.text(),
      encoding: selected.name.toLowerCase().endsWith('.xlsx') ? 'base64' : 'utf8',
    }
  } finally {
    file.delete()
  }
}
