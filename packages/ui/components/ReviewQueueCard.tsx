import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Item = { prompt: string; bucket: string; repairAction: string };

type Props = { items: Item[] };

export default function ReviewQueueCard({ items }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Review queue</Text>
      {items.map((item) => (
        <View key={`${item.prompt}-${item.bucket}`} style={styles.item}>
          <Text style={styles.prompt}>{item.prompt}</Text>
          <Text style={styles.bucket}>{item.bucket.toUpperCase()}</Text>
          <Text style={styles.repair}>{item.repairAction}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "white", borderRadius: 18, padding: 16, gap: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  item: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  prompt: { fontSize: 14, fontWeight: "600", color: "#111827" },
  bucket: { fontSize: 11, fontWeight: "700", color: "#7C3AED" },
  repair: { fontSize: 13, lineHeight: 18, color: "#4B5563" },
});
