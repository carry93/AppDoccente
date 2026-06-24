const { poolPromise } = require('./config/db');

async function checkDB() {
    try {
        const pool = await poolPromise;
        const grados = await pool.request().query('SELECT * FROM Grados');
        console.log('--- GRADOS ---');
        console.table(grados.recordset);

        const cursos = await pool.request().query('SELECT * FROM Cursos');
        console.log('\n--- CURSOS ---');
        console.table(cursos.recordset);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
