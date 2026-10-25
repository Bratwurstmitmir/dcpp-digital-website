const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const {context,readState,markup}=require('./browser_compare.cjs');
const root=path.resolve(__dirname,'..');
async function main(){
 const transformed=fs.readFileSync(path.join(__dirname,'edge-cleaned-fixture.html'),'utf8');
 const browser=await chromium.launch({executablePath:process.env.DCPP_CHROMIUM_EXECUTABLE||path.join(__dirname,'browser1148/chrome-linux/headless_shell'),headless:true,args:['--no-sandbox']});
 const results=[],errors=[];
 try{
  for(const width of [1440,390]){
   const normal=await context(browser,'candidate',width);
   const cleaned=await context(browser,'candidate',width,url=>url.pathname==='/j/privacy'?markup('candidate'):transformed);
   try{
    const a=await normal.newPage(),b=await cleaned.newPage();
    for(const page of [a,b]){page.on('pageerror',e=>errors.push(e.message));await page.clock.setFixedTime(new Date('2026-10-24T18:00:00Z'));}
    for(const target of ['/','/?projekt=blumen-boutique','/#larosabottrop','/#olympiabottrop','/j/privacy']){
     for(const page of [a,b]){
      await page.goto('https://www.dcpp-digital.de'+target,{waitUntil:'domcontentloaded'});
      await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);
     }
     const x=await readState(a),y=await readState(b);assert.deepEqual(y,x,target+' at '+width);
     results.push({path:target,width,identical:true});
    }
   }finally{await normal.close();await cleaned.close();}
  }
 }finally{await browser.close();}
 assert.deepEqual(errors,[]);
 const result={fixture:'complete V6.7.13 HTML before/after actual local workerd HTMLRewriter; no live deployment',browser:'Chromium 131.0.6778.33',comparisons:results.length,page_errors:errors,results};
 fs.writeFileSync(path.join(root,'LEGACY-CLEANUP-BROWSER-VALIDATION.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
