resource "oci_artifacts_container_repository" "container_repository" {
  compartment_id = var.compartment_ocid
  display_name   = "${local.project_name}-${local.deploy_id}-repository"
  is_public      = false
  readme {
    content = "# Container Repository for DevLive\nProject ${local.project_name}, deployment ${local.deploy_id}"
    format  = "text/markdown"
  }
}
