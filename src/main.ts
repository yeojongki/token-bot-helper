import { createApp } from 'vue'
import App from './App.vue'
import {
  ElForm,
  ElInput,
  ElInputNumber,
  ElButton,
  ElSelect,
} from 'element-plus'

const app = createApp(App)

app
  .use(ElForm)
  .use(ElInput)
  .use(ElInputNumber)
  .use(ElSelect)
  .use(ElButton)
  .mount('#app')
