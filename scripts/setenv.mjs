#!/usr/bin/env zx

import {
  setVariableFromEnvOrPrompt,
  writeEnvJson,
  readEnvJson,
} from "./lib/utils.mjs";
import {
  getNamespace,
  getRegions,
  getTenancyId,
  searchCompartmentIdByName,
} from "./lib/oci.mjs";
import { createSSHKeyPair } from "./lib/crypto.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

let properties = await readEnvJson();

await setTenancyEnv();
await setNamespaceEnv();
await setRegionEnv();
await setRegistryEnv();
await setCompartmentEnv();
await createSSHKeys("devlive");

console.log(`File ${chalk.yellow(".env.json")} created.`);

async function setTenancyEnv() {
  const tenancyId = await getTenancyId();
  properties = { ...properties, tenancyId };
  await writeEnvJson(properties);
}

async function setNamespaceEnv() {
  const namespace = await getNamespace();
  properties = { ...properties, namespace };
  await writeEnvJson(properties);
}

async function setRegistryEnv() {
  const { regionKey } = properties;
  const registry_url = `${regionKey}.ocir.io`;
  properties = { ...properties, registry_url };
  await writeEnvJson(properties);
}

async function setRegionEnv() {
  const regions = await getRegions();
  const regionNameValue = await setVariableFromEnvOrPrompt(
    "OCI_REGION",
    "OCI Region name",
    async () => printRegionNames(regions)
  );
  const { key: regionKey, name: regionName } = regions.find(
    (r) => r.name === regionNameValue
  );
  properties = { ...properties, regionName, regionKey };
  await writeEnvJson(properties);
}

async function setCompartmentEnv() {
  const compartmentName = await setVariableFromEnvOrPrompt(
    "COMPARTMENT_NAME",
    "Compartment Name (root)"
  );

  const compartmentId = await searchCompartmentIdByName(
    compartmentName || "root"
  );
  properties = { ...properties, compartmentName, compartmentId };
  await writeEnvJson(properties);
}

async function printRegionNames(regions) {
  const regionNames = regions.map((r) => r.name);
  const zones = [...new Set(regionNames.map((name) => name.split("-")[0]))];
  const regionsByZone = regions.reduce((acc, cur) => {
    const zone = cur.name.split("-")[0];
    if (acc[zone]) {
      acc[zone].push(cur.name);
    } else {
      acc[zone] = [cur.name];
    }
    return acc;
  }, {});
  Object.keys(regionsByZone).forEach((zone) =>
    console.log(`\t${chalk.yellow(zone)}: ${regionsByZone[zone].join(", ")}`)
  );
}

async function createSSHKeys(name) {
  const sshPathParam = path.join(os.homedir(), ".ssh", name);
  const publicKeyContent = await createSSHKeyPair(sshPathParam);
  properties = {
    ...properties,
    publicKeyContent,
    publicKeyPath: `${sshPathParam}.pub`,
    privateKeyPath: `${sshPathParam}`,
  };
  console.log(`SSH key ${chalk.yellow(sshPathParam)} created.`);
  await writeEnvJson(properties);
}
