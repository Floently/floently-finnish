import React from 'react'; import { Text } from 'react-native';
export default function QuestionNavigator({ current, total }: { current: number; total: number }) { return <Text>{current}/{total}</Text>; }
