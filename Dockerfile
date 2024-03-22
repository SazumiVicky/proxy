FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN apt-get update && apt-get install
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]