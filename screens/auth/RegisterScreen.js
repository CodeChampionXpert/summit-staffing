/**
 * Summit Staffing – Register screen (worker or participant)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore.js';
import { useLoading } from '../../hooks/useLoading.js';
import { useErrorHandler } from '../../hooks/useErrorHandler.js';
import { api } from '../../services/api.js';
import { LoadingScreen } from '../../components/LoadingScreen.js';
import { Colors, Spacing, Typography, Radius } from '../../constants/theme.js';

const inputStyle = {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Radius.md,
  paddingVertical: Spacing.md,
  paddingHorizontal: Spacing.lg,
  fontSize: Typography.fontSize.base,
  color: Colors.text.primary,
};

const buttonStyle = (pressed) => ({
  backgroundColor: Colors.primary,
  paddingVertical: Spacing.md,
  borderRadius: Radius.md,
  alignItems: 'center',
  opacity: pressed ? 0.9 : 1,
});


export function RegisterScreen({ navigation, route }) {
  const initialRole = route.params?.role === 'worker' ? 'worker' : 'participant';
  const [role, setRole] = useState(initialRole);
  const [supportMode, setSupportMode] = useState('individual');
  const [vendorType, setVendorType] = useState('');
  const [vendorDetails, setVendorDetails] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [abn, setAbn] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [phone, setPhone] = useState('');
  const { setAuth } = useAuthStore();
  const { isLoading, withLoading } = useLoading();
  const { error, handleError, clearError } = useErrorHandler();


  const onRegister = withLoading(async () => {
    clearError();
    const body = {
      email: email.trim().toLowerCase(),
      password,
      role,
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    if (role === 'worker') {
      if (!firstName.trim() || !lastName.trim()) {
        handleError(new Error('Worker registration requires first and last name'));
        return;
      }
      body.abn = abn.replace(/\D/g, '').slice(0, 11);
      if (body.abn?.length !== 11) {
        handleError(new Error('ABN must be 11 digits'));
        return;
      }

      // Pre-check ABN to avoid backend generic 500 on duplicate ABN.
      const { data: abnData, error: abnErr } = await api.post('/api/workers/verify-abn', { abn: body.abn });
      if (abnErr) {
        handleError(abnErr);
        return;
      }
      if (!abnData?.valid) {
        handleError(new Error('ABN is invalid'));
        return;
      }
      if (abnData?.exists) {
        handleError(new Error('ABN is already registered. Please use a different ABN.'));
        return;
      }

      body.support_mode = supportMode;
      if (supportMode === 'vendor') {
        if (!vendorType.trim()) {
          handleError(new Error('Vendor type is required'));
          return;
        }
        body.vendor_type = vendorType.trim();
        const detailPayload = {};
        
        body.vendor_details = detailPayload;
      }
    }
    if (role === 'participant' && ndisNumber.trim()) {
      body.ndis_number = ndisNumber.replace(/\D/g, '').slice(0, 10);
    }

    const { data, error: err } = await api.post('/api/auth/register', body);
    if (err) {
      if (role === 'worker' && err?.status === 409) {
        handleError(new Error('Worker registration failed: ABN or email is already registered.'));
        return;
      }
      handleError(err);
      return;
    }
    if (data?.ok && data?.pending_verification) {
      navigation.navigate('Verification', { email: data.email || email.trim().toLowerCase() });
    } else if (data?.ok && data?.token) {
      setAuth(data.token, data.user);
    } else {
      handleError(new Error(data?.error || 'Registration failed'));
    }
  });

  if (isLoading) {
    return <LoadingScreen message="Creating account…" />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.xs }}>
          Sign up
        </Text>

        <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.text.primary, marginBottom: Spacing.sm }}>
          I am a
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: Spacing.lg, gap: Spacing.sm }}>
          <Pressable
            onPress={() => setRole('participant')}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: Radius.md,
              backgroundColor: role === 'participant' ? Colors.primary : Colors.surface,
              borderWidth: 1,
              borderColor: role === 'participant' ? Colors.primary : Colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: role === 'participant' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
              Participant
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('worker')}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: Radius.md,
              backgroundColor: role === 'worker' ? Colors.primary : Colors.surface,
              borderWidth: 1,
              borderColor: role === 'worker' ? Colors.primary : Colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: role === 'worker' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
              Worker
            </Text>
          </Pressable>
        </View>

        <Text style={labelStyle}>Email</Text>
        <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!isLoading} />

        <Text style={labelStyle}>Password (min 8 characters)</Text>
        <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={password} onChangeText={setPassword} secureTextEntry editable={!isLoading} />

        <Text style={labelStyle}>First name</Text>
        <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={firstName} onChangeText={setFirstName} editable={!isLoading} />

        <Text style={labelStyle}>Last name</Text>
        <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={lastName} onChangeText={setLastName} editable={!isLoading} />

        {role === 'worker' && (
          <>
            <Text style={labelStyle}>Support type</Text>
            <View style={{ flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm }}>
              <Pressable
                onPress={() => setSupportMode('individual')}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: supportMode === 'individual' ? Colors.primary : Colors.surface,
                  borderWidth: 1,
                  borderColor: supportMode === 'individual' ? Colors.primary : Colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: supportMode === 'individual' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                  Support as individual
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSupportMode('vendor')}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: Radius.md,
                  backgroundColor: supportMode === 'vendor' ? Colors.primary : Colors.surface,
                  borderWidth: 1,
                  borderColor: supportMode === 'vendor' ? Colors.primary : Colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: supportMode === 'vendor' ? Colors.text.white : Colors.text.primary, fontWeight: Typography.fontWeight.semibold }}>
                  Support as vendor
                </Text>
              </Pressable>
            </View>

            <Text style={labelStyle}>ABN (11 digits) *</Text>
            <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={abn} onChangeText={setAbn} keyboardType="number-pad" maxLength={11} editable={!isLoading} />

            {supportMode === 'vendor' && (
              <>
                <Text style={labelStyle}>Vendor type</Text>
                <TextInput
                  style={[inputStyle, { marginBottom: Spacing.md }]}
                  value={vendorType}
                  onChangeText={setVendorType}
                  editable={!isLoading}
                />

              </>
            )}
          </>
        )}
        {role === 'participant' && (
          <>
            <Text style={labelStyle}>NDIS number (optional, 10 digits)</Text>
            <TextInput style={[inputStyle, { marginBottom: Spacing.md }]} value={ndisNumber} onChangeText={setNdisNumber} keyboardType="number-pad" maxLength={10} editable={!isLoading} />
          </>
        )}

        <Text style={labelStyle}>Phone (optional)</Text>
        <TextInput style={[inputStyle, { marginBottom: Spacing.lg }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!isLoading} />

        {error ? (
          <Text style={{ color: Colors.status.error, fontSize: Typography.fontSize.sm, marginBottom: Spacing.md }}>
            {error.message}
          </Text>
        ) : null}

        <Pressable onPress={onRegister} style={({ pressed }) => buttonStyle(pressed)}>
          <Text style={{ color: Colors.text.white, fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.base }}>
            Create account
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: Colors.text.secondary, fontSize: Typography.fontSize.sm }}>
            Already have an account? <Text style={{ color: Colors.primary, fontWeight: Typography.fontWeight.semibold }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const labelStyle = { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.text.primary, marginBottom: Spacing.sm };
