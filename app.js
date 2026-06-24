// app.js
// 1. IMPORTACIÓN DE LIBRERÍAS
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Importamos controladores y middlewares propios
const authController = require('./controllers/authController');
const cursoController = require('./controllers/cursoController');
const adminController = require('./controllers/adminController');
const webauthnController = require('./controllers/webauthnController');
const IsAuthenticated = require('./middlewares/authMiddleware');
const globalErrorHandler = require('./middlewares/errorHandler');

// 2. CONFIGURACIÓN INICIAL
dotenv.config();
const app = express();

// 3. CONFIGURACIÓN DEL MOTOR DE VISTAS (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. MIDDLEWARES DE PROPÓSITO GENERAL
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_temporal_sistema_docente', 
    resave: false,
    saveUninitialized: false, // Cambiado a false para optimizar sesiones
    cookie: { secure: false } // secure: true en entornos HTTPS
}));

// Middleware global para vistas
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.usuario = req.session.user;
        res.locals.colegio_actual = req.session.user.colegio_actual;
        res.locals.colegios = req.session.user.colegios;
    }
    next();
});

// 5. RUTAS DE LA APLICACIÓN

// Redirección principal: de "/" a "/login"
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rutas Públicas (Autenticación)
app.get('/login', authController.showLogin);
app.post('/login', authController.login);
app.get('/logout', authController.logout);

// Rutas de WebAuthn (Login)
app.post('/auth/login-challenge', webauthnController.generateLogin);
app.post('/auth/login-verify', webauthnController.verifyLogin);

// Rutas Protegidas (Solo docentes logueados)
// Rutas de WebAuthn (Registro)
app.get('/auth/register-challenge', IsAuthenticated, webauthnController.generateRegistration);
app.post('/auth/register-verify', IsAuthenticated, webauthnController.verifyRegistration);

app.get('/home', IsAuthenticated, authController.showHome);
app.post('/cambiar-colegio', IsAuthenticated, authController.cambiarColegio);
app.get('/grados', IsAuthenticated, cursoController.getGrados);
app.get('/estudiantes', IsAuthenticated, cursoController.getEstudiantesPorGrado);
app.get('/evaluar/:id_estudiante', IsAuthenticated, cursoController.getFichaEvaluacion);
app.post('/evaluar/:id_estudiante/guardar', IsAuthenticated, cursoController.guardarNota);

// Rutas del Panel de Administración
app.get('/admin', IsAuthenticated, adminController.getDashboard);

app.get('/admin/grados', IsAuthenticated, adminController.getGrados);
app.post('/admin/grados', IsAuthenticated, adminController.createGrado);
app.post('/admin/grados/:id_grado/edit', IsAuthenticated, adminController.updateGrado);
app.post('/admin/grados/:id_grado/delete', IsAuthenticated, adminController.deleteGrado);

// Gestión de Sedes (Colegios)
app.get('/admin/sedes', IsAuthenticated, adminController.getColegios);
app.post('/admin/sedes/create', IsAuthenticated, adminController.createColegio);
app.post('/admin/sedes/update/:id_colegio', IsAuthenticated, adminController.updateColegio);
app.post('/admin/sedes/delete/:id_colegio', IsAuthenticated, adminController.deleteColegio);

app.get('/admin/estudiantes', IsAuthenticated, adminController.getEstudiantes);
app.get('/admin/estudiantes/plantilla', IsAuthenticated, adminController.downloadPlantillaEstudiantes);
app.post('/admin/estudiantes/upload', IsAuthenticated, upload.single('archivo_excel'), adminController.uploadEstudiantesExcel);
app.post('/admin/estudiantes', IsAuthenticated, adminController.createEstudiante);
app.post('/admin/estudiantes/:id_estudiante/edit', IsAuthenticated, adminController.updateEstudiante);
app.post('/admin/estudiantes/:id_estudiante/delete', IsAuthenticated, adminController.deleteEstudiante);

app.get('/admin/cursos', IsAuthenticated, adminController.getCursos);
app.post('/admin/cursos', IsAuthenticated, adminController.createCurso);
app.post('/admin/cursos/:id_curso/edit', IsAuthenticated, adminController.updateCurso);
app.post('/admin/cursos/:id_curso/delete', IsAuthenticated, adminController.deleteCurso);
app.get('/admin/cursos/:id_curso/items', IsAuthenticated, adminController.getCursoItems);
app.post('/admin/cursos/:id_curso/items', IsAuthenticated, adminController.addCursoItem);
app.post('/admin/cursos/:id_curso/items/:id_item/delete', IsAuthenticated, adminController.deleteCursoItem);

// Asistencia
app.get('/admin/cursos/:id_curso/asistencia', IsAuthenticated, adminController.getAsistencia);
app.post('/admin/cursos/:id_curso/asistencia', IsAuthenticated, adminController.saveAsistencia);

app.get('/admin/export/:entity/excel', IsAuthenticated, adminController.exportExcel);
app.get('/admin/export/:entity/pdf', IsAuthenticated, adminController.exportPdf);
app.get('/admin/export/calificaciones', IsAuthenticated, adminController.exportCalificaciones);
app.get('/admin/export/asistencia', IsAuthenticated, adminController.exportAsistencia);

// 6. MANEJO DE ERRORES (¡Siempre al final!)
app.use(globalErrorHandler);

// 7. ARRANQUE DEL SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\x1b[32m¡Éxito! Servidor de EduPortal corriendo en http://localhost:${PORT}\x1b[0m`);
});