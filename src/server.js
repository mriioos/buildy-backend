const app = require('./app');

app.listen(parseInt(process.env.PORT), () => {
    console.log(`Server running at ${process.env.DOMAIN} - Local port: ${process.env.PORT}`);
});