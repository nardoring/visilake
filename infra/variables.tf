variable "stack_name" {
  type        = string
  default     = "infra"
  description = "The name of the parent Fargate networking stack."
}

variable "service_name" {
  type        = string
  default     = "nardo"
  description = "A name for the service"
}

variable "image_url" {
  type        = string
  default     = "nardo"
  description = "The url of a docker image for the service"
}

variable "host_port" {
  type        = number
  default     = 45139
  description = "Port number the application on the host is binding to"
}

variable "container_port" {
  type        = number
  default     = 3000
  description = "Port number the application inside the docker container is binding to"
}

variable "container_cpu" {
  type        = number
  default     = 1024
  description = "How much CPU to give the container. 1024 is 1 CPU"
}

variable "container_memory" {
  type        = number
  default     = 2048
  description = "How much memory in megabytes to give the container"
}

variable "desired_count" {
  type        = number
  default     = 2
  description = "How many copies of the service task to run"
}

variable "role" {
  type        = string
  default     = ""
  description = "An IAM role for the service's containers if needed"
}

variable "path" {
  type        = string
  default     = "*"
  description = "A path on the load balancer this service should be connected to"
}

variable "priority" {
  type        = number
  default     = 1
  description = "The priority for the routing rule on the load balancer"
}

variable "subnet_ids" {
  type        = list(string)
  default     = ["public_one", "private_one", "public_one", "private_two"]
  description = "A list of subnet IDs to launch resources in"
}

variable "security_group_ids" {
  type        = list(string)
  default     = ["PrivateLoadBalancerSG", "PublicLoadBalancerSG", "FargateContainerSecurityGroup"]
  description = "A list of security group IDs to associate with"
}
