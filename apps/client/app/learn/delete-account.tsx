import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../../config/legalRoutes';

export default function LearnDeleteAccountRoute() {
  return <Redirect href={getCanonicalLegalPath('account-deletion') as never} />;
}
