/** @jest-environment jsdom */
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { FgcTeamsResult } from '@fgc/shared'
import { TeamSearch } from './team-search'

jest.mock('react-native', () => require('react-native-web'))
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'svg',
  Circle: 'circle',
  Line: 'line',
  Path: 'path',
  Rect: 'rect',
}))
// Image assets are not loadable by Jest and are irrelevant here.
jest.mock('./logo', () => ({ BrandLogo: () => null }))
const mockFetchTeams = jest.fn()
jest.mock('@fgc/shared', () => ({
  ...jest.requireActual('@fgc/shared'),
  fetchTeams: (...args: unknown[]) => mockFetchTeams(...args),
}))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const result = (source: FgcTeamsResult['source'] = 'live'): FgcTeamsResult => ({
  source,
  fetchedAt: '2026-10-08T00:00:00.000Z',
  teams: [
    { teamKey: 23, code: 'BRA', iso2: 'br', name: 'Brazil' },
    { teamKey: 93, code: 'KOR', iso2: 'kr', name: 'South Korea' },
  ],
})
let container: HTMLDivElement
let root: Root
const flush = () => act(async () => void (await Promise.resolve()))
const input = () => container.querySelector('input') as HTMLInputElement
async function type(value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )!.set!
  await act(async () => {
    setter.call(input(), value)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
  await flush()
}
beforeEach(async () => {
  mockFetchTeams.mockReset()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<TeamSearch />))
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('TeamSearch', () => {
  it('lists nothing and calls no API until something is typed', async () => {
    expect(mockFetchTeams).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Type a country name or code')
    expect(container.textContent).not.toContain('Brazil')
  })
  it('shows only the matching team after typing a name or a code', async () => {
    mockFetchTeams.mockResolvedValue(result())
    await type('brazil')
    expect(container.textContent).toContain('Brazil')
    expect(container.textContent).toContain('BRA')
    expect(container.textContent).not.toContain('South Korea')
    await type('kor')
    expect(container.textContent).toContain('South Korea')
    expect(container.textContent).not.toContain('Brazil')
    expect(mockFetchTeams).toHaveBeenCalledTimes(1)
  })
  it('hides the list again when the input is cleared', async () => {
    mockFetchTeams.mockResolvedValue(result())
    await type('bra')
    await type('  ')
    expect(container.textContent).not.toContain('Brazil')
  })
  it('says so when nothing matches', async () => {
    mockFetchTeams.mockResolvedValue(result())
    await type('xyz')
    expect(container.textContent).toContain('No team matches “xyz”.')
  })
  it('flags stale snapshot data', async () => {
    mockFetchTeams.mockResolvedValue(result('snapshot'))
    await type('bra')
    expect(container.textContent).toContain('may be out of date')
  })
  it('shows an error with a retry that forces a refresh', async () => {
    mockFetchTeams.mockRejectedValueOnce(new Error('down'))
    await type('bra')
    expect(container.textContent).toContain('could not be loaded')
    mockFetchTeams.mockResolvedValue(result())
    const retry = [...container.querySelectorAll('[role="button"]')].find((el) =>
      el.textContent?.includes('Try again'),
    ) as HTMLElement
    await act(async () => retry.click())
    await flush()
    expect(mockFetchTeams).toHaveBeenLastCalledWith(
      expect.objectContaining({ forceRefresh: true }),
    )
    expect(container.textContent).toContain('Brazil')
  })
})
