import React from 'react';
import { Text, View, Button, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import AppScaffold from '../components/AppScaffold';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

export default function SettingsScreen() {
  // 🔹 State for selected image
  const [image, setImage] = React.useState<string | null>(null);

  // 🔹 Function to open gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <AppScaffold>
      <PageHeader
        title="Settings"
        subtitle="Personalization, goals, privacy, and accessibility."
      />

      <SectionCard>
        <Text>Settings should stay clear and low-friction.</Text>

        {/* 🔹 Button to trigger picker */}
        <Button title="Pick profile image" onPress={pickImage} />

        {/* 🔹 Preview selected image */}
        {image && (
          <Image
            source={{ uri: image }}
            style={{
              width: 120,
              height: 120,
              marginTop: 10,
              borderRadius: 60,
            }}
          />
        )}
      </SectionCard>
    </AppScaffold>
  );
}
