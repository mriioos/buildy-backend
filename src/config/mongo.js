// Connect to MongoDB
const mongoose = require('mongoose')
const dbConnect = () => {

    console.log("Conectando. . .")

    const db_uri = process.env.MONGO_URI;
    mongoose.set('strictQuery', false);

    try{
        mongoose.connect(db_uri);
    }
    catch(error){
        console.err("Error conectando a MongoDB:", error);
    }

    //Listen events
    mongoose.connection.on("connected", () => console.log("Conectado a MongoDB"));
}

module.exports = dbConnect;