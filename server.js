const express = require('express');

require('dotenv').config()

const http = require('http')

const app = express();

const cors = require('cors');

const socketio = require('socket.io');
const router = require('./router/router');

const { addUser, removeUser, getUser, getUserInRoom } = require('./users')




app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }))





const server = http.createServer(app)


const io = socketio(server);

io.on('connection', (socket) => {

    socket.on('join', ({ name, room }, cb) => {
        const { error, user } = addUser({ id: socket.id, name, room });
        // console.log(user);
        if (error) return cb(error);



        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}` });

        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` })

        socket.join(user.room);


        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) })

        cb()

    });

    socket.on('sendMessage', (message, cb) => {
        const user = getUser(socket.id);


        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) });


        cb()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
        }
    })
})


app.use(router)



const PORT = process.env.PORT || 3000;


server.listen(PORT, () => {
    console.log(`server runs on port: ${PORT}😃`);
})