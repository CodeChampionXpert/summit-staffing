/**
 * Summit Staffing – Dashboard Screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { Colors, Spacing, Typography, Radius, Shadows } from '../constants/theme.js';

const Card = ({ children, style }) => (
  <View style={[{ backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.md }, style]}>
    {children}
  </View>
);

const StatCard = ({ label, value, color }) => (
  <View style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', ...Shadows.sm }}>
    <Text style={{ fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: color || Colors.text.primary, marginBottom: 2 }}>{value}</Text>
    <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: 2 }}>{label}</Text>
  </View>
);

export function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, pending: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isWorker = user?.role === 'worker';

  const loadData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/bookings?limit=5');
      if (data?.ok && data?.bookings) {
        const bookings = data.bookings;
        setUpcomingBookings(bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 3));
        setStats({
          upcoming: bookings.filter(b => b.status === 'confirmed').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          pending: bookings.filter(b => b.status === 'pending').length,
        });
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  const greeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Greeting */}
      <Card style={{ marginBottom: Spacing.lg, backgroundColor: Colors.primary }}>
        <Text style={{ fontSize: Typography.fontSize.lg, color: Colors.text.white, fontWeight: Typography.fontWeight.medium }}>
          {greeting()}
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xxl, color: Colors.text.white, fontWeight: Typography.fontWeight.bold, marginTop: Spacing.xs }}>
          {user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs }}>
          {isWorker ? 'Support Worker' : 'Participant'}
        </Text>
      </Card>

      {/* Stats */}
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md }}>
        Overview
      </Text>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <StatCard label="Pending" value={stats.pending} color={Colors.status.warning} />
        <StatCard label="Upcoming" value={stats.upcoming} color={Colors.status.success} />
        <StatCard label="Completed" value={stats.completed} color={Colors.primary} />
      </View>

      {/* Quick Actions */}
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md }}>
        Quick Actions
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <Pressable
          onPress={() => navigation.navigate('AvailableShifts')}
          style={({ pressed }) => ({
            width: '47%', backgroundColor: Colors.status.success, borderRadius: Radius.md,
            padding: Spacing.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>Find Workers</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Bookings')}
          style={({ pressed }) => ({
            width: '47%', backgroundColor: Colors.primary, borderRadius: Radius.md,
            padding: Spacing.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>My Bookings</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => ({
            width: '47%', backgroundColor: Colors.primaryDark, borderRadius: Radius.md,
            padding: Spacing.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>My Profile</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          style={({ pressed }) => ({
            width: '47%', backgroundColor: '#8B5CF6', borderRadius: Radius.md,
            padding: Spacing.lg, paddingVertical: Spacing.xl, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>Notifications</Text>
        </Pressable>
      </View>

      {/* Upcoming Bookings */}
      <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.md }}>
        Recent Bookings
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : upcomingBookings.length === 0 ? (
        <Card>
          <Text style={{ color: Colors.text.secondary, textAlign: 'center' }}>No bookings yet</Text>
          {!isWorker && (
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={({ pressed }) => ({
                marginTop: Spacing.md,
                backgroundColor: Colors.primary,
                borderRadius: Radius.md,
                paddingVertical: Spacing.md,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.bold }}>
                FIND A WORKER
              </Text>
            </Pressable>
          )}
        </Card>
      ) : (
        upcomingBookings.map((b) => (
          <Pressable key={b.id} onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}>
          <Card style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: Typography.fontWeight.semibold, color: Colors.text.primary }}>{b.service_type}</Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: 2 }}>
                  {new Date(b.start_time).toLocaleDateString()} • {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={{
                backgroundColor: b.status === 'confirmed' ? Colors.status.success : Colors.status.warning,
                paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full,
              }}>
                <Text style={{ color: Colors.text.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold }}>
                  {b.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
