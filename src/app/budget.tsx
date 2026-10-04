import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDb } from '../db/database';
import { useTheme } from '../theme/ThemeContext';

const CATEGORY_META: Record<string, { colorKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
  food: { colorKey: 'food', icon: 'restaurant' },
  transport: { colorKey: 'transport', icon: 'car' },
  shopping: { colorKey: 'shopping', icon: 'cart' },
  bills: { colorKey: 'bills', icon: 'receipt' },
  health: { colorKey: 'health', icon: 'medical' },
  entertainment: { colorKey: 'entertainment', icon: 'game-controller' },
  others: { colorKey: 'others', icon: 'ellipsis-horizontal' },
};

const CATEGORY_NAMES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Others'];

function formatAmount(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type BudgetRow = { id: string; category: string; monthlyLimit: number };
type ExpenseRow = { category: string; amount: number };

export default function BudgetScreen() {
  const { colors } = useTheme();
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [spent, setSpent] = useState<Record<string, number>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const db = getDb();
          const budgetRows = await db.getAllAsync<BudgetRow>('SELECT id, category, monthlyLimit FROM budgets');
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const expenseRows = await db.getAllAsync<ExpenseRow>(
            'SELECT category, amount FROM expenses WHERE date >= ? AND date < ?',
            start.toISOString(),
            end.toISOString()
          );

          if (cancelled) return;

          const budgetMap: Record<string, number> = {};
          for (const row of budgetRows) budgetMap[row.category] = row.monthlyLimit;
          setBudgets(budgetMap);

          const spentMap: Record<string, number> = {};
          for (const row of expenseRows) {
            const cat = row.category || 'Others';
            spentMap[cat] = (spentMap[cat] ?? 0) + (Number(row.amount) || 0);
          }
          setSpent(spentMap);
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

  const openEditor = (category: string) => {
    setEditingCategory(category);
    setEditValue(budgets[category] ? String(budgets[category]) : '');
  };

  const saveBudget = async () => {
    if (!editingCategory) return;
    const value = Number(editValue);
    if (!value || value <= 0) {
      setEditingCategory(null);
      return;
    }
    try {
      const db = getDb();
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM budgets WHERE category = ?',
        editingCategory
      );
      if (existing) {
        await db.runAsync('UPDATE budgets SET monthlyLimit = ? WHERE id = ?', value, existing.id);
      } else {
        await db.runAsync(
          'INSERT INTO budgets (id, category, monthlyLimit) VALUES (?, ?, ?)',
          `${editingCategory}-${Date.now()}`,
          editingCategory,
          value
        );
      }
      setBudgets((prev) => ({ ...prev, [editingCategory]: value }));
    } catch (error) {
      console.log(error);
    } finally {
      setEditingCategory(null);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, paddingTop: 40, gap: 16, paddingBottom: 40 },
        header: { fontSize: 26, fontWeight: '700', color: colors.text },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
        cardBody: { flex: 1 },
        cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
        categoryName: { fontSize: 16, fontWeight: '600', color: colors.text },
        amountText: { fontSize: 13, color: colors.textSecondary },
        barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
        barFill: { height: 8, borderRadius: 4 },
        noBudgetText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
        modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 14 },
        modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
        modalInput: {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: colors.text,
          fontSize: 16,
        },
        modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
        modalButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
        modalButtonPrimary: { backgroundColor: colors.primary },
        modalButtonSecondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
        modalButtonTextPrimary: { color: colors.primaryText, fontWeight: '600' },
        modalButtonTextSecondary: { color: colors.text, fontWeight: '600' },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Budget & Goals</Text>

        {CATEGORY_NAMES.map((category) => {
          const meta = CATEGORY_META[category.toLowerCase()];
          const color = colors[meta.colorKey as keyof typeof colors] as string;
          const limit = budgets[category];
          const used = spent[category] ?? 0;
          const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

          return (
            <Pressable key={category} style={styles.card} onPress={() => openEditor(category)}>
              <View style={[styles.iconCircle, { backgroundColor: color + '33' }]}>
                <Ionicons name={meta.icon} size={20} color={color} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.categoryName}>{category}</Text>
                  {limit ? (
                    <Text style={styles.amountText}>
                      ₹{formatAmount(used)} / ₹{formatAmount(limit)}
                    </Text>
                  ) : null}
                </View>
                {limit ? (
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: pct >= 100 ? colors.danger : color },
                      ]}
                    />
                  </View>
                ) : (
                  <Text style={styles.noBudgetText}>Tap to set a monthly budget</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={!!editingCategory} transparent animationType="fade" onRequestClose={() => setEditingCategory(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingCategory(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editingCategory} monthly budget</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              placeholderTextColor={colors.textSecondary}
              value={editValue}
              onChangeText={setEditValue}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditingCategory(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={saveBudget}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}