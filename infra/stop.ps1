Write-Output "Current Docker Containers:"
docker ps

# Filter and kill LocalStack main containers
Write-Output "Killing and Removing LocalStack Main Container..."
docker ps -q --filter "name=localstack_main" | ForEach-Object { docker stop $_ }
docker ps -aq --filter "name=localstack_main" | ForEach-Object { docker rm $_ }

# Filter and kill LocalStack spawned containers
Write-Output "Killing and Removing LocalStack Spawned Containers..."
docker ps -q --filter "ancestor=localhost.localstack.cloud:4510/repo1" | ForEach-Object { docker stop $_ }
docker ps -aq --filter "ancestor=localhost.localstack.cloud:4510/repo1" | ForEach-Object { docker rm $_ }
