//Para la conexion con Mongo DB -> Ojo se marca error es porque se acabo el lab de 4 horas de Agustin
//require('./conection') -> antes de lanzar avisar a agustin
//
const express = require('express')
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
  let temperatura = [] //esta seria la data obtenida del mongo db
  res.render('temperatura', {temperatura:temperatura})
})

app.get('/presencia', (req, res) => {
  let presencia = [] //esta seria la data obtenida del mongo db
  res.render('presencia', {presencia:presencia})
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
const { mqtt } = require('aws-iot-device-sdk-v2')

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

  let currentDate = getCurrentDate();

  payload = decoder.decode(payload);
  payload = JSON.parse(payload);
  console.log("Received message:", topic, payload);

  switch (topic) {
    case "esp32/medicion":
      io.sockets.emit("var_temp", {
        valor: payload.temperatura,
        timestamp: currentDate
      });
      io.sockets.emit("var_hum", {
        valor: payload.humedad,
        timestamp: currentDate
      });
      break;
    /** 
    case "pres":
      io.sockets.emit("var_pres", {
        valor: payload.valor,
        timestamp: currentDate
      });
      break;
    **/
    default:
      console.log("Topic invalido");
      break;
  }
  //Para Guardar el valor dentro de MongoDB 
  /** 
  var register = new Register({
      temperatura: req.body.temperatura, -> cambiar req.body.temperatura por el valor de temperatura
      humedad: req.body.humedad, -> cambiar req.body.humedad por el valor de humedad
      timeStamp: Date.now() -> cambiar Date.now() por el valor de timeStamp que se vaya usar
  });
  register.save((err,document)=>{
      if(err) console.error(err);
      console.log(document);
  });
  **/
 //Para obtener el listado de datos en mongoDB
  /** 
  async function list(){
    const registros = await Register.find();
    console.log(registros)
    return registros;
  }
   **/
}

/*********************************************************/
function getCurrentDate() {
  let receivedDate = new Date();
  receivedDate.setHours(receivedDate.getHours() - 5); //bajarlo a america lima
  // Eliminamos los milisegundos (es la escala de la solución) y eliminamos el "T"
  let receivedDateUTC_5 = receivedDate.toISOString().slice(0, 19).replace('T', ' ');
  return receivedDateUTC_5;
}