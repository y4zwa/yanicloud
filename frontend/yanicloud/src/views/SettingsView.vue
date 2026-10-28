<template>
  <div class="m3-container">
    <div class="mb-8">
      <h1 class="text-h3 font-weight-medium mb-4 text-on-surface">Настройки</h1>
      <p class="text-title-medium text-on-surface-variant">Управление аккаунтом и хранилищем.</p>
    </div>

    <v-divider class="mb-10 border-opacity-10" color="outline-variant"></v-divider>

    <!-- АККАУНТ -->
    <div class="m3-card pa-8 mb-8">
      <h2 class="text-h5 font-weight-medium text-on-surface mb-6">Аккаунт</h2>
      <div class="d-flex align-center">
        <div class="m3-icon-avatar primary-container mr-6">
          <v-icon icon="mdi-account" color="on-primary-container" size="40"></v-icon>
        </div>
        <div class="flex-grow-1">
          <div class="text-h6 font-weight-medium text-on-surface">{{ currentUser?.username }}</div>
          <div class="text-title-medium text-on-surface-variant">
            {{ accountLabel }}
          </div>
        </div>
        <v-chip v-if="currentUser?.isAdmin" color="primary-container" class="font-weight-medium">
          <span class="text-on-primary-container">Администратор</span>
        </v-chip>
      </div>
    </div>

    <!-- ОФОРМЛЕНИЕ -->
    <div class="m3-card pa-8 mb-8">
      <h2 class="text-h5 font-weight-medium text-on-surface mb-6">Акцентный цвет</h2>
      <div class="d-flex flex-wrap" style="gap: 16px">
        <div
          v-for="a in ACCENTS"
          :key="a.id"
          class="accent-swatch"
          :class="{ selected: accentId === a.id }"
          @click="chooseAccent(a.id)"
        >
          <div class="accent-dot" :style="{ backgroundColor: a.primary }"></div>
          <span class="accent-name text-body-2 text-on-surface-variant">{{ a.name }}</span>
        </div>
      </div>

      <v-divider class="my-8 border-opacity-10" color="outline-variant"></v-divider>
      <h3 class="text-title-medium font-weight-medium text-on-surface mb-4">Баннер на главной</h3>
      <div class="d-flex align-center" style="gap: 12px">
        <v-btn
          color="primary-container"
          rounded="pill"
          class="text-none font-weight-medium"
          prepend-icon="mdi-image"
          :loading="bannerUploading"
          @click="pickBanner"
        >
          <span class="text-on-primary-container">Загрузить картинку</span>
        </v-btn>
        <v-btn variant="outlined" rounded="pill" class="text-none font-weight-medium" @click="removeBanner">
          Удалить баннер
        </v-btn>
      </div>
      <input ref="bannerInput" type="file" accept="image/*" style="display: none" @change="onBannerPick" />
    </div>

    <!-- ХРАНИЛИЩЕ (админ) -->
    <div v-if="isAdmin" class="m3-card pa-8 mb-8">
      <h2 class="text-h5 font-weight-medium text-on-surface mb-6">Хранилище</h2>

      <div class="mb-6">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-title-medium text-on-surface-variant">Диск</span>
          <span class="text-title-medium text-on-surface">{{ formatBytes(settings.diskTotal - settings.diskFree) }} из {{ formatBytes(settings.diskTotal) }}</span>
        </div>
        <v-progress-linear :model-value="diskPercent" color="primary" height="8" rounded></v-progress-linear>
        <div class="text-body-2 text-on-surface-variant mt-2">Свободно {{ formatBytes(settings.diskFree) }}</div>
      </div>

      <div class="d-flex align-center gap-6 mb-6">
        <v-text-field
          v-model="defaultQuotaInput"
          label="Квота по умолчанию, ГБ (0 — безлимит)"
          type="number"
          variant="outlined"
          hide-details
          style="max-width: 280px"
        ></v-text-field>
        <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" :loading="savingSettings" @click="saveStorageSettings">
          <span class="text-on-primary-container">Сохранить</span>
        </v-btn>
      </div>

      <div class="mb-6">
        <div class="text-title-medium text-on-surface-variant mb-3">Подключённые диски</div>
        <div v-if="loadingDisks" class="d-flex py-4">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        </div>
        <div v-else class="disks-list">
          <div v-for="disk in disks" :key="disk.path" class="disk-row d-flex align-center py-3">
            <v-icon :icon="disk.current ? 'mdi-harddisk' : 'mdi-harddisk-plus'" color="on-surface-variant" size="24" class="mr-4"></v-icon>
            <div class="flex-grow-1 overflow-hidden">
              <div class="text-title-medium font-weight-medium text-on-surface text-truncate">{{ disk.device || disk.path }}</div>
              <div class="text-body-2 text-on-surface-variant">свободно {{ formatBytes(disk.free) }} из {{ formatBytes(disk.total) }} · {{ disk.path }}</div>
            </div>
            <v-chip v-if="disk.current" color="primary-container" class="font-weight-medium">
              <span class="text-on-primary-container">Текущее</span>
            </v-chip>
            <v-btn
              v-else
              variant="tonal"
              color="primary"
              rounded="pill"
              class="text-none font-weight-medium"
              :loading="usingDisk === disk.path"
              @click="useDisk(disk)"
            >
              Использовать
            </v-btn>
          </div>
        </div>
      </div>

      <v-text-field
        v-model="storageDirInput"
        label="Путь к хранилищу (вручную)"
        variant="outlined"
        hide-details
        class="mb-3"
      ></v-text-field>
      <div class="text-body-2 text-on-surface-variant">
        При выборе диска облако автоматически создаст на нём папку <code>YaniCloud</code> и перенесёт файлы.
      </div>
    </div>

    <!-- ПОЛЬЗОВАТЕЛИ (админ) -->
    <div v-if="isAdmin" class="m3-card pa-8">
      <div class="d-flex align-center justify-space-between mb-6">
        <h2 class="text-h5 font-weight-medium text-on-surface">Пользователи</h2>
        <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" prepend-icon="mdi-account-plus" @click="openAddUser">
          <span class="text-on-primary-container">Добавить</span>
        </v-btn>
      </div>

      <div v-if="loadingUsers" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
      </div>

      <div v-else class="users-list">
        <div v-for="user in users" :key="user.id" class="user-row d-flex align-center py-4">
          <div class="m3-icon-avatar surface-variant mr-4" style="width: 48px; height: 48px; border-radius: 14px">
            <v-icon icon="mdi-account" color="on-surface-variant" size="26"></v-icon>
          </div>
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex align-center">
              <span class="text-title-medium font-weight-medium text-on-surface mr-3">{{ user.username }}</span>
              <v-chip v-if="user.isAdmin" size="small" color="primary-container" class="font-weight-medium">
                <span class="text-on-primary-container">admin</span>
              </v-chip>
            </div>
            <div class="text-body-2 text-on-surface-variant">
              {{ formatBytes(user.used) }} · {{ user.quotaBytes > 0 ? formatBytes(user.quotaBytes) : 'безлимит' }}
            </div>
          </div>
          <v-btn icon="mdi-pencil-outline" variant="text" color="on-surface-variant" @click="openEditUser(user)"></v-btn>
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            color="error"
            :disabled="user.id === currentUser?.id"
            @click="confirmDeleteUser(user)"
          ></v-btn>
        </div>
      </div>
    </div>

    <!-- ДИАЛОГ: добавить/изменить пользователя -->
    <v-dialog v-model="userDialog" max-width="460">
      <div class="m3-dialog">
        <div class="text-h6 font-weight-medium text-on-surface mb-4">
          {{ editingUser ? 'Изменить пользователя' : 'Новый пользователь' }}
        </div>
        <v-text-field v-model="userForm.username" label="Логин" variant="outlined" :disabled="!!editingUser" class="mb-3"></v-text-field>
        <v-text-field v-model="userForm.password" :label="editingUser ? 'Новый пароль (необязательно)' : 'Пароль'" variant="outlined" :type="showPw ? 'text' : 'password'" :append-inner-icon="showPw ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" @click:append-inner="showPw = !showPw" class="mb-3"></v-text-field>
        <v-text-field v-model="userForm.quotaGb" label="Квота, ГБ (0 — безлимит)" type="number" variant="outlined" class="mb-3"></v-text-field>
        <v-text-field v-model="userForm.storagePath" label="Путь к диску (пусто = общий)" variant="outlined" class="mb-4"></v-text-field>
        <v-switch v-model="userForm.isAdmin" color="primary" label="Администратор" class="mb-4" hide-details></v-switch>
        <div class="d-flex justify-end gap-4 mt-2">
          <v-btn variant="text" class="text-none" @click="userDialog = false">Отмена</v-btn>
          <v-btn color="primary-container" rounded="pill" class="text-none font-weight-medium" :loading="savingUser" @click="saveUser">
            <span class="text-on-primary-container">{{ editingUser ? 'Сохранить' : 'Создать' }}</span>
          </v-btn>
        </div>
      </div>
    </v-dialog>

    <!-- ДИАЛОГ: удалить пользователя -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <div class="m3-dialog">
        <div class="text-h6 font-weight-medium text-on-surface mb-4">Удалить пользователя?</div>
        <p class="text-title-medium text-on-surface-variant mb-6">
          Пользователь «{{ deleteTarget?.username }}» и все его файлы будут удалены безвозвратно.
        </p>
        <div class="d-flex justify-end gap-4">
          <v-btn variant="text" class="text-none" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" rounded="pill" class="text-none font-weight-medium" :loading="savingUser" @click="doDeleteUser">Удалить</v-btn>
        </div>
      </div>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" rounded="pill">
      {{ snackText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import {
  getStorage,
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminGetSettings,
  adminUpdateSettings,
  adminGetDisks,
  uploadBanner,
  deleteBanner,
  ApiError,
  type AdminUser,
  type AdminSettings,
  type AdminDisk,
  type StorageInfo,
} from '@/api'
import { currentUser } from '@/store/auth'
import { formatBytes } from '@/utils/format'
import { ACCENTS, getAccentId, setAccentId, getAccent } from '@/utils/theme'

const isAdmin = computed(() => !!currentUser.value?.isAdmin)
const vuetifyTheme = useTheme()
const accentId = ref(getAccentId())

function chooseAccent(id: string): void {
  setAccentId(id)
  accentId.value = id
  const p = getAccent(id)
  const dark = vuetifyTheme.themes.value.dark
  if (dark?.colors) dark.colors.primary = p.primary
}

function pickBanner(): void {
  bannerInput.value?.click()
}

async function onBannerPick(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  bannerUploading.value = true
  try {
    await uploadBanner(file)
    notify('Баннер обновлён')
  } catch (err) {
    notify(err instanceof ApiError ? err.message : 'Ошибка загрузки', 'error')
  } finally {
    bannerUploading.value = false
  }
}

async function removeBanner(): Promise<void> {
  try {
    await deleteBanner()
    notify('Баннер удалён')
  } catch (err) {
    notify(err instanceof ApiError ? err.message : 'Ошибка', 'error')
  }
}

const users = ref<AdminUser[]>([])
const loadingUsers = ref(false)
const settings = ref<AdminSettings>({ defaultQuota: 0, storageDir: '', trashRetentionDays: 30, diskTotal: 0, diskFree: 0, userCount: 0 })
const ownStorage = ref<StorageInfo>({ used: 0, quota: 0, percent: 0, diskTotal: 0, diskFree: 0, reservedByOthers: 0, availableTotal: 0 })
const disks = ref<AdminDisk[]>([])
const loadingDisks = ref(false)
const usingDisk = ref('')

const bannerInput = ref<HTMLInputElement>()
const bannerUploading = ref(false)

const defaultQuotaInput = ref('')
const storageDirInput = ref('')
const savingSettings = ref(false)

const userDialog = ref(false)
const editingUser = ref<AdminUser | null>(null)
const showPw = ref(false)
const savingUser = ref(false)
const userForm = ref({ username: '', password: '', quotaGb: '', isAdmin: false, storagePath: '' })

const deleteDialog = ref(false)
const deleteTarget = ref<AdminUser | null>(null)

const snackbar = ref(false)
const snackText = ref('')
const snackColor = ref('primary')

const accountLabel = computed(() => {
  const s = ownStorage.value
  if (s.quota > 0) return `${formatBytes(s.used)} из ${formatBytes(s.quota)}`
  return `Безлимит · занято ${formatBytes(s.used)}`
})

const diskPercent = computed(() => {
  if (!settings.value.diskTotal) return 0
  return Math.min(100, Math.round(((settings.value.diskTotal - settings.value.diskFree) / settings.value.diskTotal) * 100))
})

function notify(text: string, color = 'primary'): void {
  snackText.value = text
  snackColor.value = color
  snackbar.value = true
}

function gbToBytes(g: string): number {
  const n = parseFloat(g)
  if (Number.isNaN(n) || n <= 0) return 0
  return Math.round(n * 1024 ** 3)
}

function bytesToGb(b: number): string {
  if (!b) return ''
  return String(Math.round((b / 1024 ** 3) * 100) / 100)
}

async function load(): Promise<void> {
  try {
    ownStorage.value = await getStorage()
  } catch {
    /* ignore */
  }
  if (!isAdmin.value) return
  loadingUsers.value = true
  loadingDisks.value = true
  try {
    const [u, s, d] = await Promise.all([adminListUsers(), adminGetSettings(), adminGetDisks()])
    users.value = u
    settings.value = s
    disks.value = d
    defaultQuotaInput.value = bytesToGb(s.defaultQuota)
    storageDirInput.value = s.storageDir
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка загрузки настроек', 'error')
  } finally {
    loadingUsers.value = false
    loadingDisks.value = false
  }
}

async function useDisk(disk: AdminDisk): Promise<void> {
  usingDisk.value = disk.path
  try {
    const s = await adminUpdateSettings({ storageDir: `${disk.path.replace(/\/+$/, '')}/YaniCloud` })
    settings.value = s
    storageDirInput.value = s.storageDir
    const d = await adminGetDisks()
    disks.value = d
    notify('Хранилище перенесено на выбранный диск')
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка', 'error')
  } finally {
    usingDisk.value = ''
  }
}

async function saveStorageSettings(): Promise<void> {
  savingSettings.value = true
  try {
    const s = await adminUpdateSettings({
      defaultQuota: gbToBytes(defaultQuotaInput.value),
      storageDir: storageDirInput.value,
    })
    settings.value = s
    defaultQuotaInput.value = bytesToGb(s.defaultQuota)
    storageDirInput.value = s.storageDir
    notify('Настройки сохранены')
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка сохранения', 'error')
  } finally {
    savingSettings.value = false
  }
}

function openAddUser(): void {
  editingUser.value = null
  userForm.value = { username: '', password: '', quotaGb: '', isAdmin: false, storagePath: '' }
  showPw.value = false
  userDialog.value = true
}

function openEditUser(user: AdminUser): void {
  editingUser.value = user
  userForm.value = { username: user.username, password: '', quotaGb: bytesToGb(user.quotaBytes), isAdmin: user.isAdmin, storagePath: (user as any).storagePath || '' }
  showPw.value = false
  userDialog.value = true
}

async function saveUser(): Promise<void> {
  savingUser.value = true
  try {
    const payload = {
      username: userForm.value.username,
      password: userForm.value.password,
      quotaBytes: gbToBytes(userForm.value.quotaGb),
      isAdmin: userForm.value.isAdmin,
      storagePath: userForm.value.storagePath
    }
    if (editingUser.value) {
      const data: any = { quotaBytes: payload.quotaBytes, isAdmin: payload.isAdmin, storagePath: payload.storagePath }
      if (payload.password) data.password = payload.password
      await adminUpdateUser(editingUser.value.id, data)
      notify('Пользователь обновлён')
    } else {
      await adminCreateUser(payload)
      notify('Пользователь создан')
    }
    userDialog.value = false
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка сохранения', 'error')
  } finally {
    savingUser.value = false
  }
}

function confirmDeleteUser(user: AdminUser): void {
  deleteTarget.value = user
  deleteDialog.value = true
}

async function doDeleteUser(): Promise<void> {
  if (!deleteTarget.value) return
  savingUser.value = true
  try {
    await adminDeleteUser(deleteTarget.value.id)
    deleteDialog.value = false
    notify('Пользователь удалён')
    await load()
  } catch (e) {
    notify(e instanceof ApiError ? e.message : 'Ошибка удаления', 'error')
  } finally {
    savingUser.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.users-list {
  border-top: 1px solid var(--md-sys-color-outline-variant);
}
.user-row {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.disks-list {
  border-top: 1px solid var(--md-sys-color-outline-variant);
}
.disk-row {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.accent-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: background-color 0.2s, border-color 0.2s;
}
.accent-swatch:hover {
  background-color: var(--md-sys-color-surface-container-high);
}
.accent-swatch.selected {
  border-color: var(--md-sys-color-primary);
}
.accent-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.m3-dialog {
  background: var(--md-sys-color-surface-container-high);
  border-radius: 28px;
  padding: 32px;
  border: 1px solid var(--md-sys-color-outline-variant);
}
.gap-6 {
  gap: 20px;
}
code {
  background: var(--md-sys-color-surface-container-highest);
  padding: 2px 6px;
  border-radius: 6px;
}
</style>
