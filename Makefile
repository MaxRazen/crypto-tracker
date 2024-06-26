ORDER_MANAGER_PROTO := https://raw.githubusercontent.com/MaxRazen/crypto-order-manager/master/protofiles/ordermanager.proto

build:
	npm run build

run: build
	node dist/index.js --port=3001

test:
	@npm run test:build > /dev/null
	@npm run test

grpc-generate:
	@rm -rf ordermanager.proto
	@curl -o ordermanager.proto $(ORDER_MANAGER_PROTO)
	@npm run grpc:generate
	@rm -rf ordermanager.proto

clean:
	@rm -rf dist/tests
	@rm -rf dist/index.js
	@rm -rf ordermanager.proto
