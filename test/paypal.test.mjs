import test from 'node:test';import assert from 'node:assert/strict';
import { PayPalSandbox } from '../src/paypal.mjs';
test('sandbox adapter authenticates, sends idempotency key and never uses live host',async()=>{
 const calls=[];const fake=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>url.endsWith('/token')?{access_token:'TEST',expires_in:300}:{id:'ORDER',status:'CREATED',links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER'}]}}};
 const p=new PayPalSandbox({clientId:'test',secret:'test',fetcher:fake});
 await p.create({intent:'CAPTURE'},'quote-key');
 assert.equal(calls.length,2);assert.ok(calls.every(x=>x.url.startsWith('https://api-m.sandbox.paypal.com/')));
 assert.equal(calls[1].opts.headers['PayPal-Request-Id'],'quote-key');
});
test('no credentials means explicit unavailable, never synthetic success',async()=>{
 const p=new PayPalSandbox({});await assert.rejects(()=>p.create({},'x'),/Sandbox credentials/);
});
test('provider errors are concise and do not expose secret or raw body',async()=>{
 const p=new PayPalSandbox({clientId:'a',secret:'TOPSECRET',fetcher:async()=>({ok:false,status:401,json:async()=>({message:'TOPSECRET',debug_id:'debug-123',name:'AUTHENTICATION_FAILURE'})})});
 await assert.rejects(()=>p.create({},'x'),e=>!e.message.includes('TOPSECRET')&&e.message.includes('401'));
});
