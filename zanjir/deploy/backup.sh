#!/bin/sh
# Ma'lumotlar bazasining zaxira nusxasini ./backups papkasiga saqlaydi va 30 tadan eskisini o'chiradi.
# Cron uchun misol (har kuni 03:00):  0 3 * * * cd /root/zanjir && sh deploy/backup.sh
set -e
cd "$(dirname "$0")/.."
mkdir -p backups
FILE="zanjir-$(date +%F-%H%M).db"
docker compose exec -T app node --disable-warning=ExperimentalWarning server/cli.mjs backup "/tmp/$FILE"
docker compose cp "app:/tmp/$FILE" "backups/$FILE"
docker compose exec -T app rm -f "/tmp/$FILE"
ls -1t backups/zanjir-*.db | tail -n +31 | xargs -r rm -f
echo "Zaxira nusxa: backups/$FILE"
