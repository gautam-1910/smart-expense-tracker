import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDb } from '../db/database';
import { useTheme } from '../theme/ThemeContext';

type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  merchant: string | null;
};

const CATEGORIES = ['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Others'];

const CATEGORY_COLOR_KEYS: Record<string, string> = {
  food: 'food',
  transport: 'transport',
  shopping: 'shopping',
  bills: 'bills',
  health: 'health',
  entertainment: 'entertainment',
  others: 'others',
};

function colorForCategory(name: string, colors: any) {
  const key = CATEGORY_COLOR_KEYS[name.trim().toLowerCase()];
  return colors[key ?? 'others'];
}

function formatRelativeDate(iso: string) {
  const value = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startValue = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const diffDays = Math.round((startToday.getTime() - startValue.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const [allExpenses, setAllExpenses] = useState<ExpenseRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const db = getDb();
          const rows = await db.getAllAsync<ExpenseRow>(
            'SELECT id, amount, category, note, date, merchant FROM expenses ORDER BY date DESC'
          );
          if (!cancelled) setAllExpenses(rows);
        } catch (error) {
          console.log(error);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allExpenses.filter((item) => {
      const matchesCategory =
        activeCategory === 'All' || item.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        item.category.toLowerCase().includes(query) ||
        (item.note ?? '').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allExpenses, search, activeCategory]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, gap: 16 },
        searchInput: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: colors.text,
          fontSize: 15,
        },
        chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        chip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
        chipTextActive: { color: colors.primaryText },
        dateHeader: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 12,
          marginBottom: 6,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 8,
        },
        rowLeft: { flex: 1 },
        rowCategory: { fontSize: 16, fontWeight: '600', color: colors.text },
        rowNote: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
        rowAmount: { fontSize: 16, fontWeight: '600', color: colors.text },
        emptyText: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 40,
        },
      }),
    [colors]
  );

  const grouped = useMemo(() => {
    const sections: { label: string; items: ExpenseRow[] }[] = [];
    const map = new Map<string, ExpenseRow[]>();
    for (const item of filtered) {
      const label = formatRelativeDate(item.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(item);
    }
    for (const [label, items] of map.entries()) {
      sections.push({ label, items });
    }
    return sections;
  }, [filtered]);

  return (
    <View style={styles.container}>
      <FlatList
        data={grouped}
        keyExtractor={(section) => section.label}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <TextInput
              placeholder="Search by category or note"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <View style={styles.chipsRow}>
              {CATEGORIES.map((category) => {
                const selected = activeCategory === category;
                const bg =
                  category === 'All'
                    ? colors.primary
                    : colorForCategory(category, colors);
                return (
                  <Pressable
                    key={category}
                    onPress={() => setActiveCategory(category)}
                    style={[styles.chip, selected && { backgroundColor: bg, borderColor: bg }]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.dateHeader}>{section.label}</Text>
            {section.items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowCategory}>{item.category}</Text>
                  {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
                </View>
                <Text style={styles.rowAmount}>₹{formatAmount(Number(item.amount) || 0)}</Text>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions found</Text>}
      />
    </View>
  );
}