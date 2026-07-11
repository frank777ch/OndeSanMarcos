import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useMapStore } from "@/core/store/useMapStore";
import { lightColors } from "@/theme/light";
import {
  X,
  MapPin,
  Clock,
  Info,
  Phone,
  GraduationCap,
  Coffee,
  Bookmark,
  Hash,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PEEK_HEIGHT = 130; // Altura cuando está contraído (muestra título y botones)
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.6; // 60% de la pantalla cuando se expande

export function MapPlaceInfoCard() {
  const focusedPlace = useMapStore((s) => s.focusedPlace);
  const setFocusedPlace = useMapStore((s) => s.setFocusedPlace);
  const isRouteActive = useMapStore((s) => s.isRouteActive);

  // Animación del Bottom Sheet
  const translateY = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  // Cuando hay un nuevo lugar enfocado, mostramos la tarjeta en modo PEEK
  useEffect(() => {
    if (focusedPlace && !isRouteActive) {
      setIsVisible(true);
      Animated.spring(translateY, {
        toValue: EXPANDED_HEIGHT - PEEK_HEIGHT,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      setIsExpanded(false);
    } else {
      // Ocultar totalmente la tarjeta
      Animated.timing(translateY, {
        toValue: EXPANDED_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [focusedPlace, isRouteActive, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        let newY =
          (isExpandedRef.current ? 0 : EXPANDED_HEIGHT - PEEK_HEIGHT) +
          gestureState.dy;
        // Limitar para que no suba más del EXPANDED_HEIGHT ni baje de ocultarse
        if (newY < 0) newY = 0;
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 50; // distancia para decidir si cambia de estado
        if (gestureState.dy < -threshold && !isExpandedRef.current) {
          // Deslizó hacia arriba -> Expandir
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          setIsExpanded(true);
        } else if (gestureState.dy > threshold && isExpandedRef.current) {
          // Deslizó hacia abajo desde expandido -> Contraer (Peek)
          Animated.spring(translateY, {
            toValue: EXPANDED_HEIGHT - PEEK_HEIGHT,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
          setIsExpanded(false);
        } else if (gestureState.dy > threshold && !isExpandedRef.current) {
          // Deslizó hacia abajo desde contraído -> Cerrar tarjeta
          setFocusedPlace(null);
        } else {
          // Volver a la posición original (no pasó el threshold)
          Animated.spring(translateY, {
            toValue: isExpandedRef.current ? 0 : EXPANDED_HEIGHT - PEEK_HEIGHT,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  // No desmontar de inmediato para permitir que se anime de salida
  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
        {
          height: EXPANDED_HEIGHT,
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Handle de arrastre */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      <View style={styles.content}>
        {/* Encabezado: Título y Cerrar */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.nameText} numberOfLines={2}>
              {focusedPlace?.name}
            </Text>
            {focusedPlace?.schedule && (
              <Text style={styles.scheduleText} numberOfLines={1}>
                {focusedPlace.schedule}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFocusedPlace(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar información del lugar"
          >
            <X size={24} color={lightColors.textH1} />
          </TouchableOpacity>
        </View>

        {/* Información Detallada (Solo visible en modo expandido) */}
        <Animated.View
          style={[
            styles.expandedContent,
            {
              opacity: translateY.interpolate({
                inputRange: [0, EXPANDED_HEIGHT - PEEK_HEIGHT],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Acerca de este lugar</Text>

            <View style={styles.infoRow}>
              <MapPin
                size={20}
                color={lightColors.textH1}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                {focusedPlace?.description ||
                  "Este lugar es un punto de interés dentro del campus universitario de la UNMSM."}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Clock
                size={20}
                color={lightColors.textH1}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoText}>
                  {focusedPlace?.schedule ||
                    "Abierto de Lunes a Viernes, 08:00 AM - 10:00 PM."}
                </Text>
                {focusedPlace?.detailedSchedule && focusedPlace.detailedSchedule.length > 0 && (
                  <View style={[styles.listItemsContainer, { paddingLeft: 0, marginTop: 8 }]}>
                    {focusedPlace.detailedSchedule.map((item, i) => (
                      <View key={i} style={styles.listItem}>
                        <ChevronRight size={16} color={lightColors.textH1} style={styles.listIcon} />
                        <Text style={styles.listText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {focusedPlace?.phone && (
              <View style={styles.infoRow}>
                <Phone
                  size={20}
                  color={lightColors.textH1}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Teléfono: {focusedPlace.phone}
                </Text>
              </View>
            )}

            {focusedPlace?.annex && (
              <View style={styles.infoRow}>
                <Hash
                  size={20}
                  color={lightColors.textH1}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  Anexo: {focusedPlace.annex}
                </Text>
              </View>
            )}

            {focusedPlace?.careers && focusedPlace.careers.length > 0 && (
              <View style={styles.listSection}>
                <View style={styles.listSectionHeader}>
                  <GraduationCap
                    size={20}
                    color={lightColors.textH1}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.listSectionTitle}>Carreras:</Text>
                </View>
                <View style={styles.listItemsContainer}>
                  {focusedPlace.careers.map((career, i) => (
                    <View key={i} style={styles.listItem}>
                      <ChevronRight size={16} color={lightColors.textH1} style={styles.listIcon} />
                      <Text style={styles.listText}>{career}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {focusedPlace?.usage && (
              <View style={styles.infoRow}>
                <Bookmark
                  size={20}
                  color={lightColors.textH1}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>Uso: {focusedPlace.usage}</Text>
              </View>
            )}

            {focusedPlace?.services && focusedPlace.services.length > 0 && (
              <View style={styles.listSection}>
                <View style={styles.listSectionHeader}>
                  <Coffee
                    size={20}
                    color={lightColors.textH1}
                    style={styles.infoIcon}
                  />
                  <Text style={styles.listSectionTitle}>Servicios:</Text>
                </View>
                <View style={styles.listItemsContainer}>
                  {focusedPlace.services.map((svc, i) => (
                    <View key={i} style={styles.listItem}>
                      <CheckCircle2 size={16} color={lightColors.textH1} style={styles.listIcon} />
                      <Text style={styles.listText}>{svc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Info
                size={20}
                color={lightColors.textH1}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Por favor, recuerda mantener las instalaciones limpias y
                respetar las normas de la universidad durante tu visita.
              </Text>
            </View>

            {focusedPlace?.keywords && focusedPlace.keywords.length > 0 && (
              <View style={styles.keywordsContainer}>
                <Text style={styles.keywordsTitle}>Etiquetas:</Text>
                <View style={styles.badgesWrapper}>
                  {focusedPlace.keywords.map((kw, index) => (
                    <View key={index} style={styles.badge}>
                      <Text style={styles.badgeText}>{kw}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 100, // Asegurar que esté encima de todo
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  nameText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: lightColors.textH1,
    marginBottom: 4,
  },
  scheduleText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: lightColors.textH1,
  },
  closeButton: {
    backgroundColor: "#F0F0F0",
    padding: 8,
    borderRadius: 20,
  },
  expandedContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: lightColors.textH1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: lightColors.textH1,
    lineHeight: 20,
  },
  listSection: {
    marginBottom: 16,
  },
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  listSectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: lightColors.textH1,
    lineHeight: 20,
    flex: 1,
  },
  listItemsContainer: {
    paddingLeft: 36,
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  listIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 14,
    color: lightColors.textH1,
    lineHeight: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  keywordsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  keywordsTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: lightColors.textH1,
    marginBottom: 12,
  },
  badgesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: lightColors.textH1,
  },
});
