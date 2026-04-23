import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View>
      <Text style={styles.text}>Hola, Grupo 07 - Condor Inc.</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  text: {
    fontSize: 20,
  }
})
