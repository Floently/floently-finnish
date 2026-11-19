import { Platform } from 'react-native';
import KieliValmisLandingScreen from '../../features/kielivalmis/KieliValmisLandingScreen';
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

  return <KieliValmisLandingScreen />;
}
