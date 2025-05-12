#! /usr/bin/bash

NAME="kolserdav/conhos-cli"
VERSION_DEFAULT=lts-slim

echo "Setup QEMU"
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

platform=$(sh $(dirname "$0")/constants/platform.sh)
version=$(sh $(dirname "$0")/constants/version.sh)

IFS=',' read -r -a versions <<< "$version"


for version in "${versions[@]}"; do
    tags="--tag=$NAME:$version"
    if [ "$VERSION_DEFAULT" = "$version" ]; then
        tags+=" --tag=$NAME:latest"
    fi

    echo "Starting compile for version: $version, with tags: $tags"

    eval docker buildx build -f ./dockerfiles/Dockerfile.cli --platform=$platform --output="type=registry" \
    --cache-from=type=registry,ref=$NAME:cache --cache-to=type=registry,ref=$NAME:cache,mode=max \
    "$tags" --build-arg "IMAGE_VERSION=$version" .
done

