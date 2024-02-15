output "deploy_id" {
  value = random_string.deploy_id.result
}

output "mysql_admin_password" {
  value     = random_password.mysql_admin_password.result
  sensitive = true
}

output "mysql_shape" {
  value = local.mysql_shape_name
}

output "mysql_config_shape" {
  value = local.mysql_config_shape_name.display_name
}

output "mysql_private_ip" {
  value = oci_mysql_mysql_db_system.mysql_db_system.ip_address
}