import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card } from '../components/UI';
import { Screen } from '../components/Screen';
import type { ThemeMode } from '../types';

function AccRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.accRow, !last && { borderBottomWidth: 1, borderColor: colors.border }]}>
      <Text style={{ color: colors.inkDim, fontSize: 13.5 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

export function AccountScreen() {
  const { colors, radii, mode, setMode } = useTheme();
  const { profile, logout } = useAppData();

  if (!profile) return null;

  return (
    <Screen>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <Text style={[styles.header, { color: colors.inkFaint }]}>APPEARANCE</Text>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.themeRow}>
          <Text style={{ color: colors.inkDim, fontSize: 13.5 }}>Theme</Text>
          <View style={[styles.toggle, { borderColor: colors.border, borderRadius: radii.sm }]}>
            {(['light', 'dark'] as ThemeMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={[styles.toggleBtn, mode === m && { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: mode === m ? colors.accentInk : colors.inkDim, fontSize: 12, fontWeight: '700' }}>
                  {m === 'light' ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>

      <Text style={[styles.header, { color: colors.inkFaint }]}>SIGNED IN AS</Text>
      <Card style={{ marginBottom: 12 }}>
        <AccRow label="Name" value={profile.full_name} />
        <AccRow label="Email" value={profile.email} />
        <AccRow label="Role" value={profile.role === 'admin' ? 'Agency admin' : 'Investor'} last />
      </Card>

      <Text style={[styles.header, { color: colors.inkFaint }]}>SECURITY</Text>
      <Card style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.inkDim, fontSize: 13, lineHeight: 20 }}>
          This account only has access to portfolios it has been explicitly added to. Row-level security on the database
          enforces this — even a direct request for another client&apos;s data is rejected by the server, not just hidden in
          the app.
        </Text>
      </Card>

      <TouchableOpacity
        onPress={logout}
        style={[styles.logoutBtn, { borderColor: colors.border, borderRadius: radii.sm }]}
      >
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, marginTop: 6 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 9, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  accRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  logoutBtn: { borderWidth: 1, paddingVertical: 13, alignItems: 'center', marginTop: 6, minHeight: 46, justifyContent: 'center' },
});
