#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { generateEndpointSchema, validateSpec } = require("./anthropicProxy");

if (!process.env.BASEL_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.log("Please provide either a BASEL_API_KEY or an ANTHROPIC_API_KEY");
  process.exit(1);
}

if (process.env.BASEL_API_KEY && process.env.ANTHROPIC_API_KEY) {
  console.log(
    "Please provide either a BASEL_API_KEY or an ANTHROPIC_API_KEY, not both"
  );
  process.exit(1);
}

let USE_BASEL_API = false;
const BASEL_API_URL = process.env.BASEL_API_URL || "http://localhost:8000";
if (process.env.BASEL_API_KEY) {
  USE_BASEL_API = true;
  console.log("Using Basel API");
  console.log(`Using Basel API URL: ${BASEL_API_URL}`);
}

let USE_CLIENTSIDE_API = false;
if (process.env.ANTHROPIC_API_KEY) {
  USE_CLIENTSIDE_API = true;
  console.log("Using client side API");
}

async function main() {
  const args = process.argv.slice(2);
  const roots = [];
  const includes = [];
  const excludes = [];
  let i = 0;
  while (i < args.length) {
    if (args[i] === "--root") {
      roots.push(args[i + 1]);
      i += 2;
    } else if (args[i] === "--include") {
      includes.push(args[i + 1]);
      i += 2;
    } else if (args[i] === "--exclude") {
      excludes.push(args[i + 1]);
      i += 2;
    } else {
      i++;
    }
  }

  const defaultRoots = ["./"];
  const defaultIncludes = ["api"];
  const defaultExcludes = ["node_modules"];

  const rootsToUse = roots.length > 0 ? roots : defaultRoots;
  const includesToUse = includes.length > 0 ? includes : defaultIncludes;
  const excludesToUse = excludes.length > 0 ? excludes : defaultExcludes;

  const files = getFiles({
    roots: rootsToUse,
    includes: includesToUse,
    excludes: excludesToUse,
  });
  console.log("List of files to generate OpenAPI spec for:");
  console.log(files);

  let yamlDraft = "";
  for (let endpoint of files) {
    let endpointSchema;
    if (USE_BASEL_API) {
      const response = await axios.post(
        `${BASEL_API_URL}/generate-endpoint-schema`,
        { prompt: endpoint, filepath: endpoint }
      );
      endpointSchema = response.data.schema;
    } else if (USE_CLIENTSIDE_API) {
      endpointSchema = await generateEndpointSchema(endpoint, endpoint);
    }
    console.log(endpointSchema);
    yamlDraft += endpointSchema;
  }
  fs.writeFileSync("draft_spec.yaml", yamlDraft);

  let validSpec;
  if (USE_BASEL_API) {
    const response = await axios.post(`${BASEL_API_URL}/validate-spec`, {
      spec: yamlDraft,
    });
    validSpec = response.data.validYaml;
  } else if (USE_CLIENTSIDE_API) {
    validSpec = await validateSpec(yamlDraft);
  }
  writeSpecToFile(validSpec);
}

function writeSpecToFile(validSpec) {
  if (validSpec) {
    fs.writeFileSync("spec.yaml", validSpec);
  }
}

function getFiles(options) {
  const {
    roots = ["./"],
    includes = [],
    excludes = ["/node_modules/"],
    extensions = ["js", "ts", "jsx", "tsx"],
  } = options;

  let files = [];
  for (const root of roots) {
    files = files.concat(walk(root));
  }

  return files
    .filter((file) => {
      if (includes.length > 0) {
        return includes.some((include) => file.includes(include));
      }
      return true;
    })
    .filter((file) => !excludes.some((exclude) => file.includes(exclude)))
    .filter((file) => extensions.includes(path.extname(file).slice(1)));
}

function walk(dir) {
  let files = [];
  for (const file of fs.readdirSync(dir)) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      files = files.concat(walk(filepath));
    } else {
      files.push(filepath);
    }
  }
  return files;
}

main();
