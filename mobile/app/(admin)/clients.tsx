import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { getClients, getDeposits, getInvestments } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { formatCurrency, getInitials, toNumber } from '@/lib/utils';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { User, Deposit, Investment } from '@/types';

export default function AdminClientsScreen() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [c, d, i] = await Promise.all([getClients(), getDeposits(false), getInvestments(false)]);
    setClients(c); setDeposits(d); setInvestments(i);
  }

  useEffect(() => { load(); }, []);
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const filtered = clients.filter((c) =>
    query.trim() ? c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()) : true
  );

  function stats(id: string) {
    const total = deposits.filter((d) => d.clientId === id && d.status === 'confirmed').reduce((s, d) => s + toNumber(d.amount), 0);
    const active = investments.filter((i) => i.clientId === id && i.status === 'active').length;
    return { total, active };
  }

  return (
    <View style={styles.root}>
      <Header />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={COLORS.gray400} style={styles.searchIcon} />
        <TextInput style={styles.search} placeholder={t('admin.clients.searchPlaceholder')} value={query} onChangeText={setQuery} placeholderTextColor={COLORS.gray400} />
      </View>
      <FlatList
        data={filtered} keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState icon="people-outline" title={t('admin.clients.noClients')} />}
        renderItem={({ item: c }) => {
          const s = stats(c.id);
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/(admin)/client-detail', params: { id: c.id } })}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(c.name)}</Text></View>
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.email}>{c.email}</Text>
                </View>
                <StatusBadge status={c.status} />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={styles.statLabel}>{t('admin.clients.totalInvested')}</Text><Text style={styles.statVal}>{(s.total / 1_000_000).toFixed(1)}M BIF</Text></View>
                <View style={styles.stat}><Text style={styles.statLabel}>{t('admin.clients.activeInvestments')}</Text><Text style={styles.statVal}>{s.active}</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray200, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.gray900 },
  list: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.gray900 },
  email: { fontSize: 12, color: COLORS.gray400, marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: {},
  statLabel: { fontSize: 11, color: COLORS.gray400 },
  statVal: { fontSize: 13, fontWeight: '700', color: COLORS.gray700, marginTop: 2 },
});
