resource "random_string" "deploy_id" {
  length  = 2
  special = false
  upper   = false
}

resource "random_password" "mysql_admin_password" {
  length  = 16
  special = true
  upper   = true
  lower   = true
}
