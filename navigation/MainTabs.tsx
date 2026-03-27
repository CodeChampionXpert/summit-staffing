/**
 * Summit Staffing – Bottom Tab Navigator (after login)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DashboardScreen } from '../screens/DashboardScreen.js';
import { AvailableShiftsScreen } from '../screens/AvailableShiftsScreen.js';
import { BookingsScreen } from '../screens/BookingsScreen.js';
import { MessagesScreen } from '../screens/MessagesScreen.js';
import { ProfileScreen } from '../screens/ProfileScreen.js';
import { Colors, Radius, Shadows, Spacing, Typography } from '../constants/theme.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';

const Tab = createBottomTabNavigator();

function HeaderInboxMenu() {
  const nav = useNavigation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: notificationsData }, { data: conversationsData }] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/messages/conversations')
      ]);

      const notifications = notificationsData?.ok ? notificationsData.notifications || [] : [];
      const conversations = conversationsData?.ok ? conversationsData.conversations || [] : [];

      const mappedNotifications = notifications.slice(0, 5).map((n) => ({
        id: `notification_${n.id}`,
        kind: 'notification',
        title: n.title || 'Notification',
        body: n.body || '',
        createdAt: n.created_at ? new Date(n.created_at).getTime() : 0
      }));

      const mappedMessages = conversations.slice(0, 5).map((c) => ({
        id: `message_${c.conversation_id || c.id}`,
        kind: 'message',
        title: c.other_user?.first_name || c.other_user_name || c.other_user_email || 'Message',
        body: typeof c.last_message === 'string' ? c.last_message : c.last_message?.message_text || 'New message',
        createdAt: c.last_message?.created_at ? new Date(c.last_message.created_at).getTime() : 0
      }));

      const combined = [...mappedNotifications, ...mappedMessages]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 8);

      const unreadNotifications = notifications.filter((n) => !n.read).length;
      const unreadMessages = conversations.reduce((sum, c) => sum + Number(c.unread_count || 0), 0);
      setUnreadCount(unreadNotifications + unreadMessages);
      setItems(combined);
    } catch (e) {
      setUnreadCount(0);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 10000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  const badgeText = useMemo(() => (unreadCount > 99 ? '99+' : String(unreadCount)), [unreadCount]);

  return (
    <>
      <Pressable
        onPress={() => {
          setOpen((v) => !v);
          loadInbox();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, paddingHorizontal: 12, paddingVertical: 8 })}
      >
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.text.white, fontSize: 17 }}>🔔</Text>
          {unreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -8,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: Colors.status.error,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4
              }}
            >
              <Text style={{ color: Colors.text.white, fontSize: 10, fontWeight: '700' }}>{badgeText}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 90,
              right: 12,
              width: 320,
              maxHeight: 380,
              backgroundColor: Colors.surface,
              borderRadius: Radius.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              ...Shadows.md,
              paddingVertical: Spacing.sm
            }}
          >
            <View style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm }}>
              <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base }}>
                Notifications & Messages
              </Text>
            </View>

            {loading ? (
              <Text style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, color: Colors.text.secondary }}>Loading...</Text>
            ) : items.length === 0 ? (
              <Text style={{ paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, color: Colors.text.secondary }}>
                No messages
              </Text>
            ) : (
              <ScrollView>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setOpen(false);
                      if (item.kind === 'message') {
                        nav.navigate('Messages');
                      } else {
                        nav.navigate('Notifications');
                      }
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: Colors.borderLight,
                      backgroundColor: pressed ? Colors.surfaceSecondary : 'transparent'
                    })}
                  >
                    <Text style={{ color: Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                      {item.kind === 'message' ? `Message: ${item.title}` : item.title}
                    </Text>
                    {item.body ? (
                      <Text numberOfLines={1} style={{ marginTop: 2, color: Colors.text.secondary, fontSize: Typography.fontSize.sm }}>
                        {item.body}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function MainTabs() {
  const { user } = useAuthStore();
  const isWorker = user?.role === 'worker';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.text.white,
        headerTitleStyle: { fontWeight: '700' as const },
        headerRight: () => <HeaderInboxMenu />,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.muted,
        tabBarStyle: {
          paddingBottom: 20,
          paddingTop: 8,
          height: 70,
          borderTopWidth: 1,
          borderTopColor: Colors.border
        },
        tabBarIcon: () => null,
        tabBarLabel: ({ color, focused }) => (
          <Text
            style={{
              fontSize: 13,
              fontWeight: focused ? '700' : '500',
              color,
              textAlign: 'center'
            }}
          >
            {route.name}
          </Text>
        )
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Summit Staffing' }} />
      {!isWorker && <Tab.Screen name="Search" component={AvailableShiftsScreen} options={{ title: 'Add Shift' }} />}
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: 'Bookings' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
