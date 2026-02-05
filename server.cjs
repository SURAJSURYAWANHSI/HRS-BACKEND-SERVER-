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
let globalJobs = loadJobs();
const userSockets = new Map(); // UserId -> SocketId

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
        // Remove from userSockets if needed, or iterate
        for (const [uid, sid] of userSockets.entries()) {
            if (sid === socket.id) {
                userSockets.delete(uid);
                break;
            }
        }
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
        let jobTitle = '';
        let assigned = [];
        globalJobs = globalJobs.map(job => {
            if (job.id === data.jobId) {
                found = true;
                jobTitle = job.codeNo || job.description;
                assigned = job.assignedWorkers || [];
                return { ...job, ...data.updates };
            }
            return job;
        });

        if (found) {
            saveJobs(globalJobs);
            io.emit('job:update', data);

            // FCM NOTIFICATION
            assigned.forEach(workerId => {
                const socketId = userSockets.get(workerId);
                if (socketId) {
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket && targetSocket.fcmToken) {
                        sendPushNotification(
                            targetSocket.fcmToken,
                            'Job Updated',
                            `${jobTitle} moved to ${data.status}`,
                            { type: 'JOB', jobId: data.jobId }
                        );
                    }
                }
            });

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

        // FCM NOTIFICATION FOR CHAT
        const targetId = data.receiver_id;
        const senderName = data.sender_name || 'User'; // Adjust based on your message payload structure
        const content = data.content || (data.type === 'image' ? 'Sent an image' : 'Sent a file');

        if (targetId) {
            if (targetId === 'ALL') {
                // Broadcast to all except sender
                io.sockets.sockets.forEach(s => {
                    if (s.fcmToken && s.id !== socket.id) {
                        sendPushNotification(s.fcmToken, `Message from ${senderName}`, content, { type: 'MESSAGE', senderId: data.sender_id });
                    }
                });
            } else {
                const socketId = userSockets.get(targetId);
                if (socketId) {
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket && targetSocket.fcmToken) {
                        sendPushNotification(
                            targetSocket.fcmToken,
                            `Message from ${senderName}`,
                            content,
                            { type: 'MESSAGE', senderId: data.sender_id }
                        );
                    }
                }
            }
        }
    });

    // -- ANNOUNCEMENTS --
    socket.on('announcement:send', (announcement) => {
        console.log('Broadcasting Announcement:', announcement.title);

        // Broadcast to ALL connected clients (including sender for confirmation, or handle locally)
        io.emit('announcement:receive', announcement);

        // Send FCM to ALL Workers (and potentially other Admins if they have tokens)
        // We iterate through all connected sockets with tokens.
        io.sockets.sockets.forEach(s => {
            if (s.fcmToken && s.id !== socket.id) {
                sendPushNotification(
                    s.fcmToken,
                    `📢 ${announcement.priority === 'URGENT' ? 'URGENT: ' : ''}${announcement.title}`,
                    announcement.content,
                    {
                        type: 'ANNOUNCEMENT',
                        priority: announcement.priority,
                        id: announcement.id
                    }
                );
            }
        });
    });

    // WebRTC Signaling (Call Features)
    socket.on('call:offer', (data) => {
        socket.broadcast.emit('call:offer', data);

        // FCM NOTIFICATION FOR CALL
        const targetId = data.receiverId;
        const senderName = data.senderName || 'Admin';

        if (targetId === 'WORKER') {
            // Broadcast to ALL connected tokens
            // This iterates all sockets which might be expensive if scaling, but fine here
            io.sockets.sockets.forEach(s => {
                if (s.fcmToken && s.id !== socket.id) { // Don't notify self
                    sendPushNotification(s.fcmToken, 'Incoming Call', `${senderName} is calling...`, { type: 'CALL', callId: '123' });
                }
            });
        } else {
            const socketId = userSockets.get(targetId);
            if (socketId) {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket && targetSocket.fcmToken) {
                    sendPushNotification(
                        targetSocket.fcmToken,
                        'Incoming Call',
                        `${senderName} is calling...`,
                        { type: 'CALL', callId: '123', callerName: senderName }
                    );
                }
            }
        }
    });

    socket.on('call:answer', (data) => socket.broadcast.emit('call:answer', data));
    socket.on('call:ice-candidate', (data) => socket.broadcast.emit('call:ice-candidate', data));
    socket.on('call:end', (data) => socket.broadcast.emit('call:end', data));

    // File/Design Requests
    socket.on('job:request_upload', (data) => socket.broadcast.emit('job:request_upload', data));

    // -- REGISTRY & FCM --
    socket.on('user:register', (data) => {
        // data.userId
        console.log(`[Registry] Mapping User ${data.userId} -> Socket ${socket.id}`);
        userSockets.set(data.userId, socket.id);
    });

    socket.on('notification:register_token', (data) => {
        console.log(`[FCM] Registering token for socket ${socket.id}:`, data.token);
        socket.fcmToken = data.token;
    });
});

// -- FIREBASE CLOUD MESSAGING SETUP --
let admin = null;
try {
    // Only try to require if we think it might exist, or just try-catch the require
    // User needs to run: npm install firebase-admin
    admin = require('firebase-admin');

    // Check for serviceAccountKey.json
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('[FCM] Firebase Admin Initialized Successfully');
    } else {
        console.warn('[FCM] serviceAccountKey.json not found. Notifications will not be sent.');
        admin = null;
    }
} catch (e) {
    console.warn('[FCM] firebase-admin not installed or initiation failed.', e.message);
    admin = null;
}

// Helper to send notification
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin || !token) return;
    try {
        await admin.messaging().send({
            token: token,
            notification: { title, body },
            data: data,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    priority: 'high',
                    defaultSound: true
                }
            }
        });
        console.log(`[FCM] Notification sent to ${token.substr(0, 10)}...`);
    } catch (e) {
        console.error('[FCM] Error sending notification:', e);
    }
};

// -- INTERCEPT EVENTS FOR NOTIFICATIONS --
// We use the same 'io' instance, but we need to hook into the events we previously defined.
// Since we defined them inside the connection handler, we can't easily intercept them globally *unless* we refactor.
// BUT: We can just listen to the global 'io' emission if we emit events using io.emit.
// However, 'call:offer' uses socket.broadcast which doesn't trigger global io listener easily.
// EASIER APPROACH: Middleware or function wrappers. For now, let's keep it simple and just add the logic inside the connection handler 
// by replacing the loop above.
// ACTUALLY: I will just Append the logic to the existing handler in the Replace Block to rewrite the end of the file properly.

const PORT = 5000;

// -- EMAIL AUTO-REPLY SYSTEM --
const nodemailer = require('nodemailer');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

// ⚠️ CONFIGURE YOUR EMAIL HERE ⚠️
const EMAIL_CONFIG = {
    user: 'sas.automation.pvt.ltd.projects@gmail.com',
    password: 'nabjmchykkdxljjy',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 3000
};

const SMTP_CONFIG = {
    service: 'gmail',
    auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.password
    }
};

const sendAutoReply = async (toEmail, originalSubject) => {
    if (EMAIL_CONFIG.user.includes('YOUR_EMAIL')) {
        console.log('[Email] Auto-reply skipped. Credentials not configured.');
        return;
    }

    try {
        const transporter = nodemailer.createTransport(SMTP_CONFIG);

        await transporter.sendMail({
            from: `"ProTrack Admin" <${EMAIL_CONFIG.user}>`,
            to: toEmail,
            subject: `Re: ${originalSubject}`,
            text: `Thank you for your order/inquiry. This is an automated response to confirm we have received your email. Our team will review it shortly.\n\nBest regards,\nProTrack Team`
        });

        console.log(`[Email] Auto-reply sent to ${toEmail}`);
    } catch (error) {
        console.error('[Email] Failed to send auto-reply:', error);
    }
};

const startEmailListener = async () => {
    if (EMAIL_CONFIG.user.includes('YOUR_EMAIL')) {
        console.warn('[Email System] ⚠️ Email credentials missing in server.cjs. Auto-reply disabled.');
        return;
    }

    const config = {
        imap: {
            user: EMAIL_CONFIG.user,
            password: EMAIL_CONFIG.password,
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            tls: EMAIL_CONFIG.tls,
            authTimeout: EMAIL_CONFIG.authTimeout,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const connection = await imaps.connect(config);
        console.log('[Email System] Connected to IMAP');

        const openInbox = async () => {
            await connection.openBox('INBOX');

            // Search for UNSEEN messages
            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT'],
                markSeen: false
            };

            const messages = await connection.search(searchCriteria, fetchOptions);

            if (messages.length > 0) {
                console.log(`[Email System] Found ${messages.length} new emails.`);
            }

            for (const item of messages) {
                const all = item.parts.find(part => part.which === 'TEXT');
                const id = item.attributes.uid;
                const idHeader = "Imap-Id: " + id + "\r\n";

                simpleParser(idHeader + all.body, async (err, mail) => {
                    if (err) {
                        console.error('[Email] Parse error:', err);
                        return;
                    }

                    const fromEmail = mail.from.value[0].address;
                    const subject = mail.subject;

                    console.log(`[Email] New mail from: ${fromEmail}, Subject: ${subject}`);

                    // Logic: Reply to everything for now (or filter by subject 'Order')
                    await sendAutoReply(fromEmail, subject);

                    // Mark as SEEN
                    await connection.addFlags(id, '\\Seen');
                });
            }
        };

        // Initial check
        openInbox();

        // Poll every 2 minutes
        setInterval(openInbox, 120 * 1000);

    } catch (err) {
        console.error('[Email System] Connection error:', err.message);
    }
};


// Sync Database and Start Server
sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`SERVER RUNNING ON PORT ${PORT}`);
        startEmailListener(); // Start Email System
    });

}).catch((err) => {
    console.log("Database connection failed:", err);
});
