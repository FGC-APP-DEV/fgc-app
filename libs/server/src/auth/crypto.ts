import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'

export const digest = (value: string) =>
  createHash('sha256').update(value).digest('base64url')
export const randomSecret = () => randomBytes(32).toString('base64url')
export function equalSecret(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
export function checkVerifier(challenge: string, verifier: string): boolean {
  return (
    /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) && equalSecret(challenge, digest(verifier))
  )
}
export function seal(value: unknown, key: Buffer, context: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(context))
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ])
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((v) => v.toString('base64url'))
    .join('.')
}
export function unseal<T>(value: string, key: Buffer, context: string): T {
  const [iv, tag, ciphertext] = value.split('.').map((v) => Buffer.from(v, 'base64url'))
  const cipher = createDecipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(context))
  cipher.setAuthTag(tag)
  return JSON.parse(
    Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString('utf8'),
  ) as T
}
export function csrfToken(refresh: string, key: Buffer, now = Date.now()): string {
  const expires = String(Math.floor(now / 1000) + 3600)
  return `${expires}.${createHmac('sha256', key).update(`csrf:${expires}:${refresh}`).digest('base64url')}`
}
export function verifyCsrf(
  token: string,
  refresh: string,
  key: Buffer,
  now = Date.now(),
): boolean {
  const [expires, signature, extra] = token.split('.')
  if (
    extra ||
    !/^\d+$/.test(expires) ||
    Number(expires) <= now / 1000 ||
    Number(expires) > now / 1000 + 3600
  )
    return false
  return equalSecret(
    signature ?? '',
    createHmac('sha256', key).update(`csrf:${expires}:${refresh}`).digest('base64url'),
  )
}
