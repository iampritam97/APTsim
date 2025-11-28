FROM node:18-alpine
WORKDIR /app

# create log dir and allow writes (lab only)
RUN mkdir -p /var/log/web && chmod -R 777 /var/log/web

# install tools needed for some endpoints (curl/openssl not required but keep small)
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["node","app.js"]
