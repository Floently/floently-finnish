import { useState } from 'react';

import {
  NativeFloentlyProductGatewayScreen,
  NativeLandingScreen,
  NativeReadPreviewScreen,
} from '../features/publicMarketing/screens/NativePublicMarketingScreens';

type LandingRouteProps = {
  onOpenAuth?: () => void;
};

type PublicProductSurface = 'gateway' | 'learn' | 'read';

export default function LandingRoute(_props: LandingRouteProps) {
  const [surface, setSurface] = useState<PublicProductSurface>('gateway');

  if (surface === 'learn') {
    return <NativeLandingScreen />;
  }

  if (surface === 'read') {
    return (
      <NativeReadPreviewScreen
        onOpenGateway={() => setSurface('gateway')}
        onOpenLearn={() => setSurface('learn')}
      />
    );
  }

  return (
    <NativeFloentlyProductGatewayScreen
      onOpenLearn={() => setSurface('learn')}
      onOpenRead={() => setSurface('read')}
    />
  );
}
