const { poolPromise, sql } = require('./config/db');

async function seed() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            const req = transaction.request();
            
            const gradosRes = await req.query('SELECT * FROM Grados');
            const grados = gradosRes.recordset;
            
            const baseCursos = ['Álgebra', 'Geometría', 'Trigonometría', 'Aritmética'];
            
            const id_docente = 1;

            // 1. Verify and insert courses
            for (const grado of grados) {
                // Fetch existing courses for this grade
                const cursosRes = await transaction.request()
                    .input('id_grado', sql.Int, grado.id_grado)
                    .query('SELECT nombre_curso FROM Cursos WHERE id_grado = @id_grado');
                
                const existingCursos = cursosRes.recordset.map(c => c.nombre_curso.toLowerCase());
                
                for (const curso of baseCursos) {
                    if (!existingCursos.includes(curso.toLowerCase()) && !existingCursos.includes(curso.toLowerCase().replace('í','i').replace('á','a'))) {
                        await transaction.request()
                            .input('nombre_curso', sql.NVarChar, curso)
                            .input('id_docente', sql.Int, id_docente)
                            .input('id_grado', sql.Int, grado.id_grado)
                            .query('INSERT INTO Cursos (nombre_curso, id_docente, id_grado) VALUES (@nombre_curso, @id_docente, @id_grado)');
                    }
                }
            }

            // 2. Insert 5 students per grade
            const baseEstudiantes = [
                { nombre: 'Ana', apellido: 'García', seccion: 'A' },
                { nombre: 'Carlos', apellido: 'López', seccion: 'A' },
                { nombre: 'María', apellido: 'Martínez', seccion: 'A' },
                { nombre: 'Jorge', apellido: 'Pérez', seccion: 'A' },
                { nombre: 'Lucía', apellido: 'Rodríguez', seccion: 'A' }
            ];

            for (const grado of grados) {
                // Check current count
                const countRes = await transaction.request()
                    .input('id_grado', sql.Int, grado.id_grado)
                    .query("SELECT COUNT(*) as cnt FROM Estudiantes WHERE id_grado = @id_grado AND seccion = 'A'");
                    
                const count = countRes.recordset[0].cnt;
                
                if (count < 5) {
                    for (let i = count; i < 5; i++) {
                        const student = baseEstudiantes[i];
                        await transaction.request()
                            .input('apellido', sql.NVarChar, student.apellido + '_' + grado.id_grado) // Append grade to avoid identical names across grades
                            .input('nombre', sql.NVarChar, student.nombre)
                            .input('seccion', sql.NVarChar, student.seccion)
                            .input('id_grado', sql.Int, grado.id_grado)
                            .query('INSERT INTO Estudiantes (apellido, nombre, seccion, id_grado) VALUES (@apellido, @nombre, @seccion, @id_grado)');
                    }
                }
            }

            await transaction.commit();
            console.log('Seeding completado con éxito.');
        } catch (err) {
            await transaction.rollback();
            console.error('Rollback ejecutado por error:', err);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error de conexión:', err);
        process.exit(1);
    }
}

seed();
