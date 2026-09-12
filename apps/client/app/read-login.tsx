import AuthScreen from '../features/auth/screens/AuthScreen';

export default function ReadLoginRoute() {
  return <AuthScreen initialTab="signin" afterAuthPath="/read" productLabel="Floently Read" />;
}
