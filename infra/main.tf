terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
}

resource "aws_ecs_cluster" "infra" {
  name = var.stack_name
}

resource "aws_ecs_task_definition" "task" {
  family                   = var.service_name
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = var.role != "" ? aws_iam_role.ecs_role.arn : null

  container_definitions = jsonencode([
    {
      name   = var.service_name
      cpu    = var.container_cpu
      memory = var.container_memory
      image  = "localhost.localstack.cloud:4510/repo1:latest"
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.host_port
        }
      ]
    }
  ])
}

resource "aws_iam_role" "ecs_role" {
  name = "ecs_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
        Effect = "Allow"
        Sid    = ""
      },
    ]
  })
}

resource "aws_iam_role_policy" "ecs_role_policy" {
  name = "ecs_role_policy"
  role = aws_iam_role.ecs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:AttachNetworkInterface",
          "ec2:CreateNetworkInterface",
          "ec2:CreateNetworkInterfacePermission",
          "ec2:DeleteNetworkInterface",
          "ec2:DeleteNetworkInterfacePermission",
          "ec2:Describe*",
          "ec2:DetachNetworkInterface",
          "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:Describe*",
          "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
          "elasticloadbalancing:RegisterTargets",
          "dynamodb:*",
          "sqs:*",
          "s3:*",
          "athena:*",
        ],
        Effect   = "Allow",
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs_task_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Effect = "Allow"
        Sid    = ""
      },
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_execution_policy" {
  name = "ecs_task_execution_policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "dynamodb:*",
          "sqs:*",
          "s3:*",
          "athena:*",
        ],
        Effect   = "Allow",
        Resource = "*"
      },
    ]
  })
}

resource "aws_ecs_service" "nardo" {
  name            = var.service_name
  cluster         = var.stack_name
  task_definition = aws_ecs_task_definition.task.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets = [aws_subnet.public_one.id, aws_subnet.public_two.id, aws_subnet.private_one.id, aws_subnet.private_two.id]
    # security_groups  = var.security_group_ids
    assign_public_ip = true
  }
}

resource "aws_sqs_queue" "request_queue" {
  name                      = "requestQueue"
  message_retention_seconds = 60 # for localstack only
}

resource "aws_sqs_queue" "request_updates_1" {
  name                      = "requestUpdatesQueue-1"
  message_retention_seconds = 60 # for localstack only

  # TODO tag everything properly
  # tags = {
  #   Environment = "development"
  # }
}

resource "aws_sqs_queue" "request_updates_2" {
  name                      = "requestUpdatesQueue-2"
  message_retention_seconds = 60 # for localstack only
}

resource "aws_sqs_queue" "request_updates_3" {
  name                      = "requestUpdatesQueue-3"
  message_retention_seconds = 60 # for localstack only
}

resource "aws_sqs_queue" "request_updates_4" {
  name                      = "requestUpdatesQueue-4"
  message_retention_seconds = 60 # for localstack only
}

resource "aws_sqs_queue" "request_updates_5" {
  name                      = "requestUpdatesQueue-5"
  message_retention_seconds = 60 # for localstack only
}

resource "aws_sns_topic" "request_updates" {
  name                        = "requestUpdatesTopic.fifo"
  fifo_topic                  = true
  content_based_deduplication = true
}

resource "aws_sns_topic_subscription" "request_updates_sqs_target1" {
  topic_arn = aws_sns_topic.request_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.request_updates_1.arn
}

resource "aws_sns_topic_subscription" "request_updates_sqs_target2" {
  topic_arn = aws_sns_topic.request_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.request_updates_2.arn
}

resource "aws_sns_topic_subscription" "request_updates_sqs_target3" {
  topic_arn = aws_sns_topic.request_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.request_updates_3.arn
}

resource "aws_sns_topic_subscription" "request_updates_sqs_target4" {
  topic_arn = aws_sns_topic.request_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.request_updates_4.arn
}

resource "aws_sns_topic_subscription" "request_updates_sqs_target5" {
  topic_arn = aws_sns_topic.request_updates.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.request_updates_5.arn
}

# # We create this in deploy-tf.sh for now as the order matters, so we make the repo,
# # push the docker image, then start the remainder of the terraform deployment
# resource "aws_ecr_repository" "repo1" {
#   name                 = "repo1"
#   image_tag_mutability = "MUTABLE"
# }

# output "ecr_repository_url" {
#   value       = aws_ecr_repository.repo1.repository_url
#   description = "The URL of the ECR repository"
# }

