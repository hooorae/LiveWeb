// We need the file system here
var fs = require('fs');

// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static('public'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
    res.send('Hello World!')
});

// Here is the actual HTTP server 
// In this case, HTTPS (secure) server
var https = require('https');

// Security options - key and certificate
var options = {
    key: fs.readFileSync('star_itp_io.key'),
    cert: fs.readFileSync('star_itp_io.pem')
};

// We pass in the Express object and the options object
var httpServer = https.createServer(options, app);

// Default HTTPS port
httpServer.listen(443);

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);
var volumes = [];

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
    // We are given a websocket object in our function
    function (socket) {

        console.log("new client connected. ID: " + socket.id);
        volumes.push({
            id: socket.id,
            volume: 0.5
        })

        socket.on('askVolume', handleAskVolume);
        socket.on('updateVolume', handleUpdateVolume);
        socket.on('disconnect', handleDisconnect);

        function handleAskVolume() {
            console.log('client asking volume');
            socket.emit('volumes', volumes);
        };

        function handleUpdateVolume(clientMsg) {
            console.log('client updating volume');
            let clientID = clientMsg.id;
            let clientVolume = clientMsg.volume;

            volumes.forEach((v) => {
                if (v.id == clientID) {
                    v.volume = clientVolume;
                }
            })
            socket.emit('volumes', volumes);
        };

        function handleDisconnect(r) {
            console.log('client disconnected');
            if (r == "transport close") {
                volumes.forEach((v) => {
                    if (v.id == socket.id) {
                        volumes.splice(volumes.indexOf(v), 1);
                    }
                })
            }
        }

    }
);