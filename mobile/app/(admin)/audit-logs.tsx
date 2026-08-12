import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { getAuditLogs } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { formatDateTime } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import type { AuditLogEntry } from '@/types';

const ACTION_COLORS: Record<string, string> = {
  CONFIRM_DEPOSIT: COLORS.emerald, REJECT_DEPOSIT: COLORS.red,
  CONFIRM_WITHDRAWAL: COLORS.blue, REJECT_WITHDRAWAL: COLORS.red,
  CREATE_ACCOUNTANT: COLORS.navy, UPDATE_PERMISSIONS: COLORS.amber,
  UPDATE_INTEREST_RATE: '#8b5cf6', SUSPEND_USER: COLORS.red, ACTIVATE_USER: COLORS.emerald,
};

export default function AuditLogsScreen() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() { setLogs(await getAuditLogs()); }
  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  return (
    <View style={styles.root}>
      <Header />
      <Text style={styles.pageTitle}>{t('admin.auditLogs.title')}</Text>
      <FlatList
        data={logs} keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="document-text-outline" title="No audit logs." />}
        renderItem={({ item: l }) => {
          const color = ACTION_COLORS[l.action] ?? COLORS.gray500;
          return (
            <View style={styles.item}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={styles.itemMain}>
                <View style={styles.itemTop}>
                  <View style={[styles.actionTag, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.actionText, { color }]}>{l.action.replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={styles.time}>{formatDateTime(l.timestamp)}</Text>
                </View>
                <Text style={styles.details} numberOfLines={2}>{l.details}</Text>
                <Text style={styles.user}>{l.userName} · <Text style={{ textTransform: 'capitalize' }}>{l.userRole}</Text></Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray900, padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  item: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  dot: { width: 4, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 },
  itemMain: { flex: 1 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  actionTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actionText: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 11, color: COLORS.gray400 },
  details: { fontSize: 13, color: COLORS.gray700, lineHeight: 18 },
  user: { fontSize: 12, color: COLORS.gray400, marginTop: 4 },
});
