FROM node:10

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 16681

CMD ["node", "index.js"]
