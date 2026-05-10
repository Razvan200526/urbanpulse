#!/bin/bash
set -euo pipefail

# ── Variabile ──────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILENAME="urbanpulse_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/tmp/${BACKUP_FILENAME}"
RETENTION_DAYS=7

# ── Validare variabile de mediu ────────────────────────────────────────────────
REQUIRED_VARS=(
  DATABASE_URL
  R2_ENDPOINT
  R2_ACCESS_KEY
  R2_SECRET_ACCESS_KEY
  R2_BACKUP_BUCKET
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    echo "❌ Variabila de mediu ${VAR} lipsește."
    exit 1
  fi
done

echo "🕐 Backup pornit la ${TIMESTAMP}..."

# ── pg_dump + compresie gzip ───────────────────────────────────────────────────
echo "📦 Creare dump PostgreSQL..."
pg_dump \
  --dbname="${DATABASE_URL}" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_PATH}"
echo "✅ Dump creat: ${BACKUP_FILENAME} ($(du -sh "${BACKUP_PATH}" | cut -f1))"

# ── Upload în S3 via AWS CLI ───────────────────────────────────────────────────
echo "☁️  Upload în S3..."
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${BACKUP_PATH}" \
  "s3://${R2_BACKUP_BUCKET}/backups/${BACKUP_FILENAME}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --region auto \
  --no-progress

echo "✅ Upload complet: s3://${R2_BACKUP_BUCKET}/backups/${BACKUP_FILENAME}"

# ── Ștergere backup-uri mai vechi de 7 zile ───────────────────────────────────
echo "🧹 Ștergere backup-uri vechi (>${RETENTION_DAYS} zile)..."

CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +"%Y-%m-%dT%H:%M:%S" 2>/dev/null \
  || date -v-${RETENTION_DAYS}d +"%Y-%m-%dT%H:%M:%S")

AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3api list-objects \
  --bucket "${R2_BACKUP_BUCKET}" \
  --prefix "backups/" \
  --endpoint-url "${R2_ENDPOINT}" \
  --query "Contents[?LastModified<='${CUTOFF_DATE}'].Key" \
  --output text | tr '\t' '\n' | while read -r KEY; do
    if [[ -n "${KEY}" && "${KEY}" != "None" ]]; then
      echo "  🗑️  Ștergere: ${KEY}"
      AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY}" \
      AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
      aws s3 rm "s3://${R2_BACKUP_BUCKET}/${KEY}" \
        --endpoint-url "${R2_ENDPOINT}" \
        --region auto
    fi
  done

# ── Curățare fișier local ──────────────────────────────────────────────────────
rm -f "${BACKUP_PATH}"
echo "✅ Backup finalizat cu succes!"