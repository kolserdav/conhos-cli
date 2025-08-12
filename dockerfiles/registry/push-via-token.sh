#!/usr/bin/bash

PREFIX=test
NAME=test5

docker buildx build -f Dockerfile --tag ${CONHOS_REGISTRY_URL}/${PREFIX}/${NAME}:latest --cache-from=type=registry,ref=${CONHOS_REGISTRY_URL}/${PREFIX}/${NAME}:cache \
	--cache-to=type=registry,ref=${CONHOS_REGISTRY_URL}/${PREFIX}/${NAME}:cache,mode=max --output="type=registry" .