import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

const CATEGORIES = [
  { name: 'Food', icon: 'restaurant' as const, colorKey: 'food' as const },
  { name: 'Transport', icon: 'car' as const, colorKey: 'transport' as const },
  { name: 'Shopping', icon: 'cart' as const, colorKey: 'shopping' as const },
  { name: 'Bills', icon: 'receipt' as const, colorKey: 'bills' as const },
  { name: 'Health', icon: 'medical' as const, colorKey: 'health' as const },
  {
    name: 'Entertainment',
    icon: 'game-controller' as const,
    colorKey: 'entertainment' as const,
  },
  { name: 'Others', icon: 'ellipsis-horizontal' as const, colorKey: 'others' as const },
];

function formatDisplayDate(value: Date) {
  const weekday = value.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = value.getDate();
  const month = value.toLocaleDateString('en-GB', { month: 'short' });
  const year = value.getFullYear();
  return `${weekday}, ${day} ${month}, ${year}`;
}

export default function AddScreen() {
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const canSave = amount.trim().length > 0 && selectedCategory !== null;
  const isOthers = selectedCategory?.toLowerCase() === 'others';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 24,
          paddingBottom: 40,
          gap: 24,
        },
        amountRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
        },
        currency: {
          fontSize: 40,
          fontWeight: '600',
          color: colors.text,
          marginRight: 4,
        },
        amountInput: {
          flex: 1,
          fontSize: 40,
          fontWeight: '600',
          color: colors.text,
          paddingVertical: 8,
        },
        sectionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        categoryGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        },
        categoryButton: {
          width: '30%',
          flexGrow: 1,
          minWidth: 96,
          maxWidth: '32%',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 14,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: colors.surface,
        },
        categoryLabel: {
          fontSize: 12,
          fontWeight: '500',
          textAlign: 'center',
        },
        field: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: colors.border,
        },
        fieldText: {
          fontSize: 16,
          color: colors.text,
        },
        textInput: {
          fontSize: 16,
          color: colors.text,
        },
        noteInput: {
          fontSize: 16,
          color: colors.text,
          minHeight: 80,
          textAlignVertical: 'top',
        },
        saveButton: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 8,
        },
        saveButtonDisabled: {
          backgroundColor: colors.border,
          opacity: 0.7,
        },
        saveButtonText: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.primaryText,
        },
        saveButtonTextDisabled: {
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    if (!canSave || !selectedCategory) return;

    const customName = customCategoryName.trim();
    const category =
      isOthers && customName.length > 0 ? customName : selectedCategory;

    console.log({
      amount,
      category,
      date: date.toISOString(),
      note,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.amountRow}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          accessibilityLabel="Amount"
        />
      </View>

      <View>
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category.name;
            const categoryColor = colors[category.colorKey];
            return (
              <Pressable
                key={category.name}
                onPress={() => setSelectedCategory(category.name)}
                style={[
                  styles.categoryButton,
                  selected && { backgroundColor: categoryColor },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons
                  name={category.icon}
                  size={22}
                  color={selected ? colors.primaryText : categoryColor}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: selected ? colors.primaryText : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isOthers && (
          <View style={[styles.field, { marginTop: 12 }]}>
            <TextInput
              style={styles.textInput}
              value={customCategoryName}
              onChangeText={setCustomCategoryName}
              placeholder="Category name"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Custom category name"
            />
          </View>
        )}
      </View>

      <View>
        <Text style={styles.sectionLabel}>Date</Text>
        <Pressable
          style={styles.field}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel="Select date"
        >
          <Text style={styles.fieldText}>{formatDisplayDate(date)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <Pressable
            onPress={() => setShowDatePicker(false)}
            style={{ alignSelf: 'flex-end', marginTop: 8 }}
            accessibilityRole="button"
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Done</Text>
          </Pressable>
        )}
      </View>

      <View>
        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            placeholderTextColor={colors.textSecondary}
            multiline
            accessibilityLabel="Notes"
          />
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
      >
        <Text
          style={[
            styles.saveButtonText,
            !canSave && styles.saveButtonTextDisabled,
          ]}
        >
          Save
        </Text>
      </Pressable>
    </ScrollView>
  );
}
