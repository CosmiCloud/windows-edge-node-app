const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ethers = require("ethers");
const axios = require("axios");
const queryDB = require("../util/queryDB.js");

function logMessage(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] ${message}: ${error.message}`);
}

// Configuration paths
const wslImagePath = path.join(
  __dirname,
  "../wsl/image",
  "edge-node-env.tar.gz"
);
const tempDir = path.join(__dirname, "temp");
const wslName = "edge-node-env";
const keyPairsFile = path.join(__dirname, "../wsl/data/.key_pairs");
const configFile = path.join(__dirname, "../config/app_config.json");
const app_config = JSON.parse(fs.readFileSync(configFile, "utf8"));
const faucet_endpoint = app_config.faucet_endpoint;
const blockchain = app_config.blockchain;
const environment = app_config.environment
const master_paranet = app_config.master_paranet
const app_name = app_config.app_name
const edge_node_publish_mode = app_config.edge_node_publish_mode

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function generateKeyPairs() {
  logMessage("Generating key pairs...");

  try {
    // Check if the key pairs file already exists
    if (fs.existsSync(keyPairsFile)) {
      logMessage(
        "Key pairs file already exists. Returning existing key pairs."
      );

      // Read and parse existing key pairs
      const fileContent = fs.readFileSync(keyPairsFile, "utf8");

      // Attempt to parse the JSON content
      let parsedKeys;
      try {
        parsedKeys = JSON.parse(fileContent);
      } catch (error) {
        logError(
          "Error parsing existing key pairs file. Returning empty key pairs.",
          error
        );
        return { keyPair1: null, keyPair2: null }; // Return null key pairs if parsing fails
      }

      // Check if parsedKeys has at least two key pairs
      if (!Array.isArray(parsedKeys) || parsedKeys.length < 2) {
        logMessage(
          "Key pairs file does not contain enough key pairs. Returning empty key pairs."
        );
        return { keyPair1: null, keyPair2: null }; // Return null key pairs if insufficient
      }

      return {
        keyPair1: {
          address: parsedKeys[0].public_key,
          privateKey: parsedKeys[0].private_key,
        },
        keyPair2: {
          address: parsedKeys[1].public_key,
          privateKey: parsedKeys[1].private_key,
        },
      };
    }

    // Generate new key pairs
    const keyPair1 = await ethers.Wallet.createRandom();
    const keyPair2 = await ethers.Wallet.createRandom();

    const keys = [
      {
        name: "Operational",
        public_key: keyPair1.address,
        private_key: keyPair1.privateKey,
      },
      {
        name: "Management",
        public_key: keyPair2.address,
        private_key: keyPair2.privateKey,
      },
    ];

    // Write to file, converting the keys array to a JSON string
    fs.writeFileSync(keyPairsFile, JSON.stringify(keys, null, 2));
    logMessage("Key pairs generated and saved.");

    return { keyPair1, keyPair2 };
  } catch (error) {
    logError("Failed to generate key pairs", error);
    throw error;
  }
}

// Check if WSL and Virtual Machine Platform are enabled
async function isFeatureEnabled(featureName) {
  try {
    logMessage(`Checking if feature ${featureName} is enabled...`);
    const output = await execSync(
      `dism.exe /online /get-featureinfo /featurename:${featureName}`,
      { encoding: "utf8" }
    );
    const isEnabled = output.includes("Enabled");
    logMessage(
      `Feature ${featureName} is ${isEnabled ? "enabled" : "not enabled"}.`
    );
    return isEnabled;
  } catch (error) {
    logError(`Error checking feature ${featureName}`, error);
    return false;
  }
}

// Enable WSL and Virtual Machine Platform if they are not already enabled
async function enableWSL() {
  try {
    if (!(await isFeatureEnabled("Microsoft-Windows-Subsystem-Linux"))) {
      logMessage("Enabling WSL...");
      execSync(
        "dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart",
        { stdio: "inherit" }
      );
      logMessage("WSL enabled.");
    } else {
      logMessage("WSL is already enabled.");
    }

    if (!(await isFeatureEnabled("VirtualMachinePlatform"))) {
      logMessage("Enabling Virtual Machine Platform...");
      execSync(
        "dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart",
        { stdio: "inherit" }
      );
      logMessage("Virtual Machine Platform enabled.");
    } else {
      logMessage("Virtual Machine Platform is already enabled.");
    }
  } catch (error) {
    logError("Failed to enable WSL or Virtual Machine Platform", error);
    throw error;
  }
}

// Check if WSL is installed, install if not
async function installWSL() {
  try {
    logMessage("Checking if WSL is installed...");
    execSync("wsl --list");
    logMessage("WSL is already installed.");
  } catch {
    logMessage("WSL not found. Installing WSL...");
    try {
      execSync("wsl --install", { stdio: "inherit", timeout: 120000 });
      logMessage("WSL installed successfully.");
    } catch (installError) {
      logError("WSL installation failed or timed out", installError);
      process.exit(1);
    }
  }
}

// Import WSL image with adjustments
async function importWSLImage() {
  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    logMessage("Extracting WSL image...");
    const tarCommand = `tar -xzf ${wslImagePath} -C ${tempDir}`;
    execSync(tarCommand, { stdio: "inherit" });
    logMessage("WSL image extracted successfully.");

    const importCommand = `wsl --import ${wslName} "${path.join(
      __dirname,
      "../wsl/instance"
    )}" "${path.join(tempDir, "edge-node-env.tar")}"`;
    logMessage("Importing WSL image...");

    execSync(importCommand, { stdio: "inherit" });
    logMessage("WSL image imported successfully.");

    // Start the WSL instance
    logMessage("Starting WSL instance...");
    execSync(`wsl -d ${wslName} --exec echo 'WSL instance started successfully.'`, {
      stdio: "inherit",
    });
  } catch (error) {
    logError("Failed to import or start WSL image", error);
    throw error;
  } finally {
    // Delete the temp directory
    try {
      fs.rmdirSync(tempDir, { recursive: true });
      logMessage("Temporary directory deleted successfully.");
    } catch (deleteError) {
      logError("Failed to delete temporary directory", deleteError);
    }
  }
}

// Execute WSL commands
async function runWSLCommand(command) {
  try {
    logMessage(`Executing WSL command: ${command}`);
    execSync(`wsl -d ${wslName} -e sh -c "${command}"`, { stdio: "inherit" });
    logMessage(`WSL command executed successfully: ${command}`);
  } catch (error) {
    logError(`Failed to execute WSL command: ${command}`, error);
    throw error;
  }
}

const handleSignMessage = async (nonce, privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const message = `Please sign nonce ${nonce} to authenticate account ownership.`;
    const signature = await wallet.signMessage(message);

    return signature;
  } catch (e) {
    console.error("Failed to sign message:", e);
    throw e;
  }
};

const fundWallet = async (keyPair1, application_id) => {
  try {
    logMessage(`Registering for faucet funding...`);
    const register_response = await axios.post(
      `${faucet_endpoint}/auth/register`,
      { account: keyPair1.address, application_id: application_id, blockchain: blockchain }
    );

    logMessage(`Signing message...`);
    const signedMessage = await handleSignMessage(
      register_response.data.user_record[0].nonce,
      keyPair1.privateKey
    );

    logMessage(`Authenticating wallet ownership...`);
    const signature_response = await axios.post(
      `${faucet_endpoint}/auth/sign`,
      { account: keyPair1.address, signature: signedMessage, application_id: application_id }
    );

    let faucet_token = signature_response.data.token;

    logMessage(`Sending funding request...`);
    await axios.post(
      `${faucet_endpoint}/faucet/fund-wallet`,
      {
        public_key: keyPair1.address,
        blockchain: blockchain,
        application_id: application_id,
      },
      {
        headers: {
          Authorization: faucet_token,
        },
      }
    );

    logMessage(`Wallet funded.`);
  } catch (e) {
    console.error("Failed to sign message:", e);
    throw e;
  }
};

async function updateUserWallet(keyPair1) {
  try {
    await queryDB(
      `UPDATE user_wallets SET wallet = ?, private_key = ?, blockchain = ? WHERE id = 1`,
      [keyPair1.address, keyPair1.privateKey, blockchain],
      'edge_node_auth_db'
    );
  } catch (error) {
    console.error("Error updating user wallet:", error.message);
  }
}

async function updateUserConfig(wsl_instance) {
  try {
    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "edge_node_paranet_ual" AND user_id = 1`,
      [master_paranet],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "edge_node_backend_endpoint" AND user_id = 1`,
      [`http://${wsl_instance}`],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "edge_node_environment" AND user_id = 1`,
      [environment],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "edge_node_name" AND user_id = 1`,
      [app_name],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "all_nodes_names" AND user_id = 1`,
      [app_name],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "blockchain" AND user_id = 1`,
      [blockchain],
      'edge_node_auth_db'
    );

    await queryDB(
      `UPDATE UserConfigs SET value = ? WHERE \`option\` = "edge_node_publish_mode" AND user_id = 1`,
      [edge_node_publish_mode],
      'edge_node_auth_db'
    );
  } catch (error) {
    console.error("Error updating user wallet:", error.message);
  }
}

// Main Setup
async function main() {
  try {
    await enableWSL();
    await installWSL();
    await importWSLImage();

    const wsl_instance = execSync("wsl hostname -I").toString().trim();
    const { keyPair1, keyPair2 } = await generateKeyPairs();
    const application_id = generateRandomString(20);

    app_config.application_id = application_id;
    app_config.mysql_host = wsl_instance;
    app_config.edge_node_endpoint = `http://${wsl_instance}`;
    fs.writeFileSync(configFile, JSON.stringify(app_config, null, 2));

    const deviceName = `${app_config.app_name}ID[${application_id}]`;
    const publicIp =
      Object.values(require("os").networkInterfaces())
        .flat()
        .find(
          (details) =>
            details.family === "IPv4" &&
            !details.internal &&
            details.address.startsWith("172.20.")
        )?.address || null;

    logMessage("Configuring ot-node...");
    await execSync(
      `wsl -d edge-node-env -e sh -c "cd /root/ot-node && jq '.assetSync.syncParanets += [\\"${app_config.master_paranet}\\"] | .auth.ipWhitelist += [\\"${publicIp}\\"] | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.rpcEndpoints[0] |= \\"${app_config.rpc}\\" | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.operationalWallets[0].address |= \\"${keyPair1.address}\\" | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.operationalWallets[0].privateKey |= \\"${keyPair1.privateKey}\\" | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.evmManagementWalletPublicKey |= \\"${keyPair2.address}\\" | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.sharesTokenName |= \\"${deviceName}\\" | .modules.blockchain.implementation[\\"${app_config.blockchain}\\"].config.sharesTokenSymbol |= \\"${deviceName}\\"' .origintrail_noderc > .origintrail_noderc.new && mv .origintrail_noderc.new .origintrail_noderc"`
    );

    logMessage("Installing ot-node...");
    await runWSLCommand(
      "cd /root/ot-node/current && npm install && npm ci --omit=dev --ignore-scripts"
    );

    logMessage("Installing edge-node-knowledge-mining...");
    await runWSLCommand(
      `cd /root/edge-node-knowledge-mining && . ~/.bashrc && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt`
    );

    logMessage("Installing edge-node-api...");
    await runWSLCommand(
      "cd /root/edge-node-api && npm install"
    );

    logMessage("Installing edge-node-drag...");
    await runWSLCommand("cd /root/edge-node-drag && npm install");

    logMessage("Installing edge-node-authentication-service...");
    await runWSLCommand(
      `cd /root/edge-node-authentication-service && npm install`
    );

    logMessage("Updating database for edge-node-authentication-service...");
    await updateUserWallet(keyPair1)
    await updateUserConfig(wsl_instance)

    await fundWallet(keyPair1, application_id);

    logMessage("Enabling services...");
    const services = [
      "otnode",
      "edge-node-knowledge-mining",
      "edge-node-api",
      "edge-node-drag",
      "edge-node-auth",
      "airflow-webserver",
      "airflow-scheduler",
    ];

    for (const service of services) {
      await runWSLCommand(`systemctl enable ${service}`);
      logMessage(`Service ${service} enabled successfully.`);
    }

    for (const service of services) {
      await runWSLCommand(`systemctl restart ${service}`);
      logMessage(`Service ${service} restarted successfully.`);
    }

    logMessage("Setup completed successfully.");
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
