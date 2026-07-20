const assert = require('assert');
const { ensureSchema } = require('../config/ensureSchema');

(async () => {
  try {
    await ensureSchema();
    console.log('schema-ok');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
})();
