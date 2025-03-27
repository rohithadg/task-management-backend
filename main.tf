terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4.0"
    }
  }
}

provider "aws" {
  region  = local.aws_region
  profile = "gd"
}

locals {
  function_name      = "tasks-management-api"
  runtime            = "nodejs20.x"
  api_stage          = "prod"
  task_table_name    = "TasksTable"
  task_partition_key = "id"
  aws_region         = "ap-southeast-2"
  node_env           = "development"
}

data "aws_caller_identity" "current" {}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/dist"
  output_path = "${path.module}/tasks_lambda_function.zip"
}

resource "aws_lambda_layer_version" "task_management_deps" {
  filename            = "layer/nodejs_layer.zip"
  layer_name          = "task_management_dependencies"
  compatible_runtimes = ["nodejs20.x"]
}

resource "aws_lambda_function" "task_management_api" {
  function_name = local.function_name

  runtime = local.runtime
  role    = aws_iam_role.lambda_exec.arn

  handler = "index.handler"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  layers           = [aws_lambda_layer_version.task_management_deps.arn]

  memory_size = 256
  timeout     = 10

  environment {
    variables = {
      NODE_ENV           = local.node_env
      STAGE              = local.api_stage
      TASK_TABLE         = local.task_table_name
      TASK_PARTITION_KEY = local.task_partition_key
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "${local.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${local.function_name}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ],
        Resource = [
          "arn:aws:dynamodb:${local.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.task_table_name}",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_exec.name
}

resource "aws_apigatewayv2_api" "task_management_api" {
  name          = "${local.function_name}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "task_management_api" {
  api_id      = aws_apigatewayv2_api.task_management_api.id
  name        = local.api_stage
  auto_deploy = true
}

resource "aws_lambda_function_url" "task_management_api" {
  function_name      = aws_lambda_function.task_management_api.function_name
  authorization_type = "NONE"
}

resource "aws_apigatewayv2_integration" "task_management_api" {
  api_id           = aws_apigatewayv2_api.task_management_api.id
  integration_type = "AWS_PROXY"

  connection_type        = "INTERNET"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.task_management_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "tasks_get" {
  api_id    = aws_apigatewayv2_api.task_management_api.id
  route_key = "GET /tasks"

  target = "integrations/${aws_apigatewayv2_integration.task_management_api.id}"
}

resource "aws_apigatewayv2_route" "tasks_post" {
  api_id    = aws_apigatewayv2_api.task_management_api.id
  route_key = "POST /tasks"

  target = "integrations/${aws_apigatewayv2_integration.task_management_api.id}"
}

resource "aws_apigatewayv2_route" "tasks_get_by_id" {
  api_id    = aws_apigatewayv2_api.task_management_api.id
  route_key = "GET /tasks/{id}"

  target = "integrations/${aws_apigatewayv2_integration.task_management_api.id}"
}

resource "aws_apigatewayv2_route" "tasks_put" {
  api_id    = aws_apigatewayv2_api.task_management_api.id

  route_key = "PUT /tasks/{id}"

  target = "integrations/${aws_apigatewayv2_integration.task_management_api.id}"
}

resource "aws_apigatewayv2_route" "tasks_delete" {
  api_id    = aws_apigatewayv2_api.task_management_api.id
  route_key = "DELETE /tasks/{id}"

  target = "integrations/${aws_apigatewayv2_integration.task_management_api.id}"
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.task_management_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.task_management_api.execution_arn}/*"
}

resource "aws_dynamodb_table" "tasks_table" {
  name         = local.task_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = local.task_partition_key

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}

output "api_endpoint" {
  description = "Task Management API Gateway Endpoint"
  value       = aws_apigatewayv2_stage.task_management_api.invoke_url
}

output "lambda_function_url" {
  description = "Tasks Management Lambda Function URL"
  value       = aws_lambda_function_url.task_management_api.function_url
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.tasks_table.name
}
