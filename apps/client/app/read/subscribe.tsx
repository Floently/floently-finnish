import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadSubscriptionScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadSubscribeRoute() {
  return (
    <ReadProtectedRoute>
      <ReadSubscriptionScreen />
    </ReadProtectedRoute>
  );
}
