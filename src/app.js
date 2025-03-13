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

app.use((req, res, next, err) => {
    console.error(err.stack);
    res.status(500).json({ errors : ['Unknown error'] });
});

module.exports = app;