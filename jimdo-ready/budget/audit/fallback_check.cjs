const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {context,readState,markup,settleVisibleLayout}=require('./browser_compare.cjs');
const root=path.resolve(__dirname,'..'),base='https://www.dcpp-digital.de';
async function main(){
 const browser=await chromium.launch({executablePath:path.join(__dirname,'browser1148/chrome-linux/headless_shell'),headless:true,args:['--no-sandbox']});
 const comparisons=[];
 try{
  for(const width of [1440,390]){
   const original=await context(browser,'baseline',width,null,{javaScriptEnabled:false});
   const updated=await context(browser,'candidate',width,null,{javaScriptEnabled:false});
   try{
    for(const target of ['/','/?projekt=blumen-boutique','/#3x3homefit','/about/','/j/privacy']){
     const a=await original.newPage(),b=await updated.newPage();
     for(const p of [a,b]){await p.goto(base+target,{waitUntil:'domcontentloaded'});await p.waitForLoadState('networkidle');await p.evaluate(()=>document.body.offsetHeight);}
     assert.deepEqual(await readState(b),await readState(a),'No-JS behavior changed at '+target+' '+width);
     comparisons.push({case:'visible content without JavaScript',width,path:target,identical:true});
     await a.close();await b.close();
    }
   }finally{await original.close();await updated.close();}
  }
  const good=markup('candidate');
  const wrapped=good.replace(/(<script id="dcpp-panel-data" type="application\/json">)([\s\S]*?)(<\/script>)/,'$1\n/* <![CDATA[ */\n$2\n/* ]]> */\n$3');
  const cdata=await context(browser,'candidate',390,()=>wrapped);
  try{
   const page=await cdata.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/#larosabottrop',{waitUntil:'domcontentloaded'});await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('[id^="dcpp-microsite-"]').count(),11);
   assert.equal(await page.locator('#lr-site').getAttribute('data-lr-ready'),'true');
   assert.deepEqual(errors,[]);comparisons.push({case:'Jimdo CDATA wrapper around JSON',passed:true});
  }finally{await cdata.close();}
  const damaged=good.replace(/(<script id="dcpp-panel-data" type="application\/json">)[\s\S]*?(<\/script>)/,'$1{invalid JSON$2');
  const fault=await context(browser,'candidate',390,()=>damaged);
  try{
   for(const target of ['/#larosabottrop','/?projekt=digital-publishing']){
    const page=await fault.newPage();
    await page.goto(base+target,{waitUntil:'domcontentloaded'}).catch(e=>{if(!/ERR_ABORTED|interrupted/.test(String(e)))throw e;});
    await page.waitForURL(base+'/#dcpp-projects',{waitUntil:'domcontentloaded'});
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#dcpp-home-content').isVisible(),true);
    assert.match((await readState(page)).h1.join(' '),/Ideen werden/);
    comparisons.push({case:'damaged installation recovers to readable business page',path:target,passed:true});await page.close();
   }
  }finally{await fault.close();}
 }finally{await browser.close();}
 fs.writeFileSync(path.join(root,'FALLBACK-VALIDATION.json'),JSON.stringify({browser:'Chromium 131.0.6778.33',checks:comparisons.length,comparisons},null,2)+'\n');
 console.log(JSON.stringify({checks:comparisons.length,no_javascript_behavior_preserved:true,cdata_supported:true,damaged_payload_recovers:true}));
}
main().catch(e=>{console.error(e);process.exit(1)});
