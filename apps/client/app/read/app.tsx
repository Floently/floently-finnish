import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadHomeScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadAppRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadHomeScreen />
    </ReadProtectedRoute>
  );
}
