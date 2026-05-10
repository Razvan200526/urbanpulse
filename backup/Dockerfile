FROM debian:bookworm-slim
 
# Instalare dependențe: postgresql-client, awscli, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    awscli \
    ca-certificates \
    gzip \
    && rm -rf /var/lib/apt/lists/*
 
# Copiere script de backup
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh
 
# Rulare backup la pornirea containerului (Railway Cron Job pornește containerul la fiecare execuție)
CMD ["/usr/local/bin/backup.sh"]
 