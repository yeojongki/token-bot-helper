import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import ViteComponents, {
  AntDesignVueResolver,
} from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // server: {
  //   proxy: {
  //     '/bnxApi': {
  //       target: 'https://www.binaryx.pro',
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/bnxApi/, ''),
  //     },
  //   },
  // },
  plugins: [
    vue(),
    Components({
      dts: true,
      resolvers: [AntDesignVueResolver({ importStyle: 'css' })],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "ant-design-vue/es/style/themes/index.less";`,
        javascriptEnabled: true,
      },
    },
  },
}))
