import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text }}>Profile</Text>
    </View>
  );
}