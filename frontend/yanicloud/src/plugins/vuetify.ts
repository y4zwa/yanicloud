// plugins/vuetify.ts
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#bb86fc', // M3 Dark Primary (светло-фиолетовый)
          secondaryContainer: '#424242', // M3 Surface Variant
          background: '#121212',
          surface: '#121212',
          onSurface: '#e1e1e1',
          onSecondaryContainer: '#e1e1e1',
        },
      },
    },
  },
})