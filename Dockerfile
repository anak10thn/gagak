FROM alpine

# set environment
ENV APP=/opt/gagak
ENV NODE_PATH=/usr/lib/node_modules

RUN apk add --update git nodejs python make gcc libc-dev g++
# Create app directory
RUN mkdir -p $APP
WORKDIR $APP

# Install app dependencies
COPY package.json $APP
RUN npm install;ln -s /etc/config/settings.js /opt/gagak/settings.js;

# Bundle app source
COPY . $APP

RUN apk del make gcc libc-dev g++

EXPOSE 8080
CMD [ "npm", "start" ]
