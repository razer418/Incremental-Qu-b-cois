import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant Google Play : permanent une fois publié, à confirmer avant la sortie.
  appId: 'com.razer418.incrementalquebecois',
  appName: 'Incremental Québécois',
  webDir: 'dist',
  android: {
    backgroundColor: '#151714',
  },
};

export default config;
