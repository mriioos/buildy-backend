const { Router } = require('express');
const router = Router();

const validators = require('../validators/user');
const controllers = require('../controllers/user');

router.post('/', validators.postUser, controllers.postUser);

router.put('/validation', validators.putUserValidation, controllers.putUserValidation);

module.exports = router;