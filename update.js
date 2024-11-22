const queryDB = require("./util/queryDB.js");
const bcrypt = require("bcrypt");

async function update() {
  // Await the bcrypt.hash to get the actual hashed password
  const pw = await bcrypt.hash('admin123', 10);

  await queryDB(
    `UPDATE Users SET username = ?, password = ? WHERE id = 1`,
    ['admin', pw],
    "edge_node_auth_db"
  );
}

update().catch(error => {
  console.error("Error in update function:", error);
});
