const express = require('express');
const app = express();
const CORS = require('cors');
const http = require('http').Server(app)

const io = require('socket.io')(http, {
    cors: {
        origin: 'https://sockettypemessengerapp.herokuapp.com'
    }
});

io.use((socket, next) => {
    const username = socket.handshake.auth.userName;
    if (!username) {
      return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

app.use(CORS({
    origin: ['http://localhost:3000', 'https://sockettypemessengerapp.herokuapp.com'],
    credentials: true
}))

app.get('/', (req, res) => {
    res.send('success')
})

app.get('/clear', (req, res) => {
    loggedInUsers = []
    res.send(loggedInUsers)
})

io.on('connection', (socket) => {
    let loggedInUsers = [];

    for (let [id, socket] of io.of("/").sockets) {
        loggedInUsers.push({
            userID: id,
            username: socket.username,
            messages: [],
            unreadMessagesCount: 0
        });
    }
    io.emit('getActiveUsers', loggedInUsers)

    socket.broadcast.emit("user connected", {
        userID: socket.id,
        username: socket.username,
    });

    socket.on('userTyping', ({isTyping, to}) => {
        socket.to(to).emit("userTyping", {
            isTyping,
            from: socket.id
        })
    })
    

    socket.on('message', ({payload, to}) => {
        socket.to(to).emit("message", {
            payload,
            fromSelf: false,
            from: socket.id
        })
    })

    
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        const filteredUsers = loggedInUsers.filter(item => item.userID !== socket.id)

        loggedInUsers = filteredUsers;
        io.emit('getActiveUsers', loggedInUsers)
    });
})

http.listen(5000, () => console.log('listening on 3000'))
