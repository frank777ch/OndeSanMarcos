import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export function MapLocationButton() {
  return (
    <TouchableOpacity 
      style={styles.button} 
      activeOpacity={0.8}
      onPress={() => console.log('Centrar en mi ubicación')}
    >
      <Ionicons name="locate-outline" size={20} color="#4A4A4A" />
      <Text style={styles.text}>Mi ubicación</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    // Se coloca debajo de los chips de filtro
    top: Constants.statusBarHeight + 140,
    right: 20,
    zIndex: 10,
    
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    marginLeft: 8,
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '500',
  }
});