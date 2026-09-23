export const TEAM_MAP_GEOMETRY = {
  cellWidth: 64,
  cellHeight: 52,
  gap: 8,
  columnsPerBlock: 5,
  blocks: 3,
  blockGap: 48,
  pitsTop: 300,
  sceneWidth: 1232,
  minZoom: 0.8,
  maxZoom: 8,
} as const

export interface TeamMapLayoutTeam {
  id: string
  name: string
  officialId: string
  pitX?: number | null
  pitY?: number | null
}

export interface TeamMapPoint {
  cx: number
  cy: number
  source: 'pit-coordinate' | 'alphabetical-fallback'
}

export function compareTeamsAlphabetically(
  left: TeamMapLayoutTeam,
  right: TeamMapLayoutTeam,
): number {
  return (
    left.officialId.localeCompare(right.officialId, undefined, {
      numeric: true,
      sensitivity: 'base',
    }) ||
    left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) ||
    left.id.localeCompare(right.id)
  )
}

export function layoutTeams(
  teams: readonly TeamMapLayoutTeam[],
): Map<string, TeamMapPoint> {
  const geometry = TEAM_MAP_GEOMETRY
  const sorted = [...teams].sort(compareTeamsAlphabetically)
  const out = new Map<string, TeamMapPoint>()
  const blockWidth =
    geometry.columnsPerBlock * (geometry.cellWidth + geometry.gap) - geometry.gap
  const perBlock = Math.max(1, Math.ceil(sorted.length / geometry.blocks))

  sorted.forEach((team, index) => {
    const hasCoordinate = Number.isFinite(team.pitX) && Number.isFinite(team.pitY)
    let gridX: number
    let gridY: number

    if (hasCoordinate) {
      gridX = team.pitX as number
      gridY = team.pitY as number
    } else {
      const block = Math.min(geometry.blocks - 1, Math.floor(index / perBlock))
      const withinBlock = index - block * perBlock
      gridX =
        block * ((blockWidth + geometry.blockGap) / (geometry.cellWidth + geometry.gap)) +
        (withinBlock % geometry.columnsPerBlock)
      gridY = Math.floor(withinBlock / geometry.columnsPerBlock)
    }

    out.set(team.id, {
      cx: 40 + gridX * (geometry.cellWidth + geometry.gap) + geometry.cellWidth / 2,
      cy:
        geometry.pitsTop +
        gridY * (geometry.cellHeight + geometry.gap) +
        geometry.cellHeight / 2,
      source: hasCoordinate ? 'pit-coordinate' : 'alphabetical-fallback',
    })
  })
  return out
}

export function sceneHeight(points: Iterable<TeamMapPoint>): number {
  let height = TEAM_MAP_GEOMETRY.pitsTop + 200
  for (const point of points) {
    height = Math.max(height, point.cy + TEAM_MAP_GEOMETRY.cellHeight)
  }
  return height + 40
}

export function clampTeamMapZoom(zoom: number): number {
  return Math.min(TEAM_MAP_GEOMETRY.maxZoom, Math.max(TEAM_MAP_GEOMETRY.minZoom, zoom))
}
