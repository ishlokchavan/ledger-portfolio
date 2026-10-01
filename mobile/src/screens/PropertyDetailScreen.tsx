import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAppData } from '../context/AppDataContext';
import { Card, EmptyNote, Pill, ProgressBar, Segmented } from '../components/UI';
import { PropertyDetailSkeleton } from '../components/Skeleton';
import { Icon } from '../components/Icon';
import {
  daysUntil,
  fmtCompact,
  fmtDate,
  fmtMoney,
  fmtPct,
  fmtPsf,
  initials,
  milestoneState,
  nextMilestone,
  paidPct,
  plural,
  relDays,
  resaleEligibility,
  STATE_LABEL,
} from '../lib/format';
import type { PropertiesStackParamList } from '../navigation/types';
import type { MilestoneState, PaymentMilestone, Property } from '../types';

type Props = NativeStackScreenProps<PropertiesStackParamList, 'PropertyDetail'>;

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

function MilestoneTable({ milestones, currency, fxRate }: { milestones: PaymentMilestone[]; currency: string; fxRate: number }) {
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

type TabId = 'overview' | 'schedule' | 'financials' | 'details';
const parse = (d: string | null | undefined) => (d ? new Date(d + 'T00:00:00') : null);
const monthYear = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
const byDueDate = (a: PaymentMilestone, b: PaymentMilestone) =>
  new Date(a.due_date || '2099-01-01').getTime() - new Date(b.due_date || '2099-01-01').getTime();
const amt = (m: PaymentMilestone) => Number(m.amount_aed || 0);
const sumOf = (l: PaymentMilestone[]) => l.reduce((a, m) => a + amt(m), 0);

/** Cumulative-payments step chart: solid = paid, dashed = scheduled, with today/handover/NOC markers. */
function JourneyChart({
  property,
  milestones,
  resale,
  money,
  compact,
}: {
  property: Property;
  milestones: PaymentMilestone[];
  resale: ReturnType<typeof resaleEligibility>;
  money: (v: number | null | undefined) => string;
  compact: (v: number | null | undefined) => string;
}) {
  const { colors, radii } = useTheme();
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const dated = milestones.filter((m) => m.due_date).sort(byDueDate);
  if (dated.length < 2) return null;

  const H = 170, L = 34, R = 6, T = 22, B = 4;
  const iw = Math.max(0, w - L - R), ih = H - T - B;
  const denom = Math.max(Number(property.total_unit_price_aed || 0), sumOf(milestones)) || 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = parse(dated[0].due_date)!, last = parse(dated[dated.length - 1].due_date)!, ho = parse(property.handover_date);
  let t0 = parse(property.purchase_date) || first;
  if (t0 > first) t0 = first;
  const t1 = new Date(Math.max(last.getTime(), ho ? ho.getTime() : 0, today.getTime()));
  const span = t1.getTime() - t0.getTime() || 1;
  const X = (d: Date) => L + Math.min(1, Math.max(0, (d.getTime() - t0.getTime()) / span)) * iw;
  const Y = (v: number) => T + (1 - Math.min(1, v / denom)) * ih;

  const paid = dated.filter((m) => m.status === 'Paid');
  const open = dated.filter((m) => m.status !== 'Paid');
  let cum = 0;
  let act = `M${L},${Y(0)}`;
  const dots: { x: number; y: number; kind: 'paid' | 'open' | 'late'; m: PaymentMilestone; cum: number }[] = [];
  paid.forEach((m) => {
    cum += amt(m);
    const x = X(parse(m.due_date)!);
    act += ` H${x} V${Y(cum)}`;
    dots.push({ x, y: Y(cum), kind: 'paid', m, cum });
  });
  const xt = X(today);
  act += ` H${xt}`;
  const fill = `${act} V${Y(0)} Z`;
  let proj = `M${xt},${Y(cum)}`;
  open.forEach((m) => {
    cum += amt(m);
    const d = parse(m.due_date)!;
    const x = Math.max(X(d), xt);
    proj += ` H${x} V${Y(cum)}`;
    dots.push({ x, y: Y(cum), kind: d < today ? 'late' : 'open', m, cum });
  });
  proj += ` H${L + iw}`;
  const pick = (x: number) => {
    let best = -1;
    let bd = Infinity;
    dots.forEach((d, i) => {
      const dist = Math.abs(d.x - x);
      if (dist < bd) {
        bd = dist;
        best = i;
      }
    });
    setSel(best >= 0 ? best : null);
  };
  const noc = resale.applicable && resale.reqPct ? Y(resale.reqPct * Number(property.total_unit_price_aed || 0)) : null;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {[0, 50, 100].map((v) => (
            <G key={v}>
              <Line x1={L} x2={L + iw} y1={Y((v / 100) * denom)} y2={Y((v / 100) * denom)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={L - 6} y={Y((v / 100) * denom) + 3.5} fontSize={10} fontWeight="600" fill={colors.inkFaint} textAnchor="end">{`${v}%`}</SvgText>
            </G>
          ))}
          {noc != null && (
            <G>
              <Line x1={L} x2={L + iw} y1={noc} y2={noc} stroke={colors.good} strokeWidth={1.5} strokeDasharray="4 4" />
              <SvgText x={L + iw} y={noc - 5} fontSize={10} fontWeight="700" fill={colors.good} textAnchor="end">{`Resale NOC ${Math.round((resale.reqPct || 0) * 100)}%`}</SvgText>
            </G>
          )}
          <Path d={fill} fill={colors.accentSoft} />
          <Path d={proj} fill="none" stroke={colors.inkFaint} strokeWidth={2} strokeDasharray="5 4" />
          <Path d={act} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" />
          {ho && ho >= t0 && ho <= t1 && (
            <G>
              <Line x1={X(ho)} x2={X(ho)} y1={T - 4} y2={T + ih} stroke={colors.info} strokeWidth={1.5} strokeDasharray="3 3" />
              <SvgText x={X(ho)} y={11} fontSize={10} fontWeight="700" fill={colors.info} textAnchor="end">Handover</SvgText>
            </G>
          )}
          <Line x1={xt} x2={xt} y1={T - 4} y2={T + ih} stroke={colors.ink} strokeWidth={1.5} />
          <SvgText x={xt} y={11} fontSize={10} fontWeight="700" fill={colors.ink} textAnchor="middle">Today</SvgText>
          {sel != null && dots[sel] && <Line x1={dots[sel].x} x2={dots[sel].x} y1={T - 4} y2={T + ih} stroke={colors.accent} strokeWidth={1} />}
          {dots.map((d, i) => (
            <Circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={sel === i ? 7 : 4.5}
              fill={d.kind === 'paid' ? colors.accent : d.kind === 'late' ? colors.bad : colors.surface}
              stroke={d.kind === 'paid' ? colors.accent : d.kind === 'late' ? colors.bad : colors.inkFaint}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
      {w > 0 && (
        // Transparent overlay: tap or drag anywhere on the chart to snap to the nearest milestone.
        <View
          style={{ position: 'absolute', left: 0, top: 0, width: w, height: H }}
          onTouchStart={(e) => pick(e.nativeEvent.locationX)}
          onTouchMove={(e) => pick(e.nativeEvent.locationX)}
          accessible
          accessibilityLabel="Payment journey chart. Tap or drag to inspect milestones."
        />
      )}
      {sel != null && dots[sel] && w > 0 && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 190,
            left: Math.max(0, Math.min(w - 190, dots[sel].x - 95)),
            top: Math.max(0, dots[sel].y - 92),
            padding: 10,
            borderRadius: radii.md,
            backgroundColor: colors.ink,
          }}
        >
          <Text style={{ color: colors.bg, fontSize: 12.5, fontWeight: '700' }} numberOfLines={2}>{dots[sel].m.milestone_event}</Text>
          <Text style={{ color: colors.bg, opacity: 0.8, fontSize: 11.5, marginTop: 2 }}>
            {fmtDate(dots[sel].m.due_date)} · {dots[sel].kind === 'paid' ? 'Paid' : dots[sel].kind === 'late' ? 'Overdue' : 'Scheduled'}
          </Text>
          <Text style={{ color: colors.bg, opacity: 0.8, fontSize: 11.5, marginTop: 2 }}>
            {dots[sel].kind === 'paid' ? 'Paid' : 'Due'} {money(amt(dots[sel].m))}
          </Text>
          <Text style={{ color: colors.bg, opacity: 0.8, fontSize: 11.5 }}>
            Cumulative {Math.round(Math.min(1, dots[sel].cum / denom) * 100)}% · {compact(dots[sel].cum)}
          </Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: L, marginTop: 6 }}>
        <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '600' }}>{monthYear(t0)}</Text>
        <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '600' }}>{monthYear(t1)}</Text>
      </View>
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Icon>['name']; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card style={{ padding: 0, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 }}>
        <Icon name={icon} size={14} color={colors.inkFaint} />
        <Text style={{ color: colors.inkFaint, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}>{title}</Text>
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>{children}</View>
    </Card>
  );
}

export function PropertyDetailScreen({ route }: Props) {
  const { colors, radii } = useTheme();
  const { properties, milestones, currency, fxRate, loading } = useAppData();
  const [tab, setTab] = useState<TabId>('overview');
  const [view, setView] = useState<'grouped' | 'table'>('grouped');

  const property = properties.find((p) => p.id === route.params.propertyId);
  const ms = useMemo(
    () => milestones.filter((m) => m.property_id === route.params.propertyId).sort((a, b) => (a.milestone_no || 0) - (b.milestone_no || 0)),
    [milestones, route.params.propertyId]
  );

  if (!property) {
    if (loading) {
      return (
        <ScrollView style={{ backgroundColor: colors.bg }}>
          <PropertyDetailSkeleton />
        </ScrollView>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24 }}>
        <EmptyNote>Property not found.</EmptyNote>
      </View>
    );
  }

  const money = (v: number | null | undefined) => fmtMoney(v, currency, fxRate);
  const compact = (v: number | null | undefined) => fmtCompact(v, currency, fxRate);
  const pct = paidPct(property);
  const resale = resaleEligibility(property);
  const buckets: Record<MilestoneState, PaymentMilestone[]> = { overdue: [], soon: [], upcoming: [], undecided: [], paid: [] };
  ms.forEach((m) => buckets[milestoneState(m)].push(m));
  const next = nextMilestone(ms, property.id);
  const nextState = next ? milestoneState(next) : null;
  const nd = next ? daysUntil(next.due_date) : null;
  const hoDays = daysUntil(property.handover_date);
  const paidAmt = Number(property.total_paid_aed || 0);
  const pendAmt = Number(property.total_pending_aed || 0);

  // Reconcile the segmented bar with the headline paid / remaining numbers.
  const openStates: [MilestoneState, string, string][] = [
    ['overdue', 'Overdue', colors.bad],
    ['soon', 'Due in 30 days', colors.warn],
    ['upcoming', 'Upcoming', colors.surface3],
    ['undecided', 'Date TBC', colors.borderStrong],
  ];
  const openRaw = openStates.reduce((a, [k]) => a + sumOf(buckets[k]), 0);
  const scale = openRaw > 0 ? pendAmt / openRaw : 0;
  const segs: { label: string; color: string; amt: number }[] = [{ label: 'Paid', color: colors.accent, amt: paidAmt }];
  if (openRaw > 0) openStates.forEach(([k, label, color]) => buckets[k].length && segs.push({ label, color, amt: sumOf(buckets[k]) * scale }));
  else if (pendAmt > 0) segs.push({ label: 'Remaining', color: colors.surface3, amt: pendAmt });
  const segList = segs.filter((s) => s.amt > 0);
  const segTotal = segList.reduce((a, s) => a + s.amt, 0);

  // Resale forecast: first future milestone at which cumulative paid crosses the NOC threshold.
  let forecast: { date: string; event: string } | null = null;
  if (resale.applicable && !resale.eligible) {
    const need = (resale.reqPct || 0) * Number(property.total_unit_price_aed || 0);
    let acc = paidAmt;
    for (const m of ms.filter((x) => x.status !== 'Paid' && x.due_date).sort(byDueDate)) {
      acc += amt(m);
      if (acc >= need) {
        forecast = { date: m.due_date!, event: m.milestone_event };
        break;
      }
    }
  }
  const needMore = Math.max(0, (resale.reqPct || 0) * Number(property.total_unit_price_aed || 0) - paidAmt);

  const cumShare = (() => {
    const total = sumOf(ms) || 1;
    let acc = 0;
    const out: Record<string, number> = {};
    ms.forEach((m) => {
      acc += amt(m);
      out[m.id] = acc / total;
    });
    return out;
  })();

  const onShare = () => {
    const lines = [
      `${property.project_name} — ${property.developer || ''}${property.location ? ` (${property.location})` : ''}`,
      `Price ${money(property.total_unit_price_aed)} · Paid ${pct}% (${money(paidAmt)}) · Remaining ${money(pendAmt)}`,
    ];
    if (next) lines.push(`Next payment: ${next.milestone_event} — ${fmtDate(next.due_date)} (${money(amt(next))})`);
    if (property.handover_date) lines.push(`Handover: ${fmtDate(property.handover_date)}`);
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const stateColor = (s: MilestoneState | null) => (s === 'overdue' ? colors.bad : s === 'soon' ? colors.warn : colors.ink);
  const owners = [
    [property.owner1_name, property.owner1_pct],
    [property.owner2_name, property.owner2_pct],
  ].filter((o) => o[0]) as [string, number | null][];

  const TABS: [TabId, string, string?][] = [
    ['overview', 'Overview'],
    ['schedule', 'Schedule', `${buckets.paid.length}/${ms.length}`],
    ['financials', 'Financials'],
    ['details', 'Details'],
  ];

  const Stat = ({ k, v, s, color }: { k: string; v: string; s: string; color?: string }) => (
    <View style={{ width: '50%', paddingVertical: 12, paddingHorizontal: 4 }}>
      <Text style={{ color: colors.inkFaint, fontSize: 11.5, fontWeight: '600' }}>{k}</Text>
      <Text style={{ color: color ?? colors.ink, fontSize: 17, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>{v}</Text>
      <Text style={{ color: colors.inkDim, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{s}</Text>
    </View>
  );

  const ScheduleRow = ({ m }: { m: PaymentMilestone }) => {
    const st = milestoneState(m);
    const d = daysUntil(m.due_date);
    const dt = parse(m.due_date);
    const isNext = next?.id === m.id;
    const cum = Math.round((cumShare[m.id] || 0) * 100);
    const tag = st === 'overdue' ? `${Math.abs(d ?? 0)}d overdue` : st === 'soon' || isNext ? relDays(d) : '';
    return (
      <View style={[styles2.mrow, { borderColor: colors.border, backgroundColor: isNext ? colors.accentSoft : 'transparent' }]}>
        <View style={{ width: 46, alignItems: 'center' }}>
          {st === 'paid' ? (
            <Icon name="check" size={20} color={colors.good} />
          ) : (
            <Text style={{ color: dt ? colors.ink : colors.inkFaint, fontSize: 18, fontWeight: '700' }}>{dt ? dt.getDate() : '—'}</Text>
          )}
          <Text style={{ color: colors.inkFaint, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', marginTop: 3 }}>
            {st === 'paid' ? 'paid' : dt ? dt.toLocaleDateString('en-US', { month: 'short' }) + ' ' + String(dt.getFullYear()).slice(2) : 'TBC'}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: st === 'paid' ? colors.inkDim : colors.ink, fontSize: 14, fontWeight: '600' }}>{m.milestone_event}</Text>
          <Text style={{ color: colors.inkDim, fontSize: 12, marginTop: 3 }}>
            {tag ? <Text style={{ color: st === 'overdue' ? colors.bad : st === 'soon' ? colors.warn : colors.accent, fontWeight: '700' }}>{tag} · </Text> : null}
            {m.pct != null ? `${fmtPct(m.pct)} of price · ` : ''}
            {cum}% cumulative
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{money(m.amount_aed)}</Text>
          <Text style={{ color: colors.inkFaint, fontSize: 11.5 }}>+ VAT {compact(m.vat_aed)}</Text>
        </View>
      </View>
    );
  };

  const kv = (rows: [string, string, boolean?][]) =>
    rows.map(([k, v, strong], i) => (
      <View key={k} style={[styles2.kv, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
        <Text style={{ color: strong ? colors.ink : colors.inkDim, fontSize: 13.5, fontWeight: strong ? '700' : '400', flexShrink: 1 }}>{k}</Text>
        <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: strong ? '700' : '600', textAlign: 'right' }}>{v}</Text>
      </View>
    ));

  const totals = ms.reduce(
    (a, m) => ({
      amount: a.amount + Number(m.amount_aed || 0),
      vat: a.vat + Number(m.vat_aed || 0),
      total: a.total + Number(m.total_aed || 0),
      paid: a.paid + Number(m.paid_aed || 0),
      out: a.out + Number(m.outstanding_aed || 0),
    }),
    { amount: 0, vat: 0, total: 0, paid: 0, out: 0 }
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 56 }} stickyHeaderIndices={[2]}>
      {/* 0 — header */}
      <View>
        <Text style={{ color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 }}>{property.project_name}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <Icon name="developer" size={14} color={colors.inkFaint} />
          <Text style={{ color: colors.inkDim, fontSize: 14 }}> {property.developer || '—'}   </Text>
          <Icon name="location" size={14} color={colors.inkFaint} />
          <Text style={{ color: colors.inkDim, fontSize: 14 }}> {property.location || '—'}</Text>
          {property.unit_no ? <Text style={{ color: colors.inkDim, fontSize: 14 }}>   ·   Unit {property.unit_no}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          <Pill label={property.status || '—'} tone="neutral" />
          {resale.eligible && <Pill label="Resale ready" tone="good" />}
          {property.payment_plan ? <Pill label={`Plan ${property.payment_plan}`} tone="neutral" /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onShare}
            accessibilityRole="button"
            style={[styles2.ghostBtn, { borderColor: colors.borderStrong, borderRadius: radii.md }]}
          >
            <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>Share summary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1 — summary card */}
      <Card style={{ padding: 20, marginTop: 16, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }} numberOfLines={1} adjustsFontSizeToFit>{money(paidAmt)}</Text>
            <Text style={{ color: colors.inkDim, fontSize: 13.5, marginTop: 6 }}>paid of {money(property.total_unit_price_aed)}</Text>
          </View>
          <Pill label={`${pct}% paid`} tone="accent" />
        </View>
        {segTotal > 0 ? (
          <>
            <View style={{ flexDirection: 'row', gap: 3, height: 12, marginTop: 16, borderRadius: 99, overflow: 'hidden' }}>
              {segList.map((s) => (
                <Pressable
                  key={s.label}
                  onPress={() => setTab('schedule')}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.label} ${money(s.amt)}. Open schedule`}
                  style={{ flex: Math.max(s.amt, segTotal * 0.01), backgroundColor: s.color }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 12 }}>
              {segList.map((s) => (
                <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: s.color }} />
                  <Text style={{ color: colors.inkDim, fontSize: 12.5 }}>
                    {s.label} <Text style={{ color: colors.ink, fontWeight: '700' }}>{compact(s.amt)}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ marginTop: 16 }}>
            <ProgressBar pct={pct} height={12} />
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, borderTopWidth: 1, borderColor: colors.border }}>
          <Stat k="Remaining" v={compact(pendAmt)} s={ms.length ? `${plural(ms.length - buckets.paid.length, 'milestone')} left` : pendAmt > 0 ? 'no schedule added yet' : 'nothing left'} />
          <Stat
            k="Next payment"
            v={next ? relDays(nd) : buckets.undecided.length ? 'Date TBC' : 'None'}
            s={next ? `${compact(amt(next))} · ${fmtDate(next.due_date)}` : '—'}
            color={stateColor(nextState)}
          />
          <Stat k="Handover" v={property.handover_date ? (hoDays !== null && hoDays >= 0 ? relDays(hoDays).replace('In ', '') : 'Handed over') : '—'} s={fmtDate(property.handover_date)} />
          <Stat k="Resale" v={resale.unknown ? 'Not recorded' : !resale.applicable ? 'Not allowed' : resale.eligible ? 'Eligible' : 'Not yet'} s={resale.applicable ? `NOC at ${fmtPct(resale.reqPct)} paid` : resale.unknown ? 'NOC terms not added' : 'Per contract'} />
        </View>
      </Card>

      {/* 2 — sticky tab bar */}
      <View style={{ backgroundColor: colors.bg, marginHorizontal: -16, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map(([id, label, badge]) => {
            const active = tab === id;
            return (
              <TouchableOpacity key={id} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles2.tab}>
                <Text style={{ color: active ? colors.ink : colors.inkDim, fontWeight: '700', fontSize: 14 }}>{label}</Text>
                {badge ? (
                  <View style={{ backgroundColor: colors.surface3, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 }}>
                    <Text style={{ color: colors.inkDim, fontSize: 11, fontWeight: '700' }}>{badge}</Text>
                  </View>
                ) : null}
                {active && <View style={{ position: 'absolute', left: 8, right: 8, bottom: -1, height: 2.5, borderRadius: 2, backgroundColor: colors.ink }} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3 — tab body */}
      <View style={{ marginTop: 16 }}>
        {tab === 'overview' && (
          <>
            <Card style={{ padding: 20, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>Next payment</Text>
                {next && nd !== null && <Pill label={nextState === 'overdue' ? `${Math.abs(nd)} days overdue` : relDays(nd)} tone={nextState === 'overdue' ? 'bad' : nextState === 'soon' ? 'warn' : 'neutral'} />}
              </View>
              {next ? (
                <>
                  <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 12 }}>{next.milestone_event}</Text>
                  <Text style={{ color: colors.inkDim, fontSize: 13.5, marginTop: 4 }}>
                    Due {fmtDate(next.due_date)}
                    {next.pct != null ? ` · ${fmtPct(next.pct)} of price` : ''}
                  </Text>
                  <Text style={{ color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 14 }}>
                    {money(amt(next))} <Text style={{ color: colors.inkDim, fontSize: 12.5, fontWeight: '500' }}>+ VAT {money(next.vat_aed)}</Text>
                  </Text>
                </>
              ) : (
                <Text style={{ color: colors.inkDim, fontSize: 14, marginTop: 12, lineHeight: 21 }}>
                  {buckets.undecided.length
                    ? `${plural(buckets.undecided.length, 'remaining milestone')} still waiting for a confirmed due date.`
                    : ms.length === 0 && pendAmt > 0
                      ? 'No payment schedule has been added for this unit yet, so there is no next payment to show.'
                      : 'Everything on this unit is paid. Nothing further is due.'}
                </Text>
              )}
            </Card>

            {dated(ms) && (
              <SectionCard title="Payment journey" icon="money">
                <Text style={{ color: colors.inkDim, fontSize: 12.5, marginBottom: 8 }}>Cumulative share of the price paid over time. Tap or drag to inspect.</Text>
                <JourneyChart property={property} milestones={ms} resale={resale} money={money} compact={compact} />
              </SectionCard>
            )}

            <SectionCard title="Resale readiness" icon="resale">
              {!resale.applicable ? (
                <Text style={{ color: colors.inkDim, fontSize: 13.5, lineHeight: 20, marginTop: 8 }}>{resale.unknown
                    ? 'Resale terms are not recorded. Add the developer’s resale NOC requirement to see eligibility and a forecast date.'
                    : 'This unit’s contract does not allow resale at this stage.'}</Text>
              ) : (
                <>
                  <View style={{ marginTop: 28 }}>
                    <View style={{ height: 12, borderRadius: 99, backgroundColor: colors.surface3 }}>
                      <View style={{ width: `${Math.min(100, (resale.paidPct || 0) * 100)}%`, height: '100%', borderRadius: 99, backgroundColor: colors.accent }} />
                      <View style={{ position: 'absolute', left: `${Math.min(100, (resale.reqPct || 0) * 100)}%`, top: -6, bottom: -6, width: 2, backgroundColor: colors.ink }}>
                        <Text style={{ position: 'absolute', top: -18, left: -28, width: 58, textAlign: 'center', color: colors.ink, fontSize: 10.5, fontWeight: '700' }}>
                          {`NOC ${fmtPct(resale.reqPct)}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '600', marginTop: 8 }}>{fmtPct(resale.paidPct)} paid</Text>
                  </View>
                  <View style={[styles2.callout, { backgroundColor: resale.eligible ? colors.goodSoft : colors.surface2, borderRadius: radii.md }]}>
                    <Text style={{ color: resale.eligible ? colors.good : colors.ink, fontSize: 14, fontWeight: '700' }}>{resale.eligible ? 'Resale ready' : 'Not yet eligible'}</Text>
                    <Text style={{ color: colors.inkDim, fontSize: 13, lineHeight: 19, marginTop: 3 }}>
                      {resale.eligible
                        ? 'You can request a resale NOC today.'
                        : forecast
                          ? `On the current schedule you qualify after ${forecast.event} (${fmtDate(forecast.date)}). About ${money(needMore)} more to pay.`
                          : `No dated milestone gets you there yet — some payments still need due dates. About ${money(needMore)} more to pay.`}
                    </Text>
                  </View>
                </>
              )}
            </SectionCard>

            {(property.offer_notes || property.remarks) && (
              <SectionCard title="Notes" icon="filter">
                {property.offer_notes ? (
                  <Text style={styles2.note}>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>Offer / discount{'\n'}</Text>
                    <Text style={{ color: colors.inkDim }}>{property.offer_notes}</Text>
                  </Text>
                ) : null}
                {property.remarks ? (
                  <Text style={styles2.note}>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>Remarks{'\n'}</Text>
                    <Text style={{ color: colors.inkDim }}>{property.remarks}</Text>
                  </Text>
                ) : null}
              </SectionCard>
            )}
          </>
        )}

        {tab === 'schedule' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>{buckets.paid.length} of {ms.length} milestones paid</Text>
                <Text style={{ color: colors.inkDim, fontSize: 12.5, marginTop: 2 }}>{compact(paidAmt)} paid · {compact(pendAmt)} remaining</Text>
              </View>
              <Segmented value={view} onChange={setView} options={[{ id: 'grouped', label: 'Grouped' }, { id: 'table', label: 'Table' }]} />
            </View>
            {!ms.length ? (
              <Card><EmptyNote>No milestones on file.</EmptyNote></Card>
            ) : view === 'table' ? (
              <MilestoneTable milestones={ms} currency={currency} fxRate={fxRate} />
            ) : (
              (
                [
                  ['overdue', 'Overdue', colors.bad],
                  ['soon', 'Due in the next 30 days', colors.warn],
                  ['upcoming', 'Later', colors.info],
                  ['undecided', 'Date to be confirmed', colors.inkFaint],
                  ['paid', 'Paid', colors.good],
                ] as [MilestoneState, string, string][]
              )
                .filter(([k]) => buckets[k].length)
                .map(([k, label, color]) => {
                  const list = buckets[k].slice().sort(byDueDate);
                  if (k === 'paid') list.reverse();
                  return (
                    <Card key={k} style={{ padding: 0, marginBottom: 14, overflow: 'hidden' }}>
                      <View style={styles2.grpHead}>
                        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
                        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{label}</Text>
                        <Text style={{ color: colors.inkFaint, fontSize: 12.5 }}>{list.length}</Text>
                        <Text style={{ marginLeft: 'auto', color: colors.ink, fontSize: 13.5, fontWeight: '700' }}>{compact(sumOf(list))}</Text>
                      </View>
                      {list.map((m) => (
                        <ScheduleRow key={m.id} m={m} />
                      ))}
                    </Card>
                  );
                })
            )}
          </>
        )}

        {tab === 'financials' && (
          <>
            <SectionCard title="Price" icon="money">
              {kv(
                [
                  property.unit_price_aed && Number(property.unit_price_aed) !== Number(property.total_unit_price_aed) ? (['Base price', money(property.unit_price_aed)] as [string, string]) : null,
                  ['Total unit price', money(property.total_unit_price_aed), true] as [string, string, boolean],
                  fmtPsf(property.ppsf_bua) ? (['Price per sqft (BUA)', fmtPsf(property.ppsf_bua)!] as [string, string]) : null,
                  fmtPsf(property.ppsf_plot) ? (['Price per sqft (plot)', fmtPsf(property.ppsf_plot)!] as [string, string]) : null,
                  property.accelerated_payment_aed != null && Number(property.accelerated_payment_aed) > 0
                    ? (['Accelerated payment', `${fmtPct(property.accelerated_payment_pct)} · ${money(property.accelerated_payment_aed)}`] as [string, string])
                    : null,
                ].filter(Boolean) as [string, string, boolean?][]
              )}
            </SectionCard>
            {ms.length > 0 && (
              <SectionCard title="Schedule totals" icon="payments">
                {kv([
                  ['Installments (ex-VAT)', money(totals.amount)],
                  ['VAT', money(totals.vat)],
                  ['Total payable', money(totals.total), true],
                  ['Paid to date', money(totals.paid)],
                  ['Outstanding', money(totals.out), true],
                ])}
              </SectionCard>
            )}
            {(() => {
              const phases = [
                ['During construction', property.equity_construction_pct, property.equity_construction_aed, colors.accent],
                ['On handover', property.equity_handover_pct, property.equity_handover_aed, colors.info],
                ['Post-handover', property.equity_posthandover_pct, property.equity_posthandover_aed, colors.warn],
              ].filter((r) => r[1] != null && Number(r[1]) > 0) as [string, number, number | null, string][];
              if (!phases.length) return null;
              return (
                <SectionCard title="Payment structure" icon="percent">
                  <View style={{ flexDirection: 'row', height: 12, borderRadius: 99, overflow: 'hidden', gap: 2, marginTop: 10, backgroundColor: colors.surface3 }}>
                    {phases.map((r) => (
                      <View key={r[0]} style={{ flex: Number(r[1]), backgroundColor: r[3] }} />
                    ))}
                  </View>
                  {phases.map((r) => (
                    <View key={r[0]} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                      <Text style={{ color: colors.inkDim, fontSize: 13 }}>
                        <Text style={{ color: r[3] }}>● </Text>
                        {r[0]}
                      </Text>
                      <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>{fmtPct(r[1])} · {money(r[2])}</Text>
                    </View>
                  ))}
                </SectionCard>
              );
            })()}
            {owners.length > 0 && (
              <SectionCard title="Who pays what" icon="users">
                {owners.map(([name, share], i) => {
                  const f = Number(share || 0);
                  return (
                    <View key={name} style={[{ paddingVertical: 12 }, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{name}</Text>
                        <Text style={{ color: colors.inkDim, fontSize: 13 }}>{Math.round(f * 100)}% share</Text>
                      </View>
                      <Text style={{ color: colors.inkDim, fontSize: 12.5, marginTop: 4 }}>
                        Paid {money(paidAmt * f)} · Remaining {money(pendAmt * f)}
                        {next ? ` · Next ${money(amt(next) * f)}` : ''}
                      </Text>
                    </View>
                  );
                })}
                <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 4 }}>Split by ownership percentage. Actual contributions may differ.</Text>
              </SectionCard>
            )}
          </>
        )}

        {tab === 'details' && (
          <>
            <SectionCard title="Unit details" icon="properties">
              {kv(
                [
                  ['Project', property.project_name],
                  ['Developer', property.developer || '—'],
                  ['Location', property.location || '—'],
                  ['Unit no.', property.unit_no || '—'],
                  ['Type', `${property.unit_type || '—'}${property.bedrooms ? ` · ${Math.trunc(property.bedrooms)} BR` : ''}`],
                  ['Size (BUA)', property.size_sqft ? `${Math.round(property.size_sqft).toLocaleString('en-US')} sqft` : '—'],
                  property.plot_sqft ? (['Plot', `${Math.round(property.plot_sqft).toLocaleString('en-US')} sqft`] as [string, string]) : null,
                  ['Status', property.status || '—'],
                  ['Payment plan', property.payment_plan || '—'],
                  ['Purchased', fmtDate(property.purchase_date)],
                  ['Handover', fmtDate(property.handover_date)],
                ].filter(Boolean) as [string, string][]
              )}
            </SectionCard>
            {owners.length > 0 && (
              <SectionCard title="Ownership" icon="users">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {owners.map(([name, share]) => (
                    <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface2, borderRadius: 99, padding: 5, paddingRight: 12 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.bg, fontSize: 11, fontWeight: '700' }}>{initials(name)}</Text>
                      </View>
                      <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>
                        {name} <Text style={{ color: colors.inkDim, fontWeight: '400' }}>{Math.round(Number(share || 0) * 100)}%</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function dated(ms: PaymentMilestone[]): boolean {
  return ms.filter((m) => m.due_date).length >= 2;
}

const styles2 = StyleSheet.create({
  tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 14 },
  ghostBtn: { borderWidth: 1, paddingHorizontal: 14, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 11 },
  callout: { padding: 14, marginTop: 16 },
  note: { fontSize: 13.5, lineHeight: 20, marginTop: 10 },
  grpHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14 },
  mrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1 },
});

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
