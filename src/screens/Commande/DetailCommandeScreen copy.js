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
  const { api, livreurInfo } = useAuth()
  const { mettreAJourStatutLivraison, obtenirLivraisonParId } = useLivraisons()
  const [livraison, setLivraison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
  }, [livraisonId, id, obtenirLivraisonParId])

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
      setUpdatingStatus(true)
      const success = await mettreAJourStatutLivraison(livraison.livraison_id, newStatus)
      
      if (success) {
        // Update local state with the new status
        setLivraison(prev => ({
          ...prev,
          statut: newStatus,
          colis: prev.colis.map(colis => ({
            ...colis,
            statut: newStatus === 'livree' ? 'livree' : colis.statut,
            ...(newStatus === 'livree' && { date_livraison: new Date().toISOString() })
          }))
        }))
        
        Alert.alert("Succès", "Statut de livraison mis à jour")
        
        // If marked as delivered, navigate back after 1.5 seconds
        if (newStatus === 'livree') {
          setTimeout(() => navigation.goBack(), 1500)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
      Alert.alert("Erreur", "Échec de la mise à jour du statut")
    } finally {
      setUpdatingStatus(false)
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
      <View style={tw`items-center justify-center flex-1 bg-slate-50`}>
        <ActivityIndicator size="large" color={tw.color("violet-600")} />
        <Text style={tw`mt-4 font-medium text-slate-500`}>Chargement des détails...</Text>
      </View>
    )
  }

  if (!livraison) {
    return (
      <View style={tw`items-center justify-center flex-1 bg-slate-50`}>
        <MaterialCommunityIcons name="truck-remove" size={40} color={tw.color("slate-400")} />
        <Text style={tw`mt-3 font-medium text-slate-500`}>Livraison non trouvée</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      style={tw`flex-1 bg-slate-50`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={tw`p-6 mb-2 bg-white shadow-sm rounded-b-3xl`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View>
            <Text style={tw`text-2xl font-bold text-slate-800`}>{livraison.client_nom}</Text>
            <Text style={tw`mt-1 text-sm font-medium text-slate-500`}>
              Réf: {livraison.reference}
            </Text>
          </View>
          {getStatutBadge(livraison.statut)}
        </View>

        <View style={tw`flex-row items-center mb-3`}>
          <View style={tw`p-2 bg-blue-100 rounded-full`}>
            <FontAwesome name="phone" size={16} color={tw.color("blue-600")} />
          </View>
          <Text 
            style={tw`ml-3 text-base font-medium text-blue-600`}
            onPress={() => Linking.openURL(`tel:${livraison.client_telephone}`)}
          >
            {livraison.client_telephone}
          </Text>
        </View> 

        <View style={tw`flex-row items-start mb-3`}>
          <View style={tw`p-2 rounded-full bg-slate-100`}>
            <MaterialCommunityIcons 
              name="map-marker" 
              size={16} 
              color={tw.color("slate-600")} 
            />
          </View>
          <Text style={tw`flex-1 ml-3 text-base font-medium text-slate-700`}>
            {livraison.adresse_livraison}
          </Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <View style={tw`p-2 rounded-full bg-slate-100`}>
            <MaterialCommunityIcons name="clock" size={16} color={tw.color("slate-600")} />
          </View>
          <Text style={tw`ml-3 text-base font-medium text-slate-700`}>
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
        <View style={tw`p-6 mx-4 mb-4 bg-white shadow-sm rounded-2xl`}>
          <Text style={tw`mb-4 text-lg font-bold text-slate-800`}>Colis</Text>
          {livraison.colis.map((colis, index) => (
            <View 
              key={index} 
              style={tw`py-3 ${index < livraison.colis.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View style={tw`flex-row items-start justify-between`}>
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
      <View style={tw`p-6 mx-4 mb-4 bg-white shadow-sm rounded-2xl`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-lg font-bold text-slate-800`}>Montant total</Text>
          <Text style={tw`text-xl font-extrabold text-violet-600`}>{livraison.montant_total || 'N/A'} DT</Text>
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
            <View style={tw`p-2 rounded-full bg-violet-100`}>
              <MaterialCommunityIcons 
                name="information" 
                size={16} 
                color={tw.color("violet-600")} 
              />
            </View>
            <Text style={tw`ml-3 text-lg font-bold text-slate-800`}>
              Instructions
            </Text>
          </View>
          <Text style={tw`p-4 text-base leading-6 rounded-lg text-slate-600 bg-slate-50`}>
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
            loading={updatingStatus}
            disabled={updatingStatus}
            icon={<MaterialCommunityIcons name="truck-delivery" size={20} color="white" />}
          />
        )}

        {livraison.statut === "expediee" && (
          <>
            <Button
              title="Marquer comme livrée"
              onPress={marquerCommeLivree}
              style={tw`mb-3`}
              loading={updatingStatus}
              disabled={updatingStatus}
              icon={<MaterialCommunityIcons name="check-circle" size={20} color="white" />}
            />
            <Button
              title="Prendre une photo"
              backgroundColor="violet-600"
              onPress={() => navigation.navigate("Camera", {
                livraisonId: livraison.livraison_id
              })}
              style={tw`mb-3`}
              titleStyle={{ color: 'white' }}
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
              loading={updatingStatus}
              disabled={updatingStatus}
              icon={<MaterialCommunityIcons name="alert-circle" size={20} color="white" />}
            />
          </>
        )}
      </View>
    </ScrollView>
  )
}

export default DetailCommandeScreen