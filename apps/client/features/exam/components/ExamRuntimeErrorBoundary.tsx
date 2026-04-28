import React from 'react';
import { Text, View } from 'react-native';
export default function ExamRuntimeErrorBoundary({ message = 'Kokeen näkymä epäonnistui.' }: { message?: string }) { return <View><Text>{message}</Text></View>; }
