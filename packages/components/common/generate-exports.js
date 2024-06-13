const fs = require('node:fs');
const path = require('node:path');

// 指定源目录
const srcDir = './src';

// 读取源目录下的所有文件和文件夹
const files = fs.readdirSync(srcDir);

// 过滤出文件夹
const directories = files.filter(file => fs.statSync(path.join(srcDir, file)).isDirectory());

// 生成exports对象
const packageJsonExports = directories.reduce((acc, dir) => {
  acc[`./src/${dir}`] = `./src/${dir}/index.js`;
  return acc;
}, {});

// 读取package.json文件
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// 更新exports字段
packageJson.exports = packageJsonExports;

// 写回package.json文件
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
