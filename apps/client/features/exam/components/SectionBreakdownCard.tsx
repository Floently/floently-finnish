import React from 'react'; import { Text, View } from 'react-native';
export default function SectionBreakdownCard({ items }: { items: Array<{ label: string; value: string | number }> }) { return <View>{items.map((i) => <Text key={i.label}>{i.label}: {i.value}</Text>)}</View>; }
