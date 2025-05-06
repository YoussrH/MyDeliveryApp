import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import tw from "@/utils/tw";

const VerifierCodeScreen = ({ route, navigation }) => {
  console.log("[DEBUG] VerifierCodeScreen rendered");
  console.log("[DEBUG] Route params:", route.params);
  
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  
  const { email } = route.params || {};
  const { verifierCodeReinitialisation } = useAuth();

  console.log("[DEBUG] Email from route params:", email);

  const handleVerification = async () => {
    console.log("[DEBUG] handleVerification triggered with code:", code);
    
    if (!code || code.length < 6) {
      setErreur("Veuillez entrer un code valide de 6 chiffres");
      return;
    }
  
    setChargement(true);
    setErreur("");
  
    try {
      console.log("[DEBUG] Calling verifierCodeReinitialisation API with:", { email, code });
      const result = await verifierCodeReinitialisation(email, code);
      console.log("[DEBUG] API response:", result);
      
      if (result.succes) {
        console.log("[DEBUG] Code verification successful");
        // Navigate to reset screen with ALL required parameters
        navigation.navigate("ReinitialiserMotDePasse", { 
          email,
          code,
          token: result.donnees.token // Make sure to pass the token!
        });
      } else {
        console.log("[DEBUG] Code verification failed:", result.erreur);
        setErreur(result.erreur || "Code invalide");
      }
    } catch (err) {
      console.error("[ERROR] in handleVerification:", err);
      setErreur("Erreur de connexion au serveur");
    } finally {
      setChargement(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={tw`flex-1 bg-slate-50`}
    >
      <ScrollView 
        contentContainerStyle={tw`flex-grow justify-center p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`items-center mb-10`}>
          <View style={tw`w-20 h-20 rounded-full bg-violet-100 justify-center items-center mb-4`}>
            <Ionicons name="key" color={tw.color("text-violet-600")} size={40} />
          </View>
          <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>Vérification</Text>
          {email && (
            <Text style={tw`text-base text-slate-500 text-center`}>
              Entrez le code envoyé à {email}
            </Text>
          )}
        </View>

        <Input
          label="Code de vérification"
          placeholder="Code à 6 chiffres"
          value={code}
          onChangeText={(text) => {
            console.log("[DEBUG] Code input changed:", text);
            // Only allow numeric input
            const numericText = text.replace(/[^0-9]/g, '');
            setCode(numericText);
          }}
          keyboardType="number-pad"
          maxLength={6}
          containerStyle={tw`mb-6`}
          leftIcon={<Ionicons name="key" size={20} color={tw.color("text-slate-500")} />}
        />

        {erreur && (
          <View style={tw`bg-red-50 p-3 rounded-lg mb-4 border border-red-100`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="warning" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`text-red-700 ml-2`}>{erreur}</Text>
            </View>
          </View>
        )}

        <Button 
          title={chargement ? "Vérification..." : "Vérifier le code"}
          onPress={handleVerification}
          loading={chargement}
          style={tw`mt-2 h-12`}
        />

        <TouchableOpacity 
          style={tw`self-center mt-6`}
          onPress={() => {
            console.log("[DEBUG] Resend code pressed");
            navigation.navigate("MotDePasseOublie", { email });
          }}
        >
          <Text style={tw`text-violet-600 text-sm font-medium`}>
            Renvoyer le code
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifierCodeScreen;