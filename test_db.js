const { poolPromise, sql } = require('./config/db');
async function run() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT definition FROM sys.check_constraints WHERE name = 'CHK_ItemsFijos'");
    console.log(res.recordset);
    process.exit(0);
}
run();
