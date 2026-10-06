import * as ImagePicker from 'expo-image-picker';
import { isSupported, recognizeText } from 'expo-mlkit-ocr';

export async function scanReceipt(source: 'camera' | 'gallery') {
  if (!isSupported()) throw new Error('OCR is not supported on this device');

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission denied');
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  }

  if (result.canceled || !result.assets[0]) return null;
  return recognizeText(result.assets[0].uri);
}