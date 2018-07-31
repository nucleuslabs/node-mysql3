NM := node_modules/.bin
.SUFFIXES:

.PHONY: build clean test

build: node_modules/.yarn-integrity
	$(NM)/tsc --build

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	touch $@

yarn.lock: package.json
	@yarn check --integrity
	touch $@

clean:
	rm -rf node_modules dist yarn-error.log
