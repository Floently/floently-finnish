import CreateProtectedRoute from '../../features/create/mobile/CreateProtectedRoute';
import CreateComingSoonScreen from '../../features/create/mobile/CreateComingSoonScreen';

export default function CreateStudioRoute() {
  return (
    <CreateProtectedRoute>
      <CreateComingSoonScreen />
    </CreateProtectedRoute>
  );
}
