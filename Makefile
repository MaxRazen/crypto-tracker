build:
	npm run build

run: build
	node dist/index.js --port=3001

test:
	@npm run test:build > /dev/null
	@npm run test

clean:
	@rm -rf dist/tests
	@rm -rf dist/index.js
