/*
 * vpc.tf
 * AWS VPC Configuration for ECS Fargate Deployment
 *
 * Sets up the network infrastructure required for deploying a highly available
 * ECS Fargate cluster on AWS. It includes the creation of a VPC, subnets,
 * Internet Gateway, NAT Gateways, and route tables to support both public
 * and private subnet configurations. Configures VPC Endpoints for DynamoDB,
 * SQS, and ECS to enable private connections to these services.
 *
 * Resources Created:
 * - VPC with CIDR block 10.0.0.0/16, enabling DNS support and hostnames.
 * - Two public subnets for exposing services to the internet, with auto-assignment
 *   of public IP addresses.
 * - Two private subnets for running internal services, accessible only within the VPC.
 * - An Internet Gateway attached to the VPC to allow communication with the internet.
 * - NAT Gateways for each private subnet, allowing outbound internet access.
 * - Route tables and associations to correctly route traffic for each subnet type.
 * - VPC Endpoints for DynamoDB, SQS, and ECS services for private AWS service access.
 *
 * Design Decisions:
 * - Subnets are distributed across the first two available Availability Zones in
 *   the selected AWS region to ensure high availability.
 * - NAT Gateways are provisioned to enable outbound internet access for resources
 *   in the private subnets, ensuring they can still reach external services as needed.
 *
 * TODO:
 * - Finalize and configure security groups for VPC Endpoints to restrict traffic
 *   appropriately based on application needs.
 */

data "aws_availability_zones" "available" {}

### VPC ###
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

### Subnets ###

# Public Subnets
resource "aws_subnet" "public_one" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.0.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "public_two" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[1]
}

# Private Subnets
resource "aws_subnet" "private_one" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
}

resource "aws_subnet" "private_two" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
}

### Gateways ###

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

# NAT Gateway
resource "aws_eip" "nat_eip_one" {
  vpc = true
}

resource "aws_nat_gateway" "nat_one" {
  allocation_id = aws_eip.nat_eip_one.id
  subnet_id     = aws_subnet.public_one.id
}

resource "aws_eip" "nat_eip_two" {
  vpc = true
}

resource "aws_nat_gateway" "nat_two" {
  allocation_id = aws_eip.nat_eip_two.id
  subnet_id     = aws_subnet.public_two.id
}

### Routing ###

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table" "private_one" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_one.id
  }
}

resource "aws_route_table" "private_two" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_two.id
  }
}


# Route Table Associations
resource "aws_route_table_association" "public_one" {
  subnet_id      = aws_subnet.public_one.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_two" {
  subnet_id      = aws_subnet.public_two.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_one" {
  subnet_id      = aws_subnet.private_one.id
  route_table_id = aws_route_table.private_one.id
}

resource "aws_route_table_association" "private_two" {
  subnet_id      = aws_subnet.private_two.id
  route_table_id = aws_route_table.private_two.id
}

### Endpoints and Interaces ###

# DynamoDB VPC Endpoint (Gateway)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.private_one.id,
    aws_route_table.private_two.id,
    aws_route_table.public.id,
  ]
}

# SQS VPC Endpoint (Interface)
resource "aws_vpc_endpoint" "sqs" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type = "Interface"

  subnet_ids = [
    aws_subnet.private_one.id,
    aws_subnet.private_two.id,
  ]

  security_group_ids = [
    # TODO security group for VPC Endpoints
    # aws_security_group.vpc_endpoints.id,
  ]

  private_dns_enabled = true
}

# ECS (ECS Agent, ECS Telemetry, ECS API) VPC Endpoints (Interface)
resource "aws_vpc_endpoint" "ecs_agent" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.ecs-agent"
  vpc_endpoint_type = "Interface"

  subnet_ids = [
    aws_subnet.private_one.id,
    aws_subnet.private_two.id,
  ]

  security_group_ids = [
    # TODO security group for VPC Endpoints
    # aws_security_group.vpc_endpoints.id,
  ]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "ecs_telemetry" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.ecs-telemetry"
  vpc_endpoint_type = "Interface"

  subnet_ids = [
    aws_subnet.private_one.id,
    aws_subnet.private_two.id,
  ]

  security_group_ids = [
    # TODO security group for VPC Endpoints
    # aws_security_group.vpc_endpoints.id,
  ]

  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "ecs" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.ecs"
  vpc_endpoint_type = "Interface"

  subnet_ids = [
    aws_subnet.private_one.id,
    aws_subnet.private_two.id,
  ]

  security_group_ids = [
    # TODO security group for VPC Endpoints
    # aws_security_group.vpc_endpoints.id,
  ]

  private_dns_enabled = true
}
