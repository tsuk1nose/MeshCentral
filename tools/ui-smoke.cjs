/* Presentation regression checks. Run with a development Playwright installation:
 * node tools/ui-smoke.cjs /path/to/playwright /path/to/chromium [screenshot-directory]
 * Uses real template helpers/dialog handlers with fixture data; no live server.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.argv[4];
function extract(source, name) {
    const start = source.indexOf('        function ' + name + '(');
    assert(start >= 0, name);
    const end = source.indexOf('\n        function ', start + 10);
    return source.slice(start, end < 0 ? undefined : end);
}
(async () => {
    const browser = await chromium.launch({headless: true, ...(process.argv[3] ? {executablePath: process.argv[3]} : {}), args: ['--no-sandbox']});
    try {
        const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
        await page.route('http://mesh.test/**', async route => {
            const pathname = new URL(route.request().url()).pathname;
            if (['/default', '/default3'].includes(pathname)) {
                let html = fs.readFileSync(path.join(root, 'views', pathname.slice(1) + '.handlebars'), 'utf8');
                html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/\sonload="[^"]*"/g, '').replace(/\{\{\{?(\w+)\}?\}\}/g, (_, name) => ({title:'MeshCentral', title1:'MeshCentral', title2:'Device management'}[name] || ''));
                return route.fulfill({contentType:'text/html', body: html});
            }
            const file = path.join(root, 'public', pathname);
            if (file.startsWith(path.join(root, 'public') + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({path:file});
            return route.fulfill({status:404, body:''});
        });
        for (const template of ['default', 'default3']) {
            const source = fs.readFileSync(path.join(root, 'views', template + '.handlebars'), 'utf8');
            await page.goto('http://mesh.test/' + template);
            await page.addScriptTag({path:path.join(root,'public/scripts/common-0.0.1.js')});
            await page.evaluate(() => {
                document.body.style.display = 'block'; document.body.classList.add('fullscreen');
                Object.assign(window, {features2:0, nightMode:false, xxdialogMode:0, xxcurrentView:1, desktop:null, setSessionActivity:()=>{}, getstore:(k,d)=>localStorage.getItem(k) || d, putstore:(k,v)=>localStorage.setItem(k,v), features:2, debugmode:0, domainUrl:'/', urlargs:{}, serverinfo:{name:'mesh.example.com',port:443,https:true}, meshes:{'mesh/test/demo':{name:'animatronics'}}});
                window.format = (text,...values) => text.replace(/\{(\d+)\}/g,(_,i)=>values[i]);
                if (document.getElementById('logoutControlSpan')) document.getElementById('logoutControlSpan').innerHTML = '<button class="mc-account-button">Welcome admin</button><a class="mc-logout-link" href="logout">Logout</a>';
            });
            await page.addScriptTag({content:extract(source,'setNightMode') + '\n' + extract(source,'addHtmlValue')});
            await page.addScriptTag({path:path.join(root,'public/scripts/modern-ui.js')});
            await page.evaluate(() => { putstore('nightMode','2'); setNightMode(); });
            await page.locator('.mc-theme-toggle').click();
            assert.equal(await page.evaluate(() => getstore('nightMode') === '1' && document.body.classList.contains('night')), true);
            assert.equal(await page.locator('.mc-theme-toggle').getAttribute('aria-pressed'), 'true');
            await page.locator('.mc-theme-toggle').click();
            assert.equal(await page.evaluate(() => getstore('nightMode') === '2' && !document.body.classList.contains('night')), true);
            await page.evaluate(() => { features2=0x00100000; setNightMode(); });
            assert.equal(await page.locator('.mc-theme-toggle').isDisabled(), true);
            await page.evaluate(() => { features2=0; setNightMode(); });
            await page.evaluate(()=>{document.getElementById('UsersSubMenuSpan').style.display='';document.getElementById('UsersGeneral').className='topbar_td style3sel';window.go=id=>window.tabTarget=id;});
            const tabHeight=await page.locator('#UsersSubMenuSpan').evaluate(e=>e.getBoundingClientRect().height);
            assert.equal(tabHeight,44);
            await page.locator('#UsersGroups').focus();await page.keyboard.press('Enter');
            assert.equal(await page.evaluate(()=>window.tabTarget),50);
            if(output) {fs.mkdirSync(output,{recursive:true});await page.locator('#UsersSubMenuSpan').screenshot({path:path.join(output,template+'-tabs.png')});}
            if (template === 'default') {
                await page.addScriptTag({path:path.join(root,'public/scripts/qrcode.min.js')});
                const names = ['setDialogMode','dialogclose','MoreToggle','addAgentToMesh','addAgentToMeshClick'];
                await page.addScriptTag({content:names.map(name => extract(source,name)).join('\n')});
                await page.locator('.mc-theme-toggle').focus();
                await page.evaluate(() => addAgentToMesh('mesh/test/demo'));
                await page.waitForFunction(() => document.body.classList.contains('mc-dialog-open'));
                for (const dark of [false,true]) {
                    await page.evaluate(d=>{putstore('nightMode', d?'1':'2');setNightMode();},dark);
                    await page.waitForTimeout(200);
                    const dims = await page.locator('#dialog').boundingBox(); assert(dims.x>=0 && dims.x+dims.width<=1440);
                    assert.equal(await page.locator('#aginsSelect').inputValue(),'0');
                    await page.locator('#aginsSelect').selectOption('1'); assert.equal(await page.locator('#agins_linux').isVisible(),true);
                    await page.locator('#aginsSelect').selectOption('0');
                    if(output) { fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'agent-dialog-'+(dark?'dark':'light')+'.png')}); }
                }
                await page.locator('#idx_dlgCancelButton').focus(); await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(()=>document.getElementById('dialog').contains(document.activeElement)),true);
                await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.body.classList.contains('mc-dialog-open'));
                assert.equal(await page.locator('.mc-theme-toggle').evaluate(e=>e===document.activeElement),true);
                if(output) await page.screenshot({path:path.join(output,'header-dark.png')});
                await page.evaluate(()=>{window.confirmed=0;setDialogMode(2,'Edit settings',3,()=>window.confirmed++,Array.from({length:25},(_,i)=>addHtmlValue('Setting '+i,'<input type="text" value="Example">')).join(''));});
                const scrolling=await page.locator('#dialogBody').evaluate(e=>({scroll:e.scrollHeight>e.clientHeight,bottom:e.getBoundingClientRect().bottom}));
                assert(scrolling.scroll && scrolling.bottom<1000);
                await page.locator('#idx_dlgOkButton').click();assert.equal(await page.evaluate(()=>window.confirmed),1);
                await page.evaluate(()=>setDialogMode(7,'Desktop settings',3));
                assert.equal(await page.locator('#dialog7').isVisible(),true);
                const settings = await page.locator('#d7bitmapscaling').boundingBox();
                const settingsDialog = await page.locator('#dialog').boundingBox();
                assert(settings.x >= settingsDialog.x && settings.x + settings.width <= settingsDialog.x + settingsDialog.width);
                await page.evaluate(()=>setDialogMode());
                await page.setViewportSize({width:390,height:844});
                await page.evaluate(()=>setDialogMode(2,'Edit settings',3,null,addHtmlValue('Name','<input type="text" value="Example">')));
                const box=await page.locator('#dialog').boundingBox();assert(box.x>=0 && box.x+box.width<=390);
                const input=await page.locator('#dialog input[type="text"]:visible').boundingBox();assert(input.x+input.width<=390);
                await page.evaluate(()=>setDialogMode());await page.setViewportSize({width:1440,height:1000});
            } else {
                await page.addScriptTag({path:path.join(root,'public/scripts/bootstrap.js')});
                await page.addScriptTag({content:extract(source,'setModalContent')});
                await page.evaluate(()=>{window.deskDialogReleaseKeys=()=>{};setModalContent('xxAddAgent','Edit settings',addHtmlValue('Name','<input type="text" value="Example">'));window.testModal=new bootstrap.Modal(document.getElementById('xxAddAgentModal'));window.testModal.show();});
                await page.waitForTimeout(400);
                assert.equal(await page.locator('#xxAddAgentModal').isVisible(),true);
                assert.equal(await page.locator('#xxAddAgentModal .mc-field').count(),1);
                if(output) await page.screenshot({path:path.join(output,'bootstrap-dialog.png')});
                await page.locator('#xxAddAgentModal .btn-close').click();
                await page.waitForTimeout(400);
                assert.equal(await page.locator('#xxAddAgentModal').isVisible(),false);
            }
            console.log(template + ': persisted theme, server theme policy and dialog layout/controls passed');
        }
    } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
