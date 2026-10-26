import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Piccole preferenze locali (es. gruppo attivo). Mai usare per dati importanti.
export async function getPref(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setPref(key: string, value: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } else if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // preferenza non salvata: si riparte dal primo gruppo
  }
}
