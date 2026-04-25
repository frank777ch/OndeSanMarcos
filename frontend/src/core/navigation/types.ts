import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabsParamList = {
  Map: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type MapScreenProps = BottomTabScreenProps<MainTabsParamList, 'Map'>;
export type ChatScreenProps = BottomTabScreenProps<MainTabsParamList, 'Chat'>;