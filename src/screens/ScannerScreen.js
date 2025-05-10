import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQRScanner } from "@/hooks/useQRScanner";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  const {
    scannerQRCode,
    resultat,
    chargement,
    erreur,
    reinitialiser,
  } = useQRScanner();

  useEffect(() => {
    animateLine();
  }, []);

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

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Nous avons besoin d'accéder à la caméra</Text>
        <Button title="Autoriser" onPress={requestPermission} />
      </View>
    );
  }

  const handleScan = async ({ data }) => {
    if (!scanned) {
      setScanned(true);
      await scannerQRCode(data);
      setTimeout(() => {
        setScanned(false);
        reinitialiser();
      }, 5000);
    }
  };

  const scanLineTranslate = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128"],
        }}
        onBarcodeScanned={handleScan}
      />

      {/* Overlay outside CameraView */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslate }] },
            ]}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        {chargement && <ActivityIndicator size="large" color="#FFA500" style={{ marginTop: 10 }} />}
        {resultat && (
          <Text style={styles.successText}>
            ✅ Scan Réussi : Livraison Confirmer avec succès
          </Text>
        )}
        {erreur && <Text style={styles.errorText}>❌ {erreur}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    marginTop: 20,
    color: "#fff",
  },
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
    borderColor: "#FFA500",
    borderRadius: 12,
    overflow: "hidden",
  },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#FFA500",
    position: "absolute",
    top: 0,
    left: 0,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    alignItems: "center",
  },
  successText: {
    color: "lime",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});

export default ScannerScreen;
