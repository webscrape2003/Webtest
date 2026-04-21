const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.post('/api/deploy', async (req, res) => {
    const { apiKey, repoUrl, envVars, appName } = req.body;

    try {
        // Clean the repo URL to ensure it works as a tarball link
        const cleanRepo = repoUrl.replace(/\/$/, "");
        const tarballUrl = `${cleanRepo}/tarball/main`;

        const herokuResponse = await axios.post('https://api.heroku.com/app-setups', {
            source_blob: { url: tarballUrl },
            app: { name: appName || undefined }, // Optional custom name
            overrides: { env: envVars }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/vnd.heroku+json; version=3',
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ success: true, url: herokuResponse.data.dashboard_build_status_url });
    } catch (error) {
        const errorMsg = error.response ? error.response.data.message : error.message;
        res.status(500).json({ success: false, message: errorMsg });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
