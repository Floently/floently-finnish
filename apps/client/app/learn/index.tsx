import { Platform } from 'react-native';
import AppShell from '../../state/AppShell';
import { LEARN_ORIGIN } from '../../state/learnRouting';

export default function LearningRouteEntry() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const suffix = `${window.location.search}${window.location.hash}`;
      window.location.replace(`${LEARN_ORIGIN}/${suffix}`);
      return null;
    }
    return null;
  }

  return <AppShell requestedScreen="learning" />;
}
