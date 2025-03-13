const { Router } = require('express');

const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

const validators = require('../validators/user');
const controllers = require('../controllers/user');

router.post('/', validators.postUser, controllers.postUser);

router.put('/validation', validators.putUserValidation, controllers.putUserValidation);

router.post('/login', validators.postUserLogin, controllers.postUserLogin);

router.patch('/', authMiddleware(), validators.patchUser, controllers.patchUser);

module.exports = router;