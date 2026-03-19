import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BudgetProvider } from '../context/BudgetContext';
import { useBudgetContext } from '../context/BudgetContext';
import { useNotifications } from '../hooks/useNotifications';

function NotificationSetup() {
  const { syncExpense } = useBudgetContext();
  useNotifications(syncExpense);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BudgetProvider>
        <NotificationSetup />
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="history"
            options={{
              headerShown: true,
              headerTitle: 'Expense History',
              headerStyle: { backgroundColor: '#0F0F0F' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: '700' },
              presentation: 'modal',
            }}
          />
        </Stack>
      </BudgetProvider>
    </SafeAreaProvider>
  );
}
