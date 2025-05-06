import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/Input";
import Button from "@/components/Button";
import tw from "@/utils/tw";
import { useNavigation } from "@react-navigation/native";

const ConnexionScreen = () => {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const { 
    connexionLivreur, 
    erreur: authErreur, 
    chargement: authChargement,
    utilisateur
  } = useAuth();

  useEffect(() => {
    // Clear errors when component mounts
    setErreur("");
  }, []);

  const handleConnexion = async () => {
    if (!email || !motDePasse) {
      setErreur("Veuillez remplir tous les champs");
      return;
    }

    setIsSubmitting(true);
    setErreur("");

    try {
      const result = await connexionLivreur(email, motDePasse);
      
      if (!result.succes) {
        setErreur(result.erreur || "Échec de la connexion");
      }
    } catch (error) {
      console.error('Login screen error:', error);
      setErreur("Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMotDePasseOublie = () => {
    navigation.navigate("MotDePasseOublie");
  };

  const MotDePasseIcon = () => (
    <TouchableOpacity 
      onPress={() => setAfficherMotDePasse(!afficherMotDePasse)}
      style={tw`p-2`}
    >
      {afficherMotDePasse ? (
        <MaterialCommunityIcons name="eye-off" size={20} color={tw.color("text-slate-500")} />
      ) : (
        <MaterialCommunityIcons name="eye" size={20} color={tw.color("text-slate-500")} />
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
            <MaterialCommunityIcons name="bike-fast" color={tw.color("text-violet-600")} size={40} />
          </View>
          <Text style={tw`text-2xl font-bold text-slate-800 mb-2`}>Livreur Pro</Text>
          <Text style={tw`text-base text-slate-500 text-center`}>Connectez-vous pour commencer</Text>
        </View>

        <View style={tw`w-full`}>
          {(erreur || authErreur) && (
            <View style={tw`flex-row items-center bg-red-50 p-3 rounded-lg mb-4 border border-red-100`}>
              <Ionicons name="alert-circle" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`text-red-700 ml-2 text-sm`}>{erreur || authErreur}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="Votre email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={tw`mb-4`}
            leftIcon={<Ionicons name="mail" size={20} color={tw.color("text-slate-500")} />}
          />

          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry={!afficherMotDePasse}
            containerStyle={tw`mb-4`}
            leftIcon={<Ionicons name="lock-closed" size={20} color={tw.color("text-slate-500")} />}
            rightIcon={<MotDePasseIcon />}
          />

          <TouchableOpacity 
            style={tw`self-end mb-6`}
            onPress={handleMotDePasseOublie}
          >
            <Text style={tw`text-violet-600 text-sm font-medium`}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Button 
            title={
              isSubmitting || authChargement ? (
                <ActivityIndicator color="white" />
              ) : (
                "Se connecter"
              )
            }
            onPress={handleConnexion} 
            disabled={isSubmitting || authChargement}
            style={tw`mt-2 h-12`}
            icon={!(isSubmitting || authChargement) && <Ionicons name="arrow-forward" size={20} color="white" />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ConnexionScreen;