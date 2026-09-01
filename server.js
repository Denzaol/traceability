require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health Check endpoint for Coolify / Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/master', require('./routes/master'));
app.use('/api/inspection', require('./routes/inspection'));
app.use('/api/defects', require('./routes/defects'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/traceability', require('./routes/traceability'));
app.use('/api/export', require('./routes/export'));

// Fallback for SPA routing (if any)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Test database connection on startup
    try {
        const db = require('./db');
        const connection = await db.getConnection();
        console.log('✅ Database connection successful!');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed on startup:');
        console.error(`   Error Message: ${err.message}`);
        console.error(`   Host: ${process.env.DB_HOST}`);
        console.error(`   User: ${process.env.DB_USER}`);
        console.error(`   Database: ${process.env.DB_NAME}`);
        console.error('   Please check your Coolify Environment Variables.');
    }
});
