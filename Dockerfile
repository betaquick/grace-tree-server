FROM node:14.16.0-slim

WORKDIR /app

# install and cache app dependencies
COPY package.json /app/package.json

RUN npm run install-local

# add app
COPY . /app

# Grant adequate permissions to the shell script
RUN chmod +x ./wait-for-it.sh

CMD npm start
