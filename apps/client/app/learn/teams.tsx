import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../../config/legalRoutes';

export default function LearnTeamsRoute() {
  return <Redirect href={getCanonicalLegalPath('terms-of-use') as never} />;
}
