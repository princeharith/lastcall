import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { AlertLevel } from '../types';

interface BudgetGaugeProps {
  percentUsed: number;   // 0–1 (clamped to 1 for display)
  spent: number;
  budget: number;
  alertLevel: AlertLevel;
  size?: number;
  strokeWidth?: number;
}

function alertColor(level: AlertLevel): string {
  switch (level) {
    case 'over':
    case 'critical':
      return Colors.gaugeCritical;
    case 'warning':
      return Colors.gaugeWarning;
    default:
      return Colors.gaugeGood;
  }
}

export default function BudgetGauge({
  percentUsed,
  spent,
  budget,
  alertLevel,
  size = 220,
  strokeWidth = 18,
}: BudgetGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Only sweep 270° (¾ circle) – gap at bottom
  const maxAngle = 0.75;
  const clampedPct = Math.min(percentUsed, 1);
  const strokeDasharray = circumference * maxAngle;
  const strokeDashoffset = strokeDasharray * (1 - clampedPct);

  const remaining = Math.max(0, budget - spent);
  const isOver = spent > budget;

  const color = alertColor(alertLevel);
  const gradientId = 'gauge-gradient';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.gaugeBackground}
          strokeWidth={strokeWidth}
          strokeDasharray={`${strokeDasharray} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          fill="none"
          rotation={135}
          originX={size / 2}
          originY={size / 2}
        />

        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${strokeDasharray} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation={135}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      {/* Center labels */}
      <View style={styles.labelContainer}>
        <Text style={[styles.percentLabel, { color }]}>
          {Math.round(clampedPct * 100)}%
        </Text>
        <Text style={styles.spentLabel}>${spent.toFixed(2)}</Text>
        <Text style={styles.budgetLabel}>of ${budget.toFixed(0)}</Text>
        <View style={[styles.remainingBadge, { borderColor: color }]}>
          <Text style={[styles.remainingText, { color }]}>
            {isOver
              ? `$${(spent - budget).toFixed(2)} over`
              : `$${remaining.toFixed(2)} left`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentLabel: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  spentLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: -4,
  },
  budgetLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  remainingBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
