import { router } from 'expo-router';

import { NativeReadPreviewScreen } from '../../features/publicMarketing/screens/NativePublicMarketingScreens';

export default function ReadLandingRoute() {
  return (
    <NativeReadPreviewScreen
      onOpenGateway={() => router.push('/' as never)}
      onOpenLearn={() => router.push('/' as never)}
    />
  );
}
