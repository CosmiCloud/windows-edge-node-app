const DKGClient = require("dkg.js");
const path = require("path");
const log = require("electron-log");
const fs = require("fs");
const { execSync } = require("child_process");

// Configuration paths
const appConfig = path.join(__dirname, "../../../config", "app_config.json");
const config = JSON.parse(fs.readFileSync(appConfig, "utf-8"));

// Initialize the logger
log.transports.file.resolvePathFn = () => logPath;
log.transports.file.level = config.log_level || "info";
log.transports.file.format = "{h}:{i}:{s} {text}";

const wsl_instance = execSync("wsl hostname -I").toString().trim();
const dkg_host = config.dkg_host;
const dkg_port = config.dkg_port;
const host = dkg_host === "WSL" ? wsl_instance : dkg_host;
const environment = config.environment;
const blockchain = config.blockchain;

const node_options = {
  environment: environment,
  endpoint: `http://${host}`,
  port: dkg_port,
  useSSL: false,
  maxNumberOfRetries: 100,
  frequency: 2,
};

const dkg = new DKGClient(node_options);

module.exports = {
  
};
