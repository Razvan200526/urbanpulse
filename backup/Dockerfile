FROM postgres:16-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    awscli \
    ca-certificates \
    gzip \
    && rm -rf /var/lib/apt/lists/*

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

CMD ["/usr/local/bin/backup.sh"]
 
