import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <TouchableOpacity onPress={() => router.navigate('/profile')} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 8 }}>{title}</Text>
    </View>
  );
}