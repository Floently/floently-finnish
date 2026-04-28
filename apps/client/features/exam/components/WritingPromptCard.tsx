import React from 'react'; import { Text } from 'react-native'; import ContentCard from './ContentCard';
export default function WritingPromptCard({ prompt }: { prompt: string }) { return <ContentCard>{prompt}</ContentCard>; }
