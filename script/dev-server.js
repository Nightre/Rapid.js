const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 重定向 /Rapid.js/dist/rapid.js 到 /dist/rapid.js
app.get('/Rapid.js/dist/rapid.js', (req, res) => {
    res.redirect('/dist/rapid.js');
});

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 所有路由都返回 index.html，支持 SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`开发服务器运行在 http://localhost:${PORT}`);
    console.log(`您可以访问 http://localhost:${PORT}/dist/rapid.js 测试重定向`);
}); 