import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { getSetting } from '@/db/database';
import { ThemeMode, useTheme } from '@/theme/ThemeContext';

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const [name, setName] = useState('Your Name');
  const [avatar, setAvatar] = useState('');
  const [themeModal, setThemeModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setName(await getSetting('user_name', 'Your Name'));
        setAvatar(await getSetting('avatar_uri', ''));
      })();
    }, [])
  );

  const themeLabel = THEME_OPTIONS.find((o) => o.value === mode)?.label ?? 'System';

  const Row = ({ icon, label, value, onPress }: RowProps) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.text} />
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: BottomTabInset + 24 }}
    >
      <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: colors.surface }]}>
            <Ionicons name="person" size={40} color={colors.textSecondary} />
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      </View>

      <View>
        <Row icon="create-outline" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
        <Row icon="sunny-outline" label="Theme" value={themeLabel} onPress={() => setThemeModal(true)} />
        <Row icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/help-support')} />
        <Row icon="information-circle-outline" label="About" onPress={() => router.push('/about')} />
      </View>

      <Modal visible={themeModal} transparent animationType="fade" onRequestClose={() => setThemeModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setThemeModal(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Theme</Text>
            {THEME_OPTIONS.map((o) => (
              <TouchableOpacity
                key={o.value}
                style={styles.option}
                onPress={() => {
                  setMode(o.value);
                  setThemeModal(false);
                }}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{o.label}</Text>
                {mode === o.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '600', marginLeft: 16, flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1, fontSize: 16, marginLeft: 14 },
  rowValue: { fontSize: 15, marginRight: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  sheet: { borderRadius: 16, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  optionText: { fontSize: 16 },
});