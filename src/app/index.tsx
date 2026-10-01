import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

import { getDb } from '../db/database';
import { type Theme } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  merchant: string | null;
};

type PieSlice = {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

const CATEGORY_COLOR_KEYS: Record<string, keyof Theme> = {
  food: 'food',
  transport: 'transport',
  shopping: 'shopping',
  bills: 'bills',
  health: 'health',
  entertainment: 'entertainment',
  others: 'others',
};

function colorForCategory(name: string, colors: Theme) {
  const key = CATEGORY_COLOR_KEYS[name.trim().toLowerCase()];
  return colors[key ?? 'others'];
}

function monthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function formatRelativeDate(iso: string) {
  const value = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startValue = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startValue.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [monthTotal, setMonthTotal] = useState(0);
  const [pieData, setPieData] = useState<PieSlice[]>([]);
  const [recent, setRecent] = useState<ExpenseRow[]>([]);

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadDashboard() {
        try {
          const db = getDb();
          const { start, end } = monthBounds();

          const monthRows = await db.getAllAsync<ExpenseRow>(
            'SELECT id, amount, category, note, date, merchant FROM expenses WHERE date >= ? AND date < ?',
            start.toISOString(),
            end.toISOString(),
          );

          const recentRows = await db.getAllAsync<ExpenseRow>(
            'SELECT id, amount, category, note, date, merchant FROM expenses ORDER BY date DESC LIMIT 5',
          );

          const totals = new Map<string, number>();
          let total = 0;
          for (const row of monthRows) {
            const amount = Number(row.amount) || 0;
            total += amount;
            const category = row.category || 'Others';
            totals.set(category, (totals.get(category) ?? 0) + amount);
          }

          const slices: PieSlice[] = Array.from(totals.entries())
            .filter(([, amount]) => amount > 0)
            .map(([name, amount]) => ({
              name,
              amount,
              color: colorForCategory(name, colors),
              legendFontColor: colors.text,
              legendFontSize: 12,
            }));

          if (!cancelled) {
            setMonthTotal(total);
            setPieData(slices);
            setRecent(recentRows);
          }
        } catch (error) {
          console.log(error);
        }
      }

      void loadDashboard();

      return () => {
        cancelled = true;
      };
    }, [colors]),
  );

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
        greeting: {
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
        },
        totalCard: {
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingVertical: 24,
          paddingHorizontal: 20,
        },
        totalLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.primaryText,
          opacity: 0.85,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        totalAmount: {
          marginTop: 8,
          fontSize: 36,
          fontWeight: '700',
          color: colors.primaryText,
        },
        chartCard: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 12,
          overflow: 'hidden',
        },
        emptyChart: {
          paddingVertical: 36,
          paddingHorizontal: 20,
          alignItems: 'center',
        },
        emptyText: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        sectionLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        },
        transactionRow: {
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        transactionMeta: {
          flex: 1,
        },
        transactionCategory: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        transactionDate: {
          marginTop: 4,
          fontSize: 13,
          color: colors.textSecondary,
        },
        transactionAmount: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        transactionList: {
          gap: 10,
        },
      }),
    [colors],
  );

  const chartWidth = width - 48;
  const hasMonthData = pieData.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.greeting}>{`Hello! Here's ${monthLabel}`}</Text>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>This month</Text>
        <Text style={styles.totalAmount}>₹{formatAmount(monthTotal)}</Text>
      </View>

      <View style={styles.chartCard}>
        {hasMonthData ? (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="16"
            absolute
            chartConfig={{
              color: () => colors.text,
              labelColor: () => colors.text,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
            }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No expenses yet this month</Text>
          </View>
        )}
      </View>

      <View>
        <Text style={styles.sectionLabel}>Recent Transactions</Text>
        <View style={styles.transactionList}>
          {recent.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            recent.map((item) => (
              <View key={item.id} style={styles.transactionRow}>
                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionCategory}>{item.category}</Text>
                  <Text style={styles.transactionDate}>
                    {formatRelativeDate(item.date)}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>
                  ₹{formatAmount(Number(item.amount) || 0)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
