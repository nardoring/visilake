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

Write-Output "Creating ECS infrastructure locally";
awslocal cloudformation create-stack --stack-name infra --template-body file://infra/private.vpc.yml;
Start-SleepTillStacksCreated -stackName "infra"

$tables = awslocal dynamodb list-tables
Write-Output "Tables: $tables\n"

$queues = awslocal sqs list-queues
Write-Output "Queues: $queues\n"