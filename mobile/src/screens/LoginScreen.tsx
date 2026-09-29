import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';

const DEMO_ACCOUNTS = [
  { label: 'Investor (Shukla Family)', email: 'shukla.family.demo@example.com', password: 'ShuklaPortfolio#2026!' },
  { label: 'Agency admin (all clients)', email: 'ishlokchavan@gmail.com', password: 'Portfolio#Admin2026!' },
];

export function LoginScreen() {
  const { colors, radii } = useTheme();
  const { login, loginError } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const doLogin = async () => {
    if (!email.trim() || !password) {
      setLocalError('Enter your email and password.');
      return;
    }
    setLocalError('');
    setSubmitting(true);
    await login(email.trim(), password);
    setSubmitting(false);
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setLocalError('');
  };

  const error = localError || loginError;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}>
            <View style={styles.brandRow}>
              <View style={[styles.mark, { backgroundColor: colors.accent, borderRadius: radii.sm }]}>
                <Text style={[styles.markText, { color: colors.accentInk }]}>L</Text>
              </View>
              <View>
                <Text style={[styles.brandText, { color: colors.ink }]}>Ledger</Text>
                <Text style={[styles.brandSub, { color: colors.inkDim }]}>Off-plan portfolio tracking</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.ink }]}>Welcome back</Text>
            <Text style={[styles.desc, { color: colors.inkDim }]}>
              Sign in to see the properties, payment schedules, and progress tied to your account. Every investor only ever
              sees their own portfolio.
            </Text>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.badSoft, borderRadius: radii.sm }]}>
                <Text style={{ color: colors.bad, fontSize: 13 }}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.inkDim }]}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@email.com"
                placeholderTextColor={colors.inkFaint}
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.ink, borderRadius: radii.sm }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.inkDim }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                style={[styles.input, { backgroundColor: colors.surface2, borderColor: colors.border, color: colors.ink, borderRadius: radii.sm }]}
                onSubmitEditing={doLogin}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: colors.accent, borderRadius: radii.sm, opacity: submitting ? 0.6 : 1 }]}
              onPress={doLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.accentInk} />
              ) : (
                <Text style={[styles.btnText, { color: colors.accentInk }]}>Log in</Text>
              )}
            </TouchableOpacity>

            <View style={[styles.demoBox, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radii.md }]}>
              <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 12.5, marginBottom: 6 }}>Try it — demo logins</Text>
              {DEMO_ACCOUNTS.map((d) => (
                <TouchableOpacity key={d.email} activeOpacity={0.7} style={styles.demoRow} onPress={() => fillDemo(d.email, d.password)}>
                  <Text style={{ color: colors.inkDim, fontSize: 12.5, flexShrink: 1 }}>{d.label}</Text>
                  <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '600' }}>tap to fill →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderWidth: 1, padding: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  mark: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  markText: { fontWeight: '700', fontSize: 18 },
  brandText: { fontWeight: '700', fontSize: 18 },
  brandSub: { fontSize: 13, marginTop: 1 },
  title: { fontSize: 21, fontWeight: '700', marginBottom: 4 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  errorBox: { padding: 11, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  input: { paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, fontSize: 15 },
  btn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4, minHeight: 46 },
  btnText: { fontWeight: '700', fontSize: 15 },
  demoBox: { marginTop: 20, padding: 13, borderWidth: 1 },
  demoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 6 },
});
