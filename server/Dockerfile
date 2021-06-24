FROM node:14
WORKDIR /server
EXPOSE 80


COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . ./

CMD ["yarn", "start-prod"]

