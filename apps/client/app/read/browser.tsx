import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import ReadDeviceBrowserScreen from '../../features/read/mobile/ReadDeviceBrowserScreen';

export default function ReadBrowserRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadDeviceBrowserScreen />
    </ReadProtectedRoute>
  );
}
