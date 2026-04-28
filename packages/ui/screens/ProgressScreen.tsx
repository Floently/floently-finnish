import React from 'react';
import { Text, View } from 'react-native';
import AppScaffold from '../components/AppScaffold';
import PageHeader from '../components/PageHeader';
import SectionCard from '../components/SectionCard';

export default function ProgressScreen() {
  return (
    <AppScaffold>
      <PageHeader title="Progress" subtitle="See retention, confidence, mastery, and next best actions." />
      <SectionCard>
        <Text>Progress should explain what improved and what needs attention next.</Text>
      </SectionCard>
    </AppScaffold>
  );
}
