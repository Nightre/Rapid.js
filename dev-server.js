import express from 'express';
import path from 'path';

const app = express();
const PORT = 8080;

app.get('/Rapid.js/dist/rapid.js', (req, res) => {
    res.redirect('/dist/rapid.js');
});

app.use(express.static(path.join(process.cwd())));

app.listen(PORT, () => {
    console.log(`开发服务器运行在 http://localhost:${PORT}`);
    console.log(`您可以访问 http://localhost:${PORT}/dist/rapid.js 测试重定向`);
}); 