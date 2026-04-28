import React from 'react'; import { Text, View } from 'react-native';
export default function ScoreCard({ label, value }: { label: string; value: string | number }) { return <View><Text>{label}</Text><Text>{value}</Text></View>; }
