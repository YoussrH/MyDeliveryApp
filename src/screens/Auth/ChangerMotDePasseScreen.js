import { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import tw from "@/utils/tw";

const ChangerMotDePasseScreen = ({ navigation }) => {
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmerMotDePasse, setConfirmerMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  
  const { 
    changerMotDePasse,
    chargement 
  } = useAuth();

  const handleChangementMotDePasse = async () => {
    // Reset messages
    setErreur("");
    setSucces("");

    // Validate inputs
    if (!motDePasseActuel || !nouveauMotDePasse || !confirmerMotDePasse) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }

    if (nouveauMotDePasse !== confirmerMotDePasse) {
      setErreur("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (motDePasseActuel === nouveauMotDePasse) {
      setErreur("Le nouveau mot de passe doit être différent de l'actuel");
      return;
    }

    try {
      const result = await changerMotDePasse(motDePasseActuel, nouveauMotDePasse);
      
      if (result.succes) {
        setSucces("Mot de passe changé avec succès");
        // Clear form
        setMotDePasseActuel("");
        setNouveauMotDePasse("");
        setConfirmerMotDePasse("");
        // Navigate back after 1.5 seconds
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setErreur(result.erreur || "Échec du changement de mot de passe");
      }
    } catch (error) {
      setErreur("Une erreur est survenue lors du changement de mot de passe");
      console.error("Erreur changement mot de passe:", error);
    }
  };

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
            <Ionicons name="lock-closed" color={tw.color("text-violet-600")} size={40} />
          </View>
          <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>Changer le mot de passe</Text>
          <Text style={tw`text-base text-slate-500 text-center`}>
            Pour des raisons de sécurité, choisissez un mot de passe fort
          </Text>
        </View>

        <View style={tw`w-full`}>
          {/* Error Message */}
          {erreur ? (
            <View style={tw`flex-row items-center bg-red-100 p-3 rounded-lg mb-4`}>
              <Ionicons name="alert-circle" size={20} color={tw.color("text-red-500")} />
              <Text style={tw`text-red-700 ml-2 text-sm`}>{erreur}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {succes ? (
            <View style={tw`flex-row items-center bg-green-100 p-3 rounded-lg mb-4`}>
              <Ionicons name="checkmark-circle" size={20} color={tw.color("text-green-500")} />
              <Text style={tw`text-green-700 ml-2 text-sm`}>{succes}</Text>
            </View>
          ) : null}

          {/* Current Password Input */}
          <Input
            label="Mot de passe actuel"
            placeholder="Votre mot de passe actuel"
            value={motDePasseActuel}
            onChangeText={setMotDePasseActuel}
            secureTextEntry={!afficherMotDePasse}
            containerStyle={tw`mb-4`}
            leftIcon={<Ionicons name="lock-closed" size={20} color={tw.color("text-slate-500")} />}
            rightIcon={<MotDePasseIcon />}
            autoCapitalize="none"
            autoCorrect={false}
          />

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
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Confirm New Password Input */}
          <Input
            label="Confirmer le nouveau mot de passe"
            placeholder="Confirmez votre nouveau mot de passe"
            value={confirmerMotDePasse}
            onChangeText={setConfirmerMotDePasse}
            secureTextEntry={!afficherMotDePasse}
            containerStyle={tw`mb-6`}
            leftIcon={<Ionicons name="lock-closed" size={20} color={tw.color("text-slate-500")} />}
            rightIcon={<MotDePasseIcon />}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Submit Button */}
          <Button 
            title="Changer le mot de passe" 
            onPress={handleChangementMotDePasse} 
            loading={chargement} 
            style={tw`mt-2 h-12`}
            disabled={chargement}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangerMotDePasseScreen;