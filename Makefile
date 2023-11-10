export AWS_ACCESS_KEY_ID ?= test
export AWS_SECRET_ACCESS_KEY ?= test
export AWS_DEFAULT_REGION = us-east-1

usage:		## Show this help
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

check:		## Check dependencies
	@which aws
	@which awslocal
	@which docker
	@which localstack

start:		## Start localstack daemon
	localstack start -d

deploy:		## Build and deploy the app locally
	@./localstack/deploy

stop:		## Stop localstack and docker containers
	@./localstack/stop

logs:		## Output localstack logs to logs.txt
	@localstack logs > logs.txt

test-ci:
	make check start deploy; return_code=`echo $$?`;\
	make logs; make stop; exit $$return_code;

.PHONY: usage check start deploy stop logs test-ci
