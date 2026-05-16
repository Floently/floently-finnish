import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../config/legalRoutes';

export default function PrivacyRoute() {
  return <Redirect href={getCanonicalLegalPath('privacy-policy') as never} />;
}
