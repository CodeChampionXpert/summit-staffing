/**
 * Summit Staffing – Available Shifts Screen
 * Workers browse and apply for open shifts.
 * Participants view their posted shifts and create new ones.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl, Alert, Modal,
  TextInput, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { Colors, Spacing, Typography, Radius, Shadows } from '../constants/theme.js';

const SERVICE_TYPES = [
  'Personal Care',
  'Domestic Assistance',
  'Community Access',
  'Respite Care',
  'Assistance with Daily Life',
  'Transport',
  'Improved Health and Wellbeing',
  'Improved Daily Living',
];

const getServiceColor = (type) => {
  const map = {
    'Personal Care': '#8B5CF6',
    'Domestic Assistance': '#F59E0B',
    'Community Access': '#10B981',
    'Respite Care': '#EC4899',
    'Assistance with Daily Life': '#06B6D4',
    'Transport': '#6366F1',
    'Improved Health and Wellbeing': '#14B8A6',
    'Improved Daily Living': '#F97316',
  };
  return map[type] || Colors.primary;
};

// ── Mini Calendar Component ───────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goForward = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const canGoBack = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const pad = (n) => String(n).padStart(2, '0');

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <View style={{ backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md }}>
      {/* Month/Year nav */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
        <Pressable onPress={goBack} disabled={!canGoBack} style={{ padding: Spacing.sm, opacity: canGoBack ? 1 : 0.3 }}>
          <Text style={{ fontSize: 18, color: Colors.primary, fontWeight: '700' }}>{'<'}</Text>
        </Pressable>
        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary }}>
          {monthNames[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goForward} style={{ padding: Spacing.sm }}>
          <Text style={{ fontSize: 18, color: Colors.primary, fontWeight: '700' }}>{'>'}</Text>
        </Pressable>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row' }}>
        {dayNames.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, fontWeight: Typography.fontWeight.semibold }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((day, i) => {
          if (day === null) {
            return <View key={`blank-${i}`} style={{ width: '14.28%', height: 38 }} />;
          }
          const dateObj = new Date(viewYear, viewMonth, day);
          const isPast = dateObj < today;
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const isSelected = dateStr === selectedDate;

          return (
            <Pressable
              key={day}
              disabled={isPast}
              onPress={() => onSelect(dateStr)}
              style={{
                width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center',
                backgroundColor: isSelected ? Colors.primary : 'transparent',
                borderRadius: 19,
              }}
            >
              <Text style={{
                fontSize: Typography.fontSize.sm,
                color: isPast ? Colors.text.muted : isSelected ? Colors.text.white : Colors.text.primary,
                fontWeight: isSelected ? Typography.fontWeight.bold : Typography.fontWeight.normal,
              }}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Create Shift Modal ────────────────────────────────────────────
function CreateShiftModal({ visible, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const reset = () => {
    setTitle(''); setServiceType(''); setHourlyRate(''); setDate('');
    setStartTime(''); setEndTime(''); setLocation(''); setDescription('');
  };

  const handleCreate = async () => {
    if (!title || !serviceType || !hourlyRate || !date || !startTime || !endTime || !location) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const start_time = `${date}T${startTime}:00`;
    const end_time = `${date}T${endTime}:00`;

    if (new Date(end_time) <= new Date(start_time)) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await api.post('/api/shifts', {
        title,
        service_type: serviceType,
        hourly_rate: parseFloat(hourlyRate),
        start_time,
        end_time,
        location,
        description,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to create shift');
      } else {
        Alert.alert('Success', 'Shift posted successfully!');
        reset();
        onClose();
        onCreated?.();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create shift');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary }}>
                Post a New Shift
              </Text>
              <Pressable onPress={() => { reset(); onClose(); }}>
                <Text style={{ fontSize: 24, color: Colors.text.muted }}></Text>
              </Pressable>
            </View>

            {/* Title */}
            <Text style={labelStyle}>Title *</Text>
            <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="e.g. Morning personal care support" placeholderTextColor={Colors.text.muted} />

            {/* Service Type */}
            <Text style={labelStyle}>Service Type *</Text>
            <Pressable onPress={() => setShowServicePicker(!showServicePicker)} style={[inputStyle, { justifyContent: 'center' }]}>
              <Text style={{ color: serviceType ? Colors.text.primary : Colors.text.muted }}>
                {serviceType || 'Select service type...'}
              </Text>
            </Pressable>
            {showServicePicker && (
              <View style={{ backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, marginBottom: Spacing.md }}>
                {SERVICE_TYPES.map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => { setServiceType(st); setShowServicePicker(false); }}
                    style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                  >
                    <Text style={{ color: st === serviceType ? Colors.primary : Colors.text.primary, fontWeight: st === serviceType ? Typography.fontWeight.bold : Typography.fontWeight.normal }}>{st}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Hourly Rate */}
            <Text style={labelStyle}>Hourly Rate ($) *</Text>
            <TextInput style={inputStyle} value={hourlyRate} onChangeText={setHourlyRate} placeholder="e.g. 55.00" keyboardType="numeric" placeholderTextColor={Colors.text.muted} />

            {/* Date */}
            <Text style={labelStyle}>Date *</Text>
            <Pressable
              onPress={() => setShowCalendar(!showCalendar)}
              style={[inputStyle, { justifyContent: 'center' }]}
            >
              <Text style={{ color: date ? Colors.text.primary : Colors.text.muted }}>
                {date || 'Select a date...'}
              </Text>
            </Pressable>
            {showCalendar && (
              <MiniCalendar
                selectedDate={date}
                onSelect={(d) => { setDate(d); setShowCalendar(false); }}
              />
            )}

            {/* Start / End Time */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Start Time * (HH:MM)</Text>
                <TextInput style={inputStyle} value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={Colors.text.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>End Time * (HH:MM)</Text>
                <TextInput style={inputStyle} value={endTime} onChangeText={setEndTime} placeholder="13:00" placeholderTextColor={Colors.text.muted} />
              </View>
            </View>

            {/* Location */}
            <Text style={labelStyle}>Location *</Text>
            <TextInput style={inputStyle} value={location} onChangeText={setLocation} placeholder="e.g. 123 Main St, Melbourne VIC" placeholderTextColor={Colors.text.muted} />

            {/* Description */}
            <Text style={labelStyle}>Description</Text>
            <TextInput
              style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
              value={description} onChangeText={setDescription} multiline
              placeholder="Any additional details..." placeholderTextColor={Colors.text.muted}
            />

            {/* Submit */}
            <Pressable
              onPress={handleCreate}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: saving ? Colors.text.muted : Colors.primary,
                paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center',
                opacity: pressed ? 0.8 : 1, marginTop: Spacing.md,
              })}
            >
              <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>
                {saving ? 'Posting...' : 'Post Shift'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const labelStyle = { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4, marginTop: Spacing.sm };
const inputStyle = {
  backgroundColor: Colors.surfaceSecondary, borderWidth: 1, borderColor: Colors.border,
  borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  fontSize: Typography.fontSize.base, color: Colors.text.primary, marginBottom: Spacing.sm,
};

// ── Shift Card ───────────────────────────────────────────────────
function ShiftCard({ shift, onApply, isWorker }) {
  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);
  const hours = ((endDate - startDate) / (1000 * 60 * 60)).toFixed(1);

  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.md }}>
      {/* Service Type Badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
        <View style={{ backgroundColor: getServiceColor(shift.service_type), paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full }}>
          <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold }}>{shift.service_type}</Text>
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted }}>{shift.application_count || 0} applicant(s)</Text>
      </View>

      {/* Title */}
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xs }}>
        {shift.title}
      </Text>

      {/* Date & Time */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
          {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({hours}h)
        </Text>
      </View>

      {/* Rate */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
          ${parseFloat(shift.hourly_rate).toFixed(2)}/hr • ~${(parseFloat(shift.hourly_rate) * parseFloat(hours)).toFixed(2)} total
        </Text>
      </View>

      {/* Location */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>{shift.location}</Text>
      </View>

      {/* Required Skills */}
      {shift.required_skills && shift.required_skills.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing.sm }}>
          {shift.required_skills.map((skill, i) => (
            <View key={i} style={{ backgroundColor: Colors.surfaceSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.secondary }}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Participant Info */}
      {shift.participant_first_name ? (
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, marginBottom: Spacing.sm }}>
          Posted by {shift.participant_first_name} {shift.participant_last_name}
        </Text>
      ) : null}

      {/* Apply Button (workers) */}
      {isWorker && (
        <Pressable
          onPress={() => onApply(shift)}
          style={({ pressed }) => ({
            backgroundColor: Colors.primary, paddingVertical: Spacing.sm, borderRadius: Radius.md,
            alignItems: 'center', opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.semibold }}>Apply for Shift</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export function AvailableShiftsScreen({ navigation }) {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'worker';
  const isParticipant = user?.role === 'participant';

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadShifts = useCallback(async () => {
    try {
      const endpoint = isParticipant ? '/api/shifts/mine' : '/api/shifts';
      const { data } = await api.get(endpoint);
      if (data?.ok) {
        setShifts(data.shifts || []);
      }
    } catch (e) {}
    setLoading(false);
  }, [isParticipant]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  const handleApply = (shift) => {
    const confirmAction = () => {
      applyForShift(shift.id);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Apply for "${shift.title}"?`)) {
        confirmAction();
      }
    } else {
      Alert.alert(
        'Apply for Shift',
        `Are you sure you want to apply for "${shift.title}"?\n\nRate: $${parseFloat(shift.hourly_rate).toFixed(2)}/hr\nLocation: ${shift.location}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', onPress: confirmAction },
        ]
      );
    }
  };

  const applyForShift = async (shiftId) => {
    try {
      const { data, error } = await api.post(`/api/shifts/${shiftId}/apply`, {
        message: 'I am interested in this shift.',
      });
      if (error) {
        Alert.alert('Error', error.message || 'Failed to apply');
      } else {
        Alert.alert('Applied!', 'Your application has been submitted.');
        loadShifts();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to apply for shift');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <ShiftCard shift={item} onApply={handleApply} isWorker={isWorker} />
        )}
        ListHeaderComponent={
          isParticipant ? (
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
                Your posted shifts are listed below. Tap + to create a new one.
              </Text>
            </View>
          ) : (
            <View style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
                Browse available shifts and apply for the ones that match your skills.
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary }}>
                {isParticipant ? 'No shifts posted yet' : 'No available shifts'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                {isParticipant ? 'Post a shift to find support workers.' : 'Check back later for new opportunities.'}
              </Text>
            </View>
          )
        }
      />

      {/* FAB for participants */}
      {isParticipant && (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={({ pressed }) => ({
            position: 'absolute', bottom: 24, right: 24,
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
            ...Shadows.lg, opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 28, color: Colors.text.white }}>+</Text>
        </Pressable>
      )}

      <CreateShiftModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadShifts}
      />
    </View>
  );
}
