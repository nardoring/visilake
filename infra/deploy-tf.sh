#!/usr/bin/env bash
exec > >(tee -a deploy-tf.log) 2>&1
cd infra || { echo -e "\033[1;33mFailed to change directory to 'infra', run this from the project root. \033[0m\n "; exit 1; }

function usage() {
    echo -e "Usage: $0 [options]"
    echo -e "\nOptions:"
    echo -e "  none                   Full Localstack and Terraform Deployment"
    echo -e "  -v, --verbose          Enable debug for Terraform and Localstack"
    echo -e "  -r, --redeploy         Re-deploy Terraform config to Localstack"
    echo -e "  -d, --docker           Re-deploy the nardo docker image to Localstack"
    echo -e "  -t, --teardown [mode]  Perform teardown."
    echo -e "                         Modes: 'h' or 'hard' for hard teardown, no mode for standard teardown"
    echo -e "                                 hard teardown will remove all docker images on your system"
    echo -e "  -h, --help             Display this help message"
    echo -e "\nNote:"
    echo -e "  -r -d Localstack must already be running by running '$0' first"
    exit 1
}

function stop() {
    echo "Current Docker Containers:"
    docker ps

    docker ps -q --filter "ancestor=localstack/localstack-pro" | xargs -r docker stop
    docker ps -aq --filter "ancestor=localstack/localstack-pro" | xargs -r docker rm

    # Filter and kill LocalStack spawned containers
    docker ps -q --filter "ancestor=localhost.localstack.cloud:4510/repo1" | xargs -r docker stop
    docker ps -aq --filter "ancestor=localhost.localstack.cloud:4510/repo1" | xargs -r docker rm
    echo -e "\nLocalStack containers have been stopped and removed."
    exit 1
}

function clean() {
    rm -rf .terraform/ .terraform.lock.hcl terraform.tfstate terraform.tfstate.backup
}

function hard_teardown() {
    localstack stop
    docker system prune -af
}

function push_app() {
    localImageName="nardo:latest"
    docker tag $localImageName "localhost.localstack.cloud:4510/repo1"
    docker push "localhost.localstack.cloud:4510/repo1"
    docker rmi nardo:latest
}

function deploy() {
    set -e  # Exit immediately if a command exits with a non-zero status
    SECONDS=0
    echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
    node ../src/utils/dbMockJobGenerator.js
    clean # cleanup potential old state

    # build docker images with nix and load them into docker
    docker load < "$(nix build --print-out-paths .#localstackpro-image)"
    docker load < "$(nix build --print-out-paths .#nardo-image)"

    localstack start -d

    echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
    # create a new ECR repository locally, tag the Docker image, push to ECR
    awslocal ecr create-repository --repository-name repo1
    push_app

    echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
    # terraform
    tflocal init
    # tflocal plan
    tflocal apply --auto-approve

    tflocal show

    echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
    echo "Executed in $SECONDS seconds."
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            echo "Debug statements enabled"
            export DEBUG=1
            export TF_LOG=DEBUG
            shift
            ;;
        -r|--redeploy)
            node ../src/utils/dbMockJobGenerator.js
            tflocal refresh
            tflocal apply --auto-approve
            shift
            exit 1
            ;;
        -d|--docker)
            docker load < "$(nix build --print-out-paths .#nardo-image)"
            push_app
            shift
            exit 1
            ;;
        -t|--teardown)
            clean
            if [[ $2 == "hard" || $2 == "h" ]]; then
                hard_teardown
                shift
            else
                stop
            fi
            shift
            exit 1
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

deploy
