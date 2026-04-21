const express = require('express');
const Heroku = require('heroku-client');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const HEROKU_API_KEY = 'HRKU-AAWMlRPShni5R04CictZo9fmrXsANwQX6A3cbTATMkjQ_____wkzYDD52mdv'; // Get from Heroku settings
const BOT_REPO_URL = 'https://github.com/User/Repo/tarball/main'; // Your bot's source code

const heroku = new Heroku({ token: HEROKU_API_KEY });

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/deploy', async (req, res) => {
    const { deviceMode, ownerNumber, sessionId } = req.body;

    // Basic Validation
    if (!ownerNumber || !sessionId) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        // 1. Create the Heroku App
        const appName = "bwm-xmd-" + Math.floor(Math.random() * 100000);
        const newApp = await heroku.post('/apps', {
            body: { name: appName, region: 'us' }
        });

        // 2. Set Config Vars (Environment Variables)
        await heroku.patch(`/apps/${appName}/config-vars`, {
            body: {
                DEVICE_MODE: deviceMode,
                OWNER_NUMBER: ownerNumber,
                SESSION_ID: sessionId,
                // Add default bot vars here
                TZ: 'Africa/Nairobi' 
            }
        });

        // 3. Trigger Deployment from GitHub
        await heroku.post(`/apps/${appName}/builds`, {
            body: {
                source_blob: { url: BOT_REPO_URL }
            }
        });

        res.json({ success: true, url: `https://${appName}.herokuapp.com` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.body ? err.body.message : "Deployment failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
