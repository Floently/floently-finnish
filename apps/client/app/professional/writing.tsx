import { useLocalSearchParams } from 'expo-router';

import WritingRouteScreen from '../../features/writing/WritingRouteScreen';

export default function ProfessionalWritingRoute() {
  const { taskId } = useLocalSearchParams<{ taskId?: string | string[] }>();
  return <WritingRouteScreen pathway="professional" initialTaskId={Array.isArray(taskId) ? taskId[0] : taskId} />;
}
