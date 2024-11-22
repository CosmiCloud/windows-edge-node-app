const edge_node_auth_db = require("../config/edge_node_auth_db.js");

module.exports = executeQuery = async (query, params, db) => {
  return new Promise((resolve, reject) => {
    let pool;

    // Assign the correct pool based on db parameter
    switch (db) {
      case "edge_node_auth_db":
        pool = edge_node_auth_db;
        break;
      default:
        reject(new Error("Invalid database specified."));
        return;
    }

    if (!pool) {
      reject(new Error("Database pool is not defined."));
      return;
    }

    // Get a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err); // Handle connection error
        return;
      }

      // Perform the query using the connection
      connection.query(query, params, (error, results) => {
        // Release the connection back to the pool
        connection.release();

        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
};
