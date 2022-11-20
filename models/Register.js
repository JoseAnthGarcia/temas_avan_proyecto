const { Schema, model} = require('mongoose');
const registerSchema = new Schema({
temperatura: Number,
humedad: Number,
timeStamp: Date
})
module.exports = model('Register',registerSchema);