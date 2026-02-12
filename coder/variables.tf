variable "base_image" {
  description = "Base Docker image for the workspace"
  type        = string
  default     = "node:current"
}

variable "repo_url" {
  description = "Git SSH URL for the repository"
  type        = string
  default     = "git@gitea-ssh.gaeljacquin.com:gaeljacquin/gaeldle.git"
}

variable "dev_branch" {
  description = "Git branch to clone for the repository"
  type        = string
  default     = "dev"
}

variable "web_port" {
  description = "Port for the Next.js web app"
  type        = number
  default     = 3000
}

variable "api_port" {
  description = "Port for the NestJS API"
  type        = number
  default     = 8080
}

variable "database_url" {
  description = "Postgres connection string used by the apps"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stack_project_id" {
  description = "Stack Auth Project ID"
  type        = string
  default     = ""
}

variable "stack_publishable_client_key" {
  description = "Stack Auth Publishable Client Key"
  type        = string
  default     = ""
}

variable "stack_secret_server_key" {
  description = "Stack Auth Secret Server Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twitch_client_id" {
  description = "Twitch Client ID"
  type        = string
  default     = ""
}

variable "twitch_client_secret" {
  description = "Twitch Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
  default     = ""
}

variable "supabase_publishable_key" {
  description = "Supabase Publishable Key"
  type        = string
  default     = ""
}

variable "supabase_secret_key" {
  description = "Supabase Secret Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cors_allowed_origins" {
  description = "Comma-separated allowed origins for CORS (API). Example: http://localhost:3000,https://coder.example.com"
  type        = string
  default     = "https://web--magenta-hedgehog-39--gael.coder.gaeljacquin.com"
}

variable "server_url" {
  description = "API URL. Example: http://localhost:8080,https://coder.example.com"
  type        = string
  default     = "https://api--magenta-hedgehog-39--gael.coder.gaeljacquin.com"
}

variable "app_dir" {
  description = "Name of directory for app"
  type        = string
  default     = "gaeldle"
}
