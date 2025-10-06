DEPLOYMENT = cli-dev
NAME = conhos/cli-dev

deploy:
	make build
	make restart
build:
	docker buildx build --build-context conhos-vscode=../conhos-vscode -f dockerfiles/Dockerfile.dev --tag $(REGISTRY_URL)/$(NAME):latest --output="type=registry" .
restart:
	kubectl rollout restart -n conhos-dev deploy $(DEPLOYMENT)