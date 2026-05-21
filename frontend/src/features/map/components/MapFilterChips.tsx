import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const FILTERS = [
  { id: '1', label: 'Facultades', icon: 'business-outline' },
  { id: '2', label: 'Cafeterías', icon: 'cafe-outline' },
  { id: '3', label: 'Auditorios', icon: 'mic-outline' },
  { id: '4', label: 'Deportes', icon: 'football-outline' },
];

interface MapFilterChipsProps {
  activeFilter: string | null;
  onFilterChange: (filter: string) => void;
}

export function MapFilterChips({ activeFilter, onFilterChange }: MapFilterChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.label;
          return (
            <TouchableOpacity 
              key={filter.id} 
              style={[styles.chip, isActive && styles.chipActive]} 
              activeOpacity={0.8}
              onPress={() => onFilterChange(filter.label)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={isActive ? "#FFFFFF" : "#4A4A4A"} 
              />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Constants.statusBarHeight + 80,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chipActive: {
    backgroundColor: '#003087', // Azul UNMSM
  },
  chipText: {
    marginLeft: 6,
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  }
});