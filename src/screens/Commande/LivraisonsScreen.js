"use client"
import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, Modal, SectionList, ActivityIndicator } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Badge from "@/components/Badge"
import tw from "@/utils/tw"
import { useLivraisons } from "@/hooks/useLivraisons"
import DatePicker from 'react-native-date-picker'

// Date formatting functions
const formatDateFR = (date) => {
  if (!date) return "Date inconnue"
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatShortDate = (date) => {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getDisplayDate = (livraison) => {
  if (livraison.statut === "livree") {
    return livraison.date_livraison || livraison.colis?.[0]?.date_livraison
  }
  if (livraison.statut === "expediee") {
    return livraison.colis?.[0]?.date_expedition
  }
  return livraison.date_creation || new Date()
}

const groupByDate = (livraisons) => {
  const grouped = {}
  
  livraisons.forEach(livraison => {
    const displayDate = getDisplayDate(livraison)
    const dateKey = formatDateFR(displayDate)
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = []
    }
    
    grouped[dateKey].push({
      ...livraison,
      displayDate
    })
  })
  
  return Object.entries(grouped).map(([date, data]) => ({
    title: date,
    data
  }))
}

const statusFilters = [
  { id: "toutes", label: "Toutes" },
  { id: "en_cours", label: "En cours" },
  { id: "livrees", label: "Livrées" },
  { id: "echecs", label: "Échecs" }
]

const LivraisonsScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const [filtreStatut, setFiltreStatut] = useState("toutes")
  const [dateSelectionnee, setDateSelectionnee] = useState(new Date())
  const [tempDate, setTempDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  const {
    livraisons,
    chargement,
    erreur,
    obtenirLivraisonsParDate
  } = useLivraisons()

  const fromAccueil = route.params?.fromAccueil

  const chargerLivraisons = useCallback(async (date) => {
    try {
      const targetDate = date || dateSelectionnee;
      if (isNaN(new Date(targetDate).getTime())) {
        console.warn('Invalid date, using current date instead');
        const today = new Date();
        setDateSelectionnee(today);
        return;
      }
      const startDate = new Date(targetDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(targetDate)
      endDate.setHours(23, 59, 59, 999)
      
      await obtenirLivraisonsParDate(startDate.toISOString(), endDate.toISOString())
    } catch (error) {
      console.error("Error loading deliveries:", error)
    }
  }, [dateSelectionnee, obtenirLivraisonsParDate])

  useEffect(() => {
const today = new Date();
    setDateSelectionnee(today);
    chargerLivraisons(today);
    }, [])

  const filtrerLivraisons = useCallback(() => {
    if (!livraisons || livraisons.length === 0) return []
    
    let filtered = [...livraisons]
    
    if (filtreStatut !== "toutes") {
      filtered = filtered.filter((livraison) => {
        if (filtreStatut === "en_cours") return livraison.statut === "expediee"
        if (filtreStatut === "livrees") return livraison.statut === "livree"
        if (filtreStatut === "echecs") return livraison.statut === "echec"
        return true
      })
    }
    
    return filtered
  }, [livraisons, filtreStatut])

  const navigateToCommande = (id) => {
    navigation.navigate("DetailCommande", { id })
  }
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



// Update the renderLivraison function
const renderLivraison = ({ item }) => (
  <TouchableOpacity 
    onPress={() => navigateToCommande(item.livraison_id)} 
    activeOpacity={0.7}
    style={tw`mb-3`}
  >
    <View style={tw`p-4 bg-white shadow-sm rounded-xl`}>
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <View>
          <Text style={tw`text-base font-semibold text-slate-800`}>
            {item.client_nom || "Client inconnu"}
          </Text>
          <Text style={tw`mt-1 text-xs text-slate-500`}>
            Réf: {item.reference || "N/A"} • {formatShortDate(item.displayDate)}
          </Text>
        </View>
        {getStatutBadge(item.statut, item.badge_statut)}
      </View>

      <View style={tw`flex-row items-center mb-2`}>
        <MaterialCommunityIcons 
          name="map-marker" 
          size={16} 
          color={tw.color("text-slate-500")} 
        />
        <Text style={tw`flex-1 ml-2 text-sm text-slate-600`}>
          {item.adresse_livraison || "Adresse non spécifiée"}
        </Text>
      </View>

      <View style={tw`flex-row items-center`}>
        <MaterialCommunityIcons 
          name="package-variant" 
          size={16} 
          color={tw.color("text-slate-500")} 
        />
        <Text style={tw`flex-1 ml-2 text-sm text-slate-600`} numberOfLines={1}>
          {item.colis?.map(colis => colis.numero_suivi).join(", ") || "Aucun détail de colis"}
        </Text>
      </View>

      {item.retour && (
        <View style={tw`pt-2 mt-2 border-t border-slate-100`}>
          <Text style={tw`text-xs text-slate-500`}>
            Motif: {item.retour.motif || "Non spécifié"}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={tw`px-4 py-2 mt-4 mb-2 rounded-lg bg-slate-100`}>
      <Text style={tw`font-bold text-slate-700`}>{title}</Text>
    </View>
  )

  const filteredLivraisons = filtrerLivraisons()
  const groupedLivraisons = groupByDate(filteredLivraisons)

  return (
    <View style={tw`flex-1 bg-slate-50 p-4 ${fromAccueil ? '' : 'mt-10'}`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-2xl font-bold text-slate-800`}>Colis</Text>
        <TouchableOpacity
          style={tw`flex-row items-center px-3 py-2 bg-white border rounded-lg border-slate-200`}
          onPress={() => {
            setTempDate(dateSelectionnee)
            setShowDatePicker(true)
          }}
        >
          <MaterialCommunityIcons 
            name="calendar" 
            size={16} 
            color={tw.color("text-orange-600")} 
          />
          <Text style={tw`ml-2 text-orange-600`}>
            {formatShortDate(dateSelectionnee)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={tw`mb-4`}>
        <Text style={tw`mb-2 text-sm font-medium text-slate-600`}>Filtrer par statut:</Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                tw`px-3 py-2 rounded-full bg-slate-200`,
                filtreStatut === filter.id && tw`bg-orange-600`
              ]}
              onPress={() => setFiltreStatut(filter.id)}
            >
              <Text style={[
                tw`text-xs font-medium text-slate-600`,
                filtreStatut === filter.id && tw`text-white`
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={tw`items-center justify-center flex-1 p-4 bg-black bg-opacity-50`}>
          <View style={tw`w-full max-w-md p-6 bg-white rounded-xl`}>
            <Text style={tw`mb-4 text-lg font-bold text-center`}>
              Choisir une date
            </Text>
            <DatePicker
                date={tempDate}
              onDateChange={(newDate) => {
                if (isNaN(newDate.getTime())) return;
                setTempDate(newDate);
              }}
              mode="date"
              locale="fr"
              textColor={tw.color("text-slate-800")}
            />
            <View style={tw`flex-row justify-center gap-4 mt-4`}>
              <TouchableOpacity
                style={tw`px-6 py-2 rounded-full bg-slate-200`}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={tw`font-medium text-slate-700`}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`px-6 py-2 bg-orange-600 rounded-full`}
                onPress={() => {
                  if (isNaN(tempDate.getTime())) {
                    Alert.alert('Date invalide', 'Veuillez sélectionner une date valide');
                    return;
                  }
                  setDateSelectionnee(tempDate);
                  setShowDatePicker(false);
                  chargerLivraisons(tempDate);
                }}
              >
                <Text style={tw`font-medium text-white`}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content */}
      {chargement.livraisons ? (
        <View style={tw`items-center justify-center flex-1`}>
          <ActivityIndicator size="large" color={tw.color("text-orange-600")} />
          <Text style={tw`mt-2 text-slate-500`}>Chargement des livraisons...</Text>
        </View>
      ) : erreur ? (
        <View style={tw`items-center justify-center p-6 bg-white shadow-sm rounded-xl`}>
          <Text style={tw`text-red-500`}>Erreur: {erreur}</Text>
          <TouchableOpacity
            style={tw`px-4 py-2 mt-4 bg-orange-600 rounded-full`}
            onPress={chargerLivraisons}
          >
            <Text style={tw`font-medium text-white`}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={groupedLivraisons}
          renderItem={renderLivraison}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.livraison_id}
          contentContainerStyle={tw`pb-4`}
          ListEmptyComponent={
            <View style={tw`items-center justify-center p-6 mt-4 bg-white shadow-sm rounded-xl`}>
              <Text style={tw`text-slate-500`}>
                {filtreStatut === "toutes" 
                  ? "Aucune livraison trouvée pour cette date" 
                  : `Aucune livraison ${statusFilters.find(f => f.id === filtreStatut)?.label.toLowerCase()} trouvée`}
              </Text>
              <TouchableOpacity
                style={tw`px-4 py-2 mt-4 bg-orange-600 rounded-full`}
                onPress={chargerLivraisons}
              >
                <Text style={tw`font-medium text-white`}>Rafraîchir</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
          refreshing={chargement.livraisons}
          onRefresh={chargerLivraisons}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  )
}

export default LivraisonsScreen