import { Redirect, useLocalSearchParams } from 'expo-router';

export default function OpenInReadRoute() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;

  return <Redirect href={{ pathname: '/read', params: url ? { url } : {} }} />;
}
