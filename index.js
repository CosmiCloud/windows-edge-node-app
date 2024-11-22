const { app, BrowserWindow, ipcMain } = require("electron");
const { execSync } = require("child_process");
const path = require("path");
const log = require("electron-log");
const fs = require("fs");
const WebSocket = require("ws");

const beginEdgeNodeInstall = require("./scripts/install-edge-node.js");
//const configureApp = require("./scripts/configure-app.js");
const installService = require("./scripts/install-service.js");

const keysPath = path.join(__dirname, "wsl/data", ".key_pairs");
const appConfigPath = path.join(__dirname, "config", "app_config.json");
const app_config = JSON.parse(fs.readFileSync(appConfigPath, "utf-8"));

const ws = new WebSocket(`ws://${app_config.app_service_host}:${app_config.app_service_port}`);

const logPath = path.join(__dirname, "logs", `${app_config.app_name}.log`);
log.transports.file.resolvePathFn = () => logPath; // Explicitly set the log path
log.transports.file.level =
  JSON.parse(fs.readFileSync(appConfigPath, "utf-8")).log_level || "info"; // Set the log level
log.transports.file.format = "{h}:{i}:{s} {text}"; // Set the log format

log.info(`Initializing ${app_config.app_name}...`);

async function installEdgeNode() {
  try {
    // Fetch the list of WSL distributions
    const wslListOutput = execSync("wsl -l -q", { encoding: "buffer" }); // Use buffer to handle encoding

    // Decode UTF-16 LE and normalize the output
    const decodedOutput = wslListOutput.toString("utf16le");
    const wslDistroList = decodedOutput
      .split("\n") // Split into lines
      .map((line) => line.replace(/\x00/g, "").trim()) // Remove null characters and trim spaces
      .filter(Boolean); // Remove empty lines

    // Debugging: Print the list of distributions
    console.log("WSL Distributions (normalized):", wslDistroList);

    // Check if 'edge-node-env' is in the list
    if (!wslDistroList.some((distro) => distro === "edge-node-env")) {
      console.log("WSL environment 'edge-node-env' not found. Configuring...");
      await beginEdgeNodeInstall();
    } else {
      console.log(
        "WSL environment 'edge-node-env' already exists. Skipping configuration."
      );
    }
  } catch (error) {
    console.error("Error checking WSL environment:", error);
    throw error;
  }
}

// Function to create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "public", "index.html"));

  // Optionally, open DevTools for debugging
  //mainWindow.webContents.openDevTools();

  log.info("Main window created");
}

// Initialize the application
app.whenReady().then(async () => {
  try {
    await installEdgeNode();
    await installService();
    //await configureApp();
    await createWindow();

    // Log when the app is ready
    log.info("App is ready");
  } catch (error) {
    log.error("Error during WSL configuration: ", error);
    // Still create the window in case of failure, so the app isn't blocked
    createWindow();
  }
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    log.info(`${app_config.app_name} window closed, quitting app.`);
    app.quit();
  }
});

// Re-create the window if the app is activated and no windows are open (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ws.on("open", () => {
  log.info(`Connected to ${app_config.app_name} service`);
});

ws.on("message", (data) => {
  log.info(`${data}`);
});

ws.on("error", (error) => {
  log.error(`WebSocket error: ${error.message}`);
});

ipcMain.handle("get-config", (event, configType) => {
  let filePath;
  switch (configType) {
    case "app":
      filePath = appConfigPath;
      break;
    case "keys":
      filePath = keysPath;
      break;
    default:
      throw new Error(`Unknown config type: ${configType}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
});

ipcMain.handle(`${app_config.app_name}-service`, async (event, message) => {
  try {
    log.info(`Sending message to ${app_config.app_name} service...`);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      log.info("Message sent successfully.");

      // Return a Promise that resolves when we get the WebSocket response
      return new Promise((resolve, reject) => {
        ws.onmessage = (response) => {
          log.info("Received response from WebSocket.");
          resolve(JSON.parse(response.data)); // Resolve with the parsed response data
        };

        // Optionally handle errors or connection issues
        ws.onerror = (error) => {
          log.error(`WebSocket error: ${error.message}`);
          reject({ error: error.message });
        };
      });
    } else {
      log.warn("WebSocket is not open. Unable to send the message.");
      throw new Error("WebSocket is not open");
    }
  } catch (error) {
    log.error(`Failed to communicate with ${app_config.app_name} service: ${error.message}`);
    return { error: error.message }; // Return the error message to the renderer process
  }
});
