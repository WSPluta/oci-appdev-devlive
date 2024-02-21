locals {
  group_name = "${local.project_name}-${local.deploy_id}-group"
}

resource "oci_identity_group" "ocir_group" {
  provider       = oci.home
  compartment_id = var.tenancy_ocid
  description    = "Group for ${local.group_name}"
  name           = local.group_name
}

resource "oci_identity_user" "ocir_user" {
  provider       = oci.home
  compartment_id = var.tenancy_ocid
  description    = "User for pushing images to OCIR"
  name           = "${local.project_name}-${local.deploy_id}-ocir-user"

  email = "${local.project_name}-${local.deploy_id}-ocir-user@example.com"
}

resource "oci_identity_user_group_membership" "ocir_user_group_membership" {
  provider = oci.home
  group_id = oci_identity_group.ocir_group.id
  user_id  = oci_identity_user.ocir_user.id
}

resource "oci_identity_auth_token" "ocir_user_auth_token" {
  provider    = oci.home
  description = "User Auth Token to publish images to OCIR"
  user_id     = oci_identity_user.ocir_user.id
}

# FIXME allowing manage repos in tenancy, compartment will throw a 403 when pushing image
resource "oci_identity_policy" "manage_ocir_compartment" {
  provider       = oci.home
  compartment_id = var.tenancy_ocid
  name           = "manage_ocir_in_compartment_for_${local.project_name}_${random_string.deploy_id.result}"
  description    = "Allow group to manage ocir at compartment level for ${local.project_name} ${random_string.deploy_id.result}"
  statements = [
    "allow group ${local.group_name} to manage repos in tenancy",
  ]
}
