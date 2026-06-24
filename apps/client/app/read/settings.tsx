import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadSettingsScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadSettingsRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadSettingsScreen />
    </ReadProtectedRoute>
  );
}
