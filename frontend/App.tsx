import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@providers/AuthProvider";
import { AppNavigator } from "@navigation/AppNavigator";
import { useFonts } from "expo-font";
import {
  FunnelDisplay_400Regular,
  FunnelDisplay_500Medium,
  FunnelDisplay_600SemiBold,
  FunnelDisplay_700Bold,
} from "@expo-google-fonts/funnel-display";
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

export default function App() {
  const [fontsLoaded] = useFonts({
    FunnelDisplay_400Regular,
    FunnelDisplay_500Medium,
    FunnelDisplay_600SemiBold,
    FunnelDisplay_700Bold,
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
