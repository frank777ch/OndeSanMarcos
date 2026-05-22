import { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definimos los "cables" de comunicación con el mapa principal
interface MapActionButtonsProps {
  onModeSelect: (modo: 'ninguno' | 'libre' | 'guia') => void;
}

export function MapActionButtons({ onModeSelect }: MapActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.whiteButton} activeOpacity={0.8}>
        <Ionicons name="git-network-outline" size={20} color="#4A4A4A" />
        <Text style={styles.whiteText}>Iniciar ruta</Text>
      </TouchableOpacity>

      {isExpanded ? (
        <>
          <TouchableOpacity 
            style={styles.purpleButton} 
            activeOpacity={0.8}
            onPress={() => onModeSelect('libre')} // <--- AVISAMOS QUE QUEREMOS MODO LIBRE
          >
            <Ionicons name="navigate-outline" size={20} color="#FFF" />
            <Text style={styles.purpleText}>Modo libre</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.purpleButton} activeOpacity={0.8}>
            <Ionicons name="location-outline" size={20} color="#FFF" />
            <Text style={styles.purpleText}>Modo de guía</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.purpleButton} 
            activeOpacity={0.8}
            onPress={() => {
              onModeSelect('ninguno'); // <--- APAGAMOS LOS MODOS
              setIsExpanded(false);
            }}
          >
            <Ionicons name="close" size={20} color="#FFF" />
            <Text style={styles.purpleText}>Cerrar los modos</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity 
          style={styles.purpleButton} 
          activeOpacity={0.8}
          onPress={() => setIsExpanded(true)}
        >
          <Ionicons name="map-outline" size={20} color="#FFF" />
          <Text style={styles.purpleText}>Modos de seguimiento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30, // Separación desde abajo (para no chocar con tu futuro Bottom Tab Bar)
    right: 20,
    zIndex: 10,
    alignItems: 'flex-end', // Alinea todos los botones hacia la derecha
    gap: 12, // Espacio entre los botones
  },
  
  // Estilos del botón blanco
  whiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  whiteText: {
    marginLeft: 8,
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '500',
  },

  // Estilos de los botones morados
  purpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#512DA8', // Color morado similar a tu Figma
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  purpleText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  }
});