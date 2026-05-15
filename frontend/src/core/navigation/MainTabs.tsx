import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabsParamList } from "./types";
import { MapScreen } from "@features/map/screens/MapScreen";
import { ChatScreen } from "@features/chat/screens/ChatScreen";
import { Colors } from "@constants/colors";
import { ProfileScreen } from "@features/profile/screens/ProfileScreen";
import { MapPinned, MessageCircle, User2 } from "lucide-react-native";
import { lightColors } from "@/theme/light";

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lightColors.bgPrimaryBtn,
        tabBarInactiveTintColor: lightColors.textGhostBtn,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 88,
          paddingTop: 10,
          paddingBottom: 24,
        },
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: "Mapa",
          tabBarIcon: ({ color }) => <MapPinned color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: "Asistente",
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color }) => <User2 color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}
