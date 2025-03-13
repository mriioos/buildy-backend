const fs = require('fs');
const path = require('path');


fs.readdirSync(__dirname).forEach(file => {
    if (file !== 'index.js' && file.endsWith('.js')) {
        const modulePath = path.join(__dirname, file);
        module.exports[file.slice(0, -3)] = require(modulePath);
    }
});