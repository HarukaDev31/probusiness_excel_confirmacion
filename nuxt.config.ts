export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  experimental: {
    viteEnvironmentApi: true
  },
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  ssr: false,
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      title: 'ProBusiness — Confirmación de productos',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png'
        }
      ]
    }
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error']
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8085'
    }
  }
})
