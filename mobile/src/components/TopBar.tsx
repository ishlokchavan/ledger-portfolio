import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Icon } from './Icon';

export function TopBar() {
  const { colors, radii } = useTheme();
  const { profile, portfolios, currentPortfolioId, setCurrentPortfolioId } = useAppData();
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

        {canSwitch ? (
          <TouchableOpacity
            onPress={() => setOpen(true)}
            style={[styles.switchBtn, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radii.sm }]}
          >
            <Text style={{ color: colors.ink, fontSize: 12.5, fontWeight: '700' }} numberOfLines={1}>
              {portfolio?.name ?? 'Select client'}
            </Text>
            <Icon name="chevron" size={13} color={colors.inkFaint} />
          </TouchableOpacity>
        ) : portfolio ? (
          <Text style={{ color: colors.inkDim, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
            {portfolio.name}
          </Text>
        ) : null}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
            <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 14, marginBottom: 10 }}>Switch client</Text>
            {portfolios.map((p) => (
              <TouchableOpacity
                key={p.id}
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
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, maxWidth: 170 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { padding: 16, paddingBottom: 32, borderWidth: 1, maxHeight: '60%' },
  option: { paddingVertical: 12, paddingHorizontal: 10 },
});
