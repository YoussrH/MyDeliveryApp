// components/FontLoader.js
import { useEffect } from 'react';
import * as Font from 'expo-font';

const FontLoader = ({ children }) => {
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'ui-monospace': require('./assets/fonts/SFMono-Regular.otf'), // You'll need to add these font files
        'SFMono-Regular': require('./assets/fonts/SFMono-Regular.otf'),
        'Menlo': require('./assets/fonts/Menlo.ttf'),
        // Add other font files as needed
      });
    };

    loadFonts();
  }, []);

  return children;
};

export default FontLoader;