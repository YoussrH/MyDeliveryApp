"use client"
import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, Modal, SectionList, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
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

const CommandesScreen = () => {
  const navigation = useNavigation()
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

  const chargerLivraisons = useCallback(async (date) => {
    try {
      const targetDate = date || dateSelectionnee;
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
      
      await obtenirLivraisonsParDate(startDate.toISOString(), endDate.toISOString());
    } catch (error) {
      console.error("Error loading deliveries:", error);
    }
  }, [dateSelectionnee, obtenirLivraisonsParDate]);

  useEffect(() => {
    chargerLivraisons()
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

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "expediee":
        return <Badge variant="warning">En cours</Badge>
      case "livree":
        return <Badge variant="success">Livrée</Badge>
      case "echec":
        return <Badge variant="danger">Échec</Badge>
      default:
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  const renderLivraison = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigateToCommande(item.livraison_id)} 
      activeOpacity={0.7}
      style={tw`mb-3`}
    >
      <View style={tw`bg-white p-4 rounded-xl shadow-sm`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-base font-semibold text-slate-800`}>
              {item.client_nom || "Client inconnu"}
            </Text>
            <Text style={tw`text-xs text-slate-500 mt-1`}>
              Réf: {item.reference || "N/A"} • {formatShortDate(item.displayDate)}
            </Text>
          </View>
          {getStatutBadge(item.statut)}
        </View>

        <View style={tw`flex-row items-center mb-2`}>
          <MaterialCommunityIcons 
            name="map-marker" 
            size={16} 
            color={tw.color("text-slate-500")} 
          />
          <Text style={tw`text-sm text-slate-600 ml-2 flex-1`}>
            {item.adresse_livraison || "Adresse non spécifiée"}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons 
            name="package-variant" 
            size={16} 
            color={tw.color("text-slate-500")} 
          />
          <Text style={tw`text-sm text-slate-600 ml-2 flex-1`} numberOfLines={1}>
            {item.colis?.map(colis => colis.numero_suivi).join(", ") || "Aucun détail de colis"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={tw`bg-slate-100 py-2 px-4 rounded-lg mb-2 mt-4`}>
      <Text style={tw`font-bold text-slate-700`}>{title}</Text>
    </View>
  )

  const filteredLivraisons = filtrerLivraisons()
  const groupedLivraisons = groupByDate(filteredLivraisons)

  return (
    <View style={tw`flex-1 bg-slate-50 p-4 mt-10`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={tw`text-2xl font-bold text-slate-800`}>Colis</Text>
        <TouchableOpacity
          style={tw`flex-row items-center bg-white py-2 px-3 rounded-lg border border-slate-200`}
          onPress={() => {
            setTempDate(dateSelectionnee)
            setShowDatePicker(true)
          }}
        >
          <MaterialCommunityIcons 
            name="calendar" 
            size={16} 
            color={tw.color("text-violet-600")} 
          />
          <Text style={tw`text-violet-600 ml-2`}>
            {formatShortDate(dateSelectionnee)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={tw`mb-4`}>
        <Text style={tw`text-sm font-medium text-slate-600 mb-2`}>Filtrer par statut:</Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                tw`py-2 px-3 rounded-full bg-slate-200`,
                filtreStatut === filter.id && tw`bg-violet-600`
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
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50 p-4`}>
          <View style={tw`bg-white p-6 rounded-xl w-full max-w-md`}>
            <Text style={tw`text-lg font-bold mb-4 text-center`}>
              Choisir une date
            </Text>
            <DatePicker
              date={tempDate}
              onDateChange={setTempDate}
              mode="date"
              locale="fr"
              textColor={tw.color("text-slate-800")}
            />
            <View style={tw`flex-row justify-center gap-4 mt-4`}>
              <TouchableOpacity
                style={tw`bg-slate-200 py-2 px-6 rounded-full`}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={tw`text-slate-700 font-medium`}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-violet-600 py-2 px-6 rounded-full`}
                onPress={() => {
                  setDateSelectionnee(tempDate)
                  setShowDatePicker(false)
                  chargerLivraisons(tempDate)
                }}
              >
                <Text style={tw`text-white font-medium`}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content */}
      {chargement.livraisons ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={tw.color("text-violet-600")} />
          <Text style={tw`text-slate-500 mt-2`}>Chargement des livraisons...</Text>
        </View>
      ) : erreur ? (
        <View style={tw`bg-white p-6 rounded-xl shadow-sm items-center justify-center`}>
          <Text style={tw`text-red-500`}>Erreur: {erreur}</Text>
          <TouchableOpacity
            style={tw`mt-4 bg-violet-600 py-2 px-4 rounded-full`}
            onPress={chargerLivraisons}
          >
            <Text style={tw`text-white font-medium`}>Réessayer</Text>
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
            <View style={tw`bg-white p-6 rounded-xl shadow-sm items-center justify-center mt-4`}>
              <Text style={tw`text-slate-500`}>
                {filtreStatut === "toutes" 
                  ? "Aucune livraison trouvée pour cette date" 
                  : `Aucune livraison ${statusFilters.find(f => f.id === filtreStatut)?.label.toLowerCase()} trouvée`}
              </Text>
              <TouchableOpacity
                style={tw`mt-4 bg-violet-600 py-2 px-4 rounded-full`}
                onPress={chargerLivraisons}
              >
                <Text style={tw`text-white font-medium`}>Rafraîchir</Text>
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

export default CommandesScreen