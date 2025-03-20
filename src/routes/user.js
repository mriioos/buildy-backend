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

router.post('/', validators.postUser, controllers.postUser);

router.put('/validation', validators.putUserValidation, controllers.putUserValidation);

router.post('/login', validators.postUserLogin, controllers.postUserLogin);

router.patch('/', authMiddleware(), validators.patchUser, controllers.patchUser);

router.put('/company', authMiddleware(), validators.putUserCompany, controllers.putUserCompany);

router.put('/logo', authMiddleware(), upload.single('file'), validators.putUserLogo, controllers.putUserLogo);
module.exports = router;