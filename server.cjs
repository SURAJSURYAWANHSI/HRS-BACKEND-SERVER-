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
const EMAILS_FILE = path.join(DATA_DIR, 'emails.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

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

const loadEmails = () => {
    try {
        if (fs.existsSync(EMAILS_FILE)) {
            const raw = fs.readFileSync(EMAILS_FILE, 'utf8');
            const data = JSON.parse(raw);
            console.log(`[Persistence] Loaded ${data.length} emails from disk.`);
            return data;
        }
    } catch (err) {
        console.error("[Persistence] Error loading emails:", err);
    }
    return [];
};

const saveEmails = (emails) => {
    try {
        fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
    } catch (err) {
        console.error("[Persistence] Error saving emails:", err);
    }
};

const loadMessages = () => {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
            const data = JSON.parse(raw);
            console.log(`[Persistence] Loaded ${data.length} messages from disk.`);
            return data;
        }
    } catch (err) {
        console.error("[Persistence] Error loading messages:", err);
    }
    return [];
};

const saveMessages = (messages) => {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    } catch (err) {
        console.error("[Persistence] Error saving messages:", err);
    }
};

// GLOBAL STATE (Source of Truth)
let globalJobs = loadJobs();
let globalEmails = loadEmails();
let globalMessages = loadMessages();
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

    // Email Sync
    socket.on('email:request_sync', () => {
        socket.emit('email:sync_all', globalEmails);
    });

    socket.on('email:fetch_now', () => {
        if (openInboxGlobal) {
            console.log('Manual email fetch requested by client.');
            openInboxGlobal();
        }
    });

    // Chat Sync
    socket.on('message:request_sync', () => {
        socket.emit('message:sync_all', globalMessages);
    });

    // -- COMMUNICATION --

    // Chat
    socket.on('message:send', (data) => {
        // Save to global state and disk
        globalMessages.push(data);
        saveMessages(globalMessages);

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

const sendAutoReply = async (toEmail, originalSubject, customBody) => {
    console.log(`[Email Debug] sendAutoReply called for: ${toEmail}`);

    if (EMAIL_CONFIG.user.includes('YOUR_EMAIL')) {
        console.log('[Email] Auto-reply skipped. Credentials not configured.');
        return;
    }

    try {
        console.log('[Email Debug] Creating transporter...');
        const transporter = nodemailer.createTransport(SMTP_CONFIG);

        console.log('[Email Debug] Sending mail...');
        const info = await transporter.sendMail({
            from: `"HRS Engineering & Power Solutions" <${EMAIL_CONFIG.user}>`,
            to: toEmail,
            subject: `Re: ${originalSubject} - Order Received`,
            text: customBody
        });

        console.log(`[Email] ✅ Auto-reply sent to ${toEmail}. MessageId: ${info.messageId}`);
    } catch (error) {
        console.error('[Email] ❌ Failed to send auto-reply:', error.message);
        console.error('[Email] Full error:', error);
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

    // RECONNECTION LOGIC WRAPPER
    let openInboxGlobal = null;

    const runListener = async () => {
        try {
            console.log('[Email System] Connecting to IMAP...');
            const connection = await imaps.connect(config);
            console.log('[Email System] Connected to IMAP');

            connection.on('error', (err) => {
                console.error('[Email System] Connection Error:', err);
            });

            const openInbox = async () => {
                try {
                    await connection.openBox('INBOX');

                    // Search for UNSEEN messages
                    const searchCriteria = ['UNSEEN'];

                    // FETCH THE FULL BODY SO WE CAN PARSE HEADERS CORRECTLY
                    // bodies: [''] fetches the entire raw email
                    const fetchOptions = {
                        bodies: [''],
                        markSeen: false
                    };

                    const messages = await connection.search(searchCriteria, fetchOptions);

                    if (messages.length > 0) {
                        console.log(`[Email System] Found ${messages.length} new emails.`);
                    }

                    for (const item of messages) {
                        // 'which' is empty string for the whole message
                        const fullPart = item.parts.find(part => part.which === '');

                        if (!fullPart) {
                            console.warn(`[Email] Skipping message ${item.attributes.uid}: No content found.`);
                            continue;
                        }

                        const id = item.attributes.uid;

                        try {
                            // Parse the FULL email source (headers + text/html) - PROMISE VERSION
                            const mail = await simpleParser(fullPart.body);

                            // Debug Logging for Email Structure
                            console.log('[Email Debug] From Structure:', JSON.stringify(mail.from));

                            // Enhanced Safe Access to From Address
                            let fromEmail = mail.from?.value?.[0]?.address;
                            if (!fromEmail && mail.from?.text) {
                                const match = mail.from.text.match(/<(.+)>/);
                                fromEmail = match ? match[1] : mail.from.text;
                            }

                            const subject = mail.subject || 'No Subject';

                            if (!fromEmail) {
                                console.warn('[Email] Skipping email with no valid sender. Raw From:', mail.from);
                                try { await connection.addFlags(id, '\\Seen'); } catch (e) { }
                                continue;
                            }

                            console.log(`[Email] New mail from: ${fromEmail}, Subject: ${subject}`);

                            // Professional Template
                            const emailBody = `Dear Customer,

                                Thank you for choosing our company and placing your order with us.

                                We are pleased to inform you that your order has been **successfully received and automatically accepted**. Our team has started processing it and will ensure timely completion as per the job requirements.

                                We truly appreciate your trust in our services. We are continuously working to improve the quality of our work and provide you with the best possible experience.

                                If you have any questions or need further assistance, please feel free to contact us. We will be happy to help.

                                Thank you for looking to our company. We look forward to working with you.

                                Best regards,

                                HRS Engineering & Power Solutions Pvt. Ltd.
                                ravi.salve@hrsengineering.in`;

                            await sendAutoReply(fromEmail, subject, emailBody);

                            // --- PERSIST AND BROADCAST EMAIL ---
                            const newEmail = {
                                id: `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                from: fromEmail,
                                subject: subject,
                                body: mail.text || mail.html || 'No Content',
                                date: mail.date || new Date().toISOString(),
                                isRead: false
                            };

                            globalEmails.unshift(newEmail);
                            if (globalEmails.length > 100) globalEmails = globalEmails.slice(0, 100); // Keep last 100
                            saveEmails(globalEmails);

                            io.emit('email:receive', newEmail);
                            console.log(`[Email System] Email saved and broadcasted: ${newEmail.id}`);
                            // -----------------------------------

                            // Mark as SEEN
                            try {
                                await connection.addFlags(id, '\\Seen');
                            } catch (e) {
                                console.error('[Email] Failed to mark as seen:', e);
                            }
                        } catch (parseErr) {
                            console.error('[Email] Parse error:', parseErr);
                            try { await connection.addFlags(id, '\\Seen'); } catch (e) { }
                        }
                    }
                } catch (err) {
                    console.error('[Email System] Fetch Error:', err);
                }
            };

            openInboxGlobal = openInbox;

            // Initial check
            openInbox();

            // Poll every 15 seconds for testing (was 2 minutes)
            const intervalId = setInterval(openInbox, 15 * 1000);

            // Handle connection close to clear interval
            connection.on('end', () => {
                console.warn('[Email System] Connection ended. Clearing interval.');
                clearInterval(intervalId);
                setTimeout(runListener, 30000);
            });

        } catch (err) {
            console.error('[Email System] Connection error:', err.message);
            // Retry in 30s
            setTimeout(runListener, 30000);
        }
    };

    runListener();
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
