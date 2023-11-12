export AWS_ACCESS_KEY_ID ?= test
export AWS_SECRET_ACCESS_KEY ?= test
export AWS_DEFAULT_REGION = us-east-1

usage:		## Show this help
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

install:	## Check dependencies
	@which aws
	@which docker
	@which localstack || pip install localstack
	@which awslocal || pip install awscli-local[ver1]

run:		## Build and deploy the app locally
	@./localstack/deploy

clean:		## Stop localstack and remove docker containers
	@./localstack/stop

logs:		## Output localstack logs to logs.txt
	@localstack logs > logs.txt

test-ci:
	make install run; return_code=`echo $$?`;\
	make logs; make clean; exit $$return_code;

.PHONY: usage install run clean logs test-ci
