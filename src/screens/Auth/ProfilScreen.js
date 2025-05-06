import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TextInput,
  Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import tw from "@/utils/tw";
import Button from '@/components/Button';

const ProfilScreen = ({ navigation }) => {
  const { 
    utilisateur, 
    livreurInfo, 
    deconnexion, 
    api, 
    mettreAJourLivreur ,
    verifierAuthentification
  } = useAuth();
  
  const [donneesUtilisateur, setDonneesUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState(false);
  const [formData, setFormData] = useState({
    telephone: '',
    statut: false,
    type_vehicule: '',
    plaque_immatriculation: '',
    utilisateur: {
      nom: '',
      prenom: '',
      email: ''
    }
  });

  useEffect(() => {
    const recupererDonnees = async () => {
      try {
        setChargement(true);
        
        // Fetch user data
        const response = await api.get(`/auth/utilisateur`);
        
        if (response.data?.utilisateur) {
          setDonneesUtilisateur(response.data.utilisateur);
          
          // If user is a livreur, set the form data
          if (response.data.utilisateur.role === 'livreur') {
            setFormData({
              telephone: livreurInfo?.telephone || '',
              statut: livreurInfo?.statut === 'actif' || false,
              type_vehicule: livreurInfo?.type_vehicule || '',
              plaque_immatriculation: livreurInfo?.plaque_immatriculation || '',
              utilisateur: {
                nom: response.data.utilisateur.nom || '',
                prenom: response.data.utilisateur.prenom || '',
                email: response.data.utilisateur.email || ''
              }
            });
          }
        } else {
          throw new Error('Données utilisateur non disponibles');
        }
      } catch (erreur) {
        console.error('Erreur:', erreur);
        Alert.alert('Erreur', 'Impossible de charger les données');
      } finally {
        setChargement(false);
      }
    };

    if (utilisateur) {
      recupererDonnees();
    }
  }, [utilisateur, livreurInfo]);

  const handleDeconnexion = async () => {
    try {
      await deconnexion();
    } catch (erreur) {
      console.error('Erreur de déconnexion:', erreur);
      Alert.alert('Erreur', 'Échec de la déconnexion');
    }
  };

  const handleChangementMotDePasse = () => {
    navigation.navigate('ChangerMotDePasse');
  };

  const toggleEdition = () => {
    setEdition(!edition);
  };

  const handleChange = (name, value) => {
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const soumettreModifications = async () => {
    try {
      setChargement(true);
      
      const dataToSend = {
        telephone: formData.telephone,
        statut: formData.statut ? 'actif' : 'inactif',
        type_vehicule: formData.type_vehicule,
        plaque_immatriculation: formData.plaque_immatriculation,
        utilisateur: {
          nom: formData.utilisateur.nom,
          prenom: formData.utilisateur.prenom,
          email: formData.utilisateur.email
        }
      };
  
      const response = await api.put(
        `/livreur/mettre-a-jour/${utilisateur.id}`,
        dataToSend
      );
      
      if (response.data?.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setEdition(false);
        await verifierAuthentification();
      } else {
        throw new Error(response.data?.message || 'Échec de la mise à jour');
      }
    } catch (erreur) {
      console.error('Erreur:', erreur);
      Alert.alert('Erreur', erreur.message || 'Erreur lors de la mise à jour');
    } finally {
      setChargement(false);
    }
  };

  if (chargement) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={tw.color("violet-600")} />
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1 bg-slate-50`} contentContainerStyle={tw`p-4`}>
      <View style={tw`items-center mb-6`}>
        <View style={tw`w-24 h-24 rounded-full bg-violet-100 justify-center items-center mb-4`}>
          <Ionicons name="person" size={48} color={tw.color('text-violet-600')} />
        </View>
        
        {edition ? (
          <>
            <TextInput
              style={tw`text-xl font-bold text-slate-800 mb-1 w-full text-center`}
              value={formData.utilisateur.prenom}
              onChangeText={(text) => handleChange('utilisateur.prenom', text)}
              placeholder="Prénom"
            />
            <TextInput
              style={tw`text-xl font-bold text-slate-800 w-full text-center`}
              value={formData.utilisateur.nom}
              onChangeText={(text) => handleChange('utilisateur.nom', text)}
              placeholder="Nom"
            />
          </>
        ) : (
          <Text style={tw`text-xl font-bold text-slate-800`}>
            {utilisateur?.prenom} {utilisateur?.nom}
          </Text>
        )}
        
        {edition ? (
          <TextInput
            style={tw`text-slate-500 w-full text-center`}
            value={formData.utilisateur.email}
            onChangeText={(text) => handleChange('utilisateur.email', text)}
            placeholder="Email"
            keyboardType="email-address"
          />
        ) : (
          <Text style={tw`text-slate-500`}>{utilisateur?.email}</Text>
        )}
        
        {utilisateur?.role === 'livreur' && (
          <View style={tw`mt-2 bg-violet-100 px-3 py-1 rounded-full`}>
            <Text style={tw`text-violet-700 text-sm font-medium`}>Livreur</Text>
          </View>
        )}
      </View>

      <View style={tw`bg-white rounded-lg shadow-sm p-4 mb-4`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-lg font-semibold text-slate-800`}>Informations</Text>
          {utilisateur?.role === 'livreur' && (
            <TouchableOpacity onPress={toggleEdition}>
              <Ionicons 
                name={edition ? 'close' : 'create'} 
                size={20} 
                color={tw.color('text-violet-600')} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {utilisateur?.role === 'livreur' ? (
          <>
            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Téléphone</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.telephone}
                  onChangeText={(text) => handleChange('telephone', text)}
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={tw`text-slate-700`}>{livreurInfo?.telephone || 'Non renseigné'}</Text>
              )}
            </View>
            
            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Statut</Text>
              {edition ? (
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-slate-700 mr-2`}>
                    {formData.statut ? 'Actif' : 'Inactif'}
                  </Text>
                  <Switch
                    value={formData.statut}
                    onValueChange={(value) => handleChange('statut', value)}
                    thumbColor={tw.color('violet-600')}
                    trackColor={{ false: tw.color('slate-200'), true: tw.color('violet-300') }}
                  />
                </View>
              ) : (
                <Text style={tw`text-slate-700`}>
                  {livreurInfo?.statut === 'actif' ? 'Actif' : 'Inactif'}
                </Text>
              )}
            </View>
            
            <View style={tw`py-2 border-b border-slate-100`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Type de véhicule</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.type_vehicule}
                  onChangeText={(text) => handleChange('type_vehicule', text)}
                  placeholder="Ex: Moto, Voiture, Vélo"
                />
              ) : (
                <Text style={tw`text-slate-700`}>
                  {livreurInfo?.type_vehicule || 'Non renseigné'}
                </Text>
              )}
            </View>
            
            <View style={tw`py-2`}>
              <Text style={tw`text-sm text-slate-500 mb-1`}>Plaque d'immatriculation</Text>
              {edition ? (
                <TextInput
                  style={tw`text-slate-700`}
                  value={formData.plaque_immatriculation}
                  onChangeText={(text) => handleChange('plaque_immatriculation', text)}
                  placeholder="Plaque d'immatriculation"
                />
              ) : (
                <Text style={tw`text-slate-700`}>
                  {livreurInfo?.plaque_immatriculation || 'Non renseigné'}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={tw`flex-row items-center py-2 border-b border-slate-100`}>
              <Ionicons name="mail" size={20} color={tw.color('text-slate-500')} style={tw`mr-3`} />
              <Text style={tw`text-slate-700`}>{utilisateur?.email}</Text>
            </View>
            
            <View style={tw`flex-row items-center py-2`}>
              <MaterialCommunityIcons 
                name={utilisateur?.est_verifie ? 'shield-check' : 'shield-alert'} 
                size={20} 
                color={utilisateur?.est_verifie ? tw.color('text-green-500') : tw.color('text-yellow-500')} 
                style={tw`mr-3`} 
              />
              <Text style={tw`text-slate-700`}>
                {utilisateur?.est_verifie ? 'Compte vérifié' : 'Compte non vérifié'}
              </Text>
            </View>
          </>
        )}
      </View>

      {edition && (
        <View style={tw`mb-4`}>
          <Button 
            title="Enregistrer les modifications"
            onPress={soumettreModifications}
            loading={chargement}
          />
        </View>
      )}

      <View style={tw`bg-white rounded-lg shadow-sm p-4 mb-4`}>
        <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Actions</Text>
        
        <Button 
          title="Changer le mot de passe"
          onPress={handleChangementMotDePasse}
          variant="outline"
          icon={<Ionicons name="key" size={18} color={tw.color('text-violet-600')} />}
          style={tw`mb-3` } color={tw.color('text-white')}
        />
        
        <Button 
          title="Déconnexion"
          onPress={handleDeconnexion}
          variant="danger"
          icon={<Ionicons name="log-out" size={18} color={tw.color('text-white')} />}
        />
      </View>
    </ScrollView>
  );
};

export default ProfilScreen;