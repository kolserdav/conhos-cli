DEPLOYMENT = cli-dev
DEPLOYMENT_PROD = cli
PREFIX = conhos
NAME = cli-dev
NAME_PROD = cli

deploy:
	make build
	make restart
deploy-prod:
	make build-prod
	make restart-prod
build:
	docker buildx build --build-context conhos-vscode=../conhos-vscode -f dockerfiles/Dockerfile.dev --tag $(REGISTRY_URL)/$(PREFIX)/$(NAME):latest --output="type=registry" .
build-prod:
	make build NAME=$(NAME_PROD)
restart:
	kubectl rollout restart -n conhos-dev deploy $(DEPLOYMENT)
restart-prod:
	make restart DEPLOYMENT=$(DEPLOYMENT_PROD)