import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import { ReadReaderScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadAppRoute() {
  return (
    <ReadProtectedRoute>
      <ReadReaderScreen />
    </ReadProtectedRoute>
  );
}
