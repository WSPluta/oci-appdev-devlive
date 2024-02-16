#!/usr/bin/env zx

import Mustache from "mustache";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await generateKustomizeFiles();

async function generateKustomizeFiles() {
  await cd("deployment/terraform");

  const { stdout } = await $`terraform output -json`;
  const terraformOutput = JSON.parse(stdout);

  const values = {};
  for (const [key, content] of Object.entries(terraformOutput)) {
    values[key] = content.value;
  }

  const {
    mysql_private_ip: mysql_private_ip,
    mysql_admin_password: mysql_admin_password,
  } = values;

  await cd("../..");

  const myCnfPath = "deployment/kubernetes/base/mysql-client/my.cnf";
  const myCnfTemplate = await fs.readFile(`${myCnfPath}.mustache`, "utf-8");

  const output = Mustache.render(myCnfTemplate, {
    mysql_host: mysql_private_ip,
    mysql_user: "admin",
    mysql_password: mysql_admin_password,
  });

  await fs.writeFile(myCnfPath, output);

  console.log(`File ${chalk.green(myCnfPath)} created`);

  console.log(
    `1. ${chalk.yellow(
      "export KUBECONFIG=deployment/terraform/generated/kubeconfig"
    )}`
  );
  console.log(
    `2. ${chalk.yellow("kubectl apply -k deployment/kubernetes/overlays/demo")}`
  );
}
