import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { useTheme } from '@/theme/ThemeContext';

const FAQS = [
  { q: 'How do I add an expense?', a: 'Open the Add tab, enter the amount, pick a category and date, then tap Save.' },
  { q: 'How do I set a budget?', a: 'Open Budget & Goals and tap a category to set its monthly limit.' },
  { q: 'Where is my data stored?', a: 'Everything is stored locally on this device. Nothing is uploaded.' },
  { q: 'How do I change the theme?', a: 'Go to Profile → Theme and choose Light, Dark or System.' },
];

export default function HelpSupportScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Help & Support" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {FAQS.map((f) => (
          <View key={f.q} style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.q, { color: colors.text }]}>{f.q}</Text>
            <Text style={[styles.a, { color: colors.textSecondary }]}>{f.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  q: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  a: { fontSize: 14, lineHeight: 20 },
});