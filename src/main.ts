import { createApp } from 'vue'
import App from './App.vue'
import {
  ElForm,
  ElInput,
  ElInputNumber,
  ElButton,
  ElSelect,
  ElRow,
  ElCol,
} from 'element-plus'
import AsyncButton from '@/components/AsyncButton/index.vue'

const app = createApp(App)

app.component('async-button', AsyncButton)
app
  .use(ElForm)
  .use(ElInput)
  .use(ElInputNumber)
  .use(ElSelect)
  .use(ElButton)
  .use(ElRow)
  .use(ElCol)
  .mount('#app')
