import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {version}=JSON.parse(await readFile('package.json','utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Use a numeric semantic version in package.json');
// All module dependencies get a fresh URL when the release version changes.
for(const file of ['app.js','peer-sync.js']){
  const source=await readFile(file,'utf8');
  await writeFile(file,source.replace(/(from '\.\/[^']+\.js)\?v=[^']+/g,`$1?v=${version}`));
}
execFileSync(process.execPath,['scripts/build-legacy.mjs'],{stdio:'inherit'});
let index=await readFile('index.html','utf8');
index=index.replace(/<!-- build-info -->[\s\S]*?<!-- \/build-info -->\n?/g,'');
const normalized=index.replace(/\?v=[^"']+/g,'');
const files=['app.js','app.legacy.js','peer-sync.js','layout.js','ghost-motion.js','characters.js','clock-http.js','compat.js','boot.js','style.css','scripts/build-release.mjs','scripts/build-legacy.mjs'];
const hash=createHash('sha256').update(version).update(normalized);
for(const file of files)hash.update(await readFile(file));
const id=hash.digest('hex').slice(0,10),assetVersion=`${version}-${id}`;
index=index.replace(/(style\.css|compat\.js|boot\.js)\?v=[^"']+/g,`$1?v=${assetVersion}`);
const info=`<!-- build-info --><small id="version-badge" title="ScreenSync ${version} · build ${id}" aria-label="ScreenSync version ${version}">v${version}</small><script>window.screenSyncBuild=${JSON.stringify({version,id})};</script><!-- /build-info -->\n`;
index=index.replace('<script src="compat.js',info+'<script src="compat.js');
await writeFile('index.html',index);
const escapeScript=source=>source.replace(/<\/script/gi,'<\\/script');
const css=await readFile('style.css','utf8'),compat=escapeScript(await readFile('compat.js','utf8')),app=escapeScript(await readFile('app.legacy.js','utf8'));
const startup=`window.screenSyncForceLegacy=true;window.onerror=function(message){var status=document.getElementById('room-status');if(status)status.textContent='Safari 9 startup error: '+message;return false;};`;
let safari=index.replace(/<title>[^<]+<\/title>/,'<title>ScreenSync — Safari 9</title>');
safari=safari.replace(/<link rel="stylesheet" href="[^"]+">/,()=>`<style>${css}</style>`);
safari=safari.replace(/<script src="compat\.js\?v=[^"]+"><\/script><script src="boot\.js\?v=[^"]+"><\/script>/,()=>`<script>${startup}</script>\n<script>${compat}</script>\n<script>${app}</script>`);
safari=safari.replace('Finding screens…</output>','Safari 9 page loaded · starting JavaScript…</output>');
await writeFile('safari9.html',safari);
await writeFile('version.json',JSON.stringify({version,build:id},null,2)+'\n');
console.log(`Released v${version} · ${id}; safari9.html is self-contained.`);
