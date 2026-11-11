<template>
  <div class="auth-root">
    <div class="auth-card m3-reveal">
      <div class="auth-logo m3-float">
        <v-icon icon="mdi-cloud" color="primary" size="64"></v-icon>
      </div>
      <h1 class="auth-title">YaniCloud</h1>
      <p class="auth-subtitle">{{ subtitle }}</p>

      <v-form class="m3-reveal" style="--i: 2" @submit.prevent="submit">
        <v-text-field
          v-model="username"
          label="Логин"
          variant="outlined"
          prepend-inner-icon="mdi-account-outline"
          autocomplete="username"
          class="mb-4"
          :rules="[rules.required]"
        ></v-text-field>
        <v-text-field
          v-model="password"
          label="Пароль"
          variant="outlined"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showPassword = !showPassword"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          class="mb-6"
          :rules="[rules.required]"
          @keyup.enter="submit"
        ></v-text-field>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="comfortable">
          {{ error }}
        </v-alert>

        <v-btn
          type="submit"
          block
          rounded="pill"
          size="x-large"
          color="primary-container"
          height="56"
          :loading="loading"
          elevation="0"
          class="auth-submit"
        >
          <span class="text-on-primary-container text-title-medium font-weight-medium text-none">
            {{ mode === 'register' ? 'Создать аккаунт' : 'Войти' }}
          </span>
        </v-btn>
      </v-form>

      <div v-if="registrationOpen" class="auth-switch">
        <v-btn
          variant="text"
          size="small"
          rounded="pill"
          class="text-none"
          @click="switchMode(mode === 'login' ? 'register' : 'login')"
        >
          {{ mode === 'login' ? 'Создать аккаунт' : 'У меня уже есть аккаунт' }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAuthConfig, login, register, ApiError } from '@/api'
import { setUser } from '@/store/auth'

const emit = defineEmits<{ (e: 'authed'): void }>()

type Mode = 'login' | 'register'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const mode = ref<Mode>('login')
const registrationOpen = ref(false)
const hasUsers = ref(true)

const subtitle = computed(() => {
  if (mode.value === 'register') {
    return hasUsers.value ? 'Создайте аккаунт.' : 'Первый аккаунт станет администратором.'
  }
  return 'С возвращением! Войдите в аккаунт.'
})

const rules = { required: (v: string) => !!v || 'Обязательное поле' }

onMounted(async () => {
  try {
    const config = await getAuthConfig()
    registrationOpen.value = config.registrationOpen
    hasUsers.value = config.hasUsers
    if (config.registrationOpen && !config.hasUsers) mode.value = 'register'
  } catch {
    /* если настройки недоступны, остаёмся на обычном входе */
  }
})

function switchMode(next: Mode): void {
  mode.value = next
  error.value = ''
}

async function submit(): Promise<void> {
  if (!username.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    const res =
      mode.value === 'register'
        ? await register(username.value.trim(), password.value)
        : await login(username.value.trim(), password.value)
    setUser(res.user)
    emit('authed')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось подключиться к серверу'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-root {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--md-sys-color-background);
  z-index: 99999;
}
.auth-card {
  width: 420px;
  max-width: calc(100vw - 32px);
  padding: 48px 40px;
  background: var(--md-sys-color-surface-container);
  border-radius: 40px;
  border: 1px solid var(--md-sys-color-outline-variant);
  box-shadow: var(--md-sys-elevation-3);
}
.auth-logo {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: var(--md-sys-color-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}
.auth-title {
  text-align: center;
  font-weight: 600;
  font-size: 32px;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 8px;
}
.auth-subtitle {
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 32px;
}
.auth-submit {
  color: var(--md-sys-color-on-primary-container) !important;
}
.auth-switch {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
