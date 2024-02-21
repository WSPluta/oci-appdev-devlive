locals {
  mysql_shape_name        = [for each in data.oci_mysql_shapes.mysql_shapes.shapes : each.name if strcontains(each.name, "MySQL.HeatWave.VM") && strcontains(each.name, "E")][0]
  mysql_config_shape_name = [for each in data.oci_mysql_mysql_configurations.mysql_configurations.configurations : each if !strcontains(each.display_name, "HA")][0]
  private_subnet_cidr     = "10.0.1.0/28"
  tcp_protocol            = "6"
}

resource "oci_mysql_mysql_db_system" "mysql_db_system" {
  display_name        = "${local.project_name}-${local.deploy_id}-mysql"
  description         = "MySQL DB System for ${local.project_name} ${local.deploy_id}"
  admin_password      = random_password.mysql_admin_password.result
  admin_username      = "admin"
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  configuration_id    = local.mysql_config_shape_name.id
  shape_name          = local.mysql_shape_name
  subnet_id           = oci_core_subnet.mysql_subnet.id

  data_storage_size_in_gb = "50"

  database_management = "ENABLED"
}

resource "oci_mysql_heat_wave_cluster" "heat_wave_cluster" {
  db_system_id = oci_mysql_mysql_db_system.mysql_db_system.id
  cluster_size = "1"
  shape_name   = local.mysql_shape_name
}

data "oci_mysql_shapes" "mysql_shapes" {
  compartment_id = var.compartment_ocid
  availability_domain = lower(
    data.oci_identity_availability_domains.ads.availability_domains[0].name,
  )
}

data "oci_mysql_mysql_configurations" "mysql_configurations" {
  compartment_id = var.compartment_ocid

  state      = "ACTIVE"
  shape_name = local.mysql_shape_name
}

data "oci_core_vcn" "oke_vcn" {
  vcn_id = module.oke.vcn_id
}

resource "oci_core_subnet" "mysql_subnet" {
  cidr_block                 = local.private_subnet_cidr
  compartment_id             = var.compartment_ocid
  vcn_id                     = module.oke.vcn_id
  display_name               = "mysql_subnet_${var.project_name}_${random_string.deploy_id.result}"
  dns_label                  = "mysql"
  prohibit_public_ip_on_vnic = true
  security_list_ids          = [data.oci_core_vcn.oke_vcn.default_security_list_id, oci_core_security_list.mysql_security_list.id]
  route_table_id             = data.oci_core_vcn.oke_vcn.default_route_table_id
  dhcp_options_id            = data.oci_core_vcn.oke_vcn.default_dhcp_options_id
}

resource "oci_core_security_list" "mysql_security_list" {
  compartment_id = var.compartment_ocid
  vcn_id         = module.oke.vcn_id
  display_name   = "MySQL Security List"

  ingress_security_rules {
    protocol  = local.tcp_protocol
    source    = local.anywhere
    stateless = false

    tcp_options {
      min = 3306
      max = 3306
    }
  }

  ingress_security_rules {
    protocol  = local.tcp_protocol
    source    = local.anywhere
    stateless = false

    tcp_options {
      min = 33060
      max = 33060
    }
  }
}
