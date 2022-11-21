const { Schema, model} = require('mongoose');
const registerSchema = new Schema({
temperatura: Number,
humedad: Number,
timeStamp: String,
presencia: Boolean,
})
module.exports = model('Register',registerSchema);