import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Card } from './UI';

/**
 * A single pulsing placeholder block. Building block for every skeleton screen below —
 * shape it with width/height/radius to stand in for whatever it's covering (a line of
 * text, an avatar, a tile) while real data loads.
 */
export function SkeletonBlock({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surface2, opacity },
        style,
      ]}
    />
  );
}

/** Mimics a PropertyCard: name line, meta line, two meta chips, progress bar. */
export function PropertyCardSkeleton() {
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBlock width="62%" height={16} />
          <SkeletonBlock width="85%" height={12} />
        </View>
        <SkeletonBlock width={70} height={22} radius={999} />
      </View>
      <View style={[styles.row, { marginTop: 14, gap: 20 }]}>
        <SkeletonBlock width={90} height={12} />
        <SkeletonBlock width={110} height={12} />
      </View>
      <View style={{ marginTop: 14, gap: 6 }}>
        <View style={styles.row}>
          <SkeletonBlock width={70} height={11} />
          <SkeletonBlock width={28} height={11} />
        </View>
        <SkeletonBlock height={8} radius={999} />
      </View>
    </Card>
  );
}

/** A list of PropertyCardSkeletons, standing in for the Properties tab while it loads. */
export function PropertiesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Mimics a PayRow: days box, property name + milestone line, amount. */
export function PayRowSkeleton({ last = false }: { last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.payRow, !last && { borderBottomWidth: 1, borderColor: colors.border }]}>
      <SkeletonBlock width={46} height={46} radius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock width="55%" height={13} />
        <SkeletonBlock width="75%" height={11} />
      </View>
      <SkeletonBlock width={64} height={13} />
    </View>
  );
}

/** A Card full of PayRowSkeletons. */
export function PayListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card>
      {Array.from({ length: count }).map((_, i) => (
        <PayRowSkeleton key={i} last={i === count - 1} />
      ))}
    </Card>
  );
}

/** Full Dashboard-tab skeleton: greeting, summary tiles, chart card, upcoming-payments list. */
export function DashboardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.dashContent}>
      <SkeletonBlock width="55%" height={14} />
      <SkeletonBlock width="30%" height={11} style={{ marginTop: 8 }} />

      <View style={[styles.row, { marginTop: 24, marginBottom: 12 }]}>
        <SkeletonBlock width={140} height={12} />
        <SkeletonBlock width={90} height={30} radius={9} />
      </View>

      <View style={styles.tiles}>
        <Card style={{ width: '100%' }}>
          <SkeletonBlock width="50%" height={12} />
          <SkeletonBlock width="70%" height={24} style={{ marginTop: 8 }} />
          <SkeletonBlock height={8} radius={999} style={{ marginTop: 12 }} />
        </Card>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} style={{ flexBasis: '47%', flexGrow: 1 }}>
            <SkeletonBlock width="60%" height={12} />
            <SkeletonBlock width="45%" height={20} style={{ marginTop: 8 }} />
          </Card>
        ))}
      </View>

      <SkeletonBlock width={180} height={12} style={{ marginTop: 24, marginBottom: 12 }} />
      <Card>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={[styles.row, { marginBottom: 4 }]}>
              <SkeletonBlock width="40%" height={12} />
              <SkeletonBlock width={60} height={12} />
            </View>
            <SkeletonBlock height={16} radius={6} />
          </View>
        ))}
      </Card>

      <SkeletonBlock width={200} height={12} style={{ marginTop: 24, marginBottom: 12 }} />
      <PayListSkeleton count={3} />
    </View>
  );
}

/** Fact-row placeholder used inside the PropertyDetail hero skeleton. */
function FactRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.factRow, { borderColor: colors.border }]}>
      <SkeletonBlock width="45%" height={12} />
      <SkeletonBlock width="25%" height={12} />
    </View>
  );
}

/** Full PropertyDetail skeleton: hero card facts + a schedule-table placeholder. */
export function PropertyDetailSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.dashContent}>
      <Card>
        <SkeletonBlock width="70%" height={20} />
        <SkeletonBlock width="90%" height={12} style={{ marginTop: 8 }} />
        <View style={[styles.row, { marginTop: 18, gap: 10 }]}>
          <SkeletonBlock height={8} radius={999} style={{ flex: 1 }} />
          <SkeletonBlock width={34} height={12} />
        </View>
        <View style={styles.detailGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={{ width: '45%', gap: 5 }}>
              <SkeletonBlock width="60%" height={10} />
              <SkeletonBlock width="80%" height={14} />
            </View>
          ))}
        </View>
        <SkeletonBlock width={100} height={11} style={{ marginTop: 24, marginBottom: 10 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <FactRowSkeleton key={i} />
        ))}
      </Card>
      <SkeletonBlock width={220} height={12} style={{ marginTop: 22, marginBottom: 12 }} />
      <Card>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[styles.row, { paddingVertical: 10, gap: 10 }, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}
          >
            <SkeletonBlock width="35%" height={12} />
            <SkeletonBlock width="20%" height={12} />
            <SkeletonBlock width="20%" height={12} />
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dashContent: { padding: 16, paddingBottom: 40 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 9, borderTopWidth: 1 },
});
