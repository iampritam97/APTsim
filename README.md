# APTSim Range
### A Lightweight Docker-Based Cyber Attack & Detection Training Environment

APTSim Range is a fully containerized offensive–defensive cyber range designed for learning, research, and SOC training.  
It simulates real-world attack techniques and provides SIEM visibility via the ELK Stack (Elasticsearch, Logstash, Kibana).

This project includes:

- A vulnerable Node.js web application
- An attacker machine with offensive security tools (Nmap, SQLmap, Gobuster, Dalfox, etc.)
- A MySQL database with injection flaws
- A host machine for exploitation & privilege escalation
- Full ELK SIEM pipeline with Filebeat → Logstash → Elasticsearch → Kibana
- MITRE ATT&CK mapped training scenarios
- Step-by-step attack & detection walkthroughs

---

### Offensive Security Environment
- Reconnaissance (Nmap, WhatWeb, Gobuster)
- SQL Injection
- XSS (Stored & Reflected)
- Local File Inclusion (LFI)
- Brute-force (Hydra)
- Enumeration & exploitation

### Defensive Detection Environment
- Access logs shipped via Filebeat
- Logstash parsing & normalization
- Elasticsearch indexing
- Kibana dashboards for detection & incident investigation

### MITRE ATT&CK Coverage
| Tactic | Techniques Simulated |
|--------|-----------------------|
| Reconnaissance | Port scanning, enumeration |
| Initial Access | SQLi, XSS, LFI |
| Execution | Command injection |
| Discovery | OS & service enumeration |
| Credential Access | Brute-force |
| Exfiltration | Sensitive file extraction |

---
### Installation Instruction
#### Install Docker
```sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```


#### Install Docker Compose Plugin
```
sudo apt install -y docker-compose-plugin
```

#### Clone APTSim Range Repository
```
```
#### Start the APTsim
```
docker compose up -d
```