import React from 'react';
import { Pressable, Text } from 'react-native';
export default function FlagButton({ onPress }: { onPress: () => void }) { return <Pressable onPress={onPress}><Text>Merkitse</Text></Pressable>; }
