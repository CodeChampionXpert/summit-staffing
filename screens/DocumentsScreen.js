/**
 * Summit Staffing – Documents Screen
 * Displays invoices as document cards with status badges.
 */
import React, { useEffect, useState, useCallback, createElement } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { api, ApiConfig, getAuthToken } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { Colors, Spacing, Typography, Radius, Shadows } from '../constants/theme.js';

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return Colors.status.success;
    case 'pending': case 'draft': return Colors.status.warning;
    case 'overdue': return Colors.status.error;
    default: return Colors.text.muted;
  }
};

export function DocumentsScreen({ navigation }) {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'worker';
  const [documents, setDocuments] = useState([]);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingType, setUploadingType] = useState('');

  const REQUIRED_WORKER_DOCS = [
    { key: 'id_card', label: 'ID Card' },
    { key: 'driving_license', label: 'Driving License' },
    { key: 'ndis_screening', label: 'NDIS Worker Screening' },
    { key: 'wwcc', label: 'Working With Children Check' },
    { key: 'police_check', label: 'Police Check' },
    { key: 'first_aid', label: 'First Aid Certificate' },
    { key: 'insurance', label: 'Insurance' },
  ];

  const loadDocuments = useCallback(async () => {
    try {
      if (isWorker) {
        const { data } = await api.get('/api/workers/me');
        if (data?.ok) {
          setWorker(data.worker || null);
          setDocuments(data.documents || []);
        }
      } else {
        const { data } = await api.get('/api/invoices');
        if (data?.ok) {
          setDocuments(data.invoices || []);
        }
      }
    } catch (e) {}
    setLoading(false);
  }, [isWorker]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  }, [loadDocuments]);

  const uploadSingleDocument = useCallback(async (documentType, fileLike) => {
    if (!worker?.id) {
      Alert.alert('Error', 'Worker profile not loaded yet');
      return;
    }

    setUploadingType(documentType);
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('file', fileLike);

      const token = getAuthToken();
      const response = await fetch(`${ApiConfig.baseURL}/api/workers/${worker.id}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || 'Failed to upload document');
      }

      Alert.alert('Uploaded', 'Document uploaded successfully.');
      await loadDocuments();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setUploadingType('');
    }
  }, [worker?.id, loadDocuments]);

  const pickAndUpload = useCallback((documentType) => {
    if (Platform.OS === 'web') return;
    launchImageLibrary(
      { mediaType: 'mixed', selectionLimit: 1 },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Unable to pick file');
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) return;
        await uploadSingleDocument(documentType, {
          uri: asset.uri,
          name: asset.fileName || `${documentType}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    );
  }, [uploadSingleDocument]);

  const renderWebUploadInput = (documentType) => {
    if (Platform.OS !== 'web') return null;
    return createElement('input', {
      type: 'file',
      accept: 'image/*,application/pdf',
      onChange: async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        await uploadSingleDocument(documentType, file);
        e.target.value = '';
      },
      style: {
        width: '100%',
        marginTop: 8,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {isWorker ? (
        <FlatList
          data={REQUIRED_WORKER_DOCS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xxl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.white }}>
                Worker Documents
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.xs }}>
                Upload all required documents. Other features stay locked until verification is complete.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const doc = (documents || []).find((d) => d.document_type === item.key);
            const status = doc?.status || 'not_uploaded';
            const statusColor = status === 'not_uploaded' ? Colors.text.muted : getStatusColor(status);
            const busy = uploadingType === item.key;
            return (
              <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, fontSize: Typography.fontSize.base }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: Colors.text.secondary, marginTop: 4, textTransform: 'capitalize' }}>
                      {status === 'not_uploaded' ? 'Not uploaded' : status}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: statusColor, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full }}>
                    <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase' }}>
                      {status === 'not_uploaded' ? 'missing' : status}
                    </Text>
                  </View>
                </View>

                {Platform.OS === 'web' ? (
                  renderWebUploadInput(item.key)
                ) : (
                  <Pressable
                    onPress={() => pickAndUpload(item.key)}
                    disabled={busy}
                    style={({ pressed }) => ({
                      marginTop: Spacing.md,
                      backgroundColor: busy ? Colors.text.muted : Colors.primary,
                      paddingVertical: Spacing.md,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold }}>
                      {busy ? 'Uploading...' : `Upload ${item.label}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
            ) : null
          }
        />
      ) : (
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View style={{ backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.white }}>
              Your Documents
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: Spacing.xs }}>
              View your invoices and service documents below.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, fontSize: Typography.fontSize.base }}>
                  {item.service_description || item.invoice_number || 'Document'}
                </Text>
                {item.service_date && (
                  <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: 4 }}>
                    {new Date(item.service_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={{ backgroundColor: getStatusColor(item.status), paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full }}>
                <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase' }}>
                  {item.status}
                </Text>
              </View>
            </View>
            {item.total != null && (
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginTop: Spacing.sm }}>
                ${parseFloat(item.total).toFixed(2)}
              </Text>
            )}
            {item.invoice_number && (
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, marginTop: 4 }}>
                Invoice #{item.invoice_number}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary }}>
                No documents yet
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                Your invoices and service documents will appear here once bookings are completed.
              </Text>
            </View>
          )
        }
      />
      )}
    </View>
  );
}
