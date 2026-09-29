import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card, EmptyNote, ProgressBar } from '../components/UI';
import { Icon } from '../components/Icon';
import { fmtDate, fmtMoney, fmtPct, fmtPsf, milestoneState, paidPct, resaleEligibility, STATE_LABEL } from '../lib/format';
import type { PropertiesStackParamList } from '../navigation/types';
import type { PaymentMilestone } from '../types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyDetail'>;

function FactRow({ k, v }: { k: string; v: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.factRow, { borderColor: colors.border }]}>
      <Text style={{ color: colors.inkDim, fontSize: 13, flexShrink: 1 }}>{k}</Text>
      <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700', textAlign: 'right' }}>{v}</Text>
    </View>
  );
}

function SubHead({ icon, children }: { icon: React.ComponentProps<typeof Icon>['name']; children: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.subheadRow}>
      <Icon name={icon} size={12} color={colors.inkFaint} />
      <Text style={[styles.subheadText, { color: colors.inkFaint }]}> {children}</Text>
    </View>
  );
}

const STATUS_COLOR_KEY: Record<string, 'good' | 'bad' | 'warn' | 'faint'> = {
  paid: 'good',
  overdue: 'bad',
  soon: 'warn',
  upcoming: 'faint',
  undecided: 'faint',
};

const COLS = [
  { key: 'sr', label: 'Sr No', width: 60, num: false },
  { key: 'milestone', label: 'Milestone', width: 190, num: false },
  { key: 'sale', label: 'Sale date', width: 100, num: false },
  { key: 'due', label: 'Due date', width: 110, num: false },
  { key: 'inst', label: 'Installment', width: 90, num: false },
  { key: 'pct', label: '%', width: 55, num: true },
  { key: 'amount', label: 'Amount', width: 110, num: true },
  { key: 'vat', label: 'VAT', width: 90, num: true },
  { key: 'total', label: 'Total', width: 110, num: true },
  { key: 'paid', label: 'Paid', width: 110, num: true },
  { key: 'outstanding', label: 'Outstanding', width: 120, num: true },
  { key: 'year', label: 'Year', width: 60, num: false },
  { key: 'status', label: 'Status', width: 90, num: false },
  { key: 'remarks', label: 'Remarks', width: 160, num: false },
] as const;

const TABLE_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0);

function MilestoneTable({ milestones, currency, fxRate }: { milestones: PaymentMilestone[]; currency: 'AED' | 'INR'; fxRate: number }) {
  const { colors, radii } = useTheme();

  const totals = useMemo(
    () =>
      milestones.reduce(
        (acc, m) => {
          acc.amount += Number(m.amount_aed || 0);
          acc.vat += Number(m.vat_aed || 0);
          acc.total += Number(m.total_aed || 0);
          acc.paid += Number(m.paid_aed || 0);
          acc.outstanding += Number(m.outstanding_aed || 0);
          return acc;
        },
        { amount: 0, vat: 0, total: 0, paid: 0, outstanding: 0 }
      ),
    [milestones]
  );

  const statusColor = (tone: string) =>
    tone === 'good' ? colors.good : tone === 'bad' ? colors.bad : tone === 'warn' ? colors.warn : colors.inkFaint;

  return (
    <View>
      <View style={[styles.sheetWrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.lg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ width: TABLE_WIDTH }}>
            <View style={[styles.sheetHeaderRow, { backgroundColor: colors.surface2 }]}>
              {COLS.map((c) => (
                <Text
                  key={c.key}
                  style={[
                    styles.sheetHeaderCell,
                    { width: c.width, color: colors.inkFaint, textAlign: c.num ? 'right' : 'left' },
                  ]}
                >
                  {c.label.toUpperCase()}
                </Text>
              ))}
            </View>
            {milestones.map((m, i) => {
              const st = milestoneState(m);
              const label = st === 'overdue' ? `${Math.abs(daysUntilSafe(m))}d overdue` : STATE_LABEL[st];
              const cells: Record<string, string> = {
                sr: m.milestone_no != null ? String(Math.round(m.milestone_no * 10) / 10) : '—',
                milestone: m.milestone_event,
                sale: fmtDate(m.sale_date),
                due: m.due_date ? fmtDate(m.due_date) : 'Not confirmed',
                inst: m.installment_code || '—',
                pct: fmtPct(m.pct),
                amount: fmtMoney(m.amount_aed, currency, fxRate),
                vat: fmtMoney(m.vat_aed, currency, fxRate),
                total: fmtMoney(m.total_aed, currency, fxRate),
                paid: fmtMoney(m.paid_aed, currency, fxRate),
                outstanding: fmtMoney(m.outstanding_aed, currency, fxRate),
                year: m.year ? String(m.year) : '—',
                status: label,
                remarks: m.remarks || '—',
              };
              return (
                <View
                  key={m.id}
                  style={[styles.sheetRow, { borderColor: colors.border, backgroundColor: i % 2 ? colors.surface2 : 'transparent' }]}
                >
                  {COLS.map((c) => (
                    <Text
                      key={c.key}
                      numberOfLines={c.key === 'milestone' || c.key === 'remarks' ? 2 : 1}
                      style={[
                        styles.sheetCell,
                        {
                          width: c.width,
                          color: c.key === 'status' ? statusColor(STATUS_COLOR_KEY[st]) : colors.ink,
                          fontWeight: c.key === 'status' ? '700' : '400',
                          textAlign: c.num ? 'right' : 'left',
                          fontVariant: c.num ? ['tabular-nums'] : undefined,
                        },
                      ]}
                    >
                      {c.key === 'status' ? label.toUpperCase() : cells[c.key]}
                    </Text>
                  ))}
                </View>
              );
            })}
            <View style={[styles.sheetFooterRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[styles.sheetCell, { width: COLS[0].width + COLS[1].width + COLS[2].width + COLS[3].width + COLS[4].width + COLS[5].width, fontWeight: '700', color: colors.ink }]}>
                Total
              </Text>
              <Text style={[styles.sheetCell, { width: COLS[6].width, textAlign: 'right', fontWeight: '700', color: colors.ink }]}>
                {fmtMoney(totals.amount, currency, fxRate)}
              </Text>
              <Text style={[styles.sheetCell, { width: COLS[7].width, textAlign: 'right', fontWeight: '700', color: colors.ink }]}>
                {fmtMoney(totals.vat, currency, fxRate)}
              </Text>
              <Text style={[styles.sheetCell, { width: COLS[8].width, textAlign: 'right', fontWeight: '700', color: colors.ink }]}>
                {fmtMoney(totals.total, currency, fxRate)}
              </Text>
              <Text style={[styles.sheetCell, { width: COLS[9].width, textAlign: 'right', fontWeight: '700', color: colors.ink }]}>
                {fmtMoney(totals.paid, currency, fxRate)}
              </Text>
              <Text style={[styles.sheetCell, { width: COLS[10].width, textAlign: 'right', fontWeight: '700', color: colors.ink }]}>
                {fmtMoney(totals.outstanding, currency, fxRate)}
              </Text>
              <View style={{ width: COLS[11].width + COLS[12].width + COLS[13].width }} />
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.sheetHint}>
        <Icon name="filter" size={12} color={colors.inkFaint} />
        <Text style={{ color: colors.inkFaint, fontSize: 11, marginLeft: 5 }}>Scroll sideways to see every column.</Text>
      </View>
    </View>
  );
}

function daysUntilSafe(m: PaymentMilestone): number {
  if (!m.due_date) return 0;
  const dt = new Date(m.due_date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - today.getTime()) / 86400000);
}

export function PropertyDetailScreen({ route }: Props) {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate } = useAppData();
  const property = properties.find((p) => p.id === route.params.propertyId);

  if (!property) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyNote>Property not found.</EmptyNote>
      </View>
    );
  }

  const ms = milestones
    .filter((m) => m.property_id === property.id)
    .slice()
    .sort((a, b) => (a.milestone_no || 0) - (b.milestone_no || 0));

  const pct = paidPct(property);
  const resale = resaleEligibility(property);

  const pricingFacts: [string, string][] = [];
  if (property.unit_price_aed && Number(property.unit_price_aed) !== Number(property.total_unit_price_aed)) {
    pricingFacts.push(['Base price', fmtMoney(property.unit_price_aed, currency, fxRate)]);
  }
  pricingFacts.push(['Total unit price', fmtMoney(property.total_unit_price_aed, currency, fxRate)]);
  const psfBua = fmtPsf(property.ppsf_bua);
  if (psfBua) pricingFacts.push(['Price per sqft (BUA)', psfBua]);
  const psfPlot = fmtPsf(property.ppsf_plot);
  if (psfPlot) pricingFacts.push(['Price per sqft (Plot)', psfPlot]);

  const equityPhases: [string, number | null, number | null][] = [
    ['During construction', property.equity_construction_pct, property.equity_construction_aed],
    ['On handover', property.equity_handover_pct, property.equity_handover_aed],
    ['Post-handover', property.equity_posthandover_pct, property.equity_posthandover_aed],
  ].filter((row) => row[1] != null && Number(row[1]) > 0) as [string, number, number][];

  const hasAccelerated = property.accelerated_payment_aed != null && Number(property.accelerated_payment_aed) > 0;

  const owners: [string, number | null][] = [];
  if (property.owner1_name) owners.push([property.owner1_name, property.owner1_pct]);
  if (property.owner2_name) owners.push([property.owner2_name, property.owner2_pct]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <Card>
        <Text style={[styles.title, { color: colors.ink }]}>{property.project_name}</Text>
        <Text style={{ color: colors.inkDim, fontSize: 13, marginTop: 3 }}>
          {property.developer} · {property.location || ''} · Unit {property.unit_no || ''}
        </Text>

        <View style={styles.progressRow}>
          <ProgressBar pct={pct} />
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12, minWidth: 34, textAlign: 'right' }}>{pct}%</Text>
        </View>
        <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 5 }}>
          {fmtMoney(property.total_paid_aed, currency, fxRate)} paid of {fmtMoney(property.total_unit_price_aed, currency, fxRate)} ·{' '}
          {fmtMoney(property.total_pending_aed, currency, fxRate)} remaining
        </Text>

        <View style={styles.detailGrid}>
          <DetailItem label="Type" value={`${property.unit_type || '—'}${property.bedrooms ? ` · ${Math.trunc(property.bedrooms)} BR` : ''}`} />
          <DetailItem label="Size (BUA)" value={property.size_sqft ? `${Math.round(property.size_sqft).toLocaleString('en-US')} sqft` : '—'} />
          {property.plot_sqft ? <DetailItem label="Plot" value={`${Math.round(property.plot_sqft).toLocaleString('en-US')} sqft`} /> : null}
          <DetailItem label="Payment plan" value={property.payment_plan || '—'} />
          <DetailItem label="Purchase date" value={fmtDate(property.purchase_date)} />
          <DetailItem label="Handover" value={fmtDate(property.handover_date)} />
          <DetailItem label="Status" value={property.status} />
          <DetailItem label="Unit no." value={property.unit_no || '—'} />
        </View>

        {owners.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.kLabel, { color: colors.inkFaint }]}>OWNERSHIP</Text>
            <View style={styles.ownerChipRow}>
              {owners.map(([name, ownPct]) => (
                <View key={name} style={[styles.ownerChip, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}>
                  <View style={[styles.ownerDot, { backgroundColor: colors.accent }]}>
                    <Text style={{ color: colors.accentInk, fontSize: 10, fontWeight: '700' }}>{name[0]}</Text>
                  </View>
                  <Text style={{ color: colors.ink, fontSize: 12 }}>
                    {name} · {Math.round((ownPct || 0) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <SubHead icon="money">PRICING</SubHead>
        <View>
          {pricingFacts.map(([k, v]) => (
            <FactRow key={k} k={k} v={v} />
          ))}
        </View>

        {equityPhases.length > 0 && (
          <>
            <SubHead icon="percent">PAYMENT STRUCTURE</SubHead>
            <View>
              {equityPhases.map(([label, phasePct, phaseAed]) => (
                <FactRow key={label} k={label} v={`${fmtPct(phasePct)} · ${fmtMoney(phaseAed, currency, fxRate)}`} />
              ))}
            </View>
          </>
        )}

        {hasAccelerated && (
          <>
            <Text style={[styles.subheadTextPlain, { color: colors.inkFaint }]}>ACCELERATED PAYMENT</Text>
            <FactRow k="Accelerated payment" v={`${fmtPct(property.accelerated_payment_pct)} · ${fmtMoney(property.accelerated_payment_aed, currency, fxRate)}`} />
          </>
        )}

        <SubHead icon="resale">RESALE</SubHead>
        <View
          style={[
            styles.readinessBox,
            { borderColor: colors.border, backgroundColor: resale.eligible ? colors.goodSoft : colors.surface2, borderRadius: radii.md },
            resale.eligible && { borderColor: 'transparent' },
          ]}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: resale.eligible ? colors.good : colors.ink }}>
            {!resale.applicable ? 'Not resale-applicable' : resale.eligible ? 'Resale ready' : 'Not yet eligible to sell'}
          </Text>
          <Text style={{ fontSize: 12.5, color: resale.eligible ? colors.ink : colors.inkDim, marginTop: 5, lineHeight: 18 }}>
            {!resale.applicable
              ? "This unit's contract does not permit resale at this stage."
              : resale.eligible
              ? `${fmtPct(resale.paidPct)} paid, above the ${fmtPct(resale.reqPct)} required for a resale NOC.`
              : `${fmtPct(resale.paidPct)} paid — needs ${fmtPct(resale.reqPct)} paid to qualify for a resale NOC.`}
          </Text>
        </View>

        {property.offer_notes ? <DetailItem label="Offer / discount" value={property.offer_notes} style={{ marginTop: 16 }} /> : null}
        {property.remarks ? <DetailItem label="Remarks" value={property.remarks} style={{ marginTop: 14 }} /> : null}
      </Card>

      <Text style={[styles.header, { color: colors.inkFaint }]}>PAYMENT SCHEDULE ({ms.length} MILESTONES)</Text>
      {ms.length ? (
        <MilestoneTable milestones={ms} currency={currency} fxRate={fxRate} />
      ) : (
        <Card>
          <EmptyNote>No milestones on file.</EmptyNote>
        </Card>
      )}
    </ScrollView>
  );
}

function DetailItem({ label, value, style }: { label: string; value: string; style?: object }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text style={[styles.kLabel, { color: colors.inkFaint }]}>{label.toUpperCase()}</Text>
      <Text style={{ color: colors.ink, fontSize: 14.5, fontWeight: '700', marginTop: 3 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 21, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  kLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '700' },
  ownerChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  ownerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, paddingLeft: 5 },
  ownerDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subheadRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  subheadText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '700' },
  subheadTextPlain: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 9, borderTopWidth: 1 },
  readinessBox: { padding: 14, borderWidth: 1 },
  header: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22, marginBottom: 12 },
  sheetWrap: { borderWidth: 1, overflow: 'hidden' },
  sheetHeaderRow: { flexDirection: 'row' },
  sheetHeaderCell: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: '700', paddingVertical: 10, paddingHorizontal: 10 },
  sheetRow: { flexDirection: 'row', borderTopWidth: 1 },
  sheetCell: { fontSize: 12.5, paddingVertical: 10, paddingHorizontal: 10 },
  sheetFooterRow: { flexDirection: 'row', borderTopWidth: 2 },
  sheetHint: { flexDirection: 'row', alignItems: 'center', marginTop: 7, marginHorizontal: 2 },
});
