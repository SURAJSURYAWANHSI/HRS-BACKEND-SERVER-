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
    // -- SMART CACHING & SYNC --

    socket.on('job:create', (jobData) => {
        console.log('New Job Created:', jobData.id);

        // Add to cache
        if (!globalJobs.some(j => j.id === jobData.id)) {
            globalJobs.push(jobData);
        }

        io.emit('job:new', jobData);
    });

    socket.on('job:update_status', (data) => {
        console.log(`Job Status Updated: ${data.jobId} -> ${data.status}`);

        const { jobId, updates } = data;

        // Update Cache Immediately (Critical for Worker-initiated updates)
        const jobIndex = globalJobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1) {
            globalJobs[jobIndex] = { ...globalJobs[jobIndex], ...updates, lastUpdated: Date.now() };
            console.log(`[Cache] Updated job ${jobId} in memory.`);
        } else {
            console.warn(`[Cache] Job ${jobId} not found in memory, could not update cache.`);
        }

        io.emit('job:update', data);
    });

    // AUTO-SYNC: Admin pushes jobs. Server performs SMART MERGE.
    socket.on('job:sync_all_from_admin', (adminJobs) => {
        console.log(`Received ${adminJobs.length} jobs from Admin.`);

        if (globalJobs.length === 0) {
            console.log('Server cache empty. Accepting Admin state as truth.');
            globalJobs = adminJobs;
        } else {
            console.log('Performing Smart Merge (Server vs Admin)...');
            const mergedJobs = [...adminJobs];

            // Check for server-side updates that are newer than Admin (e.g. Worker updates while Admin was offline)
            globalJobs.forEach(serverJob => {
                const adminJobIndex = mergedJobs.findIndex(j => j.id === serverJob.id);

                if (adminJobIndex === -1) {
                    // Job exists on Server but not Admin? Keep it (safe side)
                    mergedJobs.push(serverJob);
                } else {
                    const adminJob = mergedJobs[adminJobIndex];
                    // If Server has newer data, OVERWRITE Admin's stale data
                    if ((serverJob.lastUpdated || 0) > (adminJob.lastUpdated || 0)) {
                        console.log(`[Merge] Preserving newer Server state for Job ${serverJob.codeNo}`);
                        mergedJobs[adminJobIndex] = serverJob;
                    }
                }
            });
            globalJobs = mergedJobs;
        }

        console.log(`Syncing ${globalJobs.length} merged jobs to all clients.`);
        io.emit('job:sync_all', globalJobs);
    });

    // Worker requests sync
    socket.on('job:request_sync', () => {
        console.log(`Worker requested sync. Sending ${globalJobs.length} cached jobs.`);
        socket.emit('job:sync_all', globalJobs);
    });

    // -- WORKER MANAGEMENT EVENTS --
    let globalWorkers = [];

    // Admin creates a new worker
    socket.on('worker:create', (workerData) => {
        console.log('New Worker Created:', workerData.name);
        if (!globalWorkers.some(w => w.id === workerData.id)) {
            globalWorkers.push(workerData);
        }
        io.emit('worker:new', workerData);
    });

    // Admin updates a worker
    socket.on('worker:update', (data) => {
        console.log(`Worker Updated: ${data.id}`);
        const idx = globalWorkers.findIndex(w => w.id === data.id);
        if (idx !== -1) {
            globalWorkers[idx] = { ...globalWorkers[idx], ...data.updates };
        }
        io.emit('worker:updated', data);
    });

    // Admin deletes a worker
    socket.on('worker:delete', (workerId) => {
        console.log(`Worker Deleted: ${workerId}`);
        globalWorkers = globalWorkers.filter(w => w.id !== workerId);
        io.emit('worker:deleted', workerId);
    });

    // Admin syncs all workers
    socket.on('worker:sync_all_from_admin', (adminWorkers) => {
        console.log(`Received ${adminWorkers.length} workers from Admin.`);
        globalWorkers = adminWorkers;
        io.emit('worker:sync_all', globalWorkers);
    });

    // Worker requests worker list
    socket.on('worker:request_sync', () => {
        console.log(`Client requested workers sync. Sending ${globalWorkers.length} workers.`);
        socket.emit('worker:sync_all', globalWorkers);
    });

    // Chat / Messaging
    socket.on('message:send', (data) => {
        io.emit('message:receive', data);
    });

    socket.on('message:like', (data) => {
        console.log('Message Liked:', data);
        io.emit('message:like', data);
    });

    // -- CALLING & SIGNALING (WebRTC) --

    // Relay call offer to target (or broadcast if no target)
    socket.on('call:offer', (data) => {
        console.log(`Call Offer from ${data.senderId} to ${data.receiverId}`);
        // Broadcast to all (each client filters by receiverId)
        socket.broadcast.emit('call:offer', data);
    });

    // Relay call answer back to caller
    socket.on('call:answer', (data) => {
        console.log(`Call Answer from ${data.senderId} to ${data.receiverId}`);
        socket.broadcast.emit('call:answer', data);
    });

    // Relay call end signal
    socket.on('call:end', (data) => {
        console.log(`Call Ended: ${data.senderId} -> ${data.receiverId}`);
        socket.broadcast.emit('call:end', data);
    });

    // Relay ICE candidates
    socket.on('call:ice-candidate', (data) => {
        socket.broadcast.emit('call:ice-candidate', data);
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
