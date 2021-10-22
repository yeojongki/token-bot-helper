import { Ref, isRef, ref } from 'vue'

export function useRef<T>(initialValue: T | Ref<T>) {
  const value = isRef(initialValue) ? initialValue : ref<T>(initialValue)
  const setValue = (v: T) => (value.value = v)

  return [value, setValue] as const
}
