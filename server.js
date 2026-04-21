const express = require('express');
const Heroku = require('heroku-client');
const cors = require('cors');
const path = require('path');

const app = express();
const heroku = new Heroku({ token: 'HRKU-AAWMlRPShni5R04CictZo9fmrXsANwQX6A3cbTATMkjQ_____wkzYDD52mdv' }); // <--- PUT YOUR KEY HERE

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configuration for the Bot you are deploying
const BOT_REPO_TARBALL = 'https://github.com/User/Repo/tarball/main'; 

// Serve the Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Deployment Logic
app.post('/api/deploy', async (req, res) => {
    const { deviceMode, ownerNumber, sessionId } = req.body;

    try {
        // 1. Create App
        const appName = "bwm-" + Math.floor(Math.random() * 10000);
        const herokuApp = await heroku.post('/apps', {
            body: { name: appName }
        });

        // 2. Set Environment Variables
        await heroku.patch(`/apps/${appName}/config-vars`, {
            body: {
                DEVICE_MODE: deviceMode,
                OWNER_NUMBER: ownerNumber,
                SESSION_ID: sessionId,
                REMOVE_BG_KEY: 'false' // Example extra var
            }
        });

        // 3. Source Code Build
        await heroku.post(`/apps/${appName}/builds`, {
            body: {
                source_blob: { url: BOT_REPO_TARBALL }
            }
        });

        res.json({ success: true, url: `https://dashboard.heroku.com/apps/${appName}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.body ? err.body.message : "Deployment failed" });
    }
});

// THIS PREVENTS STATUS 143 / ERROR R10
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
});
