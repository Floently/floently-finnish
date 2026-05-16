import { Redirect } from 'expo-router';
import { getCanonicalLegalPath } from '../config/legalRoutes';

export default function DeleteAccountRoute() {
  return <Redirect href={getCanonicalLegalPath('account-deletion') as never} />;
}
