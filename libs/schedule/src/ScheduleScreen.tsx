import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '@fgc/auth';
import { Button, Card, Heading, Notice, Screen } from '@fgc/ui';
export function ScheduleScreen() {
  const { api } = useAuth(); const [url, setUrl] = useState<string | null>(null); const [error, setError] = useState('');
  useEffect(() => { void api.get<{ url: string | null }>('/schedule').then(result => { if (result.url && !/^https:\/\//i.test(result.url)) throw new Error('The schedule link is unavailable.'); setUrl(result.url); }).catch(e => setError(e.message)); }, [api]);
  return <Screen><Heading>Official schedule</Heading><Card title="Competition schedule">{error ? <Notice text={error} error /> : url ? <Button label="Open official schedule" onPress={() => { void Linking.openURL(url).catch(() => setError('The link could not be opened.')); }} /> : <Notice text="Schedule coming soon" />}</Card></Screen>;
}
