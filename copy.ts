import fs from 'fs';
import path from 'path';

fs.renameSync('./backend-api/src/src', './backend-api/temp_src');
fs.rmSync('./backend-api/src', { recursive: true, force: true });
fs.renameSync('./backend-api/temp_src', './backend-api/src');
