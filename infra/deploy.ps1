param (
    [string]$LocalStackApiKey
)

if ($null -eq $LocalStackApiKey -or $LocalStackApiKey -eq "") {
    Write-Output "Please input your localstack API key. E.g. ./deploy.ps1 -LocalStackApiKey `"YOUR API KEY HERE`""
    exit
}

function Get-NonEmptyTasks {
    param (
        [string]$ClusterArn,
        [int]$RetryLimit = 5,
        [int]$SleepDuration = 2
    )

    for ($i = 0; $i -lt $RetryLimit; $i++) {
        $tasksJson = (awslocal ecs list-tasks --cluster $ClusterArn | ConvertFrom-Json).taskArns

        if ($null -ne $tasksJson -and $tasksJson.Count -ne 0) {
            return $tasksJson
        }

        Start-Sleep -Seconds $SleepDuration
    }

    return $null
}

function Get-AppPort {
    param (
        [string]$ClusterArn,
        [string]$TaskArn,
        [int]$RetryLimit = 5,
        [int]$SleepDuration = 2
    )

    for ($i = 0; $i -lt $RetryLimit; $i++) {
        $app = (awslocal ecs describe-tasks --cluster $ClusterArn --tasks $TaskArn | ConvertFrom-Json)

        $containers = $app.tasks[0].containers

        if ($null -ne $containers -and $containers.Count -ne 0) {
            $port = $containers[0].networkBindings[0].hostPort
            return $port
        }

        Start-Sleep -Seconds $SleepDuration
    }

    return $null
}

function Start-SleepTillStacksCreated {
    param (
        [string]$stackName,
        [int]$maxAttempts = 60
    )

    $stacks = @();
    $attempts = 0;

    while ($stacks.Count -ne 0 -or $attempts -ne $maxAttempts) {
        $stacks = (awslocal cloudformation list-stacks | ConvertFrom-Json).StackSummaries | Where-Object {$_.StackName -eq $stackName}

        if ($stacks.Count -ne 0) {
            break;
        }

        Start-Sleep -Seconds 1;
        $attempts = $attempts + 1;
    }
}


$env:LOCALSTACK_API_KEY=$LocalStackApiKey;
$env:AWS_ACCESS_KEY_ID="test";
$env:AWS_SECRET_ACCESS_KEY="test";
$env:AWS_DEFAULT_REGION="us-east-1";

Write-Output "Starting Localstack daemon";
localstack start -d;
Write-Output  "Waiting for LocalStack startup...";
localstack wait -t 30;
Write-Output "Startup complete";

Write-Output "Creating a new ECR repository locally";
$repo = awslocal ecr create-repository --repository-name repo1 --region us-east-1 | ConvertFrom-Json;
$repoUri = $repo.repository.repositoryUri;

if ($null -eq $repo) {exit;}

Write-Output "Building the Docker image, pushing it to local ECR URL: $repoUri";
Start-Sleep -Seconds 3;
$env:REPO_URI="$repoUri"
docker compose build nardo;
docker ps
Start-Sleep -Seconds 5
docker compose push nardo;
docker rmi "$repoUri";

Write-Output "Creating ECS infrastructure locally";
awslocal cloudformation create-stack --stack-name infra --template-body file://infra/private.vpc.yml;
Start-SleepTillStacksCreated -stackName "infra"

Write-Output "Deploying ECS app to local environment"
awslocal cloudformation create-stack --stack-name nardo `
    --template-body file://infra/private.nardo.yml `
    --parameters ParameterKey=ImageUrl,ParameterValue=$repoUri;
Start-SleepTillStacksCreated -stackName "nardo"

Write-Output "ECS app successfully deployed. Trying to access app endpoint."
$clustersJson = (awslocal ecs list-clusters | ConvertFrom-Json).clusterArns
Write-Output "Clusters: $($clustersJson -join ', ')"

$taskArn = Get-NonEmptyTasks -ClusterArn $clustersJson[0]
Write-Output "Task Arn: $taskArn";

if ($null -ne $taskArn) {
    $appPort = Get-AppPort -ClusterArn $clustersJson[0] -TaskArn $taskArn

    if ($null -ne $appPort) {
        Write-Output "Pinging localhost:$appPort"
        Test-NetConnection localhost -Port $appPort | Write-Output
        Write-Output "App successfully deployed to http://localhost:$appPort"
    } else {
        Write-Output "Port not found"
    }
} else {
    Write-Output "No tasks found."
}


$tables = awslocal dynamodb list-tables
Write-Output "Tables: $tables\n"

$queues = awslocal sqs list-queues
Write-Output "Queues: $queues\n"
