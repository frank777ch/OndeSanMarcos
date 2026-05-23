import { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Route, Road, Signpost, X, Map } from "lucide-react-native";
import { lightColors } from "@/theme/light";

// Definimos los "cables" de comunicación con el mapa principal
interface MapActionButtonsProps {
  onModeSelect: (modo: "ninguno" | "libre" | "guia") => void;
}

export function MapActionButtons({ onModeSelect }: MapActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.whiteButton} activeOpacity={0.8}>
        <Route size={20} color={lightColors.textLinkBtn} />
        <Text style={styles.whiteText}>Iniciar ruta</Text>
      </TouchableOpacity>

      {isExpanded ? (
        <>
          <TouchableOpacity
            style={styles.blueButton}
            activeOpacity={0.8}
            onPress={() => onModeSelect("libre")} // <--- AVISAMOS QUE QUEREMOS MODO LIBRE
          >
            <Road size={20} color="#FFF" />
            <Text style={styles.blueText}>Modo libre</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.blueButton} activeOpacity={0.8}>
            <Signpost size={20} color="#FFF" />
            <Text style={styles.blueText}>Modo de guía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueButton}
            activeOpacity={0.8}
            onPress={() => {
              onModeSelect("ninguno"); // <--- APAGAMOS LOS MODOS
              setIsExpanded(false);
            }}
          >
            <X size={20} color="#FFF" />
            <Text style={styles.blueText}>Cerrar los modos</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.blueButton}
          activeOpacity={0.8}
          onPress={() => setIsExpanded(true)}
        >
          <Map size={20} color="#FFF" />
          <Text style={styles.blueText}>Modos de seguimiento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30, // Separación desde abajo (para no chocar con tu futuro Bottom Tab Bar)
    right: 20,
    zIndex: 10,
    alignItems: "flex-end", // Alinea todos los botones hacia la derecha
    gap: 16, // Espacio entre los botones
  },

  // Estilos del botón blanco
  whiteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bg,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  whiteText: {
    marginLeft: 8,
    color: lightColors.textLinkBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
  },

  blueButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightColors.bgPrimaryBtn,
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  blueText: {
    marginLeft: 8,
    color: lightColors.textPrimaryBtn,
    fontFamily: "DMSans_500Medium",
    fontSize: 15,
  },
});
