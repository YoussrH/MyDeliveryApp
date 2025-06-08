import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
  Modal, // Import Modal from react-native
  TouchableOpacity, // Import for dismissible modal
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQRScanner } from "@/hooks/useQRScanner"; // Ensure this path is correct

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  // State to control the visibility of the feedback modal
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("success"); // 'success' or 'error'

  const {
    scannerQRCode,
    resultat, // Result from the useQRScanner hook
    chargement,
    erreur, // Error from the useQRScanner hook
    reinitialiser,
  } = useQRScanner();

  // Effect for the scanning line animation
  useEffect(() => {
    animateLine();
  }, []);

  // Effect to show feedback when resultat or erreur changes
  useEffect(() => {
    if (resultat) {
      setFeedbackMessage("✅ Scan Réussi : Livraison Confirmée avec succès !");
      setFeedbackType("success");
      setIsFeedbackVisible(true);
    } else if (erreur) {
      setFeedbackMessage(`❌ Erreur : ${erreur}`);
      setFeedbackType("error");
      setIsFeedbackVisible(true);
    }
  }, [resultat, erreur]); // Re-run when resultat or erreur changes

  const animateLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Handle camera permission request
  if (!permission) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FFA500" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionMessage}>Nous avons besoin d'accéder à la caméra pour scanner les QR codes.</Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} color="#FFA500" />
      </View>
    );
  }

  // Handle QR code scan event
  const handleScan = async ({ data }) => {
    if (!scanned && !chargement) { // Prevent multiple scans and scanning while loading
      setScanned(true); // Mark as scanned to prevent immediate re-scanning
      setIsFeedbackVisible(false); // Hide any previous feedback before starting new scan

      await scannerQRCode(data); // Call your hook's scan function

      // Reset scan state after a delay, regardless of result, to allow new scans
      // The feedback modal will manage its own visibility.
      setTimeout(() => {
        setScanned(false);
        reinitialiser(); // Reset useQRScanner hook state
      }, 5000); // Allow some time for feedback to be seen before new scan
    }
  };

  // Interpolate for the scanning line animation
  const scanLineTranslate = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250], // Moves the line across the 250px scanArea height
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScan} // Only active when not 'scanned'
      />

      {/* Overlay for the scanning frame and animation */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslate }] },
            ]}
          />
        </View>
        <Text style={styles.scanInstruction}>
            Placez le code QR dans le cadre
        </Text>
      </View>

      {/* Loading Indicator at the bottom */}
      {chargement && (
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="large" color="#FFA500" />
          <Text style={styles.loadingText}>Vérification du code...</Text>
        </View>
      )}

      {/* Feedback Modal */}
      <Modal
        animationType="fade" // Or "slide"
        transparent={true}
        visible={isFeedbackVisible}
        onRequestClose={() => setIsFeedbackVisible(false)} // For Android back button
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1} // Prevents opacity change on press
          onPress={() => setIsFeedbackVisible(false)} // Dismiss on outside press
        >
          <View style={styles.feedbackBox}>
            <Text style={feedbackType === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
              {feedbackMessage}
            </Text>
            <Button title="Fermer" onPress={() => setIsFeedbackVisible(false)} color="#FFA500" />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // --- Permission Styles ---
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 20,
  },
  permissionMessage: {
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
    fontSize: 16,
  },
  // --- Scanner Overlay Styles ---
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#FFA500", // Orange color for the scan border
    borderRadius: 12, // Slightly rounded corners for the scan frame
    overflow: "hidden", // Crucial for the scan line animation to stay within bounds
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly transparent background for the scan area
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#FFA500", // Orange scan line
    position: "absolute",
    top: 0,
    left: 0,
  },
  scanInstruction: {
    color: "#fff",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.75)', // Add shadow for better readability
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  // --- Loading Indicator Styles ---
  loadingIndicatorContainer: {
    position: "absolute",
    bottom: 80, // Position above the very bottom
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  loadingText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },
  // --- Feedback Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker transparent background for modal
  },
  feedbackBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackSuccessText: {
    color: "green",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  feedbackErrorText: {
    color: "red",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default ScannerScreen;