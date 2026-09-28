import { router } from 'expo-router';

import { NativeFloentlyProductGatewayScreen } from '../features/publicMarketing/screens/NativePublicMarketingScreens';

export default function FloentlyProductsRoute() {
  return (
    <NativeFloentlyProductGatewayScreen
      onOpenLearn={() => router.push('/' as never)}
      onOpenRead={() => router.push('/read' as never)}
    />
  );
}
