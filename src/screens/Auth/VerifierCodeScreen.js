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
        console.log("[DEBUG] Code verification successful, navigating to reset");
        navigation.navigate("ReinitialiserMotDePasse", {
          email,
          code,
          token: result.token // Use the token directly from result
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
        contentContainerStyle={tw`justify-center flex-grow p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`items-center mb-10`}>
          <View style={tw`items-center justify-center w-20 h-20 mb-4 bg-orange-100 rounded-full`}>
            <Ionicons name="key" color={tw.color("text-orange-600")} size={40} />
          </View>
          <Text style={tw`mb-2 text-2xl font-bold text-slate-800`}>Vérification</Text>
          {email && (
            <Text style={tw`text-base text-center text-slate-500`}>
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
          <View style={tw`p-3 mb-4 border border-red-100 rounded-lg bg-red-50`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="warning" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`ml-2 text-red-700`}>{erreur}</Text>
            </View>
          </View>
        )}

        <Button 
          title={chargement ? "Vérification..." : "Vérifier le code"}
          onPress={handleVerification}
          loading={chargement}
          style={tw`h-12 mt-2`}
        />

        <TouchableOpacity 
          style={tw`self-center mt-6`}
          onPress={() => {
            console.log("[DEBUG] Resend code pressed");
            navigation.navigate("MotDePasseOublie", { email });
          }}
        >
          <Text style={tw`text-sm font-medium text-orange-600`}>
            Renvoyer le code
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifierCodeScreen;