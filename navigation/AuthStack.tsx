import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { Colors } from '../constants/theme.js';
import { LoginScreen } from '../screens/auth/LoginScreen.js';
import { SignUpRoleChoice } from '../screens/auth/SignUpRoleChoice.js';
import { RegisterScreen } from '../screens/auth/RegisterScreen.js';
import { ParticipantSignUpStack } from './ParticipantSignUpStack';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen.js';
import { VerificationScreen } from '../screens/auth/VerificationScreen.js';

const headerStyle = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.text.white,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUpRoleChoice: undefined;
  Register: { role?: 'worker' | 'participant' } | undefined;
  ParticipantSignUp: undefined;
  ForgotPassword: undefined;
  Verification: { email?: string } | undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in', headerShown: true }} />
      <Stack.Screen name="SignUpRoleChoice" component={SignUpRoleChoice} options={{ title: 'Sign up' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign up' }} />
      <Stack.Screen name="ParticipantSignUp" component={ParticipantSignUpStack} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
      <Stack.Screen name="Verification" component={VerificationScreen} options={{ title: 'Verify Email' }} />
    </Stack.Navigator>
  );
};
