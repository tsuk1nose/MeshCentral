/* Decode every generated raster and every ICO payload; validate sprite cells. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '../..');
const manifest = require('./manifest.json');
async function main() {
    const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}), args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        const jobs = Object.entries(manifest.jobs).map(([file, job]) => ({ file, ...job, data: fs.readFileSync(path.join(root, file)).toString('base64') }));
        const ico = fs.readFileSync(path.join(root, 'public/favicon.ico'));
        if (ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) !== 6) throw Error('Invalid ICO directory');
        for (let i = 0; i < 6; i++) {
            const entry = 6 + i * 16, size = ico[entry] || 256;
            const length = ico.readUInt32LE(entry + 8), offset = ico.readUInt32LE(entry + 12);
            if (offset + length > ico.length) throw Error('ICO payload outside file');
            jobs.push({ file: 'favicon.ico/' + size, width: size, height: size, icons: ['brand-mark'], data: ico.subarray(offset, offset + length).toString('base64') });
        }
        const count = await page.evaluate(async jobs => {
            for (const job of jobs) {
                const image = new Image();
                image.src = 'data:image/' + (job.format || 'png') + ';base64,' + job.data;
                await image.decode();
                if (image.naturalWidth !== job.width || image.naturalHeight !== job.height) throw Error('Dimensions changed: ' + job.file);
                if (job.width % job.icons.length !== 0) throw Error('Fractional sprite cell: ' + job.file);
                const canvas = document.createElement('canvas'); canvas.width = job.width; canvas.height = job.height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
                if (job.icons[0] === 'brand-mark') {
                    for (const [x, y] of [[0, 0], [job.width - 1, 0], [0, job.height - 1], [job.width - 1, job.height - 1]]) {
                        if (ctx.getImageData(x, y, 1, 1).data[3] !== 0) throw Error('Favicon background is opaque: ' + job.file);
                    }
                }
                const cellWidth = job.width / job.icons.length;
                for (let i = 0; i < job.icons.length; i++) {
                    const data = ctx.getImageData(i * cellWidth, 0, cellWidth, job.height).data;
                    if (!data.some((v, j) => j % 4 === 3 && v !== 0)) throw Error('Empty sprite cell: ' + job.file + '/' + i);
                }
            }
            return jobs.length;
        }, jobs);
        console.log(`Decoded ${count} assets/ICO payloads; all dimensions and sprite cells passed.`);
        if (process.argv[4]) {
            const samples = ['public/images/webp/user-256.webp', 'public/images/webp/group-256.webp', 'public/images/server-256.png', 'public/favicon-32x32.png', 'public/images/icons50.png', 'public/images/leftbar-64.png', 'public/images/notify48.png', 'public/images/details/motherboard64.png', 'public/images/modern/avatar.svg'];
            const cards = samples.map(file => {
                const data = fs.readFileSync(path.join(root, file)).toString('base64');
                const type = file.endsWith('.webp') ? 'webp' : file.endsWith('.svg') ? 'svg+xml' : 'png';
                return `<div><p>${file.replace('public/', '')}</p><img src="data:image/${type};base64,${data}"></div>`;
            });
            await page.setViewportSize({ width: 1000, height: 900 });
            await page.setContent(`<style>body{background:#101827;color:#dbe7ff;font:14px sans-serif;padding:24px}main{display:grid;grid-template-columns:1fr 1fr;gap:16px}main>div{padding:12px;background:#182338;border-radius:10px;overflow:hidden}img{max-width:100%;max-height:96px}p{color:#a4b4cd}</style><h2>Lucide · MeshCentral</h2><main>${cards.join('')}</main>`);
            await page.screenshot({ path: process.argv[4], fullPage: true });
        }
    } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
