require('./config/mongo')();
const express = require('express');

// Import routers
const routes = require('./routes');

// App
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/user', routes.user);

app.get('/test', (req, res) => {
    res.send('Hello World!');
});

module.exports = app;