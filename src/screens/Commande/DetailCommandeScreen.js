import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Linking, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal,
  Animated,
  StyleSheet,
  TextInput,
  Alert
} from "react-native";
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useLivraisons } from "@/hooks/useLivraisons";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import tw from "@/utils/tw";

const DetailCommandeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id, livraisonId } = route.params;
  const { api, livreurInfo } = useAuth();
  const { 
    mettreAJourStatutLivraison, 
    obtenirLivraisonParId,
    signalerProblemeLivraison
  } = useLivraisons();
  
  const [livraison, setLivraison] = useState({
    client_nom: "",
    reference: "",
    adresse_livraison: "",
    client_telephone: "",
    statut: "en_attente",
    montant_total: "0.000",
    mode_paiement: "",
    date_creation: new Date().toISOString(),
    colis: [],
    instructions: ""
  });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dataErrors, setDataErrors] = useState({
    address: false,
    phone: false,
    coordinates: false
  });

  // Feedback modal states (like ScannerScreen)
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("success");

  // Problem reporting states
  const [showReportModal, setShowReportModal] = useState(false);
  const [problemType, setProblemType] = useState(null);
  const [problemNotes, setProblemNotes] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const problemTypes = [
    { id: 'livraison_echouee', label: "Livraison échouée", icon: "close-circle" },
    { id: 'produit_endommage', label: "Produit endommagé", icon: "package-variant" },
    { id: 'adresse_incorrecte', label: "Adresse incorrecte", icon: "map-marker-off" },
    { id: 'demande_de_remplacement', label: "Demande de remplacement", icon: "package-variant-plus" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rawData = await obtenirLivraisonParId(livraisonId || id);
        
        const validatedData = {
          ...rawData,
          client_nom: rawData.client_nom || "Client inconnu",
          reference: rawData.reference || "N/A",
          adresse_livraison: validateAddress(rawData.adresse_livraison),
          client_telephone: validatePhoneNumber(rawData.client_telephone),
          montant_total: formatCurrency(rawData.montant_total),
          date_creation: validateDate(rawData.date_creation),
          colis: validateColis(rawData.colis || [])
        };

        setDataErrors({
          address: !validatedData.adresse_livraison,
          phone: !validatedData.client_telephone,
          coordinates: false
        });

        setLivraison(validatedData);
      } catch (error) {
        console.error('Data loading error:', error);
        showFeedback("❌ Erreur: Problème de chargement des données", "error");
        setDataErrors({
          address: true,
          phone: true,
          coordinates: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [livraisonId, id]);

  // Show feedback modal (like ScannerScreen)
  const showFeedback = (message, type = "success") => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setIsFeedbackVisible(true);
  };

  // Validation helpers
  const validateAddress = (address) => {
    if (!address || typeof address !== "string") return null;
    const trimmed = address.trim();
    return trimmed.length > 5 ? trimmed : null;
  };

  const validatePhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.toString().replace(/\D/g, '');
    return cleaned.length >= 8 ? cleaned : null;
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return num.toFixed(3);
  };

  const validateDate = (dateString) => {
    try {
      return new Date(dateString).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const validateColis = (colisArray) => {
    if (!Array.isArray(colisArray)) return [];
    return colisArray.map(item => ({
      ...item,
      numero_suivi: item.numero_suivi || "N/A",
      statut: item.statut || "en_attente"
    }));
  };

  const getStatutBadge = (statut, badgeStatut) => {
    const statusMap = {
      expediee: { label: "En cours", variant: "warning" },
      livree: { label: "Livrée", variant: "success" },
      annulee: { label: "Annulée", variant: "danger" },
      en_attente: { label: "En attente", variant: "info" },
      en_preparation: { label: "En préparation", variant: "secondary" },
      retourne: { label: "Retournée", variant: "danger" },
      remplacee: { label: "Remplacée", variant: "neutral" },
      echec: { label: "Échec", variant: "danger" }
    };
    
    const statusKey = badgeStatut || statut;
    const status = statusMap[statusKey] || statusMap.en_preparation;
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const handleStatusChange = async (newStatus) => {
    if (!livraison?.livraison_id) {
      showFeedback("❌ Erreur: Données de livraison incomplètes", "error");
      return;
    }

    try {
      setUpdatingStatus(true);
      const success = await mettreAJourStatutLivraison(livraison.livraison_id, newStatus);
      
      if (success) {
        setLivraison(prev => ({
          ...prev,
          statut: newStatus,
          badge_statut: newStatus,
          colis: prev.colis.map(colis => ({
            ...colis,
            statut: newStatus === 'livree' ? 'livree' : colis.statut,
            ...(newStatus === 'livree' && { date_livraison: new Date().toISOString() })
          }))
        }));
        
        showFeedback(`✅ Succès: Statut mis à jour (${getStatusLabel(newStatus)})`);
        
        if (newStatus === 'livree') {
          setTimeout(() => navigation.goBack(), 1500);
        }
      }
    } catch (error) {
      console.error('Status update error:', error);
      showFeedback("❌ Erreur: Échec de la mise à jour", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      expediee: "En cours",
      livree: "Livrée",
      annulee: "Annulée",
      en_attente: "En attente",
      en_preparation: "En préparation",
      retourne: "Retournée",
      remplacee: "Remplacée",
      echec: "Échec"
    };
    return statusMap[status] || status;
  };

  const submitProblemReport = async () => {
    if (!problemType) {
      showFeedback("❌ Erreur: Veuillez sélectionner un type de problème", "error");
      return;
    }

    try {
      setIsReporting(true);
      const result = await signalerProblemeLivraison(
        livraison.livraison_id,
        problemType,
        problemNotes
      );

      if (result?.success) {
        showFeedback("✅ Succès: Votre signalement a été enregistré");
        
        setShowReportModal(false);
        setProblemType(null);
        setProblemNotes('');
        
        const newStatus = problemType === 'demande_de_remplacement' 
          ? 'remplacee' 
          : 'retourne';
        
        setLivraison(prev => ({
          ...prev,
          statut: 'echec',
          badge_statut: newStatus,
          colis: prev.colis.map(colis => ({
            ...colis,
            statut: newStatus === 'retourne' ? 'retourne' : colis.statut,
            ...(newStatus === 'retourne' && { date_retour: new Date().toISOString() })
          }))
        }));
      }
    } catch (error) {
      showFeedback(`❌ Erreur: ${error.message || "Échec de l'envoi du signalement"}`, "error");
    } finally {
      setIsReporting(false);
    }
  };

  const openVerifiedGoogleMaps = async () => {
    if (dataErrors.address || !livraison.adresse_livraison) {
      Alert.alert(
        "Adresse Invalide", 
        "L'adresse n'est pas valide pour la navigation",
        [
          { text: "OK" },
          { 
            text: "Signaler le problème", 
            onPress: () => setShowReportModal(true)
          }
        ]
      );
      return;
    }

    const tunisiaAddress = `${livraison.adresse_livraison}, Tunisie`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tunisiaAddress)}`;
    
    try {
      const supported = await Linking.canOpenURL(mapsUrl);
      
      if (supported) {
        await Linking.openURL(mapsUrl);
      } else {
        Alert.alert(
          "Google Maps",
          "L'application n'est pas installée. Ouvrir dans le navigateur?",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir", onPress: () => Linking.openURL(mapsUrl) }
          ]
        );
      }
    } catch (error) {
      console.error('Maps error:', error);
      showFeedback("❌ Erreur: Impossible d'ouvrir la carte", "error");
    }
  };

  const confirmAction = (action, title, message) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: action }
      ]
    );
  };

  const marquerCommeLivree = () => {
    confirmAction(
      () => handleStatusChange('livree'),
      "Livraison complétée",
      "Confirmez-vous que cette livraison est terminée?"
    );
  };

  const signalerEchec = () => {
    setShowReportModal(true);
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return "";
    const cleaned = phone.toString().replace(/\D/g, '');
    return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
  };

  const formatDeliveryDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Date non disponible";
    }
  };

  // Feedback Modal (like ScannerScreen)
  const renderFeedbackModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isFeedbackVisible}
      onRequestClose={() => setIsFeedbackVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsFeedbackVisible(false)}
      >
        <View style={styles.feedbackBox}>
          <Text style={feedbackType === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
            {feedbackMessage}
          </Text>
          <Button 
            title="Fermer" 
            onPress={() => setIsFeedbackVisible(false)} 
            style={tw`mt-4 bg-orange-500`}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Problem Report Modal (updated to match style)
  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-xl font-bold text-slate-800`}>Signaler un problème</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={tw.color("slate-500")} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={tw`mb-3 text-base font-medium text-slate-700`}>Type de problème</Text>
            <View style={tw`mb-4`}>
              {problemTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={tw`flex-row items-center p-3 mb-2 bg-white rounded-lg border ${
                    problemType === type.id ? 'border-orange-500' : 'border-slate-200'
                  }`}
                  onPress={() => setProblemType(type.id)}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={20}
                    color={problemType === type.id ? tw.color('orange-500') : tw.color('slate-500')}
                  />
                  <Text style={tw`ml-3 text-slate-700`}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={tw`mb-3 text-base font-medium text-slate-700`}>Détails (optionnel)</Text>
            <TextInput
              style={tw`h-24 p-4 mb-6 bg-white border rounded-lg border-slate-200 text-slate-700`}
              multiline
              placeholder="Décrivez le problème rencontré..."
              value={problemNotes}
              onChangeText={setProblemNotes}
            />

            <View style={tw`flex-row justify-between mt-4`}>
              <Button
                title="Annuler"
                onPress={() => setShowReportModal(false)}
                variant="neutral"
                style={tw`flex-1 mr-2`}
                disabled={isReporting}
              />
              <Button
                title={isReporting ? "Envoi..." : "Envoyer"}
                onPress={submitProblemReport}
                style={tw`flex-1 ml-2 bg-orange-500`}
                loading={isReporting}
                disabled={isReporting || !problemType}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={tw`items-center justify-center flex-1 bg-slate-50`}>
        <ActivityIndicator size="large" color={tw.color("orange-600")} />
        <Text style={tw`mt-4 font-medium text-slate-500`}>Chargement en cours...</Text>
      </View>
    );
  }

  if (dataErrors.address && dataErrors.phone) {
    return (
      <View style={tw`items-center justify-center flex-1 p-6 bg-slate-50`}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={tw.color("red-500")} />
        <Text style={tw`mt-4 text-lg font-bold text-center text-red-500`}>
          Données incomplètes
        </Text>
        <Text style={tw`mt-2 text-center text-slate-600`}>
          Les informations de livraison sont incomplètes ou invalides.
        </Text>
        <Button
          title="Signaler le problème"
          onPress={() => setShowReportModal(true)}
          style={tw`mt-6`}
          variant="destructive"
        />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-slate-50`} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={tw`p-6 mb-2 bg-white shadow-sm rounded-b-3xl`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View>
            <Text style={tw`text-2xl font-bold text-slate-800`}>
              {livraison.client_nom}
            </Text>
            <Text style={tw`mt-1 text-sm font-medium text-slate-500`}>
              Référence: {livraison.reference}
            </Text>
          </View>
          {getStatutBadge(livraison.statut)}
        </View>

        {/* Phone Number */}
        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`p-2 rounded-full ${dataErrors.phone ? 'bg-red-100' : 'bg-blue-100'}`}>
            <FontAwesome 
              name="phone" 
              size={16} 
              color={dataErrors.phone ? tw.color("red-500") : tw.color("blue-600")} 
            />
          </View>
          {dataErrors.phone ? (
            <Text style={tw`ml-3 text-base font-medium text-red-500`}>
              Téléphone non disponible
            </Text>
          ) : (
            <Text 
              style={tw`ml-3 text-base font-medium text-blue-600`}
              onPress={() => Linking.openURL(`tel:${livraison.client_telephone}`)}
            >
              {formatPhoneDisplay(livraison.client_telephone)}
            </Text>
          )}
        </View>

        {/* Address with Maps */}
        <TouchableOpacity 
          style={tw`flex-row items-start mb-3`}
          onPress={openVerifiedGoogleMaps}
          activeOpacity={0.7}
          disabled={dataErrors.address}
        >
          <View style={tw`p-2 rounded-full ${dataErrors.address ? 'bg-red-100' : 'bg-slate-100'}`}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={16} 
              color={dataErrors.address ? tw.color("red-500") : tw.color("slate-600")} 
            />
          </View>
          <View style={tw`flex-1 ml-3`}>
            <Text style={[
              tw`text-base font-medium`,
              dataErrors.address ? tw`text-red-500` : tw`text-slate-700`
            ]}>
              {dataErrors.address ? "Adresse non valide" : livraison.adresse_livraison}
            </Text>
            <Text style={[
              tw`mt-1 text-sm`,
              dataErrors.address ? tw`text-red-400` : tw`text-blue-500`
            ]}>
              {dataErrors.address ? "Cliquez pour signaler" : "Ouvrir dans Google Maps"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Delivery Date */}
        <View style={tw`flex-row items-center`}>
          <View style={tw`p-2 rounded-full bg-slate-100`}>
            <MaterialCommunityIcons name="clock" size={16} color={tw.color("slate-600")} />
          </View>
          <Text style={tw`ml-3 text-base font-medium text-slate-700`}>
            {formatDeliveryDate(livraison.date_creation)}
          </Text>
        </View>
      </View>

      {/* Packages Section */}
      {livraison.colis.length > 0 && (
        <View style={tw`p-6 mx-4 mb-4 bg-white shadow-sm rounded-2xl`}>
          <Text style={tw`mb-4 text-lg font-bold text-slate-800`}>
            Colis ({livraison.colis.length})
          </Text>
          {livraison.colis.map((colis, index) => (
            <View 
              key={`colis-${index}`}
              style={tw`py-3 ${index < livraison.colis.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View style={tw`flex-row items-start justify-between`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-slate-800`}>
                    Suivi: {colis.numero_suivi}
                  </Text>
                  {colis.description && (
                    <Text style={tw`mt-1 text-sm text-slate-500`}>
                      {colis.description}
                    </Text>
                  )}
                </View>
                <View style={tw`ml-2`}>
                  {getStatutBadge(colis.statut)}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Payment Summary */}
      <View style={tw`p-6 mx-4 mb-4 bg-white shadow-sm rounded-2xl`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-lg font-bold text-slate-800`}>Montant total</Text>
          <Text style={tw`text-xl font-extrabold text-orange-600`}>
            {livraison.montant_total} DT
          </Text>
        </View>
        {livraison.mode_paiement && (
          <View style={tw`flex-row items-center mt-2`}>
            <MaterialCommunityIcons 
              name={livraison.mode_paiement === 'espèce' ? 'cash' : 'credit-card'} 
              size={18} 
              color={tw.color("slate-500")} 
            />
            <Text style={tw`ml-2 text-sm text-slate-500`}>
              Paiement: {livraison.mode_paiement}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Instructions */}
      {livraison.instructions && (
        <View style={tw`p-6 mx-4 mb-4 bg-white shadow-sm rounded-2xl`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`p-2 bg-orange-100 rounded-full`}>
              <MaterialCommunityIcons 
                name="information" 
                size={16} 
                color={tw.color("orange-600")} 
              />
            </View>
            <Text style={tw`ml-3 text-lg font-bold text-slate-800`}>
              Instructions spéciales
            </Text>
          </View>
          <Text style={tw`p-4 text-base leading-6 rounded-lg text-slate-600 bg-slate-50`}>
            {livraison.instructions}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={tw`px-4 mb-8`}>
        {livraison.statut === "expediee" && (
          <>
            <Button
              title="Marquer comme livrée"
              onPress={marquerCommeLivree}
              style={tw`mb-3 bg-orange-600`}
              loading={updatingStatus}
              disabled={updatingStatus}
              icon={<MaterialCommunityIcons name="check-circle" size={20} color="white" />}
            />
            
            <Button
              title="Signaler un problème"
              onPress={signalerEchec}
              variant="destructive"
              style={tw`mb-3 bg-orange-600`}
              icon={<MaterialCommunityIcons name="alert-circle" size={20} color="white" />}
            />
          </>
        )}
      </View>

      {/* Feedback Modal */}
      {renderFeedbackModal()}
      
      {/* Problem Report Modal */}
      {renderReportModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  feedbackBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  feedbackSuccessText: {
    color: "orange",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  feedbackErrorText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 20,
    maxHeight: "80%",
    width: "90%",
  },
});

export default DetailCommandeScreen;