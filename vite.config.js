import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins = [react()]

  if (command === 'serve') {
    const { default: basicSsl } = await import('@vitejs/plugin-basic-ssl')
    plugins.push(basicSsl())
  }

  return {
    plugins,
    server: {
      host: true,
      https: command === 'serve',
    },
  }
})
