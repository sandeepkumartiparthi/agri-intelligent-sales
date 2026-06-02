const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// ⚡ HIGH-PERFORMANCE MIDDLEWARE PARSERS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 🗄️ LOCAL MEMORY DATA SHARDS (Bypasses Cloud Handshake Walls completely) ---
let LOCAL_USER_DATABASE = [];
let LOCAL_LISTINGS_DATABASE = [];

// --- 🔒 standalone ACCESSIBLE SECURITY ROUTING HUBS ---

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log("[Local Signup Matrix Request]: Registering identity profile for:", email);

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "Registration failed. All credential text boxes are mandatory." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        
        // Normalize role assignments safely to match frontend expectations
        let targetedRole = role.trim().toLowerCase();
        if (targetedRole.includes('farmer')) targetedRole = 'farmer';
        if (targetedRole.includes('merchant')) targetedRole = 'merchant';
        if (targetedRole.includes('admin')) targetedRole = 'admin';

        // Check for duplicates programmatically against local RAM variables
        const duplicateAccountCheck = LOCAL_USER_DATABASE.find(u => u.email === normalizedEmail);
        if (duplicateAccountCheck) {
            return res.status(400).json({ success: false, message: "An account with this email address already exists inside our data matrix." });
        }

        // Generate a clean local index unique identifier string
        const generatedUid = "user_node_" + Math.random().toString(36).substr(2, 9);

        const newRegisteredUser = {
            id: generatedUid,
            _id: generatedUid, // Structural mapping compatibility fallback rule
            name: name.trim(),
            email: normalizedEmail,
            password: password.trim(), 
            role: targetedRole,
            createdAt: new Date()
        };

        // Pushes document entry directly into rapid runtime variables array arrays
        LOCAL_USER_DATABASE.push(newRegisteredUser);
        console.log(`[Local Registry Complete]: Profile parameters allocated for: ${normalizedEmail}`);

        return res.status(201).json({
            success: true,
            message: "User successfully registered in data cluster.",
            user: { id: newRegisteredUser.id, name: newRegisteredUser.name, role: newRegisteredUser.role }
        });
    } catch (e) {
        console.error("Local Workspace Registration Error configuration:", e);
        return res.status(500).json({ success: false, message: "Core environment runtime error handling profiles." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: "Authentication aborted. Please complete all fields." });
        }

        let targetedRole = role.trim().toLowerCase();
        if (targetedRole.includes('farmer')) targetedRole = 'farmer';
        if (targetedRole.includes('merchant')) targetedRole = 'merchant';
        if (targetedRole.includes('admin')) targetedRole = 'admin';

        // Direct O(1) matching pass across memory structures
        const validatedUserDoc = LOCAL_USER_DATABASE.find(u => 
            u.email === email.trim().toLowerCase() && 
            u.password === password.trim() && 
            u.role === targetedRole
        );

        if (!validatedUserDoc) {
            return res.status(401).json({ success: false, message: "Access Denied. Invalid credentials or unauthorized system role selection." });
        }

        console.log(`[Identity Clearance Confirmed]: Active layout session assigned to ${validatedUserDoc.email}`);
        return res.json({
            success: true,
            user: { id: validatedUserDoc.id, name: validatedUserDoc.name, role: validatedUserDoc.role }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: "Core login hub mapping system failure." });
    }
});

// --- 🌾 MARKETPLACE CONTROLS LAYERS ---

app.post('/api/listings', async (req, res) => {
    try {
        const generatedListingId = "listing_node_" + Math.random().toString(36).substr(2, 9);
        const listing = {
            _id: generatedListingId,
            id: generatedListingId,
            ...req.body,
            date: new Date()
        };
        LOCAL_LISTINGS_DATABASE.unshift(listing); // Pushes fresh items to the top grid row
        res.status(201).json({ success: true, item: listing });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

app.get('/api/listings', async (req, res) => {
    try { res.json(LOCAL_LISTINGS_DATABASE); } catch (e) { res.status(500).json([]); }
});

app.delete('/api/listings/:id', async (req, res) => {
    try {
        LOCAL_LISTINGS_DATABASE = LOCAL_LISTINGS_DATABASE.filter(item => item._id !== req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

// --- 🛠️ CENTRAL MANAGEMENT SCHEMES ---

app.get('/api/admin/users', async (req, res) => {
    try { 
        // Map elements out without passing security string variables onto the wire
        const cleanUsersList = LOCAL_USER_DATABASE.map(({ password, ...u }) => u);
        res.json(cleanUsersList); 
    } catch (e) { res.status(500).json([]); }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        LOCAL_USER_DATABASE = LOCAL_USER_DATABASE.filter(u => u.id !== req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/api/market-prices', async (req, res) => {
    try {
        // 🌟 DYNAMIC PRODUCTION ROUTER: 
        // Uses the current production URL on Vercel, falls back to localhost during local development
        const pythonBaseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:5001';

        console.log(`[Forwarding API request to Python Container Engine]: ${pythonBaseUrl}/api/live-prices`);
        
        const aiRes = await axios.get(`${pythonBaseUrl}/api/live-prices`);
        res.json(aiRes.data);
    } catch (err) { 
        console.error("Internal pricing transmission bridge failed:", err.message);
        res.status(500).json([]); 
    }
});

app.listen(5000, () => console.log('🚀 SUCCESS: Standalone Engine Active. Polling structural pipelines on Port 5000.'));
