import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadLibraryScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadLibraryRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadLibraryScreen />
    </ReadProtectedRoute>
  );
}
