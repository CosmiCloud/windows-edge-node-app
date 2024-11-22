const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const queryDB = require("../util/queryDB.js");
const appConfigPath = path.join(__dirname, "../config", "app_config.json");
const app_config = require(appConfigPath);

// Determine host value based on dkg_host setting
const wsl_instance = execSync("wsl hostname -I").toString().trim();
const dkg_host = app_config.dkg_host;

// Function to log messages
function logMessage(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

// Function to log errors
function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] ${message}: ${error.message}`);
}

// Main Setup
async function main() {
  try {
    logMessage("Updating app config...");

    const host = dkg_host === "WSL" ? wsl_instance : dkg_host;
    app_config.edge_node_endpoint = `http://${host}`;

    fs.writeFileSync(appConfigPath, JSON.stringify(app_config, null, 2));

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "blockchain" AND user_id = 1`,
      [app_config.blockchain],
      'edge_node_auth_db'
    );

    logMessage("Additional configuration complete.");
  } catch (error) {
    logError("An error occurred during setup", error);
  }
}

// Export the main function for use in other files
module.exports = main;

if (require.main === module) {
  main().catch((error) => {
    console.error("An error occurred during the script execution:", error);
  });
}
