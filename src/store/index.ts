import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persist'

const pina = createPinia()
pina.use(piniaPersist)

export default pina
