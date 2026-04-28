import { Platform } from 'react-native';
import AppShell from '../../state/AppShell';

export default function LearningRouteEntry() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const suffix = `${window.location.search}${window.location.hash}`;
      window.location.replace(`https://learn.floently.com/${suffix}`);
      return null;
    }
    return null;
  }

  return <AppShell requestedScreen="learning" />;
}
