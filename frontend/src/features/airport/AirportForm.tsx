import {useState} from 'react';
import {Button, Group, Stack, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import type {CreateAirportRequest, Airport} from './types';
import {createAirport} from './api';

type Props = {
  onCreated?: (airport: Airport) => void;
};

export default function AirportForm({onCreated}: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateAirportRequest = {name: name.trim(), code: code.trim().toUpperCase()};
    if (!payload.name) {
      notifications.show({color: 'red', title: 'Missing fields', message: 'Name required'});
      return;
    }
try {
      setSubmitting(true);
      const created = await createAirport(payload);
      notifications.show({color: 'green', title: 'Airport added', message: `${created.name} has been added`});
      setName('');
      setCode('');
      onCreated?.(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create airport';
      notifications.show({color: 'red', title: 'Error', message});
    } finally {
      setSubmitting(false);
    }
  }
    return (
    <form onSubmit={handleSubmit}>
        <Stack gap="sm">
        <TextInput
            label="Name"
            placeholder="Kristianstad Österlen Airport"
            withAsterisk
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
            label="ICAO Code"
            placeholder="ESMK"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
        />
        <Group position="right" mt="md">
            <Button type="submit" loading={submitting}>
            Add Airport
            </Button>
        </Group>
        </Stack>
    </form>
    );
}
