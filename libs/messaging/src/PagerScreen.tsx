import { createPageAttempt } from './page-attempt';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@fgc/auth';
import { pagerPresets, type Page, type PageSource, type Team } from '@fgc/contracts';
import { Badge, Body, Button, Card, Field, Heading, Loading, Notice, Screen, layout } from '@fgc/ui';

export function PagerScreen({ source, initialTeamId, onBack }: { source: PageSource; initialTeamId?: string; onBack: () => void }) {
  const { api } = useAuth(); const [teams, setTeams] = useState<Team[]>([]); const [pages, setPages] = useState<Page[]>([]);
  const [teamId, setTeam] = useState(initialTeamId ?? ''); const [search, setSearch] = useState(''); const [message, setMessage] = useState(''); const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false); const attemptRef = useRef<ReturnType<typeof createPageAttempt> | null>(null); const [sent, setSent] = useState(false);
  const load = async () => { try { const [all, history] = await Promise.all([api.list<Team>('/teams'), api.list<Page>(`/pages?sourceArea=${source}`)]); setTeams(all); setPages(history); } catch (e) { setError((e as Error).message); } finally { setLoaded(true); } };
  useEffect(() => { void load(); }, [api, source]);
  const edit = (fn: () => void) => { fn(); attemptRef.current = null; setSent(false); };
  const submit = async () => {
    setBusy(true); setError(''); const attempt = attemptRef.current ?? createPageAttempt({ teamId, source, message, minutes }, api.newKey()); attemptRef.current = attempt;
    try { await api.command('/pages', attempt.body, { key: attempt.key }); setMessage(''); attemptRef.current = null; setSent(true); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <Screen><Button label="Back" variant="secondary" onPress={onBack} /><Heading>Team pager</Heading><Body>Send a message to one team. Saving a message does not confirm delivery to a device.</Body>{error && <Notice text={error} error />}{sent && <Notice text="Message recorded. Check the history for the team's response." />}
    <Card title="New message"><Field label="Find a team" value={search} onChangeText={setSearch} />
      <View style={layout.row}>{teams.filter(t => `${t.officialId} ${t.name}`.toLowerCase().includes(search.toLowerCase())).slice(0, 25).map(t => <Button key={t.id} label={`${t.officialId} · ${t.name}`} variant={teamId === t.id ? 'primary' : 'secondary'} onPress={() => edit(() => setTeam(t.id))} />)}</View>
      <View style={layout.stack}>{pagerPresets[source].map(preset => <Button key={preset} label={preset} variant="secondary" onPress={() => edit(() => setMessage(preset))} />)}</View>
      <Field label="Message (500 characters maximum)" multiline maxLength={500} value={message} onChangeText={v => edit(() => setMessage(v))} />
      <View style={layout.row}>{[0, source === 'judges' ? 15 : 10, 30, 60].map(offset => <Button key={offset} label={offset ? `In ${offset} min` : 'Send now'} variant={minutes === offset ? 'primary' : 'secondary'} onPress={() => edit(() => setMinutes(offset))} />)}</View>
      <Button label={busy ? 'Sending…' : 'Send message'} disabled={busy || !teamId || !message.trim()} onPress={() => void submit()} />
    </Card><Heading>Message history</Heading><Button label="Refresh messages" variant="secondary" onPress={() => void load()} />{!loaded ? <Loading /> : !pages.length ? <Notice text="No messages yet." /> : pages.map(page => <Card key={page.id} title={teams.find(t => t.id === page.teamId)?.name ?? 'Team'}><Body>{page.message}</Body><Badge label={page.response ?? (page.scheduledFor && Date.parse(page.scheduledFor) > Date.now() ? 'Scheduled' : 'Awaiting response')} /><Body>{page.response ? `Responded ${new Date(page.respondedAt ?? page.createdAt).toLocaleString()}` : `Available ${new Date(page.scheduledFor ?? page.createdAt).toLocaleString()}`}</Body></Card>)}
  </Screen>;
}
