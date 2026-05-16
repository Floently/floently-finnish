import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../config/legalRoutes';

export default function TermsRoute() {
  return <Redirect href={getCanonicalLegalPath('terms-of-use') as never} />;
}
