import {PayPalSandbox} from '../src/paypal.mjs';
const p=new PayPalSandbox({clientId:process.env.PAYPAL_CLIENT_ID,secret:process.env.PAYPAL_CLIENT_SECRET});
console.log(JSON.stringify({node:process.version,aiEndpointConfigured:!!process.env.AI_BASE_URL,aiModelConfigured:!!process.env.AI_MODEL,aiKeyConfigured:!!process.env.AI_API_KEY,paypalSandboxConfigured:p.configured(),mode:'read-only readiness; no orders or captures'},null,2));
if(p.configured()){try{await p.accessToken();console.log('PayPal sandbox OAuth: passed (token not displayed).');}catch(e){console.log(e.message);process.exitCode=1;}}
if(process.env.AI_BASE_URL){try{const r=await fetch(process.env.AI_BASE_URL.replace(/\/$/,'')+'/models',{headers:process.env.AI_API_KEY?{Authorization:`Bearer ${process.env.AI_API_KEY}`}:{},signal:AbortSignal.timeout(10000)});console.log(`AI models endpoint: HTTP ${r.status}`);}catch{console.log('AI endpoint not reachable.');process.exitCode=1;}}
