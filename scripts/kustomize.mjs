#!/usr/bin/env zx

import Mustache from "mustache";
import { readEnvJson } from "./lib/utils.mjs";
import { getOutputValues } from "./lib/terraform.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const { namespace, registry_url } = await readEnvJson();
const {
  mysql_private_ip,
  mysql_admin_password,
  user_name,
  user_auth_token,
  user_email,
  repository_name,
} = await getOutputValues("deployment/terraform");

await generateKustomizeFiles();

async function generateKustomizeFiles() {
  await createMyCnfFile(mysql_private_ip, mysql_admin_password);
  await createApplicationYamlFile(mysql_private_ip, mysql_admin_password);
  await createDockerConfigJsonFile(
    registry_url,
    namespace,
    user_name,
    user_auth_token,
    user_email
  );
  await createOverlayFile(registry_url, namespace, repository_name);

  console.log(
    `1. ${chalk.yellow(
      "export KUBECONFIG=deployment/terraform/generated/kubeconfig"
    )}`
  );
  console.log(
    `2. ${chalk.yellow("kubectl apply -k deployment/kubernetes/overlays/demo")}`
  );
}

async function createMyCnfFile(mysql_private_ip, mysql_admin_password) {
  const myCnfPath = "deployment/kubernetes/base/mysql-client/my.cnf";
  const myCnfTemplate = await fs.readFile(`${myCnfPath}.mustache`, "utf-8");

  const output = Mustache.render(myCnfTemplate, {
    mysql_host: mysql_private_ip,
    mysql_user: "admin",
    mysql_password: mysql_admin_password,
  });

  await fs.writeFile(myCnfPath, output);

  console.log(`File ${chalk.green(myCnfPath)} created`);
}

async function createApplicationYamlFile(
  mysql_private_ip,
  mysql_admin_password
) {
  const applicationYamlPath =
    "deployment/kubernetes/base/service-mysql/application.yaml";
  const applicationYamlTemplate = await fs.readFile(
    `${applicationYamlPath}.mustache`,
    "utf-8"
  );

  const output = Mustache.render(applicationYamlTemplate, {
    mysql_host: mysql_private_ip,
    mysql_user: "admin",
    mysql_database: "db_example",
    mysql_password: mysql_admin_password,
  });

  await fs.writeFile(applicationYamlPath, output);

  console.log(`File ${chalk.green(applicationYamlPath)} created`);
}

async function createDockerConfigJsonFile(
  registry_url,
  namespace,
  user_name,
  user_auth_token,
  user_email
) {
  const dockerConfigPath =
    "deployment/kubernetes/base/ocir-secret/.dockerconfigjson";
  const dockerConfigTemplate = await fs.readFile(
    `${dockerConfigPath}.mustache`,
    "utf-8"
  );

  const output = Mustache.render(dockerConfigTemplate, {
    registry_url: registry_url,
    user_name: `${namespace}/${user_name}`,
    user_auth_token: user_auth_token,
    user_email: user_email,
    user_auth_secret: btoa(`${namespace}/${user_name}:${user_auth_token}`),
  });

  await fs.writeFile(dockerConfigPath, output);

  console.log(`File ${chalk.green(dockerConfigPath)} created`);
}

async function createOverlayFile(registry_url, namespace, repository_name) {
  const overlayKustomizationPath =
    "deployment/kubernetes/overlays/demo/kustomization.yaml";
  const overlayKustomizationTemplate = await fs.readFile(
    `${overlayKustomizationPath}.mustache`,
    "utf-8"
  );

  const output = Mustache.render(overlayKustomizationTemplate, {
    service_mysql_image: `${registry_url}/${namespace}/${repository_name}/service-mysql`,
  });

  await fs.writeFile(overlayKustomizationPath, output);

  console.log(`File ${chalk.green(overlayKustomizationPath)} created`);
}
