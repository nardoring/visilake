#!/usr/bin/env bash
exec > >(tee -a deploy-tf.log) 2>&1

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

function teardown() {
    rm -rf .terraform/ .terraform.lock.hcl terraform.tfstate terraform.tfstate.backup
}

function hard_teardown() {
    localstack stop
    docker system prune -af
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --debug)
        export TF_LOG=DEBUG
        shift
        ;;
        --teardown)
        if [[ $2 == "hard" ]]; then
            teardown
            hard_teardown
            shift 2 # Consume both --teardown and hard
        else
            teardown
            stop
            shift # Consume --teardown
        fi
        ;;
        *)
        echo "Unknown option: $1"
        shift
        ;;
    esac
done

set -e  # Exit immediately if a command exits with a non-zero status
echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
teardown
# build docker images with nix and load them into docker
docker load < "$(nix build --print-out-paths .#localstackpro-image)"
docker load < "$(nix build --print-out-paths .#nardo-image)"

localstack start -d
docker rmi localstack/localstack:latest

echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
# create a new ECR repository locally, tag the Docker image, push to ECR
awslocal ecr create-repository --repository-name repo1

localImageName="nardo:latest"
docker tag $localImageName "localhost.localstack.cloud:4510/repo1"
docker push "localhost.localstack.cloud:4510/repo1"
docker rmi nardo:latest

echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
# terraform
tflocal init
tflocal plan
tflocal apply --auto-approve

echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
# checks
echo "Clusters:"
clusters=$(awslocal ecs list-clusters)
echo "$clusters"

cluster_arn=$(echo $clusters | jq -r '.clusterArns[0]')
# echo -e "Cluster arn: $cluster_arn\n"

## Get cluster tasks
for i in {1..5}; do
    tasks=$(awslocal ecs list-tasks --cluster $cluster_arn)
    echo -e "Tasks: $tasks\n"
    task_arn=$(echo $tasks | jq -r '.taskArns[0]')
    if [ "$task_arn" == "null" ]; then
        echo -e "\033[1;33mNo task found \033[0m\n"
        exit 1
    fi
    if [ "$task_arn" != "null" ]; then
        break
    fi
    sleep 2
done
# echo -e "Task arn: $task_arn\n"

echo -e "\n# - $(date '+%Y-%m-%d %H:%M:%S') -------------------------------------------------------#\n"
## Get task ports
for i in {1..5}; do
    app=$(awslocal ecs describe-tasks --cluster $cluster_arn --tasks $task_arn)
    echo -e "App: $app\n"
    app_port=$(echo $app | jq -r '.tasks[0].containers[0].networkBindings[0].hostPort')
    if [ "$app_port" == "" ]; then
        echo -e "\033[1;33mNo application found \033[0m\n"
        exit 1
    fi
    if [ "$app_port" != "null" ]; then
        break
    fi
    sleep 2
done

# Get tables
tables=$(awslocal dynamodb list-tables)
echo -e "Tables: $tables\n"

# Get queues
queues=$(awslocal sqs list-queues)
echo -e "Queues: $queues\n"

echo -e "Curling localhost:$app_port\n"
curl localhost:$app_port


echo "################################################################################"
