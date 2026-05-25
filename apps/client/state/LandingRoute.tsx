import { NativeLandingScreen } from '../features/publicMarketing/screens/NativePublicMarketingScreens';

type LandingRouteProps = {
  onOpenAuth?: () => void;
};

export default function LandingRoute(_props: LandingRouteProps) {
  return <NativeLandingScreen />;
}
