import { useLocalSearchParams } from 'expo-router';

import WritingRouteScreen from '../../features/writing/WritingRouteScreen';

export default function EverydayWritingRoute() {
  const { taskId } = useLocalSearchParams<{ taskId?: string | string[] }>();
  return <WritingRouteScreen pathway="everyday" initialTaskId={Array.isArray(taskId) ? taskId[0] : taskId} />;
}
