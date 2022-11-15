const express = require('express')
const http = require('http');
const path = require('path');

const app = express()

const port = 3000
app.set('port', port);

let httpServer = http.createServer(app);
httpServer.listen(port);

httpServer.on('listening', function () {
  let addr = httpServer.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
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
  connection.subscribe("temp", mqtt.QoS.AtLeastOnce, onMessageAws)
  connection.subscribe("pres", mqtt.QoS.AtLeastOnce, onMessageAws)

}).catch((err) => {
  console.error(err);
})

let onMessageAws = (topic, payload) => {

  let currentDate = getCurrentDate();

  payload = decoder.decode(payload);
  payload = JSON.parse(payload);
  console.log("Received message:", topic, payload);

  switch (topic) {
    case "temp":
      io.sockets.emit("var_temp", {
        valor: payload.valor,
        timestamp: currentDate
      });
      break;
    case "pres":
      io.sockets.emit("var_pres", {
        valor: payload.valor,
        timestamp: currentDate
      });
      break;

    default:
      console.log("Topic invalido");
      break;
  }
}

/*********************************************************/
function getCurrentDate() {
  let receivedDate = new Date();
  receivedDate.setHours(receivedDate.getHours() - 5); //bajarlo a america lima
  // Eliminamos los milisegundos (es la escala de la solución) y eliminamos el "T"
  let receivedDateUTC_5 = receivedDate.toISOString().slice(0, 19).replace('T', ' ');
  return receivedDateUTC_5;
}