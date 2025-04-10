const fs = require('fs');
const path = require('path');

// 指定要处理的目录
const directoryPath = path.join(__dirname, 'docs/examples/js');

// 读取目录中的文件
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('无法扫描目录: ' + err);
    }

    // 处理每个文件
    files.forEach((file) => {
        if (path.extname(file) === '.js') {
            const filePath = path.join(directoryPath, file);

            // 读取文件内容
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    return console.log('无法读取文件: ' + err);
                }

                // 使用正则表达式删除注释
                const result = data.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

                // 将结果写回文件
                fs.writeFile(filePath, result, 'utf8', (err) => {
                    if (err) return console.log('无法写入文件: ' + err);
                    console.log(`已处理文件: ${file}`);
                });
            });
        }
    });
});