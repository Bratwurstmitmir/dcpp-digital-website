const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
function markup(mode){
 const directory=path.join(root,mode==='baseline'?'source':'candidate');
 const v=Object.fromEntries(['HTML','CSS','HEAD'].map(kind=>[kind,fs.readFileSync(path.join(directory,fs.readdirSync(directory).find(f=>f.includes('-'+kind+'-'))),'utf8')]));
 const body=v.HTML.replace(/<var>navigation<\/var>/g,'<nav data-container="navigation"><a href="/kurse/">Kurse</a></nav>').replace(/<var>(?:sidebar|footer)<\/var>/g,'').replace(/<var>content<\/var>/g,'<div id="legacy-yoga-probe"><h1>Mind.</h1><p>Yoga-Begeisterte und Kurse: ungenutzter nativer Jimdo-Inhalt.</p></div>');
 return '<!doctype html><html lang="de-DE"><head><meta charset="utf-8"><title>Webdesign, Apps &amp; Publishing aus Bottrop - DCPP Digital</title>'+v.HEAD+'<style>'+v.CSS+'</style></head><body><div id="cc-inner" class="cc-content-parent">'+body+'</div></body></html>';
}
module.exports={markup};
