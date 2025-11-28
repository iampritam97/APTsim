#!/bin/bash

##############################################
#  APTSim Reset Utility
#  Clean, Rebuild & Relaunch APTSim Environment
#  With Colors, Graphics, Interactivity & Logs
##############################################

# Colors
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
MAGENTA="\e[35m"
CYAN="\e[36m"
RESET="\e[0m"

# Banner
clear
echo -e "${CYAN}"
echo "┌───────────────────────────────────────────────┐"
echo "│               APTSim Reset Engine             │"
echo "│     Full Clean → Rebuild → Fresh Launch       │"
echo "└───────────────────────────────────────────────┘"
echo -e "${RESET}"

# Confirm action
echo -e "${YELLOW}This will DELETE all logs, MySQL data, Suricata logs,"
echo "networks, containers and rebuild everything from scratch!"
echo -e "Are you sure? (y/n)${RESET}"
read -p "> " choice

if [[ "$choice" != "y" && "$choice" != "Y" ]]; then
    echo -e "${RED}Reset cancelled.${RESET}"
    exit 1
fi

# Spinner animation function
spinner() {
    local pid=$!
    local delay=0.12
    local spin=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    while kill -0 $pid 2>/dev/null; do
        for i in "${spin[@]}"; do
            printf "\r${CYAN}Processing... ${i}${RESET}"
            sleep $delay
        done
    done
    printf "\r${GREEN}✔ Done!${RESET}\n"
}

echo
echo -e "${BLUE}🔽 Stopping containers...${RESET}"
docker compose down & spinner

echo -e "${BLUE}🧹 Removing volumes...${RESET}"
docker compose down -v & spinner

echo -e "${BLUE}🧼 Cleaning networks...${RESET}"
docker network prune -f > /dev/null 2>&1 & spinner

echo -e "${BLUE}🧽 Cleaning unused containers...${RESET}"
docker container prune -f > /dev/null 2>&1 & spinner

#echo -e "${BLUE}🔥 Removing unused images (full cleanup)...${RESET}"
#docker image prune -af > /dev/null 2>&1 & spinner

echo -e "${MAGENTA}🔧 Rebuilding environment from scratch...${RESET}"
docker compose build --no-cache & spinner

echo -e "${GREEN}🚀 Launching APTSim...${RESET}"
docker compose up -d & spinner

sleep 2

# Display container IPs
echo -e "\n${CYAN}📡 Active Container IP Addresses:${RESET}"
docker ps --format "{{.Names}}" | while read cname; do
    ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$cname")
    printf "${YELLOW}%-25s${GREEN}%s${RESET}\n" "$cname" "$ip"
done

echo -e "\n${GREEN}✨ APTSim reset complete!"
echo -e "🌐 Kibana: ${CYAN}http://172.30.0.3:5601${RESET}"
echo -e "🛒 Web App:${CYAN}http://172.30.0.11:3000${RESET}"
echo -e "🔎 Suricata Logs: use ${CYAN}docker exec -it aptsim-suricata tail -f /var/log/suricata/eve.json${RESET}"
echo -e "⚔ Ready for attacks!${RESET}\n"
