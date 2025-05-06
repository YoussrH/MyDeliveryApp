"use client"
import { useState, useEffect } from "react"
import { View, Text, Alert, TouchableOpacity, Image } from "react-native"
import { useNavigation } from "@react-navigation/native"
import Button from "@/components/Button"
import Input from "@/components/Input"
import { Ionicons } from "@expo/vector-icons"
import tw from "@/utils/tw"

const ScannerScreen = () => {
  const navigation = useNavigation()
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [codeValue, setCodeValue] = useState("")

  useEffect(() => {
    // Simulate permission granted
    setHasPermission(true)
  }, [])

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    Alert.alert(
      "Code scanné", 
      `Commande #${data} identifiée`,
      [
        {
          text: "Voir les détails",
          onPress: () => navigation.navigate("DetailCommande", { id: "2" }),
        },
        {
          text: "Scanner à nouveau",
          onPress: () => setScanned(false),
          style: "cancel",
        },
      ]
    )
  }

  const handleManualSubmit = () => {
    if (!codeValue.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un code valide")
      return
    }

    Alert.alert(
      "Code saisi", 
      `Commande #${codeValue} identifiée`,
      [
        {
          text: "Voir les détails",
          onPress: () => navigation.navigate("DetailCommande", { id: "1" }),
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    )
  }

  const CameraPreview = () => (
    <View style={tw`flex-1 justify-center items-center bg-slate-800 rounded-xl overflow-hidden mb-4`}>
      <View style={tw`w-64 h-64 relative border-2 border-slate-600`}>
        <View style={tw`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-violet-600`} />
        <View style={tw`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-violet-600`} />
        <View style={tw`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-violet-600`} />
        <View style={tw`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-violet-600`} />
      </View>
      <Text style={tw`text-white font-medium mt-8`}>Scannez le QR code de la commande</Text>
    </View>
  )

  if (hasPermission === null) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>Demande d'autorisation de la caméra...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6`}>
        <View style={tw`bg-white p-6 rounded-xl shadow-sm items-center`}>
          <Ionicons name="camera-off" size={48} color={tw.color("text-slate-500")} style={tw`mb-4`} />
          <Text style={tw`text-xl font-semibold text-slate-800 mb-2`}>Accès à la caméra requis</Text>
          <Text style={tw`text-base text-slate-600 text-center mb-6`}>
            L'accès à la caméra est nécessaire pour scanner les QR codes des commandes
          </Text>
          <Button
            title="Autoriser l'accès"
            onPress={() => setHasPermission(true)}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={tw`flex-1 bg-slate-50 p-4`}>
      {manualEntry ? (
        <View style={tw`bg-white p-4 rounded-xl shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-xl font-semibold text-slate-800`}>Saisie manuelle</Text>
            <TouchableOpacity 
              onPress={() => setManualEntry(false)} 
              style={tw`p-1`}
            >
              <Ionicons name="close" size={24} color={tw.color("text-slate-500")} />
            </TouchableOpacity>
          </View>

          <Text style={tw`text-base text-slate-600 mb-6`}>
            Entrez le numéro de commande ou scannez le QR code
          </Text>

          <Input
            label="Code de la commande"
            placeholder="Ex: 123456"
            value={codeValue}
            onChangeText={setCodeValue}
            keyboardType="number-pad"
            autoFocus
            containerStyle={tw`mb-6`}
            leftIcon={<Ionicons name="barcode" size={20} color={tw.color("text-slate-500")} />}
          />

          <Button 
            title="Valider" 
            onPress={handleManualSubmit} 
          />
        </View>
      ) : (
        <>
          <CameraPreview />

          {scanned && (
            <Button 
              title="Scanner à nouveau" 
              onPress={() => setScanned(false)} 
              style={tw`mb-3`}
              variant="outline"
            />
          )}

          <Button
            title="Saisir le code manuellement"
            variant="outline"
            onPress={() => setManualEntry(true)}
            style={tw`mb-3`}
            icon={<Ionicons name="keypad" size={20} color={tw.color("text-white")} />}
            textStyle={tw`text-white`} // This will make the button text white
          />


          <TouchableOpacity
            style={tw`py-3 items-center`}
            onPress={() => handleBarCodeScanned({ type: "QR", data: "2" })}
          >
            <Text style={tw`text-slate-500 underline`}>Simuler un scan (démo)</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

export default ScannerScreen