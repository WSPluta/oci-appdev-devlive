#!/usr/bin/env zx

import { buildJarGradle, getVersionGradle } from "./lib/gradle.mjs";
import {
  buildImage,
  checkPodmanMachineRunning,
  pushImage,
  tagImage,
} from "./lib/container.mjs";
import { readEnvJson } from "./lib/utils.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = true;

const { namespace, registry_url } = await readEnvJson();
const { repository_name } = await getTFOutputValues();

await checkPodmanMachineRunning();

const pwd = (await $`pwd`).stdout.trim();

const service = "service-mysql";
await cd(`src/${service}`);
const version = await getVersionGradle();
await buildJarGradle();

const image_name = `${service}`;
await buildImage(`localhost/${image_name}`, version);
const local_image = `localhost/${image_name}:${version}`;
const remote_image = `${registry_url}/${namespace}/${repository_name}/${image_name}:${version}`;
await tagImage(local_image, remote_image);
await pushImage(remote_image);
console.log(`Released: ${chalk.yellow(remote_image)}`);

await cd(pwd);

async function getTFOutputValues() {
  await cd("deployment/terraform");
  const { stdout } = await $`terraform output -json`;
  const terraformOutput = JSON.parse(stdout);

  const values = {};
  for (const [key, content] of Object.entries(terraformOutput)) {
    values[key] = content.value;
  }
  await cd("../..");
  return values;
}
