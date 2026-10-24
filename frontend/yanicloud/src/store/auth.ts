import { ref, computed } from 'vue'
import { getToken, clearToken, type User } from '@/api'

export const currentUser = ref<User | null>(null)
export const authReady = ref(false)

export const isAuthed = computed(() => !!getToken())

export function setUser(user: User | null): void {
  currentUser.value = user
}

export function logout(): void {
  clearToken()
  currentUser.value = null
}
