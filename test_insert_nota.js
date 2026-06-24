const { poolPromise, sql } = require('./config/db');

async function testInsert() {
    try {
        const pool = await poolPromise;
        
        // Find a valid inscripcion
        const inscRes = await pool.request().query('SELECT TOP 1 * FROM Inscripciones');
        if (inscRes.recordset.length === 0) {
            console.log("No inscripciones found");
            process.exit(1);
        }
        const id_inscripcion = inscRes.recordset[0].id_inscripcion;
        
        // Ensure there is an item for this curso
        await pool.request()
            .input('id_curso', sql.Int, inscRes.recordset[0].id_curso)
            .query("INSERT INTO ItemsCurso (id_curso, nombre_item) VALUES (@id_curso, 'Test Item')");

        console.log(`Inserting nota for id_inscripcion: ${id_inscripcion}`);

        await pool.request()
            .input('id_ins', sql.Int, id_inscripcion)
            .input('item', sql.NVarChar, 'Test Item')
            .input('nota_n', sql.Int, 15)
            .input('nota_l', sql.NVarChar, 'A')
            .input('comment', sql.NVarChar, 'Test comment')
            .query(`
                INSERT INTO Notas (id_inscripcion, item_nombre, nota_num, nota_letra, comentario, fecha_registro)
                VALUES (@id_ins, @item, @nota_n, @nota_l, @comment, GETDATE())
            `);
            
        console.log("Insert successful!");
        process.exit(0);
    } catch (err) {
        console.error("Error inserting:", err);
        process.exit(1);
    }
}

testInsert();
