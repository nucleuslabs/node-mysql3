NM := node_modules/.bin
.SUFFIXES:

.PHONY: dev build clean debug test

# usage: make CMD=diff

build: yarn.lock
	tsc --build

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<

clean:
	rm -rf node_modules

node_modules:
	mkdir -p $@
