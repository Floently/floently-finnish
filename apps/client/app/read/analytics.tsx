import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadAnalyticsScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadAnalyticsRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadAnalyticsScreen />
    </ReadProtectedRoute>
  );
}
