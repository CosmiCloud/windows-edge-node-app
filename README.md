### Origintail Windows App Edge Node

An electronjs/React app shell with WSL hosted Origintrail Edge Node services.

## Dependencies

This app is required to be installed with the supplied faucet repo to ensure seamless node install experience.

- https://github.com/CosmiCloud/edge-node-faucet

## Installation

1. git clone repo
2. cd windws-edge-node-app
3. npm install
4. npm run build
5. cp -r example_app_config.json app_config.json
6. Edit app_config.json with desired info
7. npm install

# !Important!

After install you must change the log in credentials of your app's windows service to use your windwos credentials so it can communicate with the WSL instance. Restart the app afterwards.
