import { Alert, Platform } from 'react-native';

// Alert.alert non fa nulla sul web: lì si usa window.alert.
function show(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert(title, message);
}

export const showError = (message: string) => show('Errore', message);
export const showInfo = (message: string) => show('Fatto', message);
