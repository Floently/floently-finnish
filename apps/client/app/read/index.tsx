import { router } from 'expo-router';

import { NativeReadPreviewScreen } from '../../features/publicMarketing/screens/NativePublicMarketingScreens';

export default function ReadRouteEntry() {
  return (
    <NativeReadPreviewScreen
      onOpenGateway={() => router.push('/products' as never)}
      onOpenLearn={() => router.push('/' as never)}
    />
  );
}
