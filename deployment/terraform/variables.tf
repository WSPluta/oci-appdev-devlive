variable "tenancy_ocid" {
  type = string
}

variable "region" {
  type    = string
  default = "eu-frankfurt-1"
}

variable "compartment_ocid" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "ssh_private_key_path" {
  type = string
}

variable "project_name" {
  type    = string
  default = "devlive"
}
