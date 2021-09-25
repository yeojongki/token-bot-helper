import { ElMessage } from 'element-plus'
let copyId = 0

interface CopyTextConfig {
  hideSuccess?: boolean
}

/**
 * 复制文本
 * @param text
 */
export default function copyText(text: string, config?: CopyTextConfig) {
  const input = document.createElement('input')
  input.id = `copy-text-input-${copyId++}`
  input.value = text

  document.body.append(input)
  input.select()
  document.execCommand('copy')

  if (!config?.hideSuccess) {
    ElMessage.success('复制成功')
  }

  setTimeout(() => {
    input.remove()
  }, 0)
}
