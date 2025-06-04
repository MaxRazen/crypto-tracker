ORDER_MANAGER_PROTO := https://raw.githubusercontent.com/MaxRazen/crypto-order-manager/master/protofiles/ordermanager.proto

## help: Show makefile commands
help: Makefile
	@echo "---- Project: MaxRazen/crypto-tracker ----"
	@echo " Usage: make COMMAND"
	@echo
	@echo " Available Commands:"
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

## build: Compiles typescript code to a single executable javascript file
build:
	npm run build

## run: Builds and runs application
run: build
	node dist/index.js --port=3001

## test: Runs tests
test:
	@npm run test:build > /dev/null
	@npm run test

## grpc-generate: Fetches protobuf file and describes into the module
grpc-generate:
	@rm -rf ordermanager.proto
	@curl -o ordermanager.proto $(ORDER_MANAGER_PROTO)
	@npm run grpc:generate
	@rm -rf ordermanager.proto

## clean: Removes generated or temporary files 
clean:
	@rm -rf dist/tests
	@rm -rf dist/index.js
	@rm -rf ordermanager.proto
