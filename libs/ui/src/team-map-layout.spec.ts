import {
  TEAM_MAP_GEOMETRY,
  clampTeamMapZoom,
  layoutTeams,
  sceneHeight,
} from './team-map-layout'

const team = (id: string, officialId: string, name = officialId) => ({
  id,
  officialId,
  name,
})

describe('team map layout', () => {
  it('uses official-ID alphabetical order for fallback positions', () => {
    const points = layoutTeams([
      team('third', 'Team 10'),
      team('first', 'Team 2'),
      team('second', 'Team 3'),
    ])

    expect(points.get('first')).toMatchObject({ cx: 72, cy: 326 })
    expect(points.get('second')?.cx).toBeGreaterThan(points.get('first')!.cx)
    expect(points.get('third')?.cx).toBeGreaterThan(points.get('second')!.cx)
  })

  it('interprets stored pit coordinates as grid units', () => {
    const points = layoutTeams([{ ...team('located', 'A'), pitX: 2, pitY: 3 }])

    expect(points.get('located')).toEqual({
      cx: 40 + 2 * (TEAM_MAP_GEOMETRY.cellWidth + TEAM_MAP_GEOMETRY.gap) + 32,
      cy: 300 + 3 * (TEAM_MAP_GEOMETRY.cellHeight + TEAM_MAP_GEOMETRY.gap) + 26,
      source: 'pit-coordinate',
    })
  })

  it('keeps unlocated teams in the fallback while honoring real coordinates', () => {
    const points = layoutTeams([
      { ...team('located', 'B'), pitX: 0, pitY: 4 },
      team('fallback', 'A'),
    ])

    expect(points.get('located')?.source).toBe('pit-coordinate')
    expect(points.get('fallback')).toMatchObject({
      cx: 72,
      cy: 326,
      source: 'alphabetical-fallback',
    })
    expect(sceneHeight(points.values())).toBeGreaterThan(500)
  })

  it('bounds zoom to the legacy interaction range', () => {
    expect(clampTeamMapZoom(0)).toBe(0.8)
    expect(clampTeamMapZoom(3)).toBe(3)
    expect(clampTeamMapZoom(20)).toBe(8)
  })
})
