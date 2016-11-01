FROM aksaramaya/base

# set environment
ENV APP=/opt/gagak
ENV NODE_PATH=/usr/lib/node_modules

RUN apk add --update git nodejs python make gcc libc-dev g++
# Create app directory
RUN mkdir -p $APP
WORKDIR $APP

# Install app dependencies
COPY package.json $APP
RUN npm install

# Bundle app source
COPY . $APP

RUN apk delete make gcc libc-dev g++

EXPOSE 8080
CMD [ "npm", "start" ]
