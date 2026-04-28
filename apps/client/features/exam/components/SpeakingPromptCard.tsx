import React from 'react'; import { Text } from 'react-native'; import ContentCard from './ContentCard';
export default function SpeakingPromptCard({ prompt }: { prompt: string }) { return <ContentCard>{prompt}</ContentCard>; }
