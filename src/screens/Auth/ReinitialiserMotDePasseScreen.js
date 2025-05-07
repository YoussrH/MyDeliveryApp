import React, { useState ,useEffect} from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import tw from "@/utils/tw";

const ReinitialiserMotDePasseScreen = ({ route, navigation }) => {
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  
  const { reinitialiserMotDePasse, chargement } = useAuth();
  const { email, code, token } = route.params || {};
  
  console.log("[DEBUG] Reset password params:", { email, code, token });

  const handleReinitialisation = async () => {
    // Reset previous messages
    setErreur("");
    setSucces("");

    // Validate inputs
    if (!nouveauMotDePasse || !confirmerMotDePasse) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }

    if (nouveauMotDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (nouveauMotDePasse !== confirmerMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      console.log("[DEBUG] Attempting password reset...");
      const result = await reinitialiserMotDePasse(
        email, 
        code, 
        nouveauMotDePasse,
        token
      );
      
      console.log("[DEBUG] Reset result:", result);
      
      if (result.succes) {
        setSucces("Mot de passe réinitialisé avec succès!");
        
        // Show success alert
        Alert.alert(
          "Succès", 
          "Votre mot de passe a été réinitialisé avec succès",
          [
            {
              text: "Se connecter",
              onPress: () => navigation.navigate("Connexion")
            }
          ],
          { cancelable: false }
        );
      } else {
        setErreur(result.erreur || "Échec de la réinitialisation");
      }
    } catch (err) {
      console.error("[ERROR] in handleReinitialisation:", err);
      setErreur("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  useEffect(() => {
    if (!route.params?.email || !route.params?.code || !route.params?.token) {
      console.log("[ERROR] Missing required params, redirecting back");
      Alert.alert(
        "Erreur",
        "Session de réinitialisation invalide. Veuillez recommencer.",
        [{ text: "OK", onPress: () => navigation.navigate("MotDePasseOublie") }]
      );
    }
  }, [route.params]);

  const MotDePasseIcon = () => (
    <TouchableOpacity 
      onPress={() => setAfficherMotDePasse(!afficherMotDePasse)}
      style={tw`p-2`}
    >
      {afficherMotDePasse ? (
        <Ionicons name="eye-off" size={20} color={tw.color("text-slate-500")} />
      ) : (
        <Ionicons name="eye" size={20} color={tw.color("text-slate-500")} />
      )}
    </TouchableOpacity>
  );

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
            <Ionicons name="lock-open" color={tw.color("text-violet-600")} size={40} />
          </View>
          <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>Nouveau mot de passe</Text>
          {email && (
            <Text style={tw`text-base text-slate-500 text-center`}>
              Pour {email}
            </Text>
          )}
        </View>

        <View style={tw`w-full`}>
          {/* Error Message */}
          {erreur ? (
            <View style={tw`flex-row items-center bg-red-50 p-3 rounded-lg mb-4 border border-red-100`}>
              <Ionicons name="alert-circle" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`text-red-700 ml-2 text-sm`}>{erreur}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {succes ? (
            <View style={tw`flex-row items-center bg-green-50 p-3 rounded-lg mb-4 border border-green-100`}>
              <Ionicons name="checkmark-circle" size={20} color={tw.color("text-green-600")} />
              <Text style={tw`text-green-700 ml-2 text-sm`}>{succes}</Text>
            </View>
          ) : null}

          {/* New Password Input */}
          <Input
            label="Nouveau mot de passe"
            placeholder="Votre nouveau mot de passe"
            value={nouveauMotDePasse}
            onChangeText={setNouveauMotDePasse}
            secureTextEntry={!afficherMotDePasse}
            containerStyle={tw`mb-4`}
            leftIcon={<Ionicons name="lock-closed" size={20} color={tw.color("text-slate-500")} />}
            rightIcon={<MotDePasseIcon />}
          />

          {/* Confirm Password Input */}
          <Input
            label="Confirmer le mot de passe"
            placeholder="Confirmez votre nouveau mot de passe"
            value={confirmerMotDePasse}
            onChangeText={setConfirmerMotDePasse}
            secureTextEntry={!afficherMotDePasse}
            containerStyle={tw`mb-6`}
            leftIcon={<Ionicons name="lock-closed" size={20} color={tw.color("text-slate-500")} />}
            rightIcon={<MotDePasseIcon />}
          />

          {/* Reset Button */}
          <Button 
            title={
              chargement ? (
                <ActivityIndicator color="white" />
              ) : (
                "Réinitialiser"
              )
            }
            onPress={handleReinitialisation}
            disabled={chargement}
            style={tw`mt-2 h-12`}
          />

          {/* Back to Login Link */}
          <TouchableOpacity 
            style={tw`self-center mt-6`}
            onPress={() => navigation.navigate("Connexion")}
            disabled={chargement}
          >
            <Text style={tw`text-violet-600 text-sm font-medium`}>
              Retour à la connexion
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ReinitialiserMotDePasseScreen;