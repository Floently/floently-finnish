import ReadProtectedRoute from '../../features/read/mobile/ReadProtectedRoute';
import ReadWebWorkspaceScreen from '../../features/read/mobile/ReadWebWorkspaceScreen';

export default function ReadWorkspaceRouteEntry() {
  return (
    <ReadProtectedRoute>
      <ReadWebWorkspaceScreen />
    </ReadProtectedRoute>
  );
}
