import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card, PageHeader, Pill, Segmented } from '../components/UI';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { initials } from '../lib/format';
import type { ThemePreference } from '../types';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <>
      <Text style={[styles.header, { color: colors.inkFaint }]}>{title}</Text>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 6 }}>{children}</Card>
    </>
  );
}

function Pref({ title, sub, children, first }: { title: string; sub?: string; children: React.ReactNode; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pref, !first && { borderTopWidth: 1, borderColor: colors.border }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{title}</Text>
        {sub ? <Text style={{ color: colors.inkDim, fontSize: 12.5, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function AccountScreen() {
  const { colors, radii, preference, setPreference } = useTheme();
  const { profile, portfolios, currentPortfolioId, setCurrentPortfolioId, currency, setCurrency, fxRate, logout } = useAppData();

  if (!profile) return null;
  const isAdmin = profile.role === 'admin';

  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <PageHeader title="Account" subtitle="Your profile, preferences and access." />

        <Card style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.accentInk, fontSize: 22, fontWeight: '700' }}>{initials(profile.full_name)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '700' }} numberOfLines={1}>{profile.full_name}</Text>
            <Text style={{ color: colors.inkDim, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{profile.email}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Pill label={isAdmin ? 'Agency admin' : 'Investor'} tone={isAdmin ? 'info' : 'accent'} />
            </View>
          </View>
        </Card>

        <Group title="PREFERENCES">
          <Pref first title="Appearance" sub="Match your device or choose a theme">
            <Segmented<ThemePreference>
              value={preference}
              onChange={setPreference}
              options={[
                { id: 'light', label: '', icon: 'sun' },
                { id: 'dark', label: '', icon: 'moon' },
                { id: 'system', label: 'Auto', icon: 'monitor' },
              ]}
            />
          </Pref>
          <Pref title="Currency" sub={`1 AED = ₹${fxRate}`}>
            <Segmented accent value={currency} onChange={setCurrency} options={[{ id: 'AED', label: 'AED' }, { id: 'INR', label: 'INR' }]} />
          </Pref>
        </Group>

        <Group title={isAdmin ? 'CLIENT PORTFOLIOS' : 'PORTFOLIO ACCESS'}>
          {portfolios.length ? (
            portfolios.map((p, i) => {
              const current = p.id === currentPortfolioId;
              const row = (
                <View style={[styles.access, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                  <View style={[styles.smallAvatar, { backgroundColor: colors.accentSoft }]}>
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{initials(p.name)}</Text>
                  </View>
                  <Text style={{ flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{p.name}</Text>
                  {isAdmin ? (
                    current ? <Pill label="Viewing" tone="accent" /> : <Icon name="chevronRight" size={16} color={colors.inkFaint} />
                  ) : (
                    <Pill label="Member" tone="good" />
                  )}
                </View>
              );
              return isAdmin ? (
                <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setCurrentPortfolioId(p.id)}>{row}</TouchableOpacity>
              ) : (
                <View key={p.id}>{row}</View>
              );
            })
          ) : (
            <Text style={{ color: colors.inkFaint, padding: 18, fontSize: 13 }}>No portfolios assigned yet.</Text>
          )}
        </Group>

        <Group title="SECURITY">
          <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
            <View style={[styles.smallAvatar, { backgroundColor: colors.surface2, borderRadius: 10 }]}>
              <Icon name="lock" size={17} color={colors.inkDim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>Isolated at the database</Text>
              <Text style={{ color: colors.inkDim, fontSize: 13, lineHeight: 19, marginTop: 3 }}>
                Row-level security means even a direct request for another client&apos;s data is rejected by the server — not just hidden in the app.
              </Text>
            </View>
          </View>
        </Group>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={logout}
          accessibilityRole="button"
          style={[styles.logoutBtn, { borderColor: colors.borderStrong, borderRadius: radii.md }]}
        >
          <Text style={{ color: colors.bad, fontWeight: '700', fontSize: 15 }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  header: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7, marginBottom: 10, marginTop: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  smallAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pref: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  access: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, minHeight: 56 },
  logoutBtn: { borderWidth: 1, marginTop: 24, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
});
