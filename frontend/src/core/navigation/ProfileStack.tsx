import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "./types";
import { ProfileScreen } from "@features/profile/screens/ProfileScreen";
import { EditProfileScreen } from "@features/profile/screens/EditProfileScreen";
import { ThemeScreen } from "@features/profile/screens/ThemeScreen";
import { NotificationsScreen } from "@features/profile/screens/NotificationsScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackButtonDisplayMode: "minimal",
        headerTintColor: "#000",
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: true, title: "Editar perfil" }} 
      />
      <Stack.Screen 
        name="Theme" 
        component={ThemeScreen} 
        options={{ headerShown: true, title: "Apariencia" }} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ headerShown: true, title: "Notificaciones" }} 
      />
    </Stack.Navigator>
  );
}
