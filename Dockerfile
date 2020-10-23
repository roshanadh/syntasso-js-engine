FROM alpine:3.7

RUN apk add --update build-base && apk add nodejs

COPY client-files/wrapper-programs/. /usr/src/sandbox

WORKDIR /usr/src/sandbox