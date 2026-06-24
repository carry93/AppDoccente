const { poolPromise, sql } = require('./config/db');

async function setupDB() {
    try {
        const pool = await poolPromise;
        
        console.log("Creando tabla Asistencias...");
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Asistencias' and xtype='U')
            CREATE TABLE Asistencias (
                id_asistencia INT IDENTITY(1,1) PRIMARY KEY,
                id_inscripcion INT NOT NULL,
                fecha_registro DATE NOT NULL,
                estado_asistencia NVARCHAR(20) NOT NULL CHECK (estado_asistencia IN ('Presente', 'Tarde', 'Faltó')),
                FOREIGN KEY (id_inscripcion) REFERENCES Inscripciones(id_inscripcion),
                CONSTRAINT UQ_Asistencia_Diaria UNIQUE (id_inscripcion, fecha_registro)
            )
        `);

        console.log("Tabla Asistencias creada o ya existía.");
        process.exit(0);
    } catch (err) {
        console.error("Error al crear la base de datos de Asistencia: ", err);
        process.exit(1);
    }
}
setupDB();
