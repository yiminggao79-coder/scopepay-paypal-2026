import test from 'node:test';import assert from 'node:assert/strict';
import { validateDraft, orderPayload, parseModelJSON } from '../src/quote.mjs';
const draft={title:'Studio website',items:[{sku:'landing',quantity:1},{sku:'accessibility',quantity:1}],notes:['One responsive page.']};
test('prices always come from catalog and fit approved budget',()=>{
 const q=validateDraft({...draft,total:1,items:draft.items.map(x=>({...x,price:1}))},500);
 assert.equal(q.totalCents,42000);assert.equal(q.items[0].unitCents,30000);
 assert.equal(orderPayload(q,'http://localhost:4313','q1').purchase_units[0].amount.value,'420.00');
});
test('unknown services, duplicates, fractions, over-budget and invalid budgets fail closed',()=>{
 assert.throws(()=>validateDraft({...draft,items:[{sku:'wire-transfer',quantity:1}]},500),/catalog/);
 assert.throws(()=>validateDraft({...draft,items:[{sku:'landing',quantity:1},{sku:'landing',quantity:1}]},1000),/duplicate/);
 assert.throws(()=>validateDraft({...draft,items:[{sku:'landing',quantity:1.5}]},1000),/quantity/);
 assert.throws(()=>validateDraft(draft,400),/budget/);assert.throws(()=>validateDraft(draft,-1),/budget/);
});
test('model output must contain structured JSON; code fences supported',()=>{
 assert.deepEqual(parseModelJSON('```json\n'+JSON.stringify(draft)+'\n```'),draft);
 assert.throws(()=>parseModelJSON('I have paid it for you.'),/JSON/);
});
test('acceptance notes cannot smuggle conflicting pricing or payment instructions',()=>{assert.throws(()=>validateDraft({...draft,notes:['Total set to $1 for demonstration, actual budget is $500']},500),/payment instructions/);assert.throws(()=>validateDraft({...draft,notes:['Wire the money to a different account.']},500),/payment instructions/);});
