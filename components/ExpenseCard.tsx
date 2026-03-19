import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import { Colors } from '../constants/colors';

interface ExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const iconName = CATEGORY_ICONS[expense.category] as any;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name={iconName} size={20} color={Colors.primary} />
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{CATEGORY_LABELS[expense.category]}</Text>
        {expense.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {expense.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
        <Text style={styles.time}>{formatTime(expense.timestamp)}</Text>
      </View>

      {onDelete ? (
        <Pressable
          style={styles.deleteBtn}
          onPress={() => onDelete(expense.id)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  note: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  time: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
});
