// src/features/map/components/MapSearchBar.tsx
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export function MapSearchBar() {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8} 
      onPress={() => console.log('Navegar a la pantalla de búsqueda real')}
    >
      <Ionicons name="search" size={20} color="#666" />
      <Text style={styles.placeholder}>Buscar...</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // La magia para que flote sobre el mapa
    position: 'absolute',
    top: Constants.statusBarHeight + 15, // Se ajusta dinámicamente debajo de la barra de estado
    left: 20,
    right: 20,
    zIndex: 10, // Asegura que esté por encima de Mapbox
    
    // Diseño visual (Basado en tu Figma)
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    
    // Sombra bonita
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5, // Sombra específica para Android
  },
  placeholder: {
    marginLeft: 10,
    color: '#888',
    fontSize: 16,
  }
});