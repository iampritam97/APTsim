#!/bin/bash

###################################################
#  APTSim Smart Start Script
###################################################

# Colors
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
CYAN="\e[36m"
RESET="\e[0m"

clear
echo -e "${CYAN}"
echo "┌──────────────────────────────────────────────┐"
echo "│            APTSim Smart Startup              │"
echo "│    Auto-detect • Auto-build • Auto-heal      │"
echo "│      + Attacker Interactive Terminal         │"
echo "└──────────────────────────────────────────────┘"
echo -e "${RESET}"

echo -e "${BLUE}[1] Checking Docker installation...${RESET}"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Docker not installed! Install Docker first.${RESET}"
    exit 1
fi

echo -e "${BLUE}[2] Checking Docker Compose...${RESET}"
if ! command -v docker compose >/dev/null 2>&1; then
    echo -e "${RED}Docker Compose not installed! Install Docker Compose V2.${RESET}"
    exit 1
fi

echo -e "${BLUE}[3] Checking APTSim images...${RESET}"
IMAGES=$(docker images --format "{{.Repository}}" | grep -i "aptsim" || true)

if [[ -z "$IMAGES" ]]; then
    echo -e "${YELLOW}No APTSim images found — running first-time setup!${RESET}"
    NEED_BUILD=true
else
    echo -e "${GREEN}✓ APTSim images found.${RESET}"
    NEED_BUILD=false
fi

echo "[3] Cleaning unused networks (avoiding subnet overlap)..."
sudo docker network prune -f

echo -e "${BLUE}[4] Checking APTSim network...${RESET}"
NET=$(docker network ls | grep aptnet || true)

if [[ -z "$NET" ]]; then
    echo -e "${YELLOW}APTSim network missing — creating...${RESET}"
    docker network create --subnet 172.30.0.0/24 aptnet >/dev/null 2>&1
    echo -e "${GREEN}✓ Network created.${RESET}"
else
    echo -e "${GREEN}✓ Network exists.${RESET}"
fi

# Build images if needed
if [[ "$NEED_BUILD" = true ]]; then
    echo -e "${BLUE}🏗 Building APTSim images...${RESET}"
    docker compose build --no-cache
else
    echo -e "${CYAN}Skipping build — images already exist.${RESET}"
fi

echo -e "${BLUE}🚀 Starting containers...${RESET}"
docker compose up -d

sleep 2

echo -e "${BLUE}[5] Health checking services...${RESET}"

# Elasticsearch check
echo -ne "${YELLOW}Waiting for Elasticsearch"
for i in {1..20}; do
    if curl -s http://localhost:9200 >/dev/null 2>&1; then
        echo -e "${GREEN} ✓ Ready${RESET}"
        break
    fi
    echo -n "."
    sleep 1
done

# Kibana check
echo -ne "${YELLOW}Waiting for Kibana"
for i in {1..30}; do
    if curl -s http://localhost:5601/api/status >/dev/null 2>&1; then
        echo -e "${GREEN} ✓ Ready${RESET}"
        break
    fi
    echo -n "."
    sleep 2
done

echo -e "\n${BLUE}[6] Fetching container IP addresses...${RESET}"

docker ps --format "{{.Names}}" | while read cname; do
    ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$cname")
    printf "${YELLOW}%-25s${GREEN}%s${RESET}\n" "$cname" "$ip"
done

# Detect attacker container
ATTACKER=$(docker ps --format "{{.Names}}" | grep attacker | head -n 1)
ATTACKER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$ATTACKER" 2>/dev/null || echo "Unknown")

echo -e "\n${GREEN} APTSim is Live!"
echo -e "${GREEN} Web App:      ${CYAN}http://172.30.0.11:3000${RESET}"
echo -e "${GREEN} Kibana:       ${CYAN}http://172.30.0.3:5601${RESET}"
echo -e "${GREEN} Attacker:     ${CYAN}172.30.0.50${RESET}\n"
echo -e "⚔ Happy Hunting!"

echo -e "\n${MAGENTA}🎯 Attacker Machine (interactive)${RESET}"
echo -e "${YELLOW}Name:${RESET} ${GREEN}${ATTACKER}${RESET}"
echo -e "${YELLOW}IP:  ${RESET} ${GREEN}${ATTACKER_IP}${RESET}"

echo -e "\n${CYAN}Launching attacker terminal in 3 seconds...${RESET}"
sleep 3

docker exec -it "$ATTACKER" /bin/sh || docker exec -it "$ATTACKER" /bin/bash

