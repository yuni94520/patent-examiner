const fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const chunks=html.split('<script').slice(1).map(x=>x.slice(x.indexOf('>')+1,x.indexOf('</script>'))).filter(x=>x.trim());
for(const source of chunks)new Function(source);
console.log(`RESULT: ${chunks.length} inline script(s) compiled, 0 failed`);
