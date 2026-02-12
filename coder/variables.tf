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

variable "web_port" {
  description = "Port for the Next.js web app"
  type        = number
  default     = 3000
}

variable "api_port" {
  description = "Port for the NestJS API"
  type        = number
  default     = 9080
}

variable "database_url" {
  description = "Postgres connection string used by the apps"
  type        = string
  sensitive   = true
  default     = ""
}

variable "better_auth_url_api" {
  description = "Better Auth URL (API)"
  type        = string
  default     = "https://api--purple-squid-78--gael.coder.gaeljacquin.com/"
}

variable "better_auth_url_web" {
  description = "Better Auth URL (Web)"
  type        = string
  default     = "https://web--purple-squid-78--gael.coder.gaeljacquin.com"
}

variable "better_auth_secret" {
  description = "Secret for Better Auth (>= 32 chars). Used by both apps."
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cors_allowed_origins" {
  description = "Comma-separated allowed origins for CORS (API). Example: http://localhost:3000,https://coder.example.com"
  type        = string
  default     = "https://web--purple-squid-78--gael.coder.gaeljacquin.com"
}

variable "trusted_origins" {
  description = "Comma-separated trusted origins"
  type        = string
  default     = ""
}

variable "app_dir" {
  description = "Name of directory for app"
  type        = string
  default     = "shushu"
}
