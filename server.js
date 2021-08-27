const express = require('express');

const mysql = require('mysql') // เรียกใช้ mysql
const db = mysql.createConnection({   // config ค่าการเชื่อมต่อฐานข้อมูล
host     : 'localhost', 
user     : 'root',
password : 'docker',
database : 'tcds',
port:3307
})
db.connect() // เชื่อมต่อฐานข้อมูล

const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const sio = require('socket.io');
const favicon = require('serve-favicon');
const compression = require('compression');
const cors = require('cors');

const app = express(),


options = { 
  key: fs.readFileSync(__dirname + '/rtc-video-room-key.pem'),
  cert: fs.readFileSync(__dirname + '/rtc-video-room-cert.pem')
},
port = process.env.PORT || 3000,
server = process.env.NODE_ENV === 'production' ?
// http.createServer(app).listen(port) :
https.createServer(options, app).listen(port) : 
https.createServer(options, app).listen(port),
// io = sio(server);

io = sio(server, {
	cors: {
		// origin: "https://localhost:3000",
		origin: "https://edd5-203-150-115-16.ngrok.io",
		methods: [ "GET", "POST" ]
	}
})
app.use(cors());

// app.get('/visit',(req,res)=> {   // Router เวลาเรียกใช้งาน
//   let sql = 'SELECT * FROM opd_visit limit 10'  // คำสั่ง sql
//   let query = db.query(sql,(err,results) => { // สั่ง Query คำสั่ง sql
//   if(err) throw err  // ดัก error
//   console.log(results) // แสดงผล บน Console 
//   res.json(results)   // สร้างผลลัพธ์เป็น JSON ส่งออกไปบน Browser
//   })
//   })


// compress all requests
app.use(compression());
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => res.sendFile(__dirname + '/dist/index.html'));
app.use(favicon('./dist/favicon.ico'));
// Switch off the default 'X-Powered-By: Express' header
app.disable('x-powered-by');
io.sockets.on('connection', socket => {
  let room = '';
  // sending to all clients in the room (channel) except sender
  socket.on('message', message => socket.broadcast.to(room).emit('message', message));
  socket.on('find', () => {
    const url = socket.request.headers.referer.split('/');
    room = url[url.length - 1];
    const sr = io.sockets.adapter.rooms[room];
    if (sr === undefined) {
      // no room with such name is found so create it
      socket.join(room);
      socket.emit('create');
    } else if (sr.length === 1) {
      socket.emit('join');
    } else { // max two clients
      socket.emit('full', room);
    }

  

    let sql = "SELECT v.pcc_vn,v.vn,v.hn,concat(p.prefix,p.fname,' ',p.lname) as fullname,hv.div_id,concat(hv.doctor_prefix,hv.doctor_fname,' ',hv.doctor_lname) as doctor "+
              "FROM opd_visit v "+
              "LEFT JOIN his_patient p ON p.hn = v.hn "+
              "LEFT JOIN his_visit hv ON hv.hn = v.hn AND hv.vn = v.pcc_vn where v.vn = ? " ; // คำสั่ง sql
    let query = db.query(sql,[room],(err,results) => { // สั่ง Query คำสั่ง sql
    if(err) throw err  // ดัก error
    console.log(results) // แสดงผล บน Console 
    socket.emit('visit', results);

    // res.json(results)   // สร้างผลลัพธ์เป็น JSON ส่งออกไปบน Browser
    })
    // console.log(query)

  });
  socket.on('auth', data => {
    data.sid = socket.id;
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit('approve', data);
    // console.log(data)

   

  });
  socket.on('accept', id => {
    io.sockets.connected[id].join(room);
    // sending to all clients in 'game' room(channel), include sender
    io.in(room).emit('bridge');
  });
  socket.on('reject', () => socket.emit('full'));
  socket.on('leave', () => {
    // sending to all clients in the room (channel) except sender
    socket.broadcast.to(room).emit('hangup');
    socket.leave(room);});
});

