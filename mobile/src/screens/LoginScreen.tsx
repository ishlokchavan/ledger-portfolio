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
  { label: 'Investor', sub: 'Shukla Family', email: 'shukla.family.demo@example.com', password: 'ShuklaPortfolio#2026!' },
  { label: 'Agency admin', sub: 'All clients', email: 'ishlokchavan@gmail.com', password: 'Portfolio#Admin2026!' },
];

export function LoginScreen() {
  const { colors, radii } = useTheme();
  const { login, loginError } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
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
          <View style={styles.card}>
            <View style={styles.brandRow}>
              <View style={[styles.mark, { backgroundColor: colors.accent, borderRadius: radii.md }]}>
                <Text style={[styles.markText, { color: colors.accentInk }]}>L</Text>
              </View>
              <View>
                <Text style={[styles.brandText, { color: colors.ink }]}>Ledger</Text>
                <Text style={[styles.brandSub, { color: colors.inkDim }]}>Off-plan portfolio tracking</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.ink }]}>Welcome back</Text>
            <Text style={[styles.desc, { color: colors.inkDim }]}>
              Sign in to see the properties, payment schedules and progress tied to your account.
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
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.borderStrong, color: colors.ink, borderRadius: radii.md }]}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.inkDim }]}>Password</Text>
              <View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Your password"
                  placeholderTextColor={colors.inkFaint}
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.borderStrong, color: colors.ink, borderRadius: radii.md, paddingRight: 48 }]}
                  onSubmitEditing={doLogin}
                />
                <TouchableOpacity
                  accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPw((v) => !v)}
                  hitSlop={8}
                  style={styles.eye}
                >
                  <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '700' }}>{showPw ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: colors.accent, borderRadius: radii.md, opacity: submitting ? 0.6 : 1 }]}
              onPress={doLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.accentInk} />
              ) : (
                <Text style={[styles.btnText, { color: colors.accentInk }]}>Log in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoHead}>
              <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '700', letterSpacing: 0.7 }}>TRY A DEMO ACCOUNT</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {DEMO_ACCOUNTS.map((d) => (
                <TouchableOpacity
                  key={d.email}
                  activeOpacity={0.7}
                  style={[styles.demoChip, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}
                  onPress={() => fillDemo(d.email, d.password)}
                >
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>{d.label}</Text>
                  <Text style={{ color: colors.inkFaint, fontSize: 11.5, marginTop: 1 }}>{d.sub}</Text>
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
  card: { width: '100%', maxWidth: 400, padding: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  mark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  markText: { fontWeight: '700', fontSize: 18 },
  brandText: { fontWeight: '700', fontSize: 18 },
  brandSub: { fontSize: 13, marginTop: 1 },
  title: { fontSize: 30, fontWeight: '700', marginBottom: 6, letterSpacing: -0.5 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  errorBox: { padding: 11, marginBottom: 14 },
  field: { marginBottom: 14 },
  label: { fontSize: 12.5, fontWeight: '600', marginBottom: 6, letterSpacing: 0.2 },
  input: { paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, fontSize: 15, minHeight: 48 },
  btn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4, minHeight: 46 },
  btnText: { fontWeight: '700', fontSize: 15 },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 12 },
  demoChip: { flex: 1, padding: 13, borderWidth: 1 },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
});
