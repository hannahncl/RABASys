const db = require("./config/db");

async function check() {
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM vehicle");
    console.log(JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
