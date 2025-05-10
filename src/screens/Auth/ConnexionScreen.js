import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
  Image
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
        contentContainerStyle={tw`justify-center flex-grow p-6`}
        keyboardShouldPersistTaps="handled"
      >
        <View style={tw`items-center mb-10`}>
          <View>
            <Image
              source={require('../../../assets/iconapp.png')}
              style={tw`items-center justify-center mb-4 rounded-full h-28 w-28`}
              resizeMode="contain"
            />
          </View>
          <Text style={tw`mb-2 text-2xl font-bold text-slate-800`}>Livreur Pro</Text>
          <Text style={tw`text-base text-center text-slate-500`}>
            Connectez-vous pour commencer
          </Text>
        </View>

        <View style={tw`w-full`}>
          {(erreur || authErreur) && (
            <View style={tw`flex-row items-center p-3 mb-4 border border-red-100 rounded-lg bg-red-50`}>
              <Ionicons name="alert-circle" size={20} color={tw.color("text-red-600")} />
              <Text style={tw`ml-2 text-sm text-red-700`}>{erreur || authErreur}</Text>
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
            <Text style={tw`text-sm font-medium text-orange-600`}>Mot de passe oublié ?</Text>
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
            style={tw`h-12 mt-2 bg-orange-600`}
            icon={!(isSubmitting || authChargement) && (
              <Ionicons name="arrow-forward" size={20} color="white" />
            )}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ConnexionScreen;