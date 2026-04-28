import React from 'react'; import { Text } from 'react-native';
export default function WordCounter({ value }: { value: string }) { return <Text>{value.trim() ? value.trim().split(/\s+/).length : 0} sanaa</Text>; }
