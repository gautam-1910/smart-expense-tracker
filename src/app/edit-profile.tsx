import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { getSetting, setSetting } from '@/db/database';
import { useTheme } from '@/theme/ThemeContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pickedUri, setPickedUri] = useState('');

  useEffect(() => {
    (async () => {
      setName(await getSetting('user_name', ''));
      setAvatar(await getSetting('avatar_uri', ''));
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) {
      setPickedUri(res.assets[0].uri);
      setAvatar(res.assets[0].uri);
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    try {
      await setSetting('user_name', trimmed);
      if (pickedUri) {
        // copy to permanent storage; picker cache can be cleared by the OS
        const dest = new File(Paths.document, `avatar-${Date.now()}.jpg`);
        new File(pickedUri).copy(dest);
        await setSetting('avatar_uri', dest.uri);
      }
      router.back();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Edit Profile" />
      <View style={styles.body}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarEmpty, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
          <View style={[styles.camBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="camera" size={16} color={colors.primaryText} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={save}>
          <Text style={[styles.saveText, { color: colors.primaryText }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20 },
  avatarWrap: { alignSelf: 'center', marginVertical: 24 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  camBadge: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  saveBtn: { marginTop: 28, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '600' },
});