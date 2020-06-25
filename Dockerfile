FROM ubuntu:16.04

RUN apt-get update \
&& apt-get install -y curl \
&& curl -sL https://deb.nodesource.com/setup_12.x | bash \
&& apt-get install -y nodejs

RUN mkdir home/client-files/
COPY /client-files/wrapper-programs/main-wrapper.js /home/client-files/main-wrapper.js

CMD ["bash"]