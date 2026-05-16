import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../../config/legalRoutes';

export default function LearnSupportRoute() {
  return <Redirect href={getCanonicalLegalPath('support') as never} />;
}
