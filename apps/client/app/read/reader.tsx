import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadReaderScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadReaderRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadReaderScreen />
    </ReadProtectedRoute>
  );
}
