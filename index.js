//Para la conexion con Mongo DB -> Ojo se marca error es porque se acabo el lab de 4 horas de Agustin
require('./conection') 
//
const express = require('express')
//var router = require("express").Router();

const http = require('http');
const path = require('path');
//app.use(express.json()); -> Si en caso vayan requerir usar JSON caso contrario borrarlo
const app = express()
const port = 3000
app.set('port', port);
app.use(express.static(__dirname));

// Vistas ejs dinamicas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//Para obtener el listado de datos en mongoDB
async function list(){
  const registros = await Register.find().select({ _id: 0 });
  return registros;
}

let httpServer = http.createServer(app);
httpServer.listen(port);

httpServer.on('listening', function () {
  let addr = httpServer.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
});

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/temperatura', (req, res) => {
  //registrosObtenidos  = await list();
  //let temperatura = [registrosObtenidos] //esta seria la data obtenida del mongo db
  //console.log(`data2 ${temperatura}`);
  //res.render('temperatura', {temperatura:temperatura})
  res.render("temperatura")
})

app.get('/presencia', (req, res) => {
  //let presencia = [] //esta seria la data obtenida del mongo db
  //res.render('presencia', {presencia:presencia})
  res.render("presencia")
})

/************************ SocketIO ***********/
const socketIO = require("socket.io");
const io = socketIO(httpServer);

io.on("connection", (socket) => {
  console.log("Nueva conexion");

});
io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

/********************* aws iot core connection *****************/
const aws = require('./utils/awsConnection');
const { mqtt } = require('aws-iot-device-sdk-v2');
const Register = require('./models/Register');

const connection = aws.getConnection();
const decoder = new TextDecoder('utf8');

connection.connect().then((result) => {
  if (result) console.log("** AWS iot core: resuming an existing session");
  else console.log("** AWS iot core: a new session is completed!");

  // SUSCRIBIRSE
  connection.subscribe("esp32/medicion", mqtt.QoS.AtLeastOnce, onMessageAws)

}).catch((err) => {
  console.error(err);
})

let onMessageAws = (topic, payload) => {

  payload = decoder.decode(payload);
  payload = JSON.parse(payload);

  switch (topic) {
    case "esp32/medicion":
      io.sockets.emit("var_temp", payload);
      //Aqui se guarda a DB
      var register = new Register({
        temperatura: payload.temperatura, 
        humedad: payload.humedad,
        timeStamp: payload.timestamp,
        presencia: payload.presencia,
      });
       //Para Guardar el valor dentro de MongoDB 
      register.save((err,document)=>{
        if(err) console.error(err);
        //console.log(document);
      });
      break;
    default:
      console.log("Topic invalido");
      break;
  }
}
/*****************Opcional!!**************************/
function getCurrentDate() {
  let receivedDate = new Date();
  receivedDate.setHours(receivedDate.getHours() - 5); //bajarlo a america lima
  // Eliminamos los milisegundos (es la escala de la soluci??n) y eliminamos el "T"
  let receivedDateUTC_5 = receivedDate.toISOString().slice(0, 19).replace('T', ' ');
  return receivedDateUTC_5;
}

app.get("/datitos",(req,res) =>{
  console.log("dentro del api")

  //Register.find().select({ _id: 0 })
  Register.find((err,val) => {
    if(err){
      console.log(err)
    }else{
      res.json(val)
    }

  })

});