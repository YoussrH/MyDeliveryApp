import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQRScanner } from "@/hooks/useQRScanner";

const ScannerScreen = () => {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const {
    scannerQRCode,
    resultat,
    chargement,
    erreur,
    reinitialiser,
  } = useQRScanner();

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Nous avons besoin d'accéder à la caméra</Text>
        <Button title="Autoriser" onPress={requestPermission} />
      </View>
    );
  }

  const handleScan = async ({ data, type }) => {
    if (!scanned) {
      setScanned(true);
      await scannerQRCode(data);

      setTimeout(() => {
        setScanned(false);
        reinitialiser();
      }, 5000);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128"],
        }}
        onBarcodeScanned={handleScan}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </CameraView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Changer caméra</Text>
        </TouchableOpacity>

        {chargement && <ActivityIndicator size="large" color="#000" style={{ marginTop: 10 }} />}

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
  container: { flex: 1, backgroundColor: "#000" },
  message: { textAlign: "center", marginTop: 20, color: "#fff" },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
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
