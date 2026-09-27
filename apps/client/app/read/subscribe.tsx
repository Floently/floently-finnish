import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadSubscriptionScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadSubscribeRouteEntry() {
  return (
    <ReadProtectedRoute requireReadAccess={false}>
      <ReadSubscriptionScreen />
    </ReadProtectedRoute>
  );
}
