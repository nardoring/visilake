Write-Output "Deleting infra stack...";
awslocal cloudformation delete-stack --stack-name infra