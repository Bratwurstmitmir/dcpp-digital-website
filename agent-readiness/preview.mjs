import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker from './site/_worker.js';

const directory=path.join(path.dirname(fileURLToPath(import.meta.url)),'site');
const mime={'.html':'text/html; charset=utf-8','.md':'text/markdown; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
export const assets={async fetch(request){
  let filename=decodeURIComponent(new URL(request.url).pathname);
  if(filename.endsWith('/'))filename+='index.html';
  const full=path.resolve(directory,'.'+filename);
  if(!full.startsWith(directory+path.sep))return new Response('Not found',{status:404});
  try{return new Response(await fs.readFile(full),{headers:{'Content-Type':mime[path.extname(full)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}};

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173);
 http.createServer(async(req,res)=>{
  try{
   const request=new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers});
   const response=await worker.fetch(request,{ASSETS:assets});
   res.writeHead(response.status,Object.fromEntries(response.headers));
   res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Preview error');}
 }).listen(port,'0.0.0.0',()=>process.stdout.write('DCPP preview http://localhost:'+port+'\n'));
}
