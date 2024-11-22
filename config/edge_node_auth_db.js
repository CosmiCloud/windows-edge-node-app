const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "./app_config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const mysql = require('mysql2')

const pool = mysql.createPool({
    host: config.mysql_host,
    port: 3306,
    user: 'root',
    password: 'admin',
    database: 'edge-node-auth-service',
    waitForConnections: true,
    connectionLimit: 1000, // Adjust this based on your requirements
    queueLimit: 0
})

module.exports = pool;