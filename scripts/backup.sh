#!/bin/sh
set -eu

# Снимок базы YaniCloud + манифест имён. Запускать на хосте, где есть docker.
# Переменные: CONTAINER (имя контейнера), BACKUP_DIR (куда класть снимки).
#
# Файлы пользователей скрипт не копирует: их каталоги перечислены в manifest.json
# (user_dir + storage_key). Синхронизируйте их rsync-ом — см. README.

CONTAINER="${CONTAINER:-yanicloud}"
BACKUP_DIR="${BACKUP_DIR:-/mnt/hdd/backup/yanicloud}"
STAMP="$(date +%F_%H%M%S)"
DEST="$BACKUP_DIR/$STAMP"

mkdir -p "$DEST"

docker exec "$CONTAINER" node --input-type=module -e '
import Database from "better-sqlite3";
import fs from "node:fs";

fs.rmSync("/data/.backup-db.sqlite", { force: true });
const db = new Database("/data/yanicloud.db");
db.exec("VACUUM INTO \"/data/.backup-db.sqlite\"");

const rows = db.prepare(`
  SELECT n.id, u.username, n.type, n.name, n.size, n.storage_key,
         COALESCE(u.storage_path, "") AS user_dir
  FROM nodes n JOIN users u ON u.id = n.user_id
  ORDER BY u.id, n.parent_id, n.name
`).all();
fs.writeFileSync("/data/.backup-manifest.json", JSON.stringify(rows, null, 2));
db.close();
'

docker cp "$CONTAINER:/data/.backup-db.sqlite" "$DEST/yanicloud.db"
docker cp "$CONTAINER:/data/.backup-manifest.json" "$DEST/manifest.json"
docker exec "$CONTAINER" rm -f /data/.backup-db.sqlite /data/.backup-manifest.json

echo "Снимок базы и манифест: $DEST"
echo "Файлы пользователей: каталоги user_dir из manifest.json (storage_key — имя файла)."
