import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function AddScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text }}>Add</Text>
    </View>
  );
}