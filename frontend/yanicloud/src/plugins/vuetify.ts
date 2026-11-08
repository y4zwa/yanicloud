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
          primary: '#D0BCFF',
          'on-primary': '#381E72',
          'primary-container': '#4F378B',
          'on-primary-container': '#EADDFF',
          primaryContainer: '#4F378B',
          onPrimaryContainer: '#EADDFF',
          background: '#131217',
          surface: '#131217',
          'on-background': '#E5E3E8',
          'on-surface': '#E5E3E8',
          onSurface: '#E5E3E8',
          'on-surface-variant': '#CBC8D0',
          onSurfaceVariant: '#CBC8D0',
          'surface-variant': '#2C2A32',
          surfaceVariant: '#2C2A32',
          'secondary-container': '#2C2A32',
          'on-secondary-container': '#E5E3E8',
          secondaryContainer: '#2C2A32',
          onSecondaryContainer: '#E5E3E8',
          outline: '#97949E',
          'outline-variant': '#4A4752',
        },
      },
    },
  },
})
