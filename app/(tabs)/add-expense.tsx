import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetContext } from '../../context/BudgetContext';
import { Colors } from '../../constants/colors';
import { ExpenseCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../../types';

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'drinks',
  'transport',
  'shopping',
  'entertainment',
  'bills',
  'other',
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export default function AddExpenseScreen() {
  const { addExpense } = useBudgetContext();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = parseFloat(amount);
  const isValid = !isNaN(numericAmount) && numericAmount > 0;

  function handleQuickAmount(val: number) {
    Haptics.selectionAsync();
    setAmount(val.toString());
  }

  function handleCategorySelect(cat: ExpenseCategory) {
    Haptics.selectionAsync();
    setCategory(cat);
  }

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addExpense({ amount: numericAmount, category, note: note.trim() });
      // Reset
      setAmount('');
      setNote('');
      setCategory('food');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Logged!', `$${numericAmount.toFixed(2)} added.`);
    } catch (err) {
      Alert.alert('Error', 'Could not save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Log Expense</Text>

          {/* Amount input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              maxLength={8}
            />
          </View>

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((val) => (
              <Pressable
                key={val}
                style={[
                  styles.quickBtn,
                  amount === val.toString() && styles.quickBtnActive,
                ]}
                onPress={() => handleQuickAmount(val)}
              >
                <Text
                  style={[
                    styles.quickBtnText,
                    amount === val.toString() && styles.quickBtnTextActive,
                  ]}
                >
                  ${val}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Category picker */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat;
              const iconName = CATEGORY_ICONS[cat] as any;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Note */}
          <Text style={styles.sectionLabel}>Note (optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="What was this for?"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={120}
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={isValid ? '#fff' : Colors.textMuted}
            />
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
              {isSubmitting ? 'Saving…' : 'Log Expense'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    paddingTop: 16,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    height: 80,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
    padding: 0,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryLabelActive: {
    color: Colors.primary,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 28,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.surface,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  submitTextDisabled: {
    color: Colors.textMuted,
  },
});
