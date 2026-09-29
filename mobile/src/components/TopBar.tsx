import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from './Icon';
import { Segmented } from './UI';

export function TopBar() {
  const { colors, radii } = useTheme();
  const { profile, portfolios, currentPortfolioId, setCurrentPortfolioId, currency, setCurrency, secondary } = useAppData();
  const [open, setOpen] = useState(false);

  const portfolio = portfolios.find((p) => p.id === currentPortfolioId);
  const canSwitch = profile?.role === 'admin' && portfolios.length > 1;

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={[styles.mark, { backgroundColor: colors.accent, borderRadius: radii.sm - 2 }]}>
            <Text style={{ color: colors.accentInk, fontWeight: '700', fontSize: 14 }}>L</Text>
          </View>
          <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 16 }}>Ledger</Text>
        </View>

        <Segmented
          accent
          value={currency}
          onChange={setCurrency}
          options={[
            { id: 'AED', label: 'AED' },
            { id: secondary, label: secondary },
          ]}
        />
      </View>

      {canSwitch && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setOpen(true)}
          accessibilityLabel="Switch client"
          style={[styles.clientStrip, { backgroundColor: colors.accentSoft, borderRadius: radii.md }]}
        >
          <Icon name="users" size={16} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 12.5, fontWeight: '600' }}>Client</Text>
          <Text style={{ color: colors.accent, fontSize: 13.5, fontWeight: '700', flex: 1 }} numberOfLines={1}>
            {portfolio?.name ?? 'Select client'}
          </Text>
          <Icon name="chevron" size={14} color={colors.accent} />
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Switch client</Text>
            {portfolios.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.7}
                style={[styles.option, p.id === currentPortfolioId && { backgroundColor: colors.accentSoft, borderRadius: radii.sm }]}
                onPress={() => {
                  setCurrentPortfolioId(p.id);
                  setOpen(false);
                }}
              >
                <Text style={{ color: colors.ink, fontSize: 14 }}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  clientStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, minHeight: 40 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { padding: 16, paddingBottom: 32, borderWidth: 1, maxHeight: '60%' },
  option: { paddingVertical: 12, paddingHorizontal: 10 },
});
