import React from 'react';
import { Text, View } from 'react-native';


export default function CertificateScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Certificate</Text>
      <Text style={{ marginTop: 12, textAlign: 'center' }}>
        Certificate rendering is not available in this local build.
      </Text>
    </View>
  );
}
