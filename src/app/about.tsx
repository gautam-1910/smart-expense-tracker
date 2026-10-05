import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { useTheme } from '@/theme/ThemeContext';

export default function AboutScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="About" />
      <View style={styles.body}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="wallet" size={40} color={colors.primaryText} />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Smart Expense Tracker</Text>
        <Text style={[styles.ver, { color: colors.textSecondary }]}>
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          A personal expense tracker built with React Native, Expo and SQLite. All data stays on your device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', padding: 32, paddingTop: 40 },
  logo: { width: 84, height: 84, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 22, fontWeight: '700' },
  ver: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  desc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});