FROM debian:11-slim
RUN apt-get update && apt-get install -y build-essential sudo rsyslog auditd
WORKDIR /opt/host
COPY suid_vuln.c .
RUN gcc suid_vuln.c -o /usr/local/bin/suid_vuln && chmod 4755 /usr/local/bin/suid_vuln
# create a log file for filebeat to read
RUN mkdir -p /var/log/host && touch /var/log/host/audit.log
CMD ["/bin/bash","-lc","/usr/sbin/rsyslogd && tail -f /dev/null"]
