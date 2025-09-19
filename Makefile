NAME = conhos/cli

deploy:
	make build
	make restart
build:
	docker buildx build --build-context conhos-vscode=../conhos-vscode -f Dockerfile --tag $(REGISTRY_URL)/$(NAME):latest --cache-from=type=registry,ref=$(REGISTRY_URL)/$(NAME):cache \
	--cache-to=type=registry,ref=$(REGISTRY_URL)/$(NAME):cache,mode=max --output="type=registry" .
restart:
	kubectl rollout restart -n conhos-dev deploy cli