export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Returns a copy sorted by team name (then official id), as the legacy lists did. */
export function sortTeams<T>(
  items: readonly T[],
  team: (item: T) => { name: string; officialId: string },
): T[] {
  return [...items].sort((a, b) => {
    const x = team(a)
    const y = team(b)
    return (
      x.name.localeCompare(y.name, 'en', { sensitivity: 'base' }) ||
      x.officialId.localeCompare(y.officialId, 'en', { numeric: true })
    )
  })
}
