import { useEffect, useState } from 'react';

import { getAuthToken } from '@core/api/apiClient';
import ReadAuthScreen from '../../features/read/mobile/ReadAuthScreen';
import { ReadHomeScreen } from '../../features/read/mobile/ReadMobileScreens';

export default function ReadAppRoute() {
  const [hasToken, setHasToken] = useState(() => Boolean(getAuthToken()));

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()));
  }, []);

  if (!hasToken) {
    return <ReadAuthScreen />;
  }

  return <ReadHomeScreen />;
}
