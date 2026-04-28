import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = '@floently/yki-exam-runtime';
export async function saveRuntimeSession(payload: unknown) { await AsyncStorage.setItem(KEY, JSON.stringify(payload)); }
export async function loadRuntimeSession<T>() { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) as T : null; }
export async function clearRuntimeSession() { await AsyncStorage.removeItem(KEY); }
