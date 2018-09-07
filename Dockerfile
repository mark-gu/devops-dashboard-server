FROM node:alpine

WORKDIR /app/devops-dashboard-server

RUN npm config set registry http://registry.npmjs.org/
RUN npm install -g npm@latest typescript@latest pm2@latest

COPY package.json .
RUN npm install

COPY . .
RUN tsc -p tsconfig.json

EXPOSE 8800

CMD [ "pm2-runtime", "./process.yml" ]
