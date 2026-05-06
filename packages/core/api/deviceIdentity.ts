import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'floently.client.device_id.v1';

let memoryDeviceId: string | null = null;

function randomId(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;
  if (cryptoRef?.randomUUID) {
    return `dev_${cryptoRef.randomUUID()}`;
  }

  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

async function readStoredDeviceId(): Promise<string | null> {
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    const value = local ? local.getItem(DEVICE_ID_KEY) : await AsyncStorage.getItem(DEVICE_ID_KEY);
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  } catch {
    return memoryDeviceId;
  }
}

async function writeStoredDeviceId(deviceId: string): Promise<void> {
  memoryDeviceId = deviceId;
  try {
    const local = (globalThis as { localStorage?: Storage }).localStorage;
    if (local) {
      local.setItem(DEVICE_ID_KEY, deviceId);
      return;
    }
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch {
    memoryDeviceId = deviceId;
  }
}

export async function getOrCreateClientDeviceId(): Promise<string> {
  const existing = memoryDeviceId ?? await readStoredDeviceId();
  if (existing) {
    memoryDeviceId = existing;
    return existing;
  }

  const created = randomId();
  await writeStoredDeviceId(created);
  return created;
}

export function getClientPlatform(): string {
  return Platform.OS || 'unknown';
}

export async function getClientDeviceHeaders(): Promise<Record<string, string>> {
  const deviceId = await getOrCreateClientDeviceId();
  return {
    'X-Floently-Device-Id': deviceId,
    'X-Floently-Client-Platform': getClientPlatform(),
  };
}
