#!/usr/bin/bash

USER=ccf92e82-c695-4c6e-8120-85261fc75eaa
REPO=test2

docker buildx build -f Dockerfile --tag ${CONHOS_REGISTRY_URL}/${USER}/${REPO}:latest --cache-from=type=registry,ref=${CONHOS_REGISTRY_URL}/${USER}/${REPO}:cache \
	--cache-to=type=registry,ref=${CONHOS_REGISTRY_URL}/${USER}/${REPO}:cache,mode=max --output="type=registry" .