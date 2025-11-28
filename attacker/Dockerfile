FROM alpine:3.18

# Base tools
RUN apk update && apk add --no-cache \
    bash \
    curl \
    wget \
    python3 \
    py3-pip \
    git \
    ruby \
    ruby-dev \
    build-base \
    netcat-openbsd \
    ca-certificates \
    unzip

# Gobuster (precompiled)
RUN wget -q https://github.com/OJ/gobuster/releases/download/v3.6.0/gobuster_Linux_x86_64.tar.gz \
    -O /tmp/gobuster.tar.gz \
 && tar -xzf /tmp/gobuster.tar.gz -C /usr/bin gobuster \
 && chmod +x /usr/bin/gobuster

# Install Dalfox v2.12.0 properly
# RUN wget -q https://github.com/hahwul/dalfox/releases/download/v2.12.0/dalfox-linux-amd64.tar.gz -O /tmp/dalfox.tar.gz \
#     && tar -xzf /tmp/dalfox.tar.gz -C /tmp \
#     && mv /tmp/dalfox-linux-amd64 /usr/bin/dalfox \
#     && chmod +x /usr/bin/dalfox \
#     && rm -rf /tmp/dalfox.tar.gz
# Install full Nmap with NSE support
RUN apk add --no-cache openssl-dev libssh2-dev libpcap-dev linux-headers \
    && wget https://nmap.org/dist/nmap-7.94.tar.bz2 -O /tmp/nmap.tar.bz2 \
    && tar -xjf /tmp/nmap.tar.bz2 -C /tmp \
    && cd /tmp/nmap-7.94 \
    && ./configure \
    && make \
    && make install \
    && rm -rf /tmp/nmap*

# Dirsearch (Python directory scanner)
RUN git clone https://github.com/maurosoria/dirsearch.git /opt/dirsearch

# SQLmap (slim version from GitHub)
RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap

WORKDIR /root

CMD ["/bin/bash"]
