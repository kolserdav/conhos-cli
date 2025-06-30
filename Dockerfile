FROM node:lts-bookworm-slim

WORKDIR /home

ENV LIB=/var/lib/conhos

RUN mkdir -p ${LIB}

COPY package*.json ${LIB}
COPY src ${LIB}/src
COPY bin ${LIB}/bin

RUN cd ${LIB} && npm i

ENV PATH=$PATH:${LIB}/bin

CMD ["sleep", "infinity"]