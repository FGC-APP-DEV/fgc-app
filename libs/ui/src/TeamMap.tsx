import React, { useMemo, useRef, useState } from 'react'
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native'
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg'
import { Body, Button, Field, layout, tokens } from './operations'
import {
  TEAM_MAP_GEOMETRY,
  clampTeamMapZoom,
  compareTeamsAlphabetically,
  layoutTeams,
  sceneHeight,
} from './team-map-layout'

export interface MapTeam {
  id: string
  name: string
  officialId: string
  country?: string
  shortName?: string | null
  /** Grid units from an approved pit-location source, never screen pixels. */
  pitX?: number | null
  /** Grid units from an approved pit-location source, never screen pixels. */
  pitY?: number | null
}

export type TeamMapStatus = 'captured' | 'skipped' | 'active' | 'pending' | 'neutral'

export interface TeamMapProps {
  /** Always pass the complete event team set, even when a sibling list is filtered. */
  teams: MapTeam[]
  status: (id: string) => TeamMapStatus | string
  onSelect: (id: string) => void
  /** Optional IDs currently visible in a sibling filter; other pits remain on the map. */
  visibleTeamIds?: ReadonlySet<string>
}

interface ViewTransform {
  zoom: number
  x: number
  y: number
}

const MAP_HEIGHT = 520
const MAX_SEARCH_RESULTS = 6

const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  captured: { fill: '#D1FAE5', stroke: '#6EE7B7' },
  skipped: { fill: tokens.surfaceLow, stroke: '#D4D4D4' },
  active: { fill: '#FEE2E2', stroke: '#F87171' },
  pending: { fill: '#FFFBEB', stroke: '#FDE68A' },
  neutral: { fill: '#FFFBEB', stroke: '#FDE68A' },
}

function statusColors(status: string): { fill: string; stroke: string } {
  switch (status) {
    case 'captured':
      return STATUS_COLORS.captured
    case 'skipped':
      return STATUS_COLORS.skipped
    case 'active':
      return STATUS_COLORS.active
    case 'pending':
      return STATUS_COLORS.pending
    default:
      return STATUS_COLORS.neutral
  }
}

function teamLabel(team: MapTeam): string {
  return [team.officialId, team.name, team.country].filter(Boolean).join(' · ')
}

function shortCode(team: MapTeam): string {
  if (team.shortName?.trim()) return team.shortName.trim().slice(0, 8).toUpperCase()
  return team.officialId.slice(0, 8).toUpperCase()
}

function touchDistance(event: GestureResponderEvent): number | undefined {
  const touches = event.nativeEvent.touches
  if (touches.length < 2) return undefined
  return Math.hypot(
    touches[0].pageX - touches[1].pageX,
    touches[0].pageY - touches[1].pageY,
  )
}

export function TeamMap({ teams, status, onSelect, visibleTeamIds }: TeamMapProps) {
  const { width: windowWidth } = useWindowDimensions()
  const mapWidth = Math.max(320, Math.min(896, windowWidth - 40))
  const points = useMemo(() => layoutTeams(teams), [teams])
  const sceneH = useMemo(() => sceneHeight(points.values()), [points])
  const sortedTeams = useMemo(() => [...teams].sort(compareTeamsAlphabetically), [teams])
  const usesFallback = useMemo(
    () => [...points.values()].some((point) => point.source === 'alphabetical-fallback'),
    [points],
  )
  const hiddenByFilter = visibleTeamIds
    ? teams.filter((team) => !visibleTeamIds.has(team.id)).length
    : 0

  const [view, setView] = useState<ViewTransform>({ zoom: 1, x: 0, y: 0 })
  const [search, setSearch] = useState('')
  const [focusedId, setFocusedId] = useState<string>()
  const [showAccessibleList, setShowAccessibleList] = useState(false)
  const gesture = useRef<{
    view: ViewTransform
    pinchDistance?: number
  }>({ view: { zoom: 1, x: 0, y: 0 } })

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Leave taps with the SVG pit cell; claim only an actual drag/pinch.
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, state) =>
          state.numberActiveTouches > 1 || Math.abs(state.dx) + Math.abs(state.dy) > 4,
        onPanResponderGrant: (event) => {
          gesture.current = {
            view,
            pinchDistance: touchDistance(event),
          }
        },
        onPanResponderMove: (event, state) => {
          const start = gesture.current
          const pinch = touchDistance(event)
          const zoom =
            pinch && start.pinchDistance
              ? clampTeamMapZoom(start.view.zoom * (pinch / start.pinchDistance))
              : start.view.zoom
          const scale = TEAM_MAP_GEOMETRY.sceneWidth / mapWidth
          setView({
            zoom,
            x: start.view.x + state.dx * scale,
            y: start.view.y + state.dy * scale,
          })
        },
      }),
    [mapWidth, view],
  )

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const searchResults = normalizedSearch
    ? sortedTeams
        .filter((team) => teamLabel(team).toLocaleLowerCase().includes(normalizedSearch))
        .slice(0, MAX_SEARCH_RESULTS)
    : []

  function focusTeam(team: MapTeam) {
    const point = points.get(team.id)
    if (!point) return
    const zoom = 3
    const visibleSceneHeight = (TEAM_MAP_GEOMETRY.sceneWidth / mapWidth) * MAP_HEIGHT
    setView({
      zoom,
      x: TEAM_MAP_GEOMETRY.sceneWidth / 2 - zoom * point.cx,
      y: visibleSceneHeight / 2 - zoom * point.cy,
    })
    setFocusedId(team.id)
    setSearch('')
  }

  function selectTeam(team: MapTeam) {
    setFocusedId(team.id)
    onSelect(team.id)
  }

  function resetView() {
    setView({ zoom: 1, x: 0, y: 0 })
    setFocusedId(undefined)
  }

  return (
    <View style={layout.stack}>
      <Body>
        Map shows all {teams.length} teams, including {hiddenByFilter} hidden by the
        current list filters.
      </Body>
      {usesFallback && (
        <Body>
          Schematic map: teams without approved pit coordinates use alphabetical
          positions. Confirm venue locations before relying on placement.
        </Body>
      )}
      <Field
        label="Find a team on the map"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {searchResults.length > 0 && (
        <View accessibilityRole="list" style={layout.stack}>
          {searchResults.map((team) => (
            <Button
              key={team.id}
              label={`Focus ${teamLabel(team)}`}
              variant="secondary"
              onPress={() => focusTeam(team)}
            />
          ))}
        </View>
      )}
      <View style={layout.row}>
        <Button
          label="Zoom in"
          variant="secondary"
          onPress={() =>
            setView((current) => ({
              ...current,
              zoom: clampTeamMapZoom(current.zoom * 1.5),
            }))
          }
        />
        <Button
          label="Zoom out"
          variant="secondary"
          onPress={() =>
            setView((current) => ({
              ...current,
              zoom: clampTeamMapZoom(current.zoom / 1.5),
            }))
          }
        />
        <Button label="Reset map" variant="secondary" onPress={resetView} />
      </View>
      <View
        accessibilityLabel="Interactive team pit map"
        style={{
          overflow: 'hidden',
          height: MAP_HEIGHT,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.background,
        }}
        {...panResponder.panHandlers}
      >
        <Svg
          width="100%"
          height={MAP_HEIGHT}
          viewBox={`0 0 ${TEAM_MAP_GEOMETRY.sceneWidth} ${sceneH}`}
        >
          <Rect
            width={TEAM_MAP_GEOMETRY.sceneWidth}
            height={sceneH}
            fill={tokens.background}
          />
          <G transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
            <Rect
              x={40}
              y={30}
              width={430}
              height={190}
              rx={10}
              fill="#EEF2FF"
              stroke="#A5B4FC"
              strokeWidth={2}
            />
            <SvgText
              x={255}
              y={135}
              textAnchor="middle"
              fontSize={26}
              fill="#4F46E5"
              fontWeight="600"
            >
              Field 1
            </SvgText>
            <Rect
              x={510}
              y={30}
              width={430}
              height={190}
              rx={10}
              fill="#EEF2FF"
              stroke="#A5B4FC"
              strokeWidth={2}
            />
            <SvgText
              x={725}
              y={135}
              textAnchor="middle"
              fontSize={26}
              fill="#4F46E5"
              fontWeight="600"
            >
              Field 2
            </SvgText>
            <Rect
              x={980}
              y={30}
              width={212}
              height={88}
              rx={10}
              fill="#F8E8EB"
              stroke="#D75F72"
              strokeWidth={2}
            />
            <SvgText
              x={1086}
              y={82}
              textAnchor="middle"
              fontSize={17}
              fill="#A93D52"
              fontWeight="600"
            >
              Pit Admin
            </SvgText>
            <Rect
              x={980}
              y={132}
              width={212}
              height={88}
              rx={10}
              fill="#FAECE7"
              stroke="#E08B6D"
              strokeWidth={2}
            />
            <SvgText
              x={1086}
              y={184}
              textAnchor="middle"
              fontSize={17}
              fill="#AD5B3F"
              fontWeight="600"
            >
              Filming
            </SvgText>
            <SvgText
              x={616}
              y={276}
              textAnchor="middle"
              fontSize={16}
              fill={tokens.outline}
            >
              — PITS —
            </SvgText>
            {sortedTeams.map((team) => {
              const point = points.get(team.id)
              if (!point) return null
              const currentStatus = status(team.id)
              const colors = statusColors(currentStatus)
              const focused = focusedId === team.id
              const filtered = Boolean(visibleTeamIds && !visibleTeamIds.has(team.id))
              return (
                <G
                  key={team.id}
                  onPress={() => selectTeam(team)}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`${teamLabel(team)}, ${currentStatus}`}
                  opacity={filtered ? 0.45 : 1}
                >
                  <Rect
                    x={point.cx - TEAM_MAP_GEOMETRY.cellWidth / 2}
                    y={point.cy - TEAM_MAP_GEOMETRY.cellHeight / 2}
                    width={TEAM_MAP_GEOMETRY.cellWidth}
                    height={TEAM_MAP_GEOMETRY.cellHeight}
                    rx={6}
                    fill={colors.fill}
                    stroke={focused ? tokens.primaryContainer : colors.stroke}
                    strokeWidth={focused ? 3 : 1.5}
                  />
                  <SvgText
                    x={point.cx}
                    y={point.cy + 4}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="600"
                    fill={tokens.primaryContainer}
                  >
                    {shortCode(team)}
                  </SvgText>
                </G>
              )
            })}
          </G>
        </Svg>
      </View>
      <Body>Drag to move · pinch or use the buttons to zoom · search to focus.</Body>
      <Button
        label={
          showAccessibleList ? 'Hide accessible team list' : 'Browse accessible team list'
        }
        variant="secondary"
        onPress={() => setShowAccessibleList((value) => !value)}
      />
      {showAccessibleList && (
        <ScrollView
          accessibilityLabel="All teams on the map"
          style={{ maxHeight: 320 }}
          contentContainerStyle={layout.stack}
          keyboardShouldPersistTaps="handled"
        >
          {sortedTeams.map((team) => (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              accessibilityLabel={`Select ${teamLabel(team)}`}
              onPress={() => selectTeam(team)}
              style={({ pressed }) => ({
                minHeight: 48,
                justifyContent: 'center',
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: focusedId === team.id ? tokens.secondary : tokens.border,
                borderRadius: 12,
                backgroundColor: pressed ? tokens.surfaceLow : tokens.surface,
              })}
            >
              <Text style={layout.text}>
                {teamLabel(team)} · {status(team.id)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
