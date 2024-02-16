locals {
  oke_latest_version = reverse(sort(data.oci_containerengine_cluster_option.test_cluster_option.kubernetes_versions))[0]
  tcp                = "6"
  anywhere           = "0.0.0.0/0"
}

module "oke" {
  source  = "oracle-terraform-modules/oke/oci"
  version = "5.1.2"

  tenancy_id     = var.tenancy_ocid
  compartment_id = var.compartment_ocid
  region         = var.region
  home_region    = var.tenancy_ocid

  providers = {
    oci      = oci
    oci.home = oci.home
  }

  kubernetes_version = local.oke_latest_version
  cluster_name = "${local.project_name}-${local.deploy_id}-oke"
  vcn_name     = "${local.project_name}-${local.deploy_id}-vcn"

  cni_type           = "npn"
  cluster_type       = "enhanced"

  control_plane_is_public     = true
  control_plane_allowed_cidrs = ["0.0.0.0/0"]

  create_bastion  = false
  create_operator = false

  ssh_private_key_path = var.ssh_private_key_path
  ssh_public_key       = var.ssh_public_key

  # mysql subnet will be on "10.0.1.0/28" CIDR
  subnets = {
    bastion  = { cidr = "10.0.0.0/29" }
    cp       = { cidr = "10.0.0.8/29" }
    int_lb   = { cidr = "10.0.0.32/27" }
    operator = { cidr = "10.0.0.64/29" }
    pods     = { cidr = "10.0.64.0/18" }
    pub_lb   = { cidr = "10.0.128.0/27" }
    workers  = { cidr = "10.0.144.0/20" }
  }

  # worker_nsg_ids = []

  worker_pools = {
    oke-vm-standard-e4-flex = {
      description      = "${local.project_name}-${local.deploy_id}-vm-e4-flex",
      shape            = "VM.Standard.E4.Flex",
      size             = 1,
      create           = true,
      ocpus            = 1,
      memory           = 16,
      boot_volume_size = 200,
      os               = "Oracle Linux",
      os_version       = "8",
    },
  }
}

data "oci_containerengine_cluster_option" "test_cluster_option" {
  cluster_option_id = "all"
}

data "oci_containerengine_cluster_kube_config" "kube_config" {
  cluster_id = module.oke.cluster_id
}

resource "local_file" "kube_config" {
  content         = data.oci_containerengine_cluster_kube_config.kube_config.content
  filename        = "${path.module}/generated/kubeconfig"
  file_permission = "0600"
}
