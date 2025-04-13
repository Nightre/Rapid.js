import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

// 重定向 /Rapid.js/dist/rapid.js 到 /dist/rapid.js
app.get('/Rapid.js/dist/rapid.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/rapid.js'));
});
app.use(express.static(path.join(__dirname, '../docs')));

app.listen(PORT, () => {
    console.log(`listen on http://localhost:${PORT}`);
}); 