import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  EmailSent: { email?: string };
  VerifiedEmail: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Theme: undefined;
  Notifications: undefined;
};

export type MainTabsParamList = {
  Map: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type WelcomeScreenProps = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type EmailSentScreenProps = NativeStackScreenProps<AuthStackParamList, 'EmailSent'>;
export type VerifiedEmailScreenProps = NativeStackScreenProps<AuthStackParamList, 'VerifiedEmail'>;

export type ProfileMainScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;
export type EditProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;
export type ThemeScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Theme'>;
export type NotificationsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;

export type MapScreenProps = BottomTabScreenProps<MainTabsParamList, 'Map'>;
export type ChatScreenProps = BottomTabScreenProps<MainTabsParamList, 'Chat'>;