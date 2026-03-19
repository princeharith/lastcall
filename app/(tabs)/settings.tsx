import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBudgetContext } from '../../context/BudgetContext';
import { Colors } from '../../constants/colors';
import {
  loadTextbeltKey,
  saveTextbeltKey,
  clearTextbeltKey,
  loadServerUrl,
  saveServerUrl,
} from '../../services/storage';
import { sendSMS, simulateSMS, buildAlertMessage } from '../../services/smsService';

// ── Reusable field components ─────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
}: FieldRowProps) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const {
    settings,
    trustedContact,
    simulateMode,
    updateSettings,
    updateTrustedContact,
    updateSimulateMode,
    resetAlertLevel,
  } = useBudgetContext();

  // Budget
  const [budget, setBudget] = useState(settings.monthlyBudget.toString());
  const [warnPct, setWarnPct] = useState(Math.round(settings.warningThreshold * 100).toString());
  const [critPct, setCritPct] = useState(Math.round(settings.criticalThreshold * 100).toString());

  // Trusted contact
  const [contactName, setContactName] = useState(trustedContact?.name ?? '');
  const [contactPhone, setContactPhone] = useState(trustedContact?.phone ?? '');

  // Textbelt
  const [textbeltKey, setTextbeltKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Server
  const [serverUrl, setServerUrl] = useState('');

  // Sync from context when it loads
  useEffect(() => {
    setBudget(settings.monthlyBudget.toString());
    setWarnPct(Math.round(settings.warningThreshold * 100).toString());
    setCritPct(Math.round(settings.criticalThreshold * 100).toString());
  }, [settings]);

  useEffect(() => {
    setContactName(trustedContact?.name ?? '');
    setContactPhone(trustedContact?.phone ?? '');
  }, [trustedContact]);

  useEffect(() => {
    loadTextbeltKey().then((key) => {
      if (key) setTextbeltKey(key);
      setKeyLoaded(true);
    });
    loadServerUrl().then((url) => setServerUrl(url));
  }, []);

  async function saveBudgetSettings() {
    const monthly = parseFloat(budget);
    const warn = parseInt(warnPct) / 100;
    const crit = parseInt(critPct) / 100;

    if (isNaN(monthly) || monthly <= 0) {
      Alert.alert('Invalid budget', 'Please enter a positive number.');
      return;
    }
    if (warn >= crit) {
      Alert.alert('Invalid thresholds', 'Warning must be lower than critical.');
      return;
    }

    await updateSettings({ monthlyBudget: monthly, warningThreshold: warn, criticalThreshold: crit });

    // Sync budget to server if configured
    const url = await loadServerUrl();
    if (url.trim()) {
      try {
        await fetch(`${url.trim()}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: monthly }),
        });
      } catch {
        // Non-fatal
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Budget settings updated.');
  }

  async function saveContact() {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Missing info', 'Please enter both a name and phone number.');
      return;
    }
    await updateTrustedContact({ name: contactName.trim(), phone: contactPhone.trim() });

    // Sync phone to backend if a server URL is configured
    if (serverUrl.trim()) {
      try {
        await fetch(`${serverUrl.trim()}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactPhone: contactPhone.trim() }),
        });
      } catch {
        // Non-fatal — local save already succeeded
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Trusted contact updated.');
  }

  async function handleSaveKey() {
    if (!textbeltKey.trim()) {
      Alert.alert('Missing key', 'Please paste your Textbelt API key.');
      return;
    }
    await saveTextbeltKey(textbeltKey.trim());
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'API key stored securely.');
  }

  async function handleClearKey() {
    Alert.alert('Clear API Key', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearTextbeltKey();
          setTextbeltKey('');
        },
      },
    ]);
  }

  async function sendTestSms() {
    if (!trustedContact) {
      Alert.alert('No Contact', 'Please save a trusted contact first.');
      return;
    }
    const message = buildAlertMessage('warning', settings.monthlyBudget * 0.8, settings.monthlyBudget);
    try {
      if (simulateMode) {
        await simulateSMS(trustedContact.phone, message);
        Alert.alert('Simulated!', `SMS logged to console for ${trustedContact.name}.`);
      } else {
        const key = await loadTextbeltKey();
        if (!key) {
          Alert.alert('No API Key', 'Please save your Textbelt API key first.');
          return;
        }
        const result = await sendSMS(key, trustedContact.phone, message);
        if (result.success) {
          Alert.alert('Sent!', `Test SMS sent to ${trustedContact.name}. ${result.quotaRemaining ?? '?'} texts remaining.`);
        } else {
          Alert.alert('SMS Failed', result.error ?? 'Unknown error');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Unknown error');
    }
  }

  async function handleResetAlerts() {
    await resetAlertLevel();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Reset', 'Alert level reset. Alerts will fire again on next threshold crossing.');
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
          <Text style={styles.screenTitle}>Settings</Text>

          {/* ── Budget ── */}
          <View style={styles.card}>
            <SectionHeader title="Budget" />
            <FieldRow
              label="Monthly Budget ($)"
              value={budget}
              onChangeText={setBudget}
              placeholder="500"
              keyboardType="decimal-pad"
            />
            <FieldRow
              label="Warning at (%)"
              value={warnPct}
              onChangeText={setWarnPct}
              placeholder="75"
              keyboardType="numeric"
            />
            <FieldRow
              label="Critical at (%)"
              value={critPct}
              onChangeText={setCritPct}
              placeholder="90"
              keyboardType="numeric"
            />
            <SaveButton label="Save Budget" onPress={saveBudgetSettings} />
          </View>

          {/* ── Trusted Contact ── */}
          <View style={styles.card}>
            <SectionHeader title="Trusted Contact" />
            <Text style={styles.cardSubtext}>
              This person gets an SMS when you hit your warning / critical thresholds.
            </Text>
            <FieldRow
              label="Name"
              value={contactName}
              onChangeText={setContactName}
              placeholder="Mom"
            />
            <FieldRow
              label="Phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="5551234567"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <FieldRow
              label="Server URL (optional)"
              value={serverUrl}
              onChangeText={async (v) => { setServerUrl(v); await saveServerUrl(v); }}
              placeholder="http://192.168.1.x:3000"
              autoCapitalize="none"
            />
            <SaveButton label="Save Contact" onPress={saveContact} />
          </View>

          {/* ── Textbelt ── */}
          <View style={styles.card}>
            <SectionHeader title="Textbelt (SMS)" />
            <Text style={styles.cardSubtext}>
              API key stored encrypted on-device. Get yours at textbelt.com.
            </Text>

            {/* Simulate / Live toggle */}
            <View style={styles.showTokensRow}>
              <Text style={styles.fieldLabel}>
                {simulateMode ? '🧪 Simulate' : '📡 Textbelt'}
              </Text>
              <Switch
                value={simulateMode}
                onValueChange={updateSimulateMode}
                trackColor={{ false: Colors.primary, true: Colors.border }}
                thumbColor="#fff"
              />
            </View>

            {!keyLoaded ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                <View style={styles.showTokensRow}>
                  <Text style={styles.fieldLabel}>Show key</Text>
                  <Switch
                    value={showKey}
                    onValueChange={setShowKey}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
                <FieldRow
                  label="Textbelt API Key"
                  value={textbeltKey}
                  onChangeText={setTextbeltKey}
                  placeholder="Paste your key from textbelt.com"
                  autoCapitalize="none"
                  secureTextEntry={!showKey}
                />
                <View style={styles.buttonRow}>
                  <SaveButton label="Save Key" onPress={handleSaveKey} flex />
                  <Pressable style={styles.clearBtn} onPress={handleClearKey}>
                    <Ionicons name="trash-outline" size={18} color={Colors.critical} />
                  </Pressable>
                </View>
                <Pressable style={styles.testSmsBtn} onPress={sendTestSms}>
                  <Ionicons name="paper-plane-outline" size={16} color={Colors.primary} />
                  <Text style={styles.testSmsBtnText}>Send test SMS</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* ── Alerts ── */}
          <View style={styles.card}>
            <SectionHeader title="Alerts" />
            <Text style={styles.cardSubtext}>
              Reset the alert tracker so notifications fire again at each threshold.
            </Text>
            <Pressable style={styles.dangerBtn} onPress={handleResetAlerts}>
              <Ionicons name="refresh-outline" size={16} color={Colors.warning} />
              <Text style={styles.dangerBtnText}>Reset Alert Level</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Last Call v1.0 · Built with Expo + Textbelt</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SaveButton({
  label,
  onPress,
  flex,
}: {
  label: string;
  onPress: () => void;
  flex?: boolean;
}) {
  return (
    <Pressable style={[styles.saveBtn, flex && { flex: 1 }]} onPress={onPress}>
      <Text style={styles.saveBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    paddingTop: 16,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardSubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldRow: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  showTokensRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  clearBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testSmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  testSmsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
});
