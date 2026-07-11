const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const targetRegex = /bg-(slate|gray|zinc|neutral)-500 bg-opacity-75 transition-opacity/g;
      if (targetRegex.test(content)) {
        content = content.replace(targetRegex, 'bg-slate-900/40 backdrop-blur-sm transition-opacity');
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

replaceInDir('src');
