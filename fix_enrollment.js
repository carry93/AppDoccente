const { poolPromise, sql } = require('./config/db');

async function fixEnrollment() {
    try {
        const pool = await poolPromise;
        
        // Obtenemos todos los estudiantes que no tienen inscripciones en todos los cursos de su grado
        const estudiantesRes = await pool.request().query('SELECT * FROM Estudiantes');
        const estudiantes = estudiantesRes.recordset;

        let added = 0;
        for (const estudiante of estudiantes) {
            // Obtener cursos del grado
            const cursosRes = await pool.request()
                .input('id_grado', sql.Int, estudiante.id_grado)
                .query('SELECT id_curso FROM Cursos WHERE id_grado = @id_grado');
                
            for (const curso of cursosRes.recordset) {
                // Verificar si ya está inscrito
                const inscRes = await pool.request()
                    .input('id_est', sql.Int, estudiante.id_estudiante)
                    .input('id_cur', sql.Int, curso.id_curso)
                    .query('SELECT * FROM Inscripciones WHERE id_estudiante = @id_est AND id_curso = @id_cur');
                    
                if (inscRes.recordset.length === 0) {
                    await pool.request()
                        .input('id_est', sql.Int, estudiante.id_estudiante)
                        .input('id_cur', sql.Int, curso.id_curso)
                        .query('INSERT INTO Inscripciones (id_estudiante, id_curso) VALUES (@id_est, @id_cur)');
                    added++;
                }
            }
        }

        console.log(`Se añadieron ${added} inscripciones faltantes.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixEnrollment();
