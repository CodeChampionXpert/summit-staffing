import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {LoginScreen} from '../screens/auth/LoginScreen.js';
import {RegisterScreen} from '../screens/auth/RegisterScreen.js';
import {ForgotPasswordScreen} from '../screens/auth/ForgotPasswordScreen.js';
import {VerificationScreen} from '../screens/auth/VerificationScreen.js';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: { email?: string } | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{title: 'Reset Password'}} />
      <Stack.Screen name="Verification" component={VerificationScreen} options={{title: 'Verify Email'}} />
    </Stack.Navigator>
  );
};
