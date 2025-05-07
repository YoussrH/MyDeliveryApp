// Create a new file called MonoText.js
import React from 'react';
import { Text } from 'react-native';
import tw from '@/utils/tw';

const MonoText = ({ children, style, ...props }) => {
  return (
    <Text style={[tw`font-mono`, style]} {...props}>
      {children}
    </Text>
  );
};

export default MonoText;