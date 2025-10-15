import * as fs from 'node:fs';
import * as path from 'node:path';
export const isDev = process.env.NODE_ENV === 'development';
export function loadEnvFile(file) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        for (const line of raw.split('\n')) {
            const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
            if (m)
                process.env[m[1]] = m[2];
        }
    }
}
loadEnvFile('.env.electron');
//# sourceMappingURL=env.js.map