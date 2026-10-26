import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';import {mkdtempSync,rmSync} from 'node:fs';
test('HTTP workflow labels rehearsal, blocks checkout and persists a validated scope',async t=>{
 const cwd=new URL('..',import.meta.url),data=mkdtempSync(new URL('./temporary-',import.meta.url));const port=14313,base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.mjs'],{cwd,env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,PORT:String(port),DATA_DIR:data}});t.after(async()=>{child.kill();await once(child,'exit');rmSync(data,{recursive:true,force:true});});await once(child.stdout,'data');
 const first=await(await fetch(base+'/api/state')).json();assert.equal(first.aiConfigured,false);assert.equal(first.paypalConfigured,false);
 assert.equal((await fetch(base+'/api/draft',{method:'POST',body:'{}'})).status,403);
 const post=async(path,data)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':first.csrf},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
 const q=await post('/api/draft',{budget:500,rehearsal:true});assert.equal(q.data.quote.totalCents,42000);assert.equal(q.data.quote.source,'rehearsal');
 const order=await post('/api/order',{quoteId:q.data.quote.id,approved:true,total:1});assert.equal(order.status,400);assert.match(order.data.error,/Rehearsal/);
 assert.equal((await post('/api/draft',{budget:500,brief:'I need a landing page.'})).status,400);
 const saved=await(await fetch(base+'/api/state')).json();assert.equal(saved.quote.id,q.data.quote.id);assert.equal(saved.activity.some(x=>x.text.includes('capture confirmed')),false);
 const ledger=await(await fetch(base+'/api/quotes')).json();assert.equal(ledger.quotes.length,1);assert.equal(ledger.quotes[0].id,q.data.quote.id);
 assert.equal((await fetch(base+'/data/state.json')).status,404);
});
