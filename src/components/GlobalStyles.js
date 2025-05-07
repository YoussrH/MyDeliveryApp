// Create a new file called GlobalStyles.js
import React from 'react';
import { Text, View } from 'react-native';
import tw from '@/utils/tw';

const GlobalStyles = ({ children }) => {
  return (
    <View style={tw`flex-1 font-mono`}>
      {children}
    </View>
  );
};

export default GlobalStyles;