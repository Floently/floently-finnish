import { router } from 'expo-router';
import LandingRoute from '../state/LandingRoute';

export default function LearnHomeRoute() {
  return <LandingRoute onOpenAuth={() => router.push('/learn-login' as never)} />;
}
