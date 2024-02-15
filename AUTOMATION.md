# Automation

## TODO

- Include Mysql client execution, `SHOW DATABASES` will work
- Deploy Spring Boot App with MySQL connectivity

## Deploy

Run the deployment from OCI Cloud Shell is recommended. Node.Js is required for running the scripts (scripts based on [google/zx](https://github.com/google/zx)).

Install dependencies for scripts:

```bash
cd scripts && npm install && cd ..
```

Set up the environment. It will create a `.env.json` file with all the information required.

Answer the **Compartment name** where you want to deploy the infrastructure. Root compartment is the default.

```bash
zx scripts/setenv.mjs
```

The following script will create the `terraform.tfvars` from the information created in the previous step on the file `.env.json`.

```bash
zx scripts/tfvars.mjs
```

The output of the `tfvars.mjs` script will tell you to run the following commands.

```bash
cd deployment/terraform/
```

```bash
terraform init
```

```bash
terraform apply -auto-approve
```

> NOTE: terraform deployment will take 34 minutes (OKE, MySQL + HeatWave)

Check that Kubernetes is up and running and you can talk to the API endpoint.

```bash
KUBECONFIG=./generated/kubeconfig kubectl get no
```
