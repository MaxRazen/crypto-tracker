build:
	yarn run build

run:
	yarn run start:dev

.PHONY: test
test:
	yarn run test

lint:
	yarn run format
	cd packages/web && yarn run format && yarn run lint
