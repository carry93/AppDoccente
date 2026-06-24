const { poolPromise } = require('./config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            await transaction.request().query(`
                CREATE TABLE WebAuthnCredentials (
                    id_credencial INT IDENTITY(1,1) PRIMARY KEY,
                    id_docente INT NOT NULL,
                    credentialID VARCHAR(255) NOT NULL,
                    publicKey VARCHAR(MAX) NOT NULL,
                    counter INT NOT NULL,
                    transports VARCHAR(255),
                    FOREIGN KEY (id_docente) REFERENCES Docentes(id_docente)
                )
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
