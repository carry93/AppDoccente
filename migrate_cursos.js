const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Mover Notas de Inscription 2,3,7 a las inscripciones canónicas 5,6,4
            // Wait, student 1 has:
            // Insc 2 (Curso 2), Insc 5 (Curso 5) -> both Algebra
            // Insc 3 (Curso 3), Insc 6 (Curso 6) -> both Geometria
            // Insc 4 (Curso 4), Insc 7 (Curso null) -> Aritmetica
            // We want canonical courses: 2 (Algebra), 3 (Geometria), 4 (Aritmetica)
            
            // Move Notas from 5 -> 2
            await transaction.request().query(`UPDATE Notas SET id_inscripcion = 2 WHERE id_inscripcion = 5`);
            // Move Notas from 6 -> 3
            await transaction.request().query(`UPDATE Notas SET id_inscripcion = 3 WHERE id_inscripcion = 6`);
            // Move Notas from 7 -> 4
            await transaction.request().query(`UPDATE Notas SET id_inscripcion = 4 WHERE id_inscripcion = 7`);

            // 2. Delete duplicate inscriptions
            await transaction.request().query(`DELETE FROM Inscripciones WHERE id_inscripcion IN (5, 6, 7)`);

            // 3. Delete duplicate courses
            await transaction.request().query(`DELETE FROM Cursos WHERE id_curso IN (5, 6, 7)`);

            // 4. Add id_grado to Cursos
            await transaction.request().query(`ALTER TABLE Cursos ADD id_grado INT NULL`);
            
            // 5. Update existing courses to id_grado = 1 (5to Secundaria)
            await transaction.request().query(`UPDATE Cursos SET id_grado = 1`);
            
            // 6. Make id_grado NOT NULL
            await transaction.request().query(`ALTER TABLE Cursos ALTER COLUMN id_grado INT NOT NULL`);

            // 7. Add Foreign Key
            await transaction.request().query(`
                ALTER TABLE Cursos 
                ADD CONSTRAINT FK_Cursos_Grados FOREIGN KEY (id_grado) REFERENCES Grados(id_grado)
            `);

            // 8. Add Unique Constraint
            await transaction.request().query(`
                ALTER TABLE Cursos
                ADD CONSTRAINT UQ_Curso_Grado UNIQUE (id_grado, nombre_curso)
            `);

            await transaction.commit();
            console.log('Migración completada con éxito.');
        } catch (err) {
            await transaction.rollback();
            console.error('Error en la transacción, se hizo rollback:', err);
            throw err;
        }
        process.exit(0);
    } catch (err) {
        console.error('Error de conexión:', err);
        process.exit(1);
    }
}

migrate();
