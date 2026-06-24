import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadImportScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadImportRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadImportScreen />
    </ReadProtectedRoute>
  );
}
