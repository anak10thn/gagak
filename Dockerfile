FROM anak10thn/tinycore-nodejs

# set environment
ENV APP=/opt/gagak
# Create app directory
RUN mkdir -p $APP
WORKDIR $APP

# Install app dependencies
COPY package.json $APP
RUN npm install

# Bundle app source
COPY . $APP

EXPOSE 8080
CMD [ "npm", "start" ]
