const fs=require('fs');
const path=require('path');
const terser=require('./audit/tooling/node_modules/terser');
const acorn=require('./audit/tooling/node_modules/acorn');
const csstree=require('./audit/tooling/node_modules/css-tree');
const root=__dirname;
const source=fs.readFileSync(path.join(root,'candidate/HEAD-before-formatting.txt'),'utf8');
const unwrap=s=>s.replace(/\/\*\s*<!\[CDATA\[\s*\*\/|\/\*\s*\]\]>\s*\*\/|\/\/<!\[CDATA\[|\/\/\]\]>/g,'').trim();
const normalize=v=>{
 if(Array.isArray(v))return v.filter(x=>x?.type!=='EmptyStatement').map(normalize);
 if(v&&typeof v==='object'){
  const object=Object.fromEntries(Object.entries(v).filter(([k])=>!['start','end','raw','loc','range'].includes(k)).map(([k,x])=>[k,normalize(x)]));
  if(v.type==='Property'&&!v.computed){
   const name=String(v.key.name??v.key.value);object.key={type:'StaticPropertyKey',name};
   if(name!=='__proto__'&&v.kind==='init'&&!v.method&&v.value?.type==='Identifier'&&v.value.name===name)object.shorthand=false;
  }
  return object;
 }
 return v;
};
function ast(s){return JSON.stringify(normalize(acorn.parse(s,{ecmaVersion:'latest',sourceType:'script'})));}
function diff(a,b,p='root'){
 if(JSON.stringify(a)===JSON.stringify(b))return null;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return {path:p,before:a,after:b};
 for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=diff(a[k],b[k],p+'.'+k);if(d)return d;}
 return {path:p};
}
(async()=>{
 let output='',offset=0,count=0;
 for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  output+=source.slice(offset,m.index);const attributes=m[1],body=m[2];
  if(/application\/ld\+json/.test(attributes)){const clean=unwrap(body);JSON.parse(clean);output+=m[0];}
  else{
   const clean=unwrap(body);const result=await terser.minify(clean,{compress:false,mangle:false,ecma:2020,format:{comments:false,inline_script:true}});
   if(ast(clean)!==ast(result.code)){console.error(JSON.stringify(diff(JSON.parse(ast(clean)),JSON.parse(ast(result.code)))));throw new Error('JavaScript AST changed for script '+count);}
   output+='<script'+attributes+'>\n/*<![CDATA[*/\n'+result.code+'\n/*]]>*/\n</script>';count++;
  }
  offset=m.index+m[0].length;
 }
 output+=source.slice(offset);
 const name='DCPP-Digital-HEAD-V6.7.13-AGENTIC-PRUEFFASSUNG-1zu1.txt';fs.writeFileSync(path.join(root,'candidate',name),output);
 const cssOriginal=fs.readFileSync(path.join(root,'source/DCPP-Digital-CSS-V6.7.12-UNVERAENDERT-1zu1.txt'),'utf8');
 const cssCandidate=fs.readFileSync(path.join(root,'candidate/DCPP-Digital-CSS-V6.7.13-AGENTIC-PRUEFFASSUNG-1zu1.txt'),'utf8');
 const cssAst=s=>csstree.generate(csstree.parse(s,{parseCustomProperty:true}));
 if(cssAst(cssOriginal)!==cssAst(cssCandidate))throw new Error('CSS AST changed');
 const v=JSON.parse(fs.readFileSync(path.join(root,'BUILD-VALIDATION.json'),'utf8'));v.javascript_asts_unchanged=count;v.css_ast_unchanged=true;v.files.HEAD={before_bytes:fs.statSync(path.join(root,'source/DCPP-Digital-HEAD-V6.7.12-UNVERAENDERT-1zu1.txt')).size,after_bytes:Buffer.byteLength(output)};
 fs.writeFileSync(path.join(root,'BUILD-VALIDATION.json'),JSON.stringify(v,null,2)+'\n');
 console.log(JSON.stringify({scripts_checked:count,head_bytes:Buffer.byteLength(output),css_semantics_unchanged:true}));
})().catch(e=>{console.error(e);process.exit(1)});
