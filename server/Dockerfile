FROM node:14
WORKDIR /server
EXPOSE 80
EXPOSE 8080
EXPOSE 5000


COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . ./

CMD ["yarn", "start-prod"]

