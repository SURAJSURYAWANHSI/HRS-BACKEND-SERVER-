const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
    cors: {
        origin: '*', // Allow all origins for dev (Admin & Worker)
        methods: ['GET', 'POST']
    }
});

// Socket Events
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });

    // Job State Cache (Admin as source of truth)
    let globalJobs = [];

    // Job Sync Events
    socket.on('job:create', (jobData) => {
        console.log('New Job Created:', jobData.id);
        io.emit('job:new', jobData);
    });

    socket.on('job:update_status', (data) => {
        console.log(`Job Status Updated: ${data.jobId} -> ${data.status}`);
        io.emit('job:update', data);
    });

    // AUTO-SYNC: Admin pushes all jobs, Server caches and relays to Workers
    socket.on('job:sync_all_from_admin', (allJobs) => {
        console.log(`Received ${allJobs.length} jobs from Admin. Caching and syncing to Workers...`);
        globalJobs = allJobs; // Update cache
        io.emit('job:sync_all', allJobs); // Broadcast to all connected clients
    });

    // Worker requests sync (sends cached jobs to requester)
    socket.on('job:request_sync', () => {
        console.log(`Worker requested sync. Sending ${globalJobs.length} cached jobs.`);
        socket.emit('job:sync_all', globalJobs); // Send to requester only
    });

    // Chat / Messaging
    socket.on('message:send', (data) => {
        io.emit('message:receive', data);
    });

    // WEBRTC SIGNALING
    socket.on('call:offer', (data) => {
        // Broadcast to all (client logic will filter by receiverId)
        // Ideally we would emit to specific socket ID, but for this setup broadcast works
        socket.broadcast.emit('call:offer', data);
    });

    socket.on('call:answer', (data) => {
        socket.broadcast.emit('call:answer', data);
    });

    socket.on('call:ice-candidate', (data) => {
        socket.broadcast.emit('call:ice-candidate', data);
    });

    socket.on('call:end', (data) => {
        socket.broadcast.emit('call:end', data);
    });

    socket.on('call:busy', (data) => {
        socket.broadcast.emit('call:busy', data);
    });
});

const PORT = 5000;

// Sync Database and Start Server
sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`SERVER RUNNING ON PORT ${PORT}`);
    });
}).catch((err) => {
    console.log("Database connection failed:", err);
});
