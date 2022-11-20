const mongoose = require('mongoose');
//Connection
const uri = 'mongodb://44.201.176.43:27017/TemasAvanzados';

mongoose.connect(uri,{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

mongoose.connection.on('open',_ => {
    console.log('Database is connected to'+uri);
});

mongoose.connection.on('error', err => {
    console.log(err);
});