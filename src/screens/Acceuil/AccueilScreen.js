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
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={tw.color("violet-600")} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={tw`flex-1 bg-slate-50 mt-10 p-4`} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <View>
          <Text style={tw`text-2xl font-bold text-slate-800`}>
            Bonjour, {utilisateur?.prenom || "Livreur"}
          </Text>
          <Text style={tw`text-sm text-slate-500 mt-1`}>
            {new Date().toLocaleDateString("fr-FR", { 
              weekday: "long", 
              day: "numeric", 
              month: "long" 
            })}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={tw`mb-4 bg-white p-2 rounded-lg flex-row items-center`}>
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
        <View style={tw`bg-red-100 p-3 rounded-lg mb-4`}>
          <Text style={tw`text-red-600`}>{erreur}</Text>
        </View>
      )}

      {/* Stats Card */}
      <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>Statistiques</Text>
        </View>
        <View style={tw`flex-row justify-between`}>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-slate-800`}>
              {statistiques?.livraisonsDuJour?.total || 0}
            </Text>
            <Text style={tw`text-sm text-slate-500 mt-1`}>Aujourd'hui</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-emerald-500`}>
              {statistiques?.livraisonsDuJour?.completees || 0}
            </Text>
            <Text style={tw`text-sm text-slate-500 mt-1`}>Complétées</Text>
          </View>
          <View style={tw`items-center flex-1`}>
            <Text style={tw`text-2xl font-bold text-amber-500`}>
              {statistiques?.enCours || 0}
            </Text>
            <Text style={tw`text-sm text-slate-500 mt-1`}>En cours</Text>
          </View>
        </View>
        <View style={tw`mt-4 pt-4 border-t border-slate-200`}>
          <Text style={tw`text-sm text-slate-500`}>
            Ce mois: {statistiques?.colisLivresCeMois || 0} colis livrés
          </Text>
        </View>
      </View>

      {/* Current Deliveries */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>
            Mes livraisons
          </Text>
          {filteredDeliveries.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate("Commandes")}>
              <Text style={tw`text-violet-600 text-sm font-medium`}>Voir tout</Text>
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
              <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <View>
                    <Text style={tw`text-base font-semibold text-slate-800`}>
                      {delivery.client_nom}
                    </Text>
                    <Text style={tw`text-sm text-slate-500 mt-1`}>
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
                  <Text style={tw`text-sm text-slate-600 ml-2 flex-1`}>
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
                    <Text style={tw`text-sm text-slate-600 ml-2 flex-1`}>
                      Colis: {delivery.colis[0].numero_suivi || 'Non disponible'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={tw`bg-white p-6 rounded-xl shadow-sm items-center justify-center`}>
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
        <Text style={tw`text-lg font-semibold text-slate-800 mb-4`}>
          Actions rapides
        </Text>
        <View style={tw`flex-row justify-between`}>
          <TouchableOpacity 
            style={tw`items-center w-1/3`}
            onPress={handleScanPress}
          >
            <View style={tw`w-14 h-14 bg-violet-100 rounded-xl justify-center items-center mb-2`}>
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
            onPress={() => navigation.navigate("Commandes")}
          >
            <View style={tw`w-14 h-14 bg-blue-100 rounded-xl justify-center items-center mb-2`}>
              <MaterialCommunityIcons 
                name="package-variant" 
                size={24} 
                color={tw.color("text-blue-500")} 
              />
            </View>
            <Text style={tw`text-sm text-slate-800`}>Commandes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`items-center w-1/3`}
            onPress={() => navigation.navigate("Statistiques")}
          >
            <View style={tw`w-14 h-14 bg-pink-100 rounded-xl justify-center items-center mb-2`}>
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