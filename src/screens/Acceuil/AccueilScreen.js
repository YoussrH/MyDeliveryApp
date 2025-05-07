import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import tw from "@/utils/tw";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useLivraisons } from "@/hooks/useLivraisons";
import { useQRScanner } from "@/hooks/useQRScanner";
import { useNavigation } from "@react-navigation/native";

const AccueilScreen = () => {
  const navigation = useNavigation();
  const { utilisateur, livreurInfo } = useAuth();
  const { 
    livraisons,
    statistiques,
    chargement,
    erreur,
    obtenirLivraisonsAujourdhui,
    mettreAJourStatutLivraison,
    updateServiceStatus,
    obtenirStatistiques
  } = useLivraisons();
  const { scannerQRCode } = useQRScanner();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filteredDeliveries = livraisons.filter(delivery => 
    (delivery.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (delivery.client_nom?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (delivery.adresse_livraison?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        obtenirLivraisonsAujourdhui(),
        obtenirStatistiques()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      Alert.alert("Erreur", "Impossible de charger les données");
    }
  }, [obtenirLivraisonsAujourdhui, obtenirStatistiques]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleStatusChange = async (livraisonId, currentStatus) => {
    let newStatus;
    switch(currentStatus) {
      case 'en_preparation':
        newStatus = 'expediee';
        break;
      case 'expediee':
        newStatus = 'livree';
        break;
      default:
        return;
    }

    const success = await mettreAJourStatutLivraison(livraisonId, newStatus);
    if (success) {
      await loadData();
      Alert.alert("Succès", "Statut de livraison mis à jour");
    } else {
      Alert.alert("Erreur", "Échec de la mise à jour du statut");
    }
  };

  const handleScanPress = () => {
    navigation.navigate("Scanner");
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "expediee": return <Badge variant="warning">En cours</Badge>;
      case "livree": return <Badge variant="success">Livrée</Badge>;
      case "annulee": return <Badge variant="danger">Annulée</Badge>;
      case "en_attente": return <Badge variant="info">En attente</Badge>;
      default: return <Badge variant="secondary">En préparation</Badge>;
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (chargement.livraisons && !refreshing) {
    return (
      <View style={tw`items-center justify-center flex-1`}>
        <ActivityIndicator size="large" color={tw.color("violet-600")} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={tw`flex-1 p-4 mt-10 bg-slate-50`} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-6`}>
        <View>
          <Text style={tw`text-2xl font-bold text-slate-800`}>
            Bonjour, {utilisateur?.prenom || "Livreur"}
          </Text>
          <Text style={tw`mt-1 text-sm text-slate-500`}>
            {new Date().toLocaleDateString("fr-FR", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={tw`flex-row items-center p-2 mb-4 bg-white rounded-lg`}>
        <Feather 
          name="search" 
          size={20} 
          color={tw.color("text-slate-400")} 
          style={tw`mr-2`} 
        />
        <TextInput
          style={tw`flex-1 text-slate-800`}
          placeholder="Rechercher une commande..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Feather name="x" size={20} color={tw.color("text-slate-400")} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {erreur && (
        <View style={tw`p-3 mb-4 bg-red-100 rounded-lg`}>
          <Text style={tw`text-red-600`}>{erreur}</Text>
        </View>
      )}

      {/* Stats Card */}
      <View style={tw`p-4 mb-6 bg-white shadow-sm rounded-xl`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>Statistiques</Text>
        </View>
        <View style={tw`flex-row justify-between`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-slate-800`}>
              {statistiques?.livraisonsDuJour?.total || 0}
            </Text>
            <Text style={tw`mt-1 text-sm text-slate-500`}>Aujourd'hui</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-emerald-500`}>
              {statistiques?.livraisonsDuJour?.completees || 0}
            </Text>
            <Text style={tw`mt-1 text-sm text-slate-500`}>Complétées</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-amber-500`}>
              {statistiques?.enCours || 0}
            </Text>
            <Text style={tw`mt-1 text-sm text-slate-500`}>En cours</Text>
          </View>
        </View>
        <View style={tw`pt-4 mt-4 border-t border-slate-200`}>
          <Text style={tw`text-sm text-slate-500`}>
            Ce mois: {statistiques?.colisLivresCeMois || 0} colis livrés
          </Text>
        </View>
      </View>

      {/* Current Deliveries */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>
            Mes livraisons
          </Text>
          {filteredDeliveries.length > 0 && (
            <TouchableOpacity 
              onPress={() => navigation.navigate("Livraisons", { fromAccueil: true })}
            >
              <Text style={tw`text-sm font-medium text-violet-600`}>Voir tout</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map((delivery) => (
            <TouchableOpacity 
              key={delivery.livraison_id} 
              activeOpacity={0.7}
              onPress={() => navigation.navigate("DetailCommande", { livraisonId: delivery.livraison_id })}
            >
              <View style={tw`p-4 mb-3 bg-white shadow-sm rounded-xl`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View>
                    <Text style={tw`text-base font-semibold text-slate-800`}>
                      {delivery.client_nom}
                    </Text>
                    <Text style={tw`mt-1 text-sm text-slate-500`}>
                      {new Date(delivery.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {delivery.reference}
                    </Text>
                  </View>
                  {getStatutBadge(delivery.statut)}
                </View>

                <View style={tw`flex-row items-center mb-2`}>
                  <MaterialCommunityIcons 
                    name="map-marker" 
                    size={16} 
                    color={tw.color("text-slate-500")} 
                  />
                  <Text style={tw`flex-1 ml-2 text-sm text-slate-600`}>
                    {delivery.adresse_livraison}
                  </Text>
                </View>

                {delivery.colis && delivery.colis.length > 0 && (
                  <View style={tw`flex-row items-center mb-3`}>
                    <MaterialCommunityIcons 
                      name="package-variant" 
                      size={16} 
                      color={tw.color("text-slate-500")} 
                    />
                    <Text style={tw`flex-1 ml-2 text-sm text-slate-600`}>
                      Colis: {delivery.colis[0].numero_suivi || 'Non disponible'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={tw`items-center justify-center p-6 bg-white shadow-sm rounded-xl`}>
            {searchQuery ? (
              <Text style={tw`text-slate-500`}>Aucun résultat pour "{searchQuery}"</Text>
            ) : (
              <Text style={tw`text-slate-500`}>Aucune livraison prévue aujourd'hui</Text>
            )}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={tw`mb-6`}>
        <Text style={tw`mb-4 text-lg font-semibold text-slate-800`}>
          Actions rapides
        </Text>
        <View style={tw`flex-row justify-between`}>
          <TouchableOpacity 
            style={tw`items-center w-1/3`}
            onPress={handleScanPress}
          >
            <View style={tw`items-center justify-center mb-2 w-14 h-14 bg-violet-100 rounded-xl`}>
              <MaterialCommunityIcons 
                name="qrcode-scan" 
                size={24} 
                color={tw.color("text-violet-600")} 
              />
            </View>
            <Text style={tw`text-sm text-slate-800`}>Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center w-1/3`}
            onPress={() => navigation.navigate("Livraisons", { fromAccueil: true })}
          >
            <View style={tw`items-center justify-center mb-2 bg-blue-100 w-14 h-14 rounded-xl`}>
              <MaterialCommunityIcons 
                name="package-variant" 
                size={24} 
                color={tw.color("text-blue-500")} 
              />
            </View>
            <Text style={tw`text-sm text-slate-800`}>Livraisons</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center w-1/3`}
            onPress={() => navigation.navigate("Statistiques")}
          >
            <View style={tw`items-center justify-center mb-2 bg-pink-100 w-14 h-14 rounded-xl`}>
              <Ionicons 
                name="stats-chart" 
                size={24} 
                color={tw.color("text-pink-500")} 
              />
            </View>
            <Text style={tw`text-sm text-slate-800`}>Statistiques</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default AccueilScreen;