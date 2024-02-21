# Automation

## TODO

- By script (maybe something like `artifacts.mjs`); build and push Spring Boot app container image to OCI Container Registry (user and token has to be created with terraform). Add the image token secret to the kustomize deployment.
- Deploy **Spring Boot App** with MySQL connectivity
- Deploy a Checker (busybox) pod to run **cURL** commands to check the Spring Boot application.
- Merge this **AUTOMATION** guide with the existing LiveLabs format.

## Set Up environment

Run the deployment from OCI Cloud Shell is recommended, many variables are predefined on the OCI Cloud Shell. Node.Js is required for running the scripts (based on [google/zx](https://github.com/google/zx); a Javascript wrapper around bash scripting).

Install dependencies for scripts:

```bash
cd scripts && npm install && cd ..
```

Set up the environment. It will create a `.env.json` file with all the information required. It is a sensitive file, any leakage will compromise your deployment. `.env.json` files are in the `.gitignore` file for that reason.

As part of the script you will be prompted with a comparmtment name. Answer the **Compartment name** where you want to deploy the infrastructure. Root compartment is the default.

```bash
npx zx scripts/setenv.mjs
```

## Deploy infrastructure with Terraform

The following script `tfvars.mjs` will create the `terraform.tfvars` from the information created in the previous step on the file `.env.json`. It will use a template engine called Mustache to replace the values from `terraform.tfvars.mustache`.

```bash
npx zx scripts/tfvars.mjs
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

> NOTE: terraform deployment will take 34 minutes (mainly because the creation of the Kubernetes Cluster and node pool, and MySQL DB system with HeatWave cluster).

After a while, terraform will finished and you can get back to the root folder of the project.

```bash
cd ../..
```

Time to create the files required for the Kubernetes components that you are going to deploy.

## Deploy to Kubernetes

Run the following script that will build the service app and run the tests. It will build the container image and push it to Oracle Container Registry.

```bash
npx zx scripts/artifacts.mjs
```

Run the following script that will create config files for the Config Maps.

```bash
npx zx scripts/kustomize.mjs
```

Export the `kubeconfig` variable to talk to your new cluster.

> If the console closes, remember to rerun this command.

```bash
export KUBECONFIG=deployment/terraform/generated/kubeconfig
```

Check that Kubernetes is up and running and you can talk to the Control Plane API endpoint by listing the nodes.

```bash
kubectl get nodes
```

You are going to use Kustomize to deploy all the Kubernetes components that includes:

- MySQL client (pod alive for one hour)
- **[WORK IN PROGRESS]** Spring Boot Application that use MySQL as its database
- **[WORK IN PROGRESS]** Checker, a busybox pod to run cURL commands against the Spring Boot service.

Deploy the components with Kustomize:

```bash
kubectl apply -k deployment/kubernetes/overlays/demo
```

Run bash on the MySQL client to run a simple query like `SHOW DATABASES;`. All operations on MySQL can be run from here. It has a Config Map with a `my.cnf` file with the credentials for the MySQL System.

Get the name of the pod. It will look like this `mysql-client-xxx`.

```bash
kubectl get po
```

Copy the name of the pod and `exec` into it with the following command.

```bash
kubectl exec -it mysql-client-xxx -- bash
```

Run `mysql` client application, the host and credentials are already on `/etc/my.cnf` file.

```bash
mysql
```

When logged in, run any query. Let's start with showing the databases available, as this is a brand new MySQL database.

```bash
show databases;
```

> **Work In Progress**: create `db_example` database at this point. It will be needed by the Spring Boot Application.

When you are done, quit the mysql client application.

```bash
\quit
```

Then exit the bash execution inside the pod.

```bash
exit
```

You are back at OCI Cloud Shell.

## Clean Up

Delete the deployment on Kubernetes.

```bash
kubectl delete -k deployment/kubernetes/overlays/demo
```

Change to the terraform folder:

```bash
cd deployment/terraform
```

Delete the infrastructure with terraform destroy:

```bash
terraform destroy -auto-approve
```

Change to the root folder of the project:

```bash
cd ../..
```
