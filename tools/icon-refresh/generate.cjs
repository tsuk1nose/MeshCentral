/* Regenerate compatibility PNG/WebP/sprite assets from vendored Lucide artwork.
 * Development only: node generate.cjs [path/to/playwright] [path/to/chromium]
 * No browser or npm package is needed by the deployed application.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '../..');
const manifest = require('./manifest.json');
const iconDir = path.join(root, 'public/images/lucide');
async function main() {
    const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}), args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        const sources = {};
        for (const name of fs.readdirSync(iconDir).filter(x => x.endsWith('.svg'))) sources[name.slice(0, -4)] = fs.readFileSync(path.join(iconDir, name), 'utf8');
        const render = async (job) => page.evaluate(async ({ job, sources }) => {
            const canvas = document.createElement('canvas');
            canvas.width = job.width; canvas.height = job.height;
            const ctx = canvas.getContext('2d');
            if (job.background) { ctx.fillStyle = job.background; ctx.fillRect(0, 0, canvas.width, canvas.height); }
            const cellWidth = job.width / job.icons.length;
            for (let i = 0; i < job.icons.length; i++) {
                const name = job.icons[i];
                let color = job.color || '#6d9ff4';
                if (job.icons.length > 1 && /^(circle-check|shield-check)$/.test(name)) color = '#36b887';
                if (job.icons.length > 1 && /^(circle-x|shield-x|mic-off)$/.test(name)) color = '#ef6464';
                if (job.icons.length > 1 && /^(triangle-alert|shield-alert|battery-warning)$/.test(name)) color = '#e6a23c';
                const svg = sources[name].replace('stroke="currentColor"', `stroke="${color}"`);
                const image = new Image();
                image.src = 'data:image/svg+xml;base64,' + btoa(svg);
                await image.decode();
                const padding = Math.max(0, Math.min(cellWidth, job.height) * (job.height <= 16 ? 0 : 0.12));
                const side = Math.min(cellWidth, job.height) - padding * 2;
                ctx.drawImage(image, i * cellWidth + (cellWidth - side) / 2, (job.height - side) / 2, side, side);
            }
            return canvas.toDataURL('image/' + (job.format || 'png'), 0.95).split(',')[1];
        }, { job, sources });
        let count = 0;
        for (const [relative, job] of Object.entries(manifest.jobs)) {
            const data = Buffer.from(await render(job), 'base64');
            fs.writeFileSync(path.join(root, relative), data); count++;
        }
        // ICO contains actual PNG payloads at each common browser icon resolution.
        const sizes = [16, 32, 48, 64, 128, 256];
        const chunks = [];
        const header = Buffer.alloc(6 + sizes.length * 16);
        header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
        let offset = header.length;
        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const data = Buffer.from(await render({ width: size, height: size, icons: ['network'], color: '#ffffff', background: '#2563eb' }), 'base64');
            const entry = 6 + i * 16;
            header[entry] = size === 256 ? 0 : size; header[entry + 1] = size === 256 ? 0 : size;
            header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
            header.writeUInt32LE(data.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
            chunks.push(data); offset += data.length;
        }
        fs.writeFileSync(path.join(root, 'public/favicon.ico'), Buffer.concat([header, ...chunks]));
        console.log(`Generated ${count} raster assets and a ${sizes.length}-resolution favicon.ico from Lucide ${manifest.version}.`);
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
