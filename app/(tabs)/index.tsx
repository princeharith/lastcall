import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetContext } from '../../context/BudgetContext';
import BudgetGauge from '../../components/BudgetGauge';
import ExpenseCard from '../../components/ExpenseCard';
import { Colors } from '../../constants/colors';
import { AlertLevel } from '../../types';

function AlertBanner({ level, spent, budget }: { level: AlertLevel; spent: number; budget: number }) {
  if (level === 'none') return null;

  const configs = {
    warning: {
      bg: '#2D1F00',
      border: Colors.warning,
      icon: 'warning' as const,
      color: Colors.warning,
      text: `Heads up — you've used ${Math.round((spent / budget) * 100)}% of your monthly budget.`,
    },
    critical: {
      bg: '#2D0800',
      border: Colors.critical,
      icon: 'alert-circle' as const,
      color: Colors.critical,
      text: `Critical! Only $${Math.max(0, budget - spent).toFixed(2)} left this month.`,
    },
    over: {
      bg: '#2D0000',
      border: Colors.critical,
      icon: 'close-circle' as const,
      color: Colors.critical,
      text: `Over budget by $${(spent - budget).toFixed(2)}. Your contact has been notified.`,
    },
  };

  const cfg = configs[level];

  return (
    <View style={[styles.alertBanner, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      <Text style={[styles.alertText, { color: cfg.color }]}>{cfg.text}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const {
    expenses,
    settings,
    spent,
    percentUsed,
    alertLevel,
    isLoaded,
    removeExpense,
  } = useBudgetContext();

  const recentExpenses = expenses.slice(0, 5);
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>Last Call</Text>
            <Text style={styles.monthLabel}>{currentMonth}</Text>
          </View>
          <Pressable
            style={styles.historyBtn}
            onPress={() => router.push('/history')}
          >
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Alert banner */}
        <AlertBanner level={alertLevel} spent={spent} budget={settings.monthlyBudget} />

        {/* Budget gauge */}
        <View style={styles.gaugeSection}>
          <BudgetGauge
            percentUsed={percentUsed}
            spent={spent}
            budget={settings.monthlyBudget}
            alertLevel={alertLevel}
            size={230}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>
              ${(spent / Math.max(new Date().getDate(), 1)).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Avg / Day</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              ${Math.max(0, settings.monthlyBudget - spent).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        {/* Recent expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {expenses.length > 5 && (
              <Pressable onPress={() => router.push('/history')}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the Add tab to log your first expense.
              </Text>
            </View>
          ) : (
            recentExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={removeExpense}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  monthLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  gaugeSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statCardMiddle: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
