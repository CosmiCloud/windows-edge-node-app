const path = require("path");
const log = require("electron-log");
const axios = require("axios");
const bcrypt = require("bcrypt");
const queryDB = require("../../util/queryDB.js");
const { execSync } = require("child_process");
const fs = require("fs");
const WebSocket = require("ws");

const dkg_node = require("./dkg/node.js");

// Configuration paths
const appConfig = path.join(__dirname, "../../config", "app_config.json");
const app_config = JSON.parse(fs.readFileSync(appConfig, "utf-8"));
const logPath = path.join(__dirname, "../../logs", `service.log`);
const wsl_instance = execSync("wsl hostname -I").toString().trim();

const port = app_config.app_service_port || 8080; // Use port from config or default to 8080

// Initialize the logger
log.transports.file.resolvePathFn = () => logPath;
log.transports.file.level = app_config.log_level || "info";
log.transports.file.format = "{h}:{i}:{s} {text}";

// Function to check DKG Info
async function checkDKGInfo(retryInterval = 5000) {
  while (true) {
    try {
      const dkg_node_info = await dkg_node.info();

      if (dkg_node_info) {
        log.info(`Connected to DKG: 
          Host: ${wsl_instance}
          DKG Version: ${JSON.stringify(dkg_node_info.version)}
        `);
        break;
      }
    } catch (error) {
      log.error(`Unable to establish connection to DKG: ${error.message}`);
      log.info(`Retrying in ${retryInterval / 1000} seconds...`);
    }

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }
}

// WebSocket server setup
const wss = new WebSocket.Server({ port: port });

wss.on("connection", (ws) => {
  log.info(`Client connected to ${app_config.app_name} service via WebSocket`);
  checkDKGInfo();

  // Handle incoming messages from the front end
  ws.on("message", async (message) => {
    log.info(`Received message from client...`);
    message = JSON.parse(message);

    switch (message.TYPE) {
      case "change-credentials":
        try {
          log.info("Changing Credentials...");

          let username = message.form.username;
          let password = await bcrypt.hash(message.form.password, 10);

          log.info("Updating password...");
          await queryDB(
            `UPDATE Users SET username = ?, password = ? WHERE id = 1`,
            [username, password],
            "edge_node_auth_db"
          );

          response = { success: true };
        } catch (error) {
          log.error("Credential change failed:", error.message);
          response = {
            error: "An error occured while changing your credentials.",
          };
        }
        break;
      case "log-in":
        log.info("Authenticating...");
        try {
          const loginUrl = new URL(`${app_config.edge_node_endpoint}`);
          loginUrl.port = 3001;
          loginUrl.pathname = "/login";

          response = await axios.post(loginUrl.toString(), message.form, {
            withCredentials: true,
          });

          const setCookieHeader = response.headers["set-cookie"];
          let sidCookieValue;

          if (setCookieHeader) {
            const sidCookie = setCookieHeader.find((cookie) =>
              cookie.startsWith("connect.sid")
            );
            if (sidCookie) {
              sidCookieValue = sidCookie.split(";")[0].split("=")[1];
            }
          }
          response = { ...response.data, cookie: sidCookieValue };
          log.info("Successfully authenticated!");
        } catch (error) {
          log.error("Authentication failed:", error.message);
          response = { error: "Authentication failed" };
        }
        break;
      case "auth-check":
        log.info("Checking Authentication...");
        try {
          const loginUrl = new URL(`${app_config.edge_node_endpoint}`);
          loginUrl.port = 3001;
          loginUrl.pathname = "/auth/check";

          response = await axios.get(loginUrl.toString());

          response = response.data;
          log.info("Successfully checked authentication!");
        } catch (error) {
          log.error("Authentication check failed:", error.message);
          response = { error: "Authentication check failed" };
        }
        break;
      default:
        log.info("Invalid message type.");
        response = { error: "Invalid message type" };
    }

    // Send the response back to the client
    log.info(`Sending response to client: ${JSON.stringify(response)}`);
    ws.send(JSON.stringify(response));
  });

  // Send a welcome message when a client connects
  ws.send(`Welcome to ${app_config.app_name} service!`);
});

log.info(`WebSocket server is running and listening on port ${port}`);
