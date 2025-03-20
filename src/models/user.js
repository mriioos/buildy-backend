const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
        minlength : 8
    },
    validation_attempts : {
        type : Number,
        default : 3
    },
    validation_code : {
        type : String,
        default : () => Math.random().toString(16).substring(2, 8), // Genera un número aleatorio en base 16
        length : 6
    },
    validated : {
        type : Boolean,
        default : false
    },
    role : {
        type : String,
        default : 'user'
    },
    name : {
        type : String,
        required : false
    },
    lastname : {
        type : String,
        required : false
    },
    nif : {
        type : String,
        required : false
    },
    logo : {
        type : String,
        required : false
    },
    company : {
        type : Object,
        required : false,
        default : {}
    }
},
{
    timestamps : true,
    versionKey : false
});

module.exports = mongoose.model('User', userSchema);