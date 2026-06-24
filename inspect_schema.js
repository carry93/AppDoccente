const { poolPromise } = require('./config/db');

async function checkSchema() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME IN ('Docentes', 'Grados', 'Cursos', 'Estudiantes', 'Inscripciones', 'Notas', 'ItemsCurso')
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
