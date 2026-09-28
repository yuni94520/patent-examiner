const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
let pass=0,fail=0;
function ok(name,value){if(value)pass++;else{fail++;console.error(`FAIL ${name}`);}}

ok('claim input remains visible',/id="claimTxt"/.test(html));
ok('citation input remains visible',/id="citTxt"/.test(html));
ok('embedding adjustment removed',!(/id="semanticEndpoint"/.test(html)));
ok('query expansion adjustment removed',!(/id="qeMode"/.test(html)));
ok('query limit adjustment removed',!(/id="qeLimit"/.test(html)));
ok('RRF adjustment removed',!(/id="rrfK"/.test(html)));
ok('patent id adjustment removed',!(/id="patId"/.test(html)));
ok('claim number adjustment removed',!(/id="clNum"/.test(html)));
ok('citation id adjustment removed',!(/id="citId"/.test(html)));
ok('prompt policy loads before inline application',html.indexOf('prompt-screening-policy.js')>0&&html.indexOf('prompt-screening-policy.js')<html.indexOf('const SEARCH_FORMULA_PROMPT'));
ok('official evaluator uses prompt policy',/PromptScreeningPolicy\.score\(/.test(html));
ok('candidate distilled rules are enabled in official audit',/includeCandidateRules:true/.test(html));
ok('sidebar is hidden',/aside\{display:none/.test(html));

console.log(`RESULT: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
