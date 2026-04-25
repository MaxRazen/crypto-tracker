build:
	yarn run build

run:
	yarn run start:dev

runweb:
	yarn --cwd web run dev

gen\:api:
	yarn --cwd web run gen:api

.PHONY: test
test:
	yarn run test

lint:
	yarn run format
	cd web && yarn run format && yarn run lint
