const { poolPromise, sql } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            const req = transaction.request();

            console.log("Creando tabla Colegios...");
            await req.query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Colegios' and xtype='U')
                CREATE TABLE Colegios (
                    id_colegio INT IDENTITY(1,1) PRIMARY KEY,
                    nombre_colegio NVARCHAR(200) NOT NULL,
                    direccion NVARCHAR(200)
                )
            `);

            console.log("Creando tabla Docentes_Colegios...");
            await req.query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Docentes_Colegios' and xtype='U')
                CREATE TABLE Docentes_Colegios (
                    id_docente INT NOT NULL,
                    id_colegio INT NOT NULL,
                    PRIMARY KEY (id_docente, id_colegio),
                    FOREIGN KEY (id_docente) REFERENCES Docentes(id_docente),
                    FOREIGN KEY (id_colegio) REFERENCES Colegios(id_colegio)
                )
            `);

            console.log("Añadiendo id_colegio a tablas existentes...");
            const tables = ['Grados', 'Cursos', 'Estudiantes'];
            for (const table of tables) {
                // Check if column exists
                const colCheck = await req.query(`
                    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = 'id_colegio'
                `);
                
                if (colCheck.recordset.length === 0) {
                    await req.query(`ALTER TABLE ${table} ADD id_colegio INT NULL`);
                }
            }

            console.log("Insertando Sede Principal y Secundaria...");
            // Check if Sede Principal exists
            const sedeCheck = await req.query("SELECT id_colegio FROM Colegios WHERE nombre_colegio = 'Sede Principal'");
            let id_sede_principal;
            
            if (sedeCheck.recordset.length === 0) {
                const insertRes = await req.query("INSERT INTO Colegios (nombre_colegio) OUTPUT inserted.id_colegio VALUES ('Sede Principal')");
                id_sede_principal = insertRes.recordset[0].id_colegio;
                
                // Also create a secondary for testing
                await req.query("INSERT INTO Colegios (nombre_colegio) VALUES ('Sede Norte')");
            } else {
                id_sede_principal = sedeCheck.recordset[0].id_colegio;
            }

            console.log("Asignando Docente 1 a los colegios...");
            // Asignar docente ID 1 a ambos colegios
            await req.query(`
                IF NOT EXISTS (SELECT * FROM Docentes_Colegios WHERE id_docente = 1 AND id_colegio = ${id_sede_principal})
                INSERT INTO Docentes_Colegios (id_docente, id_colegio) VALUES (1, ${id_sede_principal})
            `);
            
            const sedeNorteCheck = await req.query("SELECT id_colegio FROM Colegios WHERE nombre_colegio = 'Sede Norte'");
            if (sedeNorteCheck.recordset.length > 0) {
                const id_norte = sedeNorteCheck.recordset[0].id_colegio;
                await req.query(`
                    IF NOT EXISTS (SELECT * FROM Docentes_Colegios WHERE id_docente = 1 AND id_colegio = ${id_norte})
                    INSERT INTO Docentes_Colegios (id_docente, id_colegio) VALUES (1, ${id_norte})
                `);
            }

            console.log("Asignando registros existentes a la Sede Principal...");
            for (const table of tables) {
                await req.query(`UPDATE ${table} SET id_colegio = ${id_sede_principal} WHERE id_colegio IS NULL`);
                // Hacer la columna NOT NULL y agregar FK (esto puede requerir separar ALTER COLUMN)
                await req.query(`ALTER TABLE ${table} ALTER COLUMN id_colegio INT NOT NULL`);
                
                // Add foreign key if it doesn't exist
                const fkCheck = await req.query(`
                    SELECT * FROM sys.foreign_keys 
                    WHERE name = 'FK_${table}_Colegio'
                `);
                
                if (fkCheck.recordset.length === 0) {
                    await req.query(`
                        ALTER TABLE ${table} 
                        ADD CONSTRAINT FK_${table}_Colegio 
                        FOREIGN KEY (id_colegio) REFERENCES Colegios(id_colegio)
                    `);
                }
            }

            await transaction.commit();
            console.log("Migración Multi-Colegio completada con éxito.");
        } catch (err) {
            await transaction.rollback();
            console.error("Error en transacción, haciendo rollback: ", err);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error de conexión:", err);
        process.exit(1);
    }
}

migrate();
