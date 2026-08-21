import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { getActivePartnerBanks } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { COLORS } from '@/constants/config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { PartnerBank } from '@/types';

export default function ClientBanksScreen() {
  const { t } = useTranslation();
  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivePartnerBanks()
      .then(setBanks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <Header title={t('partnerBanksPage.title')} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.navy} />
        </View>
      ) : banks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={48} color={COLORS.gray200} />
          <Text style={styles.emptyText}>{t('partnerBanksPage.noBanks')}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>{t('partnerBanksPage.subtitle')}</Text>
          <FlatList
            data={banks}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Bank name + icon */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                    {item.icon ? (
                      <Image
                        source={{ uri: item.icon }}
                        style={styles.bankIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name="business" size={22} color={COLORS.navy} />
                    )}
                  </View>
                  <Text style={styles.bankName}>{item.name}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Account details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t('partnerBanksPage.accountName')}</Text>
                    <Text style={styles.detailValue}>{item.accountName}</Text>
                  </View>
                </View>
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.detailLabel}>{t('partnerBanksPage.accountNumber')}</Text>
                  <Text style={styles.accountNumber}>{item.accountNumber}</Text>
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.gray50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: COLORS.gray400, textAlign: 'center', marginTop: 12 },

  subtitle: {
    fontSize: 13, color: COLORS.gray500, paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 4, lineHeight: 18,
  },
  list: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.gray50,
    borderWidth: 1, borderColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  bankIcon: { width: 36, height: 36 },
  bankName: { fontSize: 16, fontWeight: '700', color: COLORS.navy, flex: 1 },

  divider: { height: 1, backgroundColor: COLORS.gray100, marginVertical: 12 },

  detailsRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flex: 1 },
  detailLabel: {
    fontSize: 10, color: COLORS.gray400, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 2,
  },
  detailValue: { fontSize: 13, fontWeight: '600', color: COLORS.gray700 },

  accountNumber: {
    fontSize: 20, fontWeight: '800', color: COLORS.navy,
    letterSpacing: 2, fontVariant: ['tabular-nums'],
  },
});
