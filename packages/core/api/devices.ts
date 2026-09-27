import { apiClient } from './client';

export type ClientDevice = {
  device_id: string;
  platform: 'web' | 'android' | 'ios' | 'unknown' | string;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  current?: boolean;
};

export async function listClientDevices(): Promise<ClientDevice[]> {
  const res = await apiClient.get<{ devices: ClientDevice[] }>('/devices');
  if (!res.ok || !res.data) {
    throw new Error(res.error ?? 'Could not load devices.');
  }
  return res.data.devices ?? [];
}

export async function removeClientDevice(deviceId: string): Promise<boolean> {
  const res = await apiClient.delete<{ removed: boolean }>(`/devices/${encodeURIComponent(deviceId)}`);
  if (!res.ok || !res.data) {
    throw new Error(res.error ?? 'Could not remove device.');
  }
  return Boolean(res.data.removed);
}

export async function resetOtherClientDevices(): Promise<string[]> {
  const res = await apiClient.post<{ removed: string[] }>('/devices/reset', {});
  if (!res.ok || !res.data) {
    throw new Error(res.error ?? 'Could not reset devices.');
  }
  return res.data.removed ?? [];
}
