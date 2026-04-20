import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skillpath.app',
  appName: 'skillpath',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
