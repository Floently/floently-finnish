import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import ReadLiveBrowserScreen from '../../features/read/mobile/ReadLiveBrowserScreen';

export default function ReadBrowserRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadLiveBrowserScreen />
    </ReadProtectedRoute>
  );
}
