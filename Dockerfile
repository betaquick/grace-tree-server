FROM node:8.12.0

WORKDIR /app

# install and cache app dependencies
COPY package.json /app/package.json

RUN npm run install-local

# add app
COPY . /app

# Grant adequate permissions to the shell script
RUN chmod +x ./wait-for-it.sh

CMD npm start
