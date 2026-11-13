import { Capacitor } from '@capacitor/core'

// true dentro de la app Android/iOS (WebView de Capacitor); false en el navegador y la PWA.
export const esNativa = Capacitor.isNativePlatform()
