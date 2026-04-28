import React from 'react'; import { Text } from 'react-native'; import ContentCard from './ContentCard';
export default function ReadingPassageCard({ text }: { text: string }) { return <ContentCard>{text}</ContentCard>; }
