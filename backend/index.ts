import express, { Request, Response, NextFunction } from 'express';
import homeRouter from './routers';
import path from 'path';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { sessionData, requiredLoginAllSites, loginRequest } from './middleware/auth';
import { logger } from './middleware/logger'

require('dotenv').config({path: './backend/database/config.env'})
const app = express();
const server = createServer(app);
const io = new Server(server);


app.use(logger)
app.use(sessionData)
// app.use(requiredLoginAllSites);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.set('views', path.join(__dirname, 'views')).set('view engine', 'ejs');

io.on('connection', (socket) => {
  socket.broadcast.emit('hi');
});

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});



app.use('/', homeRouter);


server.listen(process.env.PORT_ENV || 8000, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT_ENV || 8000}`);
});
