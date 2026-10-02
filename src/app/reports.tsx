import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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

const CATEGORY_META: Record<string, { colorKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
  food: { colorKey: 'food', icon: 'restaurant' },
  transport: { colorKey: 'transport', icon: 'car' },
  shopping: { colorKey: 'shopping', icon: 'cart' },
  bills: { colorKey: 'bills', icon: 'receipt' },
  health: { colorKey: 'health', icon: 'medical' },
  entertainment: { colorKey: 'entertainment', icon: 'game-controller' },
  others: { colorKey: 'others', icon: 'ellipsis-horizontal' },
};

function metaForCategory(name: string) {
  return CATEGORY_META[name.trim().toLowerCase()] ?? CATEGORY_META.others;
}

function formatAmount(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type MonthOption = { key: string; label: string; fullLabel: string; year: number; month: number };

function buildMonthOptions(): MonthOption[] {
  const now = new Date();
  const options: MonthOption[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return options;
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const monthOptions = useMemo(buildMonthOptions, []);
  const [selected, setSelected] = useState<string>(monthOptions[0].key);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  const isSixMonths = selected === 'six';
  const selectedOption = monthOptions.find((m) => m.key === selected);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          const db = getDb();
          let start: Date;
          let end: Date;

          if (isSixMonths) {
            const oldest = monthOptions[monthOptions.length - 1];
            const newest = monthOptions[0];
            start = new Date(oldest.year, oldest.month, 1);
            end = new Date(newest.year, newest.month + 1, 1);
          } else {
            const opt = monthOptions.find((m) => m.key === selected)!;
            start = new Date(opt.year, opt.month, 1);
            end = new Date(opt.year, opt.month + 1, 1);
          }

          const result = await db.getAllAsync<ExpenseRow>(
            'SELECT id, amount, category, note, date, merchant FROM expenses WHERE date >= ? AND date < ? ORDER BY date ASC',
            start.toISOString(),
            end.toISOString()
          );
          if (!cancelled) setRows(result);
        } catch (error) {
          console.log(error);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [selected])
  );

  const { total, chartLabels, chartValues, topCategories, caption } = useMemo(() => {
    let total = 0;
    const categoryTotals = new Map<string, number>();

    if (isSixMonths) {
      const monthTotals = new Map(monthOptions.map((m) => [m.key, 0]));
      for (const row of rows) {
        const amount = Number(row.amount) || 0;
        total += amount;
        const d = new Date(row.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthTotals.has(key)) {
          monthTotals.set(key, (monthTotals.get(key) ?? 0) + amount);
        }
        const cat = row.category || 'Others';
        categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + amount);
      }
      const ordered = [...monthOptions].reverse();
      return {
        total,
        chartLabels: ordered.map((m) => m.label),
        chartValues: ordered.map((m) => monthTotals.get(m.key) ?? 0),
        topCategories: Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]),
        caption: 'Total spending in ₹ per month',
      };
    } else {
      const opt = monthOptions.find((m) => m.key === selected)!;
      const daysInMonth = new Date(opt.year, opt.month + 1, 0).getDate();
      const dayTotals = new Array(daysInMonth).fill(0);

      for (const row of rows) {
        const amount = Number(row.amount) || 0;
        total += amount;
        const day = new Date(row.date).getDate();
        dayTotals[day - 1] += amount;
        const cat = row.category || 'Others';
        categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + amount);
      }

      const step = Math.max(1, Math.round(daysInMonth / 5));
      const labels = dayTotals.map((_, i) => (i % step === 0 ? String(i + 1) : ''));

      return {
        total,
        chartLabels: labels,
        chartValues: dayTotals,
        topCategories: Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]),
        caption: `Daily spending in ₹ for ${opt.label}`,
      };
    }
  }, [rows, selected]);

  const hasData = tab === 'expense' && chartValues.some((v) => v > 0);
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, paddingTop: 40, gap: 16, paddingBottom: 40 },
        header: { fontSize: 26, fontWeight: '700', color: colors.text },
        dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        dropdownButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        dropdownText: { color: colors.text, fontWeight: '600', fontSize: 14 },
        tabRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4, gap: 4 },
        tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
        tabActive: { backgroundColor: colors.primary },
        tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
        tabTextActive: { color: colors.primaryText },
        totalLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
        totalAmount: { marginTop: 4, fontSize: 32, fontWeight: '700', color: colors.text },
        chartCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, overflow: 'hidden' },
        emptyChart: { paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center' },
        emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
        caption: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 8 },
        sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
        categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
        iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
        categoryBody: { flex: 1 },
        categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
        categoryName: { fontSize: 15, fontWeight: '600', color: colors.text },
        categoryPct: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
        barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
        barFill: { height: 8, borderRadius: 4 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
        modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 8 },
        modalOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
        modalOptionActive: { backgroundColor: colors.primary },
        modalOptionText: { fontSize: 15, color: colors.text, fontWeight: '600' },
        modalOptionTextActive: { color: colors.primaryText },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.dropdownRow}>
          <Text style={styles.header}>Reports</Text>
          <Pressable style={styles.dropdownButton} onPress={() => setPickerOpen(true)}>
            <Text style={styles.dropdownText}>
              {isSixMonths ? 'Last 6 Months' : selectedOption?.fullLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          <Pressable style={[styles.tab, tab === 'expense' && styles.tabActive]} onPress={() => setTab('expense')}>
            <Text style={[styles.tabText, tab === 'expense' && styles.tabTextActive]}>Expense</Text>
          </Pressable>
          <Pressable style={[styles.tab, tab === 'income' && styles.tabActive]} onPress={() => setTab('income')}>
            <Text style={[styles.tabText, tab === 'income' && styles.tabTextActive]}>Income</Text>
          </Pressable>
        </View>

        {tab === 'expense' ? (
          <>
            <View>
              <Text style={styles.totalLabel}>Expense Trend</Text>
              <Text style={styles.totalAmount}>₹{formatAmount(total)}</Text>
            </View>

            <View style={styles.chartCard}>
              {hasData ? (
                <LineChart
                  data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
                  width={chartWidth}
                  height={200}
                  withDots={false}
                  withInnerLines={false}
                  chartConfig={{
                    color: () => colors.primary,
                    labelColor: () => colors.textSecondary,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    fillShadowGradientFrom: colors.primary,
                    fillShadowGradientTo: colors.surface,
                    fillShadowGradientOpacity: 0.15,
                    decimalPlaces: 0,
                    propsForBackgroundLines: { stroke: colors.border },
                  }}
                  bezier
                  style={{ marginVertical: 8 }}
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyText}>No data for this period</Text>
                </View>
              )}
            </View>
            <Text style={styles.caption}>{caption}</Text>

            <View>
              <Text style={styles.sectionLabel}>Top Categories</Text>
              {topCategories.length === 0 ? (
                <Text style={styles.emptyText}>No expenses yet</Text>
              ) : (
                topCategories.map(([name, amount]) => {
                  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                  const meta = metaForCategory(name);
                  const color = colors[meta.colorKey as keyof typeof colors];
                  return (
                    <View key={name} style={styles.categoryRow}>
                      <View style={[styles.iconCircle, { backgroundColor: color + '33' }]}>
                        <Ionicons name={meta.icon} size={18} color={color} />
                      </View>
                      <View style={styles.categoryBody}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>{name}</Text>
                          <Text style={styles.categoryPct}>{pct}%</Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No income recorded yet</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            {monthOptions.map((opt) => {
              const active = selected === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.modalOption, active && styles.modalOptionActive]}
                  onPress={() => {
                    setSelected(opt.key);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>{opt.fullLabel}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.modalOption, isSixMonths && styles.modalOptionActive]}
              onPress={() => {
                setSelected('six');
                setPickerOpen(false);
              }}
            >
              <Text style={[styles.modalOptionText, isSixMonths && styles.modalOptionTextActive]}>Last 6 Months</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}