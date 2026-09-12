import AuthScreen from '../features/auth/screens/AuthScreen';

export default function LearnLoginRoute() {
  return <AuthScreen initialTab="signin" afterAuthPath="/learn" productLabel="Floently Learn" />;
}
