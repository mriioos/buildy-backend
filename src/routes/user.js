const { Router } = require('express');
const multer = require('multer');
const upload = multer({ 
    storage : multer.memoryStorage(),
    limits : { fileSize : 2 * 1024 * 1024 } // 2MB max
});

const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

const validators = require('../validators/user');
const controllers = require('../controllers/user');

// Crear usuario
router.post('/', validators.postUser, controllers.postUser);

// Validar usuario
router.put('/validation', validators.putUserValidation, controllers.putUserValidation);

// Inciar sesión de un usuario
router.post('/login', validators.postUserLogin, controllers.postUserLogin);

// Modificar datos de un usuario
router.patch('/', authMiddleware(), validators.patchUser, controllers.patchUser);

// Modificar datos de la empresa de un usuario
router.put('/company', authMiddleware(), validators.putUserCompany, controllers.putUserCompany);

// Modificar logo de un usuario
router.put('/logo', authMiddleware(), upload.single('file'), validators.putUserLogo, controllers.putUserLogo);

// Recuperar los datos de un usuario
router.get('/', authMiddleware(), validators.getUser, controllers.getUser);

// Eliminar un usuario
router.delete('/', authMiddleware(), validators.deleteUser, controllers.deleteUser);

// Recuperar contraseña
router.post('/recovery', validators.postUserRecovery, controllers.postUserRecovery);

// Cambiar contraseña (Con el token que devuelve de validación)
router.put('/password', authMiddleware(), validators.putUserPassword, controllers.putUserPassword);

// Crear un guest de la expresa (trabajador)
router.post('/company/guest', authMiddleware(), validators.postUserCompanyGuest, controllers.postUserCompanyGuest);

module.exports = router;