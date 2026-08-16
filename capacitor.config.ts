import type { CapacitorConfig } from '@capacitor/cli'

// App-Konfiguration für die Store-Builds.
// appId ist die eindeutige Kennung im App Store und bei Google Play. Sie lässt
// sich vor der ersten Veröffentlichung frei ändern, danach nicht mehr.
const config: CapacitorConfig = {
  appId: 'io.github.gayanegmileski.wienmiete',
  appName: 'Mietzins-Check Wien',
  webDir: 'dist',
  backgroundColor: '#f5f1ea',
  android: {
    backgroundColor: '#f5f1ea',
  },
  ios: {
    backgroundColor: '#f5f1ea',
    contentInset: 'always',
  },
}

export default config
