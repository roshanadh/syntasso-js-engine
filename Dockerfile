FROM node:14.16.0-alpine3.13

COPY client-files/wrapper-programs/. /usr/src/sandbox

WORKDIR /usr/src/sandbox