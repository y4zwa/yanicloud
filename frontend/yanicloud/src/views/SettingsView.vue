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
        <div v-for="user in users" :key="user.id" class="user-block">
          <div class="user-row d-flex align-center py-4">
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

          <!-- КАРТОЧКА ПЕРЕНОСА НА ДРУГОЙ ДИСК -->
          <template v-for="m in [migrationFor(user)]" :key="'mig-' + user.id">
            <v-expand-transition>
              <div v-if="m" class="mig-card" :class="'mig-card--' + migKind(m)">
                <div class="d-flex align-center" style="gap: 10px">
                  <span v-if="m.active" class="mig-pulse"></span>
                  <v-icon v-else-if="m.status === 'done'" icon="mdi-check-circle-outline" size="20" color="primary"></v-icon>
                  <v-icon v-else icon="mdi-alert-circle-outline" size="20" color="error"></v-icon>
                  <span class="text-title-small font-weight-medium">{{ migLabel(m) }}</span>
                  <span v-if="m.active && m.progress != null" class="mig-percent">{{ migPercent(m) }}%</span>
                  <v-spacer></v-spacer>
                  <span v-if="m.active && speeds[user.id]" class="text-body-2 text-on-surface-variant">
                    {{ formatBytes(speeds[user.id]) }}/с<template v-if="etaText(m)"> · осталось {{ etaText(m) }}</template>
                  </span>
                  <v-btn
                    v-if="!m.active"
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    color="on-surface-variant"
                    @click="hideFinished(user.id)"
                  ></v-btn>
                </div>

                <div class="d-flex align-center flex-wrap my-2" style="gap: 6px">
                  <code class="mig-path">{{ m.fromDir ?? '—' }}</code>
                  <v-icon icon="mdi-arrow-right" size="16" color="on-surface-variant"></v-icon>
                  <code class="mig-path">{{ m.toDir ?? '—' }}</code>
                </div>

                <div class="mig-track">
                  <div class="mig-fill" :class="'mig-fill--' + migKind(m)" :style="migFillStyle(m)"></div>
                </div>

                <div class="mt-2 text-body-2" :class="m.status === 'failed' ? 'text-error' : 'text-on-surface-variant'">
                  <template v-if="m.status === 'failed'">
                    {{ m.error ?? 'Не удалось завершить перенос. Данные не пострадали — старая папка на месте.' }}
                  </template>
                  <template v-else-if="m.status === 'done'">
                    Все файлы на новом месте, старая копия удалена.
                  </template>
                  <template v-else>
                    {{ formatBytes(m.copiedBytes) }} из {{ formatBytes(m.totalBytes) }}
                  </template>
                </div>
              </div>
            </v-expand-transition>
          </template>
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
        <v-text-field
          v-model="userForm.storagePath"
          label="Диск пользователя (пусто = общее хранилище)"
          variant="outlined"
          class="mb-2"
          :disabled="editingMigrationActive"
          :persistent-hint="editingMigrationActive"
          :hint="editingMigrationActive ? 'Идёт перенос файлов — путь заблокирован до завершения' : ''"
        ></v-text-field>
        <div v-if="disks.length && !editingMigrationActive" class="d-flex flex-wrap mb-3" style="gap: 8px">
          <v-chip
            v-for="d in disks"
            :key="d.path"
            variant="tonal"
            size="small"
            style="cursor: pointer"
            :title="'свободно ' + formatBytes(d.free)"
            @click="userForm.storagePath = d.path"
          >
            <v-icon icon="mdi-harddisk" start size="14"></v-icon>
            {{ d.path }}
          </v-chip>
        </div>
        <v-alert
          v-if="willMigrate"
          type="info"
          variant="tonal"
          density="compact"
          icon="mdi-folder-move-outline"
          class="mb-4"
        >
          При сохранении запустится перенос данных (~{{ formatBytes(editingUser?.used ?? 0) }}): файлы будут скопированы
          и проверены, старая копия удалится только после успешной сверки.
        </v-alert>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
  adminGetUserMigration,
  uploadBanner,
  deleteBanner,
  ApiError,
  type AdminUser,
  type AdminSettings,
  type AdminDisk,
  type StorageInfo,
  type Migration,
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

// ---------- ПЕРЕНОС ПОЛЬЗОВАТЕЛЯ НА ДРУГОЙ ДИСК ----------
const migrations = ref<Record<number, Migration>>({})
const speeds = ref<Record<number, number>>({})
const hiddenFinished = ref<Record<number, boolean>>({})
const speedSamples = new Map<number, { bytes: number; at: number; speed: number }>()
let pollTimer: ReturnType<typeof setTimeout> | null = null

const MIG_LABELS: Record<string, string> = {
  preparing: 'Подготовка',
  copying: 'Копирование',
  verifying: 'Проверка копии',
  switching: 'Переключение',
  resyncing: 'Досинхронизация',
  cleaning: 'Очистка старого диска',
  done: 'Переезд завершён',
  failed: 'Ошибка переезда',
}

function migLabel(m: Migration): string {
  return MIG_LABELS[m.status] ?? m.status
}

function migKind(m: Migration): 'progress' | 'busy' | 'done' | 'failed' {
  if (m.status === 'done') return 'done'
  if (m.status === 'failed') return 'failed'
  if ((m.status === 'copying' || m.status === 'resyncing') && m.progress != null) return 'progress'
  return 'busy'
}

function migPercent(m: Migration): number {
  return Math.min(100, Math.floor((m.progress ?? 0) * 100))
}

function migFillStyle(m: Migration): Record<string, string> {
  const k = migKind(m)
  if (k === 'done' || k === 'failed') return { width: '100%' }
  if (k === 'progress') return { width: `${Math.max(2, (m.progress ?? 0) * 100)}%` }
  return {}
}

function etaText(m: Migration): string {
  const sp = speeds.value[m.userId]
  if (!sp || m.progress == null || m.totalBytes <= m.copiedBytes) return ''
  const sec = Math.round((m.totalBytes - m.copiedBytes) / sp)
  if (sec < 45) return 'меньше минуты'
  if (sec < 3600) return `~${Math.max(1, Math.round(sec / 60))} мин`
  return `~${(sec / 3600).toFixed(1)} ч`
}

function migrationFor(user: AdminUser): Migration | null {
  const m = migrations.value[user.id]
  if (!m) return null
  if (!m.active && hiddenFinished.value[user.id]) return null
  return m
}

function hideFinished(id: number): void {
  hiddenFinished.value = { ...hiddenFinished.value, [id]: true }
}

function applyMigration(m: Migration): void {
  const prev = migrations.value[m.userId]
  if (prev?.active && !m.active) {
    if (m.status === 'done') notify('Переезд завершён — файлы на новом месте')
    else if (m.status === 'failed') notify('Ошибка переезда: ' + (m.error ?? 'неизвестная ошибка'), 'error')
    load()
  }
  migrations.value = { ...migrations.value, [m.userId]: m }
  if (m.active) schedulePoll()
  else speedSamples.delete(m.userId)
}

function sampleSpeed(m: Migration): void {
  if (!m.active || (m.status !== 'copying' && m.status !== 'resyncing')) {
    speeds.value = { ...speeds.value, [m.userId]: 0 }
    return
  }
  const now = Date.now()
  const prev = speedSamples.get(m.userId)
  if (!prev) {
    speedSamples.set(m.userId, { bytes: m.copiedBytes, at: now, speed: 0 })
    return
  }
  const dt = (now - prev.at) / 1000
  if (dt < 0.3) return
  const inst = Math.max(0, (m.copiedBytes - prev.bytes) / dt)
  const speed = prev.speed ? prev.speed * 0.6 + inst * 0.4 : inst
  speedSamples.set(m.userId, { bytes: m.copiedBytes, at: now, speed })
  speeds.value = { ...speeds.value, [m.userId]: speed }
}

function schedulePoll(): void {
  if (pollTimer !== null) return
  pollTimer = setTimeout(async () => {
    pollTimer = null
    const activeIds = Object.values(migrations.value)
      .filter((m) => m.active)
      .map((m) => m.userId)
    for (const id of activeIds) {
      try {
        const { migration } = await adminGetUserMigration(id)
        if (migration) {
          sampleSpeed(migration)
          applyMigration(migration)
        }
      } catch {
        /* сетевая осечка — пережидаем до следующего тика */
      }
    }
    if (Object.values(migrations.value).some((m) => m.active)) schedulePoll()
  }, 1500)
}

const editingMigrationActive = computed(() => {
  const id = editingUser.value?.id
  return id != null && !!migrations.value[id]?.active
})

const willMigrate = computed(() => {
  if (!editingUser.value || !userDialog.value) return false
  const cur = (editingUser.value as any).storagePath ?? null
  const next = userForm.value.storagePath.trim() || null
  return next !== cur
})

onBeforeUnmount(() => {
  if (pollTimer !== null) clearTimeout(pollTimer)
})
// ---------- КОНЕЦ БЛОКА ПЕРЕНОСА ----------

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
    // подхватываем активные/завершённые переносы из списка пользователей
    for (const usr of users.value as any[]) {
      if (usr.migration) applyMigration(usr.migration)
    }
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
  userForm.value = {
    username: user.username,
    password: '',
    quotaGb: bytesToGb(user.quotaBytes),
    isAdmin: user.isAdmin,
    storagePath: (user as any).storagePath || ''
  }
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
      const res: any = await adminUpdateUser(editingUser.value.id, data)
      if (res?.migration) applyMigration(res.migration)
      notify(res?.migration?.active ? 'Запущен перенос файлов на новый диск' : 'Пользователь обновлён')
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
.user-block {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}
.user-row {
  border-radius: 12px;
  transition: background-color 0.2s;
}
.user-row:hover {
  background-color: var(--md-sys-color-surface-container-high);
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

/* ── Карточка переноса на другой диск ── */
.mig-card {
  border-radius: 16px;
  padding: 14px 16px;
  margin: 2px 0 18px;
  background: var(--md-sys-color-surface-container-high);
  border: 1px solid var(--md-sys-color-outline-variant);
}
.mig-card--done {
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface-container-high));
  border-color: transparent;
}
.mig-card--failed {
  background: color-mix(in srgb, var(--md-sys-color-error, #b3261e) 12%, var(--md-sys-color-surface-container-high));
  border-color: transparent;
}
.mig-pulse {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--md-sys-color-primary);
  animation: mig-pulse 1.4s ease-in-out infinite;
}
@keyframes mig-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.75); }
}
.mig-percent {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 600;
  color: var(--md-sys-color-primary);
}
.mig-path {
  font-size: 12px;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mig-track {
  height: 10px;
  border-radius: 999px;
  background: var(--md-sys-color-surface-container-highest);
  overflow: hidden;
}
.mig-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--md-sys-color-primary);
  position: relative;
  overflow: hidden;
  transition: width 0.7s cubic-bezier(0.2, 0, 0, 1);
}
.mig-fill--progress::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 25%, rgba(255, 255, 255, 0.5) 50%, transparent 75%);
  transform: translateX(-100%);
  animation: mig-shimmer 2s infinite;
}
@keyframes mig-shimmer {
  to { transform: translateX(100%); }
}
.mig-fill--busy {
  width: 32%;
  animation: mig-indeterminate 1.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes mig-indeterminate {
  from { transform: translateX(-110%); }
  to { transform: translateX(420%); }
}
.mig-fill--done {
  background: var(--md-sys-color-primary);
}
.mig-fill--failed {
  background: var(--md-sys-color-error, #b3261e);
  transition: none;
}
</style>
