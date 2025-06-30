NAME = conhos/cli

deploy:
	make build
	make restart
build:
	docker buildx build -f Dockerfile --tag $(REGISTRY_URL)/$(NAME):latest --cache-from=type=registry,ref=$(REGISTRY_URL)/$(NAME):cache \
	--cache-to=type=registry,ref=$(REGISTRY_URL)/$(NAME):cache,mode=max --output="type=registry" .
restart:
	kubectl rollout restart deploy conhos-cli