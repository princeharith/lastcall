import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetContext } from '../context/BudgetContext';
import ExpenseCard from '../components/ExpenseCard';
import { Colors } from '../constants/colors';
import { Expense, ExpenseCategory, CATEGORY_LABELS } from '../types';

type GroupedExpense = {
  title: string;
  data: Expense[];
};

function groupByDay(expenses: Expense[]): GroupedExpense[] {
  const map = new Map<string, Expense[]>();
  for (const exp of expenses) {
    const date = new Date(exp.timestamp);
    const key = date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    const existing = map.get(key) ?? [];
    map.set(key, [...existing, exp]);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const ALL_CATEGORIES = 'all' as const;
type FilterCategory = ExpenseCategory | typeof ALL_CATEGORIES;

export default function HistoryScreen() {
  const { expenses, removeExpense } = useBudgetContext();
  const [filter, setFilter] = useState<FilterCategory>(ALL_CATEGORIES);

  const filtered = useMemo(() => {
    if (filter === ALL_CATEGORIES) return expenses;
    return expenses.filter((e) => e.category === filter);
  }, [expenses, filter]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  // Derive which categories actually appear in expenses
  const usedCategories = useMemo<ExpenseCategory[]>(() => {
    const set = new Set(expenses.map((e) => e.category));
    return Array.from(set) as ExpenseCategory[];
  }, [expenses]);

  function handleDelete(id: string) {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeExpense(id) },
    ]);
  }

  const renderGroup = ({ item }: { item: GroupedExpense }) => (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{item.title}</Text>
        <Text style={styles.groupTotal}>
          ${item.data.reduce((s, e) => s + e.amount, 0).toFixed(2)}
        </Text>
      </View>
      {item.data.map((exp) => (
        <ExpenseCard key={exp.id} expense={exp} onDelete={handleDelete} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter chips */}
      <View style={styles.filtersWrapper}>
        <Pressable
          style={[styles.chip, filter === ALL_CATEGORIES && styles.chipActive]}
          onPress={() => setFilter(ALL_CATEGORIES)}
        >
          <Text style={[styles.chipText, filter === ALL_CATEGORIES && styles.chipTextActive]}>
            All
          </Text>
        </Pressable>
        {usedCategories.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, filter === cat && styles.chipActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.chipText, filter === cat && styles.chipTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.summaryTotal}>${totalFiltered.toFixed(2)}</Text>
        </View>
      )}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.title}
        renderItem={renderGroup}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filtersWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
