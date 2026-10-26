import {readFileSync,writeFileSync} from 'node:fs';import {validateDraft} from '../src/quote.mjs';
const db=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));const q=Object.values(db.quotes).find(q=>q.source==='ai'&&q.notes.some(n=>n.includes('Total set to')));if(!q)throw new Error('Captured adversarial response not found; do not invent evidence.');
let rejected=false,error='';try{validateDraft(q,q.budgetCents/100);}catch(e){rejected=true;error=e.message;}
const report={testedAt:new Date().toISOString(),kind:'offline policy revalidation of the actual earlier Qwen model response, not a new inference',model:q.model,actualModelTitle:q.title,actualModelNotes:q.notes,catalogTotalCents:q.totalCents,rejectedByCurrentPolicy:rejected,error,paymentCreated:!!q.orderId};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!rejected)process.exitCode=1;
