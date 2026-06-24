const { poolPromise, sql } = require('./config/db');

async function fixDB() {
    try {
        const pool = await poolPromise;
        
        // 1. Drop the constraint
        try {
            await pool.request().query('ALTER TABLE Notas DROP CONSTRAINT CHK_ItemsFijos');
            console.log("Constraint CHK_ItemsFijos dropped.");
        } catch (e) {
            console.log("Constraint might not exist or already dropped: ", e.message);
        }

        // 2. Insert the default items to all courses that don't have them
        const defaultItems = [
            'Examen Mensual',
            'Examen Bimestral',
            'Práctica',
            'Intervención Oral',
            'Conducta'
        ];

        const cursosRes = await pool.request().query('SELECT id_curso FROM Cursos');
        
        let inserted = 0;
        for (const c of cursosRes.recordset) {
            // Check existing items
            const itemsRes = await pool.request()
                .input('id', sql.Int, c.id_curso)
                .query('SELECT nombre_item FROM ItemsCurso WHERE id_curso = @id');
            const existing = itemsRes.recordset.map(i => i.nombre_item);
            
            for (const item of defaultItems) {
                if (!existing.includes(item)) {
                    await pool.request()
                        .input('id_curso', sql.Int, c.id_curso)
                        .input('item', sql.NVarChar, item)
                        .query('INSERT INTO ItemsCurso (id_curso, nombre_item) VALUES (@id_curso, @item)');
                    inserted++;
                }
            }
        }

        console.log(`Successfully added ${inserted} default items to courses.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixDB();
