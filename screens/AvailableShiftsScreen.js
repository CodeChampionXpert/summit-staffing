/**
 * Summit Staffing – Available Shifts Screen
 * Workers browse and apply for open shifts.
 * Participants view their posted shifts and create new ones.
 */
import React, { useEffect, useState, useCallback, createElement } from 'react';
import {
  View, Text, FlatList, Pressable, RefreshControl, Alert, Modal,
  TextInput, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { Colors, Spacing, Typography, Radius, Shadows } from '../constants/theme.js';
import { SERVICE_TYPES } from '../constants/serviceTypes.js';

const DateTimePicker = Platform.OS !== 'web' ? require('@react-native-community/datetimepicker').default : null;

const webInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: Colors.surfaceSecondary,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  fontSize: Typography.fontSize.base,
  color: Colors.text.primary,
  marginBottom: Spacing.sm,
};

function WebTimeInput({ value, onChange }) {
  return createElement('input', {
    type: 'time',
    value: value || '',
    onChange: (e) => onChange(e.target.value),
    style: webInputStyle,
  });
}

const SERVICE_ICONS = {
  // 'Personal Care': '🧴',
  // 'Domestic Assistance': '🧹',
  // 'Community Access': '🌍',
  // 'Respite Care': '🏠',
  // 'Assistance with Daily Life': '🤝',
  // 'Transport': '🚗',
  // 'Improved Health and Wellbeing': '💊',
  // 'Improved Daily Living': '⭐',
};

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

// ── Mini Calendar Component ────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
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
      <View style={{ flexDirection: 'row' }}>
        {dayNames.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, fontWeight: Typography.fontWeight.semibold }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((day, i) => {
          if (day === null) return <View key={`blank-${i}`} style={{ width: '14.28%', height: 38 }} />;
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

// ── Service Type Card ─────────────────────────────────────────────────────────
function ServiceTypeCard({ type, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: selected ? Colors.primary : Colors.surface,
        borderWidth: 2,
        borderColor: selected ? Colors.primary : Colors.border,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        opacity: pressed ? 0.85 : 1,
        ...Shadows.sm,
      })}
    >
      {/* <Text style={{ fontSize: 22, marginRight: Spacing.sm }}>{SERVICE_ICONS[type] || '🔧'}</Text> */}
      <Text style={{
        flex: 1,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: selected ? Colors.text.white : Colors.text.primary,
      }}>
        {type}
      </Text>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: selected ? Colors.text.white : Colors.surfaceSecondary,
        borderWidth: selected ? 0 : 1,
        borderColor: Colors.border,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: Typography.fontWeight.bold }}>✓</Text>}
      </View>
    </Pressable>
  );
}

// ── Create Shift Modal ────────────────────────────────────────────────────────
function CreateShiftModal({ visible, onClose, onCreated }) {
  const isWeb = Platform.OS === 'web';
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [date, setDate] = useState('');
  const [startTimeDate, setStartTimeDate] = useState(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [endTimeDate, setEndTimeDate] = useState(() => {
    const d = new Date();
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [webStartTimeText, setWebStartTimeText] = useState('09:00');
  const [webEndTimeText, setWebEndTimeText] = useState('10:00');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [shiftHours, setShiftHours] = useState('1');
  const [workersNeeded, setWorkersNeeded] = useState('1');
  const [bookingMode, setBookingMode] = useState('individual');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const reset = () => {
    setTitle(''); setServiceType(''); setHourlyRate(''); setDate('');
    setStartTimeDate(() => {
      const d = new Date();
      d.setHours(9, 0, 0, 0);
      return d;
    });
    setEndTimeDate(() => {
      const d = new Date();
      d.setHours(10, 0, 0, 0);
      return d;
    });
    setWebStartTimeText('09:00');
    setWebEndTimeText('10:00');
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setShiftHours('1');
    setWorkersNeeded('1');
    setBookingMode('individual');
    setLocation(''); setDescription('');
    setShowServicePicker(false); setShowCalendar(false);
  };

  const handleCreate = async () => {
    if (!title || !serviceType || !hourlyRate || !date || !location || !shiftHours || !workersNeeded) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const [year, month, day] = date.split('-').map(Number);
    let startHour;
    let startMinute;
    let endHour;
    let endMinute;

    if (isWeb) {
      [startHour, startMinute] = webStartTimeText.split(':').map(Number);
      [endHour, endMinute] = webEndTimeText.split(':').map(Number);
    } else {
      startHour = startTimeDate.getHours();
      startMinute = startTimeDate.getMinutes();
      endHour = endTimeDate.getHours();
      endMinute = endTimeDate.getMinutes();
    }

    if ([startHour, startMinute, endHour, endMinute].some((v) => Number.isNaN(v))) {
      Alert.alert('Invalid Time', 'Please select valid start and end time.');
      return;
    }

    const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);
    const dayStart = new Date(year, month - 1, day, 9, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 17, 0, 0, 0);
    const hours = Number(shiftHours);
    const workerCount = Number(workersNeeded);

    if (Number.isNaN(hours) || hours <= 0 || hours > 8) {
      Alert.alert('Invalid Hours', 'Shift hours must be between 1 and 8.');
      return;
    }

    if (!Number.isInteger(workerCount) || workerCount < 1) {
      Alert.alert('Invalid Workers', 'Workers count must be at least 1.');
      return;
    }

    if (start < dayStart || end > dayEnd) {
      Alert.alert('Invalid Time', 'Shift time must be between 9:00 AM and 5:00 PM.');
      return;
    }

    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours <= 0) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }

    if (Math.abs(durationHours - hours) > 0.001) {
      Alert.alert('Invalid Duration', 'Start/End time must match selected shift hours.');
      return;
    }

    const start_time = start.toISOString();
    const end_time = end.toISOString();
    if (new Date(end_time) <= new Date(start_time)) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await api.post('/api/shifts', {
        title,
        service_type: serviceType,
        hourly_rate: parseFloat(hourlyRate),
        start_time,
        end_time,
        location,
        description,
        required_skills: [
          `workers_needed:${workerCount}`,
          `booking_mode:${workerCount > 1 ? bookingMode : 'single'}`,
          `shift_hours:${hours}`,
        ],
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
        <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary }}>
                Add Shift
              </Text>
              <Pressable onPress={() => { reset(); onClose(); }}>
                <Text style={{ fontSize: 24, color: Colors.text.muted }}>✕</Text>
              </Pressable>
            </View>

            {/* Title */}
            <Text style={labelStyle}>Title *</Text>
            <TextInput
              style={inputStyle}
              value={title}
              onChangeText={setTitle}
            />

            {/* ── Service Type Picker ── */}
            <Text style={labelStyle}>Service Type *</Text>

            {/* Selected value display / toggle button */}
            <Pressable
              onPress={() => setShowServicePicker(!showServicePicker)}
              style={[inputStyle, {
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderColor: showServicePicker ? Colors.primary : Colors.border,
              }]}
            >
              <Text style={{ color: serviceType ? Colors.text.primary : Colors.text.muted, fontSize: Typography.fontSize.base }}>
                {serviceType
                  ? ` ${serviceType}`
                  : 'Select a service type'}
              </Text>
              <Text style={{ color: Colors.text.muted, fontSize: 12 }}>
                {showServicePicker ? '▲' : '▼'}
              </Text>
            </Pressable>

            {/* Service type cards — shown inline when picker is open */}
            {showServicePicker && (
              <View style={{
                backgroundColor: Colors.surfaceSecondary,
                borderRadius: Radius.lg,
                padding: Spacing.md,
                marginBottom: Spacing.md,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, marginBottom: Spacing.sm }}>
                  Tap to select
                </Text>
                {SERVICE_TYPES.map((type) => (
                  <ServiceTypeCard
                    key={type}
                    type={type}
                    selected={serviceType === type}
                    onPress={() => {
                      setServiceType(type);
                      setShowServicePicker(false);
                    }}
                  />
                ))}
              </View>
            )}

            {/* Hourly Rate */}
            <Text style={labelStyle}>Hourly Rate ($) *</Text>
            <TextInput
              style={inputStyle}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
            />

            {/* Date */}
            <Text style={labelStyle}>Date *</Text>
            <Pressable
              onPress={() => setShowCalendar(!showCalendar)}
              style={[inputStyle, { justifyContent: 'center' }]}
            >
              <Text style={{ color: date ? Colors.text.primary : Colors.text.muted }}>
                {date || 'Select a date'}
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
                <Text style={labelStyle}>Start Time *</Text>
                {isWeb ? (
                  <WebTimeInput value={webStartTimeText} onChange={setWebStartTimeText} />
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowStartTimePicker(true)}
                      style={[inputStyle, { justifyContent: 'center' }]}
                    >
                      <Text style={{ color: Colors.text.primary }}>
                        {startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                    {showStartTimePicker && DateTimePicker && (
                      <DateTimePicker
                        value={startTimeDate}
                        mode="time"
                        display={Platform.OS === 'android' ? 'spinner' : 'default'}
                        is24Hour={false}
                        onChange={(e, selectedTime) => {
                          setShowStartTimePicker(false);
                          if (selectedTime) setStartTimeDate(selectedTime);
                        }}
                      />
                    )}
                  </>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>End Time *</Text>
                {isWeb ? (
                  <WebTimeInput value={webEndTimeText} onChange={setWebEndTimeText} />
                ) : (
                  <>
                    <Pressable
                      onPress={() => setShowEndTimePicker(true)}
                      style={[inputStyle, { justifyContent: 'center' }]}
                    >
                      <Text style={{ color: Colors.text.primary }}>
                        {endTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Pressable>
                    {showEndTimePicker && DateTimePicker && (
                      <DateTimePicker
                        value={endTimeDate}
                        mode="time"
                        display={Platform.OS === 'android' ? 'spinner' : 'default'}
                        is24Hour={false}
                        onChange={(e, selectedTime) => {
                          setShowEndTimePicker(false);
                          if (selectedTime) setEndTimeDate(selectedTime);
                        }}
                      />
                    )}
                  </>
                )}
              </View>
            </View>

            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, marginTop: -4, marginBottom: Spacing.sm }}>
              Allowed range: 9:00 AM to 5:00 PM
            </Text>

            <Text style={labelStyle}>Shift Hours *</Text>
            <TextInput
              style={inputStyle}
              value={shiftHours}
              onChangeText={setShiftHours}
              keyboardType="numeric"
            />

            <Text style={labelStyle}>How many workers you want? *</Text>
            <TextInput
              style={inputStyle}
              value={workersNeeded}
              onChangeText={setWorkersNeeded}
              keyboardType="number-pad"
            />

            {Number(workersNeeded) > 1 && (
              <>
                <Text style={labelStyle}>Worker Mode</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Pressable
                    onPress={() => setBookingMode('same')}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.md,
                      borderRadius: Radius.md,
                      backgroundColor: bookingMode === 'same' ? Colors.primary : Colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: bookingMode === 'same' ? Colors.primary : Colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: bookingMode === 'same' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                      Both do same work
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setBookingMode('individual')}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.md,
                      borderRadius: Radius.md,
                      backgroundColor: bookingMode === 'individual' ? Colors.primary : Colors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: bookingMode === 'individual' ? Colors.primary : Colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: bookingMode === 'individual' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                      Both work as individual
                    </Text>
                  </Pressable>
                </View>

                {Array.from({ length: Math.min(Number(workersNeeded) || 0, 6) }).map((_, idx) => (
                  <View
                    key={`worker-slot-${idx + 1}`}
                    style={{
                      backgroundColor: Colors.surfaceSecondary,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      padding: Spacing.md,
                      marginBottom: Spacing.sm,
                    }}
                  >
                    <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                      Book shift for worker {idx + 1}
                    </Text>
                    <Text style={{ color: Colors.text.secondary, fontSize: Typography.fontSize.sm, marginTop: 2 }}>
                      Worker information will appear after applications.
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Location */}
            <Text style={labelStyle}>Location *</Text>
            <TextInput
              style={inputStyle}
              value={location}
              onChangeText={setLocation}
            />

            {/* Description */}
            <Text style={labelStyle}>Description</Text>
            <TextInput
              style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Submit */}
            <Pressable
              onPress={handleCreate}
              disabled={saving}
              style={({ pressed }) => ({
                backgroundColor: saving ? Colors.text.muted : Colors.primary,
                paddingVertical: Spacing.md,
                borderRadius: Radius.md,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                marginTop: Spacing.md,
              })}
            >
              <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>
                {saving ? 'Adding...' : 'Add Shift'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const labelStyle = {
  fontSize: Typography.fontSize.sm,
  color: Colors.text.secondary,
  marginBottom: 4,
  marginTop: Spacing.sm,
};
const inputStyle = {
  backgroundColor: Colors.surfaceSecondary,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Radius.md,
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  fontSize: Typography.fontSize.base,
  color: Colors.text.primary,
  marginBottom: Spacing.sm,
};

// ── Shift Card ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, onApply, onSelect, isWorker, isParticipant }) {
  const startDate = new Date(shift.start_time);
  const endDate = new Date(shift.end_time);
  const hours = ((endDate - startDate) / (1000 * 60 * 60)).toFixed(1);

  return (
    <Pressable
      onPress={isParticipant ? () => onSelect?.(shift) : undefined}
      style={({ pressed }) => ({
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        ...Shadows.md,
        opacity: pressed && isParticipant ? 0.95 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
        <View style={{ backgroundColor: getServiceColor(shift.service_type), paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full }}>
          <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold }}>
            {shift.service_type}
          </Text>
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted }}>{shift.application_count || 0} applicant(s)</Text>
      </View>

      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xs }}>
        {shift.title}
      </Text>

      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4 }}>
        {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({hours}h)
      </Text>

      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4 }}>
        ${parseFloat(shift.hourly_rate).toFixed(2)}/hr • ~${(parseFloat(shift.hourly_rate) * parseFloat(hours)).toFixed(2)} total
      </Text>

      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.sm }}>
        📍 {shift.location}
      </Text>

      {shift.participant_first_name && (
        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.muted, marginBottom: Spacing.sm }}>
          Posted by {shift.participant_first_name} {shift.participant_last_name}
        </Text>
      )}

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
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function AvailableShiftsScreen({ navigation }) {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'worker';
  const isParticipant = user?.role === 'participant';

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shiftBookingVisible, setShiftBookingVisible] = useState(false);
  const [shiftBookingLoading, setShiftBookingLoading] = useState(false);
  const [shiftBooking, setShiftBooking] = useState(null);
  const [shiftApplications, setShiftApplications] = useState([]);
  const [workersWanted, setWorkersWanted] = useState(1);
  const [bookingMode, setBookingMode] = useState('individual'); // informational UI for now

  const loadShifts = useCallback(async () => {
    try {
      const endpoint = isParticipant ? '/api/shifts/mine' : '/api/shifts';
      const { data } = await api.get(endpoint);
      if (data?.ok) setShifts(data.shifts || []);
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
    const confirmAction = () => applyForShift(shift.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`Apply for "${shift.title}"?`)) confirmAction();
    } else {
      Alert.alert(
        'Apply for Shift',
        `Apply for "${shift.title}"?\n\nRate: $${parseFloat(shift.hourly_rate).toFixed(2)}/hr\nLocation: ${shift.location}`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Apply', onPress: confirmAction }]
      );
    }
  };

  const applyForShift = async (shiftId) => {
    const { error } = await api.post(`/api/shifts/${shiftId}/apply`, { message: 'I am interested in this shift.' });
    if (error) Alert.alert('Error', error.message || 'Failed to apply');
    else { Alert.alert('Applied!', 'Your application has been submitted.'); loadShifts(); }
  };

  const openShiftBooking = useCallback(async (shift) => {
    if (!isParticipant) return;
    setShiftBookingLoading(true);
    setShiftBooking(shift);
    setShiftApplications([]);
    setWorkersWanted(1);
    setBookingMode('individual');
    setShiftBookingVisible(true);
    try {
      const { data } = await api.get(`/api/shifts/${shift.id}`);
      if (data?.ok) {
        setShiftApplications(data.applications || []);
      } else {
        Alert.alert('Error', data?.error || 'Failed to load applications');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setShiftBookingLoading(false);
    }
  }, [isParticipant]);

  const acceptMany = async (applicationIds) => {
    if (!shiftBooking?.id) return;
    setShiftBookingLoading(true);
    try {
      const { error } = await api.post(`/api/shifts/${shiftBooking.id}/accept-many`, {
        application_ids: applicationIds,
        booking_mode: bookingMode,
      });
      if (error) {
        Alert.alert('Error', error.message || 'Failed to book');
        return;
      }

      const acceptedWorkers = shiftApplications
        .filter((a) => applicationIds.includes(a.id))
        .map((a, idx) => {
          const name = `${a.worker_first_name || ''} ${a.worker_last_name || ''}`.trim() || a.worker_email || `Worker ${idx + 1}`;
          return `${idx + 1}. ${name}`;
        })
        .join('\n');

      Alert.alert('Shift Booked', `Bookings created for:\n${acceptedWorkers || 'Selected workers'}`);
      setShiftBookingVisible(false);
      loadShifts();
    } finally {
      setShiftBookingLoading(false);
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
          <ShiftCard
            shift={item}
            onApply={handleApply}
            onSelect={(s) => (isParticipant ? openShiftBooking(s) : undefined)}
            isWorker={isWorker}
            isParticipant={isParticipant}
          />
        )}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
              {isParticipant
                ? 'Your posted shifts are below. Tap + to add a shift, or tap a shift to book workers.'
                : 'Browse available shifts and apply for the ones that match your skills.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary }}>
                {isParticipant ? 'No shifts posted yet' : 'No available workers'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                {isParticipant ? 'Tap + to add a new shift.' : 'Check back later for new opportunities.'}
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

      {/* Shift booking for participants (accept multiple worker applications) */}
      <Modal
        visible={shiftBookingVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setShiftBookingVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
            <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary }}>
                  {shiftBooking?.title ? `Book workers for: ${shiftBooking.title}` : 'Book workers'}
                </Text>
                <Pressable
                  onPress={() => {
                    setShiftBookingVisible(false);
                    setShiftApplications([]);
                  }}
                >
                  <Text style={{ fontSize: 24, color: Colors.text.muted }}>✕</Text>
                </Pressable>
              </View>

              {shiftBookingLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : shiftApplications.length === 0 ? (
                <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary }}>
                    No applications yet
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: Spacing.xs, textAlign: 'center' }}>
                    Workers will apply to your shift. Then you can book them here.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={labelStyle}>How many workers you want?</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.md }}>
                    <Pressable
                      disabled={workersWanted <= 1 || shiftBookingLoading}
                      onPress={() => setWorkersWanted((n) => Math.max(1, n - 1))}
                      style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: workersWanted <= 1 ? Colors.border : Colors.surfaceSecondary,
                        opacity: pressed || workersWanted <= 1 ? 0.7 : 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      })}
                    >
                      <Text style={{ fontSize: 24, color: Colors.text.primary }}>−</Text>
                    </Pressable>

                    <View style={{ flex: 1, paddingVertical: Spacing.sm }}>
                      <Text style={{ fontSize: Typography.fontSize.base, color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold, textAlign: 'center' }}>
                        {workersWanted} worker{workersWanted === 1 ? '' : 's'} selected
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, textAlign: 'center', marginTop: 2 }}>
                        Max: {shiftApplications.length}
                      </Text>
                    </View>

                    <Pressable
                      disabled={workersWanted >= shiftApplications.length || shiftBookingLoading}
                      onPress={() => setWorkersWanted((n) => Math.min(shiftApplications.length, n + 1))}
                      style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: workersWanted >= shiftApplications.length ? Colors.border : Colors.surfaceSecondary,
                        opacity: pressed || workersWanted >= shiftApplications.length ? 0.7 : 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      })}
                    >
                      <Text style={{ fontSize: 24, color: Colors.text.primary }}>+</Text>
                    </Pressable>
                  </View>

                  <Text style={labelStyle}>Option</Text>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <Pressable
                      onPress={() => setBookingMode('individual')}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.md,
                        borderRadius: Radius.md,
                        backgroundColor: bookingMode === 'individual' ? Colors.primary : Colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: bookingMode === 'individual' ? Colors.primary : Colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: bookingMode === 'individual' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                        Both work as individual
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setBookingMode('same')}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.md,
                        borderRadius: Radius.md,
                        backgroundColor: bookingMode === 'same' ? Colors.primary : Colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: bookingMode === 'same' ? Colors.primary : Colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: bookingMode === 'same' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                        Both do same job
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={labelStyle}>Book shift</Text>
                  {shiftApplications.slice(0, Math.min(workersWanted, shiftApplications.length)).map((app, idx) => {
                    const name = `${app.worker_first_name || ''} ${app.worker_last_name || ''}`.trim() || app.worker_email || `Worker ${idx + 1}`;
                    return (
                      <View
                        key={app.id}
                        style={{
                          backgroundColor: Colors.surfaceSecondary,
                          borderRadius: Radius.lg,
                          padding: Spacing.lg,
                          marginBottom: Spacing.md,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary }}>
                          Book shift for worker {idx + 1}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
                          {name}
                        </Text>
                        {app.worker_hourly_rate != null && (
                          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>
                            ${Number(app.worker_hourly_rate).toFixed(2)}/hr
                          </Text>
                        )}

                        <Pressable
                          disabled={shiftBookingLoading}
                          onPress={() => acceptMany(shiftApplications.slice(0, Math.min(workersWanted, shiftApplications.length)).map((x) => x.id))}
                          style={({ pressed }) => ({
                            marginTop: Spacing.md,
                            backgroundColor: Colors.primary,
                            borderRadius: Radius.md,
                            paddingVertical: Spacing.md,
                            alignItems: 'center',
                            opacity: pressed || shiftBookingLoading ? 0.8 : 1,
                          })}
                        >
                          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.semibold }}>
                            Book shift for worker {idx + 1}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}