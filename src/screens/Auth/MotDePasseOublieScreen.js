import React, { useState, useEffect, useRef } from "react";
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

const MotDePasseOublieScreen = ({ navigation }) => {
  console.log("[DEBUG] MotDePasseOublieScreen rendered");
  
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [compteur, setCompteur] = useState(0);
  const compteurRef = useRef(null);
  
  const { motDePasseOublie, chargement } = useAuth();

  const demarrerCompteur = () => {
    console.log("[DEBUG] Starting countdown timer");
    setCompteur(30);
    compteurRef.current = setInterval(() => {
      setCompteur(prev => {
        if (prev <= 1) {
          console.log("[DEBUG] Countdown finished");
          clearInterval(compteurRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  const handleDemandeReinitialisation = async () => {
    console.log("[DEBUG] handleDemandeReinitialisation triggered");
    
    if (!email) {
      setErreur("Veuillez entrer votre email");
      return;
    }
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur("Format d'email invalide");
      return;
    }
  
    if (compteur > 0) return;
  
    setErreur("");
    setSucces("");
  
    try {
      console.log("[DEBUG] Calling motDePasseOublie API with email:", email);
      const result = await motDePasseOublie(email);
      console.log("[DEBUG] API response:", result);
      
      // Modified this condition to check for success message
      if (result.succes || result.erreur?.includes("envoyé avec succès")) {
        console.log("[DEBUG] Password reset request successful");
        setSucces(`Un code a été envoyé à ${email}`);
        demarrerCompteur();
        
        console.log("[DEBUG] Navigating to VerifierCode");
        navigation.navigate("VerifierCode", { email });
      } else {
        setErreur(result.erreur || "Cet email n'est pas enregistré");
      }
    } catch (err) {
      console.error("[ERROR] in handleDemandeReinitialisation:", err);
      setErreur("Erreur de connexion au serveur");
    }
  };

  useEffect(() => {
    console.log("[DEBUG] MotDePasseOublieScreen mounted");
    return () => {
      console.log("[DEBUG] MotDePasseOublieScreen unmounted");
      if (compteurRef.current) {
        console.log("[DEBUG] Clearing countdown timer");
        clearInterval(compteurRef.current);
      }
    };
  }, []);

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
            <Ionicons name="lock-closed" color={tw.color("text-violet-600")} size={40} />
          </View>
          <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>Mot de passe oublié</Text>
          <Text style={tw`text-base text-slate-500 text-center`}>
            Entrez votre email pour recevoir un code de réinitialisation
          </Text>
        </View>

        <Input
          label="Email"
          placeholder="email@exemple.com"
          value={email}
          onChangeText={(text) => {
            console.log("[DEBUG] Email input changed:", text);
            setEmail(text);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={tw`mb-4`}
          leftIcon={<Ionicons name="mail" size={20} color={tw.color("text-slate-500")} />}
        />

        {erreur && (
          <View style={tw`bg-red-50 p-3 rounded-lg mb-4 border border-red-100`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="warning" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`text-red-700 ml-2`}>{erreur}</Text>
            </View>
          </View>
        )}

        {succes && (
          <View style={tw`bg-green-50 p-3 rounded-lg mb-4 border border-green-100`}>
            <View style={tw`flex-row items-center`}>
              <Ionicons name="checkmark-circle" size={20} color={tw.color("text-green-600")} />
              <Text style={tw`text-green-700 ml-2`}>{succes}</Text>
            </View>
          </View>
        )}

        <Button 
          title={
            compteur > 0 
              ? `Renvoyer (${compteur}s)` 
              : chargement ? "Envoi en cours..." : "Envoyer le code"
          }
          onPress={handleDemandeReinitialisation}
          disabled={chargement || compteur > 0}
          style={tw`mt-2 h-12`}
        />

        <TouchableOpacity 
          style={tw`self-center mt-6`}
          onPress={() => {
            console.log("[DEBUG] Back to login pressed");
            navigation.goBack();
          }}
        >
          <Text style={tw`text-violet-600 text-sm font-medium`}>
            Retour à la connexion
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MotDePasseOublieScreen;