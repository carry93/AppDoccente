const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            // 1. Create ItemsCurso table
            await transaction.request().query(`
                CREATE TABLE ItemsCurso (
                    id_item INT IDENTITY(1,1) PRIMARY KEY,
                    id_curso INT NOT NULL,
                    nombre_item NVARCHAR(100) NOT NULL,
                    CONSTRAINT FK_ItemsCurso_Cursos FOREIGN KEY (id_curso) REFERENCES Cursos(id_curso) ON DELETE CASCADE,
                    CONSTRAINT UQ_Item_Curso UNIQUE (id_curso, nombre_item)
                )
            `);

            // 2. Insert default items for all existing courses
            // 'Examen Mensual', 'Examen Bimestral', 'Práctica', 'Intervención Oral', 'Conducta'
            await transaction.request().query(`
                INSERT INTO ItemsCurso (id_curso, nombre_item)
                SELECT id_curso, item
                FROM Cursos
                CROSS JOIN (
                    VALUES 
                        ('Examen Mensual'), 
                        ('Examen Bimestral'), 
                        ('Práctica'), 
                        ('Intervención Oral'), 
                        ('Conducta')
                ) AS DefaultItems(item)
            `);

            await transaction.commit();
            console.log('Migración de ItemsCurso completada con éxito.');
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
