const { validationResult } = require('express-validator'); // No se por qué no funciona con import

module.exports = validateResults = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ errors : errors.array() });
        return;
    }

    next();
}