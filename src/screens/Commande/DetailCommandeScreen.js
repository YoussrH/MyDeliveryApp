import { useState, useEffect } from "react"
import { View, Text, ScrollView, Linking, Alert, ActivityIndicator } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons'
import { useAuth } from "@/contexts/AuthContext"
import { useLivraisons } from "@/hooks/useLivraisons"
import Button from "@/components/Button"
import Badge from "@/components/Badge"
import tw from "@/utils/tw"

const DetailCommandeScreen = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { id, livraisonId } = route.params
  const { api } = useAuth()
  const { mettreAJourStatutLivraison, obtenirLivraisonParId } = useLivraisons()
  const [livraison, setLivraison] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await obtenirLivraisonParId(livraisonId || id)
        setLivraison(data)
      } catch (error) {
        console.error('Error fetching delivery details:', error)
        Alert.alert("Erreur", "Impossible de charger les détails de la livraison")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [livraisonId, id, obtenirLivraisonParId, api])

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "expediee":
        return <Badge variant="warning">En cours</Badge>
      case "livree":
        return <Badge variant="success">Livrée</Badge>
      case "annulee":
        return <Badge variant="danger">Annulée</Badge>
      case "en_attente":
        return <Badge variant="info">En attente</Badge>
      default:
        return <Badge variant="secondary">En préparation</Badge>
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const success = await mettreAJourStatutLivraison(livraison.livraison_id, newStatus)
      if (success) {
        setLivraison(prev => ({ ...prev, statut: newStatus }))
        Alert.alert("Succès", "Statut de livraison mis à jour")
      }
    } catch (error) {
      console.error('Error updating status:', error)
      Alert.alert("Erreur", "Échec de la mise à jour du statut")
    }
  }

  const commencerLivraison = () => {
    handleStatusChange('expediee')
  }

  const marquerCommeLivree = () => {
    Alert.alert(
      "Confirmation", 
      "Êtes-vous sûr de vouloir marquer cette livraison comme complétée ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => handleStatusChange('livree')
        },
      ]
    )
  }

  const signalerEchec = () => {
    Alert.alert(
      "Signaler un problème", 
      "Quelle est la raison de l'échec de livraison ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Client absent", 
          onPress: () => handleStatusChange('annulee')
        },
        { 
          text: "Adresse incorrecte", 
          onPress: () => handleStatusChange('annulee')
        },
        { 
          text: "Autre problème", 
          onPress: () => handleStatusChange('annulee')
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-slate-50`}>
        <ActivityIndicator size="large" color={tw.color("violet-600")} />
        <Text style={tw`mt-4 text-slate-500 font-medium`}>Chargement des détails...</Text>
      </View>
    )
  }

  if (!livraison) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-slate-50`}>
        <MaterialCommunityIcons name="truck-remove" size={40} color={tw.color("slate-400")} />
        <Text style={tw`text-slate-500 font-medium mt-3`}>Livraison non trouvée</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={tw`flex-1 bg-slate-50`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={tw`bg-white p-6 rounded-b-3xl shadow-sm mb-2`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <View>
            <Text style={tw`text-2xl font-bold text-slate-800`}>{livraison.client_nom}</Text>
            <Text style={tw`text-sm text-slate-500 mt-1 font-medium`}>
              Réf: {livraison.reference}
            </Text>
          </View>
          {getStatutBadge(livraison.statut)}
        </View>

        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`bg-blue-100 p-2 rounded-full`}>
            <FontAwesome name="phone" size={16} color={tw.color("blue-600")} />
          </View>
          <Text 
            style={tw`text-base text-blue-600 font-medium ml-3`}
            onPress={() => Linking.openURL(`tel:${livraison.client_telephone}`)}
          >
            {livraison.client_telephone}
          </Text>
        </View> 

        <View style={tw`flex-row items-start mb-3`}>
          <View style={tw`bg-slate-100 p-2 rounded-full`}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={16} 
              color={tw.color("slate-600")} 
            />
          </View>
          <Text style={tw`text-base text-slate-700 font-medium ml-3 flex-1`}>
            {livraison.adresse_livraison}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-slate-100 p-2 rounded-full`}>
            <MaterialCommunityIcons name="clock" size={16} color={tw.color("slate-600")} />
          </View>
          <Text style={tw`text-base text-slate-700 font-medium ml-3`}>
            {new Date(livraison.date_creation).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      {/* Packages Section */}
      {livraison.colis && livraison.colis.length > 0 && (
        <View style={tw`bg-white p-6 mx-4 rounded-2xl shadow-sm mb-4`}>
          <Text style={tw`text-lg font-bold text-slate-800 mb-4`}>Colis</Text>
          {livraison.colis.map((colis, index) => (
            <View 
              key={index} 
              style={tw`py-3 ${index < livraison.colis.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-slate-800`}>
                    N° de suivi: {colis.numero_suivi || 'Non disponible'}
                  </Text>
                
                </View>
                {colis.statut && (
                  <View style={tw`ml-2`}>
                    {getStatutBadge(colis.statut)}
                    
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Payment Summary */}
      <View style={tw`bg-white p-6 mx-4 rounded-2xl shadow-sm mb-4`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-lg font-bold text-slate-800`}>Montant total</Text>
          <Text style={tw`text-xl font-extrabold text-violet-600`}>{livraison.montant_total || 'N/A'} DT</Text>
        </View>
        {livraison.mode_paiement && (
          <View style={tw`mt-2 flex-row items-center`}>
            <MaterialCommunityIcons 
              name={livraison.mode_paiement === 'espèce' ? 'cash' : 'credit-card'} 
              size={18} 
              color={tw.color("slate-500")} 
            />
            <Text style={tw`text-sm text-slate-500 ml-2`}>
              Paiement: {livraison.mode_paiement}
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Instructions */}
      {livraison.instructions && (
        <View style={tw`bg-white p-6 mx-4 rounded-2xl shadow-sm mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`bg-violet-100 p-2 rounded-full`}>
              <MaterialCommunityIcons 
                name="information" 
                size={16} 
                color={tw.color("violet-600")} 
              />
            </View>
            <Text style={tw`text-lg font-bold text-slate-800 ml-3`}>
              Instructions
            </Text>
          </View>
          <Text style={tw`text-base text-slate-600 leading-6 bg-slate-50 p-4 rounded-lg`}>
            {livraison.instructions}
            
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={tw`px-4 mb-8`}>
        {livraison.statut === "en_preparation" && (
          <Button
            title="Commencer la livraison"
            onPress={commencerLivraison}
            style={tw`mb-3`}
            icon={<MaterialCommunityIcons name="truck-delivery" size={20} color="white" />}
          />
        )}

        {livraison.statut === "expediee" && (
          <>
            <Button
              title="Marquer comme livrée"
              onPress={marquerCommeLivree}
              style={tw`mb-3`}
              icon={<MaterialCommunityIcons name="check-circle" size={20} color="white" />}
            />
            <Button
              title="Prendre une photo"
              variant="outline"
              borderColor="violet-600"
              backgroundColor="violet-600"
              onPress={() => navigation.navigate("Camera", { 
                livraisonId: livraison.livraison_id 
              })}
              style={tw`mb-3`}
              titleStyle={{ color: 'white' }} // <-- Set text color to white
              icon={
                <MaterialCommunityIcons 
                  name="camera" 
                  size={20} 
                  color="white"
                />
              }
/>

            <Button
              title="Signaler un problème"
              variant="destructive"
              onPress={signalerEchec}
              icon={<MaterialCommunityIcons name="alert-circle" size={20} color="white" />}
            />
          </>
        )}
      </View>
    </ScrollView>
  )
}

export default DetailCommandeScreen