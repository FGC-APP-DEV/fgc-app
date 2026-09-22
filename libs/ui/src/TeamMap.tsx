import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Body, Button, Field, layout, tokens } from './operations';

interface MapTeam { id: string; name: string; officialId: string; pitX?: number | null; pitY?: number | null }
export function TeamMap({ teams, status, onSelect }: { teams: MapTeam[]; status: (id: string) => string; onSelect: (id: string) => void }) {
  const [zoom, setZoom] = useState(1); const [search, setSearch] = useState('');
  const perBlock = Math.ceil(teams.length / 3); const height = Math.max(320, 120 + Math.ceil(perBlock / 5) * 60);
  const selected = teams.find(t => `${t.officialId} ${t.name}`.toLowerCase().includes(search.toLowerCase()));
  return <View style={layout.stack}><Body>Map shows every team, including teams hidden by list filters. Locations use the alphabetical fallback when pit coordinates are unavailable.</Body>
    <Field label="Find a team on the map" value={search} onChangeText={setSearch} /><View style={layout.row}><Button label="Zoom in" variant="secondary" onPress={() => setZoom(z => Math.min(3, z + 0.25))} /><Button label="Zoom out" variant="secondary" onPress={() => setZoom(z => Math.max(0.5, z - 0.25))} />{search && selected && <Button label={`Open ${selected.name}`} onPress={() => onSelect(selected.id)} />}</View>
    <ScrollView horizontal style={{ maxHeight: 420 }}><ScrollView nestedScrollEnabled><Svg width={1200 * zoom} height={height * zoom} viewBox={`0 0 1200 ${height}`}>
      <Rect width="1200" height={height} fill={tokens.background} /><SvgText x="40" y="40" fill={tokens.primaryContainer} fontSize="22">TEAM PITS</SvgText>
      {teams.map((team, index) => { const block = Math.min(2, Math.floor(index / Math.max(1, perBlock))); const within = index - block * perBlock; const x = 40 + (team.pitX ?? (block * 5.7 + within % 5)) * 68; const y = 90 + (team.pitY ?? Math.floor(within / 5)) * 60; const state = status(team.id); const fill = state === 'captured' ? '#DCFCE7' : state === 'skipped' ? tokens.surfaceLow : '#FEF3C7'; return <React.Fragment key={team.id}><Rect x={x} y={y} width="60" height="48" rx="8" fill={fill} stroke={search && selected?.id === team.id ? tokens.secondary : tokens.border} strokeWidth="2" onPress={() => onSelect(team.id)} accessibilityLabel={`${team.name}, ${state}`} /><SvgText x={x + 30} y={y + 28} textAnchor="middle" fill={tokens.primaryContainer} fontSize="12" onPress={() => onSelect(team.id)}>{team.officialId.slice(0, 8)}</SvgText></React.Fragment>; })}
    </Svg></ScrollView></ScrollView>
  </View>;
}
