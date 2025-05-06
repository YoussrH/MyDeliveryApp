"use client"
import { useState, useEffect } from "react"
import { View, Text, FlatList, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import Badge from "@/components/Badge"
import tw from "@/utils/tw"

const CommandesScreen = () => {
  const navigation = useNavigation()
  const [livraisons, setLivraisons] = useState([])
  const [filtreActif, setFiltreActif] = useState("toutes")

  useEffect(() => {
    const mockLivraisons = [
      {
        id: "1",
        client: "Marie Dubois",
        adresse: "15 Rue de Paris, 75001 Paris",
        heure: "10:30",
        statut: "en_attente",
        produits: ["Pizza Margherita", "Coca-Cola"],
      },
      {
        id: "2",
        client: "Thomas Martin",
        adresse: "8 Avenue des Champs-Élysées, 75008 Paris",
        heure: "11:15",
        statut: "en_cours",
        produits: ["Burger Deluxe", "Frites", "Milkshake Vanille"],
      }
    ]

    setLivraisons(mockLivraisons)
  }, [])

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "en_cours":
        return <Badge variant="warning">En cours</Badge>
      case "livre":
        return <Badge variant="success">Livré</Badge>
      case "echec":
        return <Badge variant="danger">Échec</Badge>
      default:
        return <Badge variant="secondary">En attente</Badge>
    }
  }

  const navigateToCommande = (id) => {
    navigation.navigate("DetailCommande", { id })
  }

  const filtrerLivraisons = () => {
    if (filtreActif === "toutes") return livraisons
    return livraisons.filter((livraison) => {
      if (filtreActif === "a_faire") return livraison.statut === "en_attente"
      if (filtreActif === "en_cours") return livraison.statut === "en_cours"
      if (filtreActif === "livrees") return livraison.statut === "livre"
      return true
    })
  }

  const renderLivraison = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigateToCommande(item.id)} 
      activeOpacity={0.7}
      
    >
      <View style={tw`bg-white p-4 rounded-xl shadow-sm mb-3`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-base font-semibold text-slate-800`}>{item.client}</Text>
            <Text style={tw`text-sm text-slate-500 mt-1`}>{item.heure}</Text>
          </View>
          {getStatutBadge(item.statut)}
        </View>

        <View style={tw`flex-row items-center mb-2`}>
          <MaterialCommunityIcons name="map-marker" size={16} color={tw.color("text-slate-500")} />
          <Text style={tw`text-sm text-slate-600 ml-2 flex-1`}>{item.adresse}</Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons name="package-variant" size={16} color={tw.color("text-slate-500")} />
          <Text style={tw`text-sm text-slate-600 ml-2 flex-1`}>{item.produits.join(", ")}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={tw`flex-1 bg-slate-50 p-4 mt-10`}>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={tw`text-2xl font-bold text-slate-800`}>Commandes</Text>
        <View style={tw`flex-row items-center`}>
          <MaterialCommunityIcons name="filter" size={16} color={tw.color("text-slate-500")} />
          <Text style={tw`text-sm text-slate-500 ml-1`}>Filtrer:</Text>
        </View>
      </View>

      <View style={tw`flex-row justify-between mb-4`}>
        <TouchableOpacity
          style={[
            tw`py-2 px-4 rounded-full bg-slate-200`,
            filtreActif === "toutes" && tw`bg-violet-600`
          ]}
          onPress={() => setFiltreActif("toutes")}
        >
          <Text style={[
            tw`text-sm font-medium text-slate-600`,
            filtreActif === "toutes" && tw`text-white`
          ]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`py-2 px-4 rounded-full bg-slate-200`,
            filtreActif === "a_faire" && tw`bg-violet-600`
          ]}
          onPress={() => setFiltreActif("a_faire")}
        >
          <Text style={[
            tw`text-sm font-medium text-slate-600`,
            filtreActif === "a_faire" && tw`text-white`
          ]}>
            À faire
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`py-2 px-4 rounded-full bg-slate-200`,
            filtreActif === "en_cours" && tw`bg-violet-600`
          ]}
          onPress={() => setFiltreActif("en_cours")}
        >
          <Text style={[
            tw`text-sm font-medium text-slate-600`,
            filtreActif === "en_cours" && tw`text-white`
          ]}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`py-2 px-4 rounded-full bg-slate-200`,
            filtreActif === "livrees" && tw`bg-violet-600`
          ]}
          onPress={() => setFiltreActif("livrees")}
        >
          <Text style={[
            tw`text-sm font-medium text-slate-600`,
            filtreActif === "livrees" && tw`text-white`
          ]}>
            Livrées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtrerLivraisons()}
        renderItem={renderLivraison}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`pb-4`}
        ListEmptyComponent={
          <View style={tw`bg-white p-6 rounded-xl shadow-sm items-center justify-center`}>
            <Text style={tw`text-slate-500`}>Aucune livraison trouvée</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default CommandesScreen