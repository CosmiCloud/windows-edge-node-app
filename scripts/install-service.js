// const path = require("path");
// const log = require("electron-log");
// const fs = require("fs");
// const { Service } = require("node-windows");

// // Ensure logs directory exists
// const logDir = path.join(__dirname, "../logs");
// if (!fs.existsSync(logDir)) {
//   fs.mkdirSync(logDir, { recursive: true });
// }

// // Load configuration file
// const appConfig = path.join(__dirname, "../config", "app_config.json");
// let app_config;
// try {
//   app_config = JSON.parse(fs.readFileSync(appConfig, "utf-8"));
// } catch (error) {
//   console.error("Error reading app_config.json:", error.message);
//   process.exit(1); // Exit the script if the config file can't be loaded
// }

// // Setup electron-log
// const logPath = path.join(logDir, "service.log");
// log.transports.file.resolvePathFn = () => logPath;
// log.transports.file.level = app_config.log_level || "info";
// log.transports.file.format = "{h}:{i}:{s} {text}";

// try {
//   const scriptPath = path.resolve(__dirname, "../src/service/index.js");
//   if (!fs.existsSync(scriptPath)) {
//     log.error(`Script path does not exist: ${scriptPath}`);
//     process.exit(1);
//   }

//   const svc = new Service({
//     name: `${app_config.app_name} Service`,
//     description: `The ${app_config.app_name} Windows Service.`,
//     script: path.resolve(__dirname, "../src/service/index.js"),
//     nodeOptions: ["--max-old-space-size=4096"],
//   });

//   svc.on("install", () => {
//     log.info(`${app_config.app_name} service installed.`);
//     svc.start();
//   });

//   svc.on("alreadyinstalled", () => {
//     log.warn(`${app_config.app_name} service is already installed.`);
//   });

//   svc.on("start", () => {
//     log.info(`${app_config.app_name} service started.`);
//   });

//   svc.on("stop", () => {
//     log.info(`${app_config.app_name} service stopped.`);
//   });

//   svc.on("uninstall", () => {
//     log.info(`${app_config.app_name} service uninstalled.`);
//   });

//   svc.on("error", (err) => {
//     log.error(`${app_config.app_name} Service encountered an error:`, err);
//   });

//   // Main function to install the service
//   async function main() {
//     log.info("Starting service installation...");
//     await svc.install();
//   }

//   module.exports = main;

//   // Execute main if script is run directly
//   if (require.main === module) {
//     main().catch((error) => {
//       log.error("An error occurred during the script execution:", error);
//       console.error("An error occurred during the script execution:", error);
//     });
//   }
// } catch (error) {
//   log.error("Unexpected error in script:", error);
//   console.error("Unexpected error in script:", error.message);
// }

// async function installService() {
//   return new Promise((resolve, reject) => {
//     // Load app configuration
//     const appConfigPath = path.join(__dirname, "../config", "app_config.json");
//     let app_config;
//     try {
//       app_config = JSON.parse(fs.readFileSync(appConfigPath, "utf-8"));
//     } catch (error) {
//       return reject(new Error(`Failed to read app_config.json: ${error.message}`));
//     }

//     const scriptPath = path.resolve(__dirname, "../src/service/index.js");
//     if (!fs.existsSync(scriptPath)) {
//       return reject(new Error(`Service script not found at ${scriptPath}`));
//     }

//     const svc = new Service({
//       name: `${app_config.app_name} Service`,
//       description: `The ${app_config.app_name} Windows Service.`,
//       script: scriptPath,
//       nodeOptions: ["--max-old-space-size=4096"],
//     });

//     svc.on("install", () => {
//       log.info("Service installed. Starting service...");
//       svc.start();
//     });

//     svc.on("start", () => {
//       log.info("Service started successfully.");
//       resolve();
//     });

//     svc.on("alreadyinstalled", () => {
//       log.warn("Service already installed. Attempting to start...");
//       svc.start();
//     });

//     svc.on("error", (err) => {
//       log.error("Service encountered an error:", err);
//       reject(err);
//     });

//     log.info("Installing service...");
//     svc.install();
//   });
// }

const { Service } = require("node-windows");
const path = require("path");
const log = require("electron-log");
const fs = require("fs");

async function installService() {
  return new Promise((resolve, reject) => {
    // Load app configuration
    const appConfigPath = path.join(__dirname, "../config", "app_config.json");
    let app_config;
    try {
      app_config = JSON.parse(fs.readFileSync(appConfigPath, "utf-8"));
    } catch (error) {
      return reject(new Error(`Failed to read app_config.json: ${error.message}`));
    }

    const scriptPath = path.resolve(__dirname, "../src/service/index.js");
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Service script not found at ${scriptPath}`));
    }

    const svc = new Service({
      name: `${app_config.app_name} Service`,
      description: `The ${app_config.app_name} Windows Service.`,
      script: scriptPath,
      nodeOptions: ["--max-old-space-size=4096"],
    });

    svc.on("install", () => {
      log.info("Service installed. Starting service...");
      svc.start();
    });

    svc.on("start", () => {
      log.info("Service started successfully.");
      resolve();
    });

    svc.on("alreadyinstalled", () => {
      log.warn("Service already installed. Attempting to start...");
      svc.start();
    });

    svc.on("error", (err) => {
      log.error("Service encountered an error:", err);
      reject(err);
    });

    log.info("Installing service...");
    svc.install();
  });
}

module.exports = installService;
