const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models/index.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
    cors: {
        origin: '*', // Allow all origins for dev
        methods: ['GET', 'POST']
    }
});

// -- PERSISTENCE LAYER --
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'jobs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
        console.error("Failed to create data directory:", e);
    }
}

const loadJobs = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(raw);
            console.log(`[Persistence] Loaded ${data.length} jobs from disk.`);
            return data;
        }
    } catch (err) {
        console.error("[Persistence] Error loading jobs:", err);
    }
    console.log("[Persistence] No existing data found. Starting empty.");
    return [];
};

const saveJobs = (jobs) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
        console.log(`[Persistence] Saved ${jobs.length} jobs to disk.`);
    } catch (err) {
        console.error("[Persistence] Error saving jobs:", err);
    }
};

// GLOBAL STATE (Source of Truth)
// Defined in outer scope to be shared across all connections
let globalJobs = loadJobs();

// -- SOCKET EVENTS --
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join Rooms
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });

    // -- JOB MANAGEMENT --

    // Create
    socket.on('job:create', (jobData) => {
        console.log('New Job Created:', jobData.id);
        globalJobs.push(jobData);
        saveJobs(globalJobs);
        io.emit('job:new', jobData);
    });

    // Update
    socket.on('job:update_status', (data) => {
        console.log(`Job Status Updated: ${data.jobId} -> ${data.status}`);

        // Update Server Cache
        let found = false;
        globalJobs = globalJobs.map(job => {
            if (job.id === data.jobId) {
                found = true;
                return { ...job, ...data.updates };
            }
            return job;
        });

        if (found) {
            saveJobs(globalJobs);
            io.emit('job:update', data);
        } else {
            console.warn(`Job ${data.jobId} not found in cache for update.`);
        }
    });

    // Full Sync (Admin Push)
    socket.on('job:sync_all_from_admin', (allJobs) => {
        console.log(`Received ${allJobs.length} jobs from Admin. Updating Server Cache...`);
        globalJobs = allJobs;
        saveJobs(globalJobs);
        io.emit('job:sync_all', allJobs);
    });

    // Request Sync (Worker Pull)
    socket.on('job:request_sync', () => {
        console.log(`Worker requested sync. Sending ${globalJobs.length} cached jobs.`);
        socket.emit('job:sync_all', globalJobs);
    });

    // -- COMMUNICATION --

    // Chat
    socket.on('message:send', (data) => {
        io.emit('message:receive', data);
    });

    // WebRTC Signaling (Call Features)
    socket.on('call:offer', (data) => socket.broadcast.emit('call:offer', data));
    socket.on('call:answer', (data) => socket.broadcast.emit('call:answer', data));
    socket.on('call:ice-candidate', (data) => socket.broadcast.emit('call:ice-candidate', data));
    socket.on('call:end', (data) => socket.broadcast.emit('call:end', data));

    // File/Design Requests
    socket.on('job:request_upload', (data) => socket.broadcast.emit('job:request_upload', data));
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
