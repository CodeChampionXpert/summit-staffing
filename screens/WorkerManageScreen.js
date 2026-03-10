/**
 * Summit Staffing – Worker Management Screen
 * Skills, Documents, Availability, all from Profile tab
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { Colors, Spacing, Typography, Radius, Shadows } from '../constants/theme.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOC_TYPES = [
  { key: 'ndis_screening', label: 'NDIS Worker Screening' },
  { key: 'wwcc', label: 'Working With Children Check' },
  { key: 'police_check', label: 'Police Check' },
  { key: 'first_aid', label: 'First Aid Certificate' },
  { key: 'insurance', label: 'Insurance' },
];
const DOC_STATUS_COLORS = { pending: Colors.status.warning, approved: Colors.status.success, rejected: Colors.status.error, expired: Colors.text.muted };

const Section = ({ title, children }) => (
  <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm }}>
    <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md }}>{title}</Text>
    {children}
  </View>
);

export function WorkerManageScreen({ route }) {
  const passedWorkerId = route?.params?.workerId;
  const [workerId, setWorkerId] = useState(passedWorkerId || null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [savingAvail, setSavingAvail] = useState(false);
  const [setupFirstName, setSetupFirstName] = useState('');
  const [setupLastName, setSetupLastName] = useState('');
  const [settingUp, setSettingUp] = useState(false);

  const load = useCallback(async () => {
    try {
      // If no workerId passed, fetch from /me first
      let wId = workerId;
      if (!wId) {
        const meRes = await api.get('/api/workers/me');
        if (meRes.data?.ok && meRes.data?.worker) {
          const w = meRes.data.worker;
          // /me returns skills, availability, documents as separate fields
          w.skills = meRes.data.skills || w.skills || [];
          w.availability = meRes.data.availability || w.availability || [];
          w.documents = meRes.data.documents || w.documents || [];
          wId = w.id;
          setWorkerId(wId);
          setWorker(w);
          setAvailability(w.availability);
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }
      // When fetching by ID, also use /me if we're the worker
      const { data } = await api.get('/api/workers/me');
      if (data?.ok && data?.worker) {
        const w = data.worker;
        w.skills = data.skills || w.skills || [];
        w.availability = data.availability || w.availability || [];
        w.documents = data.documents || w.documents || [];
        setWorker(w);
        setAvailability(w.availability);
      }
    } catch (e) {}
    setLoading(false);
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    setAddingSkill(true);
    const { error } = await api.post(`/api/workers/${workerId}/skills`, { skill_name: newSkill.trim() });
    if (error) Alert.alert('Error', error.message);
    else { setNewSkill(''); load(); }
    setAddingSkill(false);
  };

  const removeSkill = async (skillId) => {
    Alert.alert('Remove Skill', 'Remove this skill?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const { error } = await api.delete(`/api/workers/${workerId}/skills/${skillId}`);
        if (error) Alert.alert('Error', error.message);
        else load();
      }},
    ]);
  };

  const toggleDay = (dayIndex) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.day_of_week === dayIndex);
      if (existing) {
        return prev.map(a => a.day_of_week === dayIndex ? { ...a, is_available: !a.is_available } : a);
      }
      return [...prev, { day_of_week: dayIndex, start_time: '09:00', end_time: '17:00', is_available: true }];
    });
  };

  const saveAvailability = async () => {
    setSavingAvail(true);
    const { error } = await api.put(`/api/workers/${workerId}/availability`, { availability });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Availability saved!');
    setSavingAvail(false);
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>;
  }

  const runSetup = async () => {
    setSettingUp(true);
    const showError = (msg) => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
      else Alert.alert('Error', msg);
    };
    try {
      const { data, error } = await api.post('/api/workers/setup', {
        first_name: setupFirstName.trim() || undefined,
        last_name: setupLastName.trim() || undefined,
      });
      setSettingUp(false);
      if (error) {
        showError(error.message || 'Setup failed');
        return;
      }
      if (data?.ok && data?.worker) {
        setWorkerId(data.worker.id);
        setWorker({
          ...data.worker,
          skills: data.skills || [],
          availability: data.availability || [],
          documents: data.documents || [],
        });
        setAvailability(data.availability || []);
      } else {
        load();
      }
    } catch (e) {
      setSettingUp(false);
      showError(e?.message || 'Something went wrong');
    }
  };

  if (!worker) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.xxl }}>
        <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.sm }}>
          Set up your worker profile
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.lg }}>
          You're logged in as a Support Worker but no profile exists yet. Create one to add skills, documents, and availability.
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4 }}>First name (optional)</Text>
        <TextInput
          style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, color: Colors.text.primary }}
          placeholder="e.g. John"
          placeholderTextColor={Colors.text.muted}
          value={setupFirstName}
          onChangeText={setSetupFirstName}
        />
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4 }}>Last name (optional)</Text>
        <TextInput
          style={{ backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, color: Colors.text.primary }}
          placeholder="e.g. Smith"
          placeholderTextColor={Colors.text.muted}
          value={setupLastName}
          onChangeText={setSetupLastName}
        />
        <Pressable
          onPress={() => runSetup()}
          disabled={settingUp}
          style={({ pressed }) => ({
            backgroundColor: settingUp ? Colors.text.muted : Colors.primary,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            borderRadius: Radius.md,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
            cursor: Platform.OS === 'web' ? 'pointer' : undefined,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold }}>
            {settingUp ? 'Creating...' : 'Create worker profile'}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>

      {/* Verification Status */}
      <Section title=" Verification Status">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: worker.verification_status === 'verified' ? Colors.status.success : Colors.status.warning }} />
          <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold, textTransform: 'capitalize' }}>
            {worker.verification_status || 'pending'}
          </Text>
        </View>
      </Section>

      {/* Skills */}
      <Section title=" Skills & Services">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md }}>
          {(worker.skills || []).map(s => (
            <Pressable key={s.id} onPress={() => removeSkill(s.id)}
              style={{ backgroundColor: Colors.primaryLight + '20', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: Typography.fontWeight.medium }}>{s.skill_name}</Text>
              <Text style={{ color: Colors.status.error, marginLeft: Spacing.xs }}></Text>
            </Pressable>
          ))}
          {(!worker.skills || worker.skills.length === 0) && <Text style={{ color: Colors.text.muted }}>No skills added yet</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TextInput
            style={{ flex: 1, backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, color: Colors.text.primary }}
            placeholder="Add a skill..."
            placeholderTextColor={Colors.text.muted}
            value={newSkill}
            onChangeText={setNewSkill}
          />
          <Pressable onPress={addSkill} disabled={addingSkill}
            style={({ pressed }) => ({ backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold }}>+</Text>
          </Pressable>
        </View>
      </Section>

      {/* Documents – upload info */}
      <Section title=" Documents (upload here)">
        {DOC_TYPES.map(dt => {
          const doc = (worker.documents || []).find(d => d.document_type === dt.key);
          return (
            <View key={dt.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.medium }}>{dt.label}</Text>
                {doc?.expiry_date && <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted }}>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</Text>}
              </View>
              {doc ? (
                <View style={{ backgroundColor: DOC_STATUS_COLORS[doc.status] || Colors.text.muted, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full }}>
                  <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold, textTransform: 'uppercase' }}>{doc.status}</Text>
                </View>
              ) : (
                <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted }}>Not uploaded</Text>
              )}
            </View>
          );
        })}
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.primary, marginTop: Spacing.md, fontWeight: Typography.fontWeight.medium }}>
          Where to upload: Use the web portal to upload documents (NDIS screening, WWCC, etc.). You can upload multiple at once. Uploaded docs will appear above for status.
        </Text>
      </Section>

      {/* Availability */}
      <Section title=" Weekly Availability">
        {DAYS.map((day, i) => {
          const slot = availability.find(a => a.day_of_week === i);
          const isAvail = slot?.is_available ?? false;
          return (
            <Pressable key={i} onPress={() => toggleDay(i)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
              <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.medium }}>{day}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                {isAvail && slot && <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted }}>{slot.start_time || '09:00'} – {slot.end_time || '17:00'}</Text>}
                <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: isAvail ? Colors.status.success : Colors.border, justifyContent: 'center', paddingHorizontal: 2 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.text.white, alignSelf: isAvail ? 'flex-end' : 'flex-start' }} />
                </View>
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={saveAvailability} disabled={savingAvail}
          style={({ pressed }) => ({ backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.md, opacity: pressed ? 0.8 : 1 })}>
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold }}>{savingAvail ? 'Saving...' : 'Save Availability'}</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}
