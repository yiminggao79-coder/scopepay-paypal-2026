import http from 'node:http';import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {randomUUID,timingSafeEqual} from 'node:crypto';
import {catalog,validateDraft,orderPayload} from './src/quote.mjs';import {draftScope} from './src/ai.mjs';import {PayPalSandbox} from './src/paypal.mjs';
const dir=fileURLToPath(new URL('.',import.meta.url)),port=Number(process.env.PORT||4313),host=process.env.HOST||'127.0.0.1';const base=process.env.PUBLIC_BASE_URL||`http://127.0.0.1:${port}`;const csrf=randomUUID();const locks=new Map();
if(host!=='127.0.0.1'&&host!=='localhost'&&!process.env.ADMIN_KEY)throw new Error('Set ADMIN_KEY before exposing this single-operator workspace.');
if(!/^https?:\/\//.test(base))throw new Error('PUBLIC_BASE_URL must be an HTTP or HTTPS URL.');
const dataDir=process.env.DATA_DIR||dir+'data';mkdirSync(dataDir,{recursive:true});const file=dataDir+'/state.json';let db={quotes:{},activity:[]};if(existsSync(file)){try{db=JSON.parse(readFileSync(file,'utf8'));if(!db.quotes||!Array.isArray(db.activity))throw new Error();}catch{throw new Error('Stored payment state is unreadable. Restore or inspect data/state.json before continuing.');}}
function save(){writeFileSync(file+'.tmp',JSON.stringify(db,null,2));renameSync(file+'.tmp',file);}
function log(text){db.activity.unshift({at:new Date().toISOString(),text});db.activity=db.activity.slice(0,50);save();}
const paypal=new PayPalSandbox({clientId:process.env.PAYPAL_CLIENT_ID,secret:process.env.PAYPAL_CLIENT_SECRET});
function admin(req){if(!process.env.ADMIN_KEY)return true;const h=req.headers.authorization||'';if(!h.startsWith('Basic '))return false;const p=Buffer.from(h.slice(6),'base64').toString().split(':').slice(1).join(':');const a=Buffer.from(p),b=Buffer.from(process.env.ADMIN_KEY);return a.length===b.length&&timingSafeEqual(a,b);}
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>14000)throw new Error('Request too large.');}return JSON.parse(s||'{}');}
async function once(id,fn){if(locks.has(id))return locks.get(id);const p=fn();locks.set(id,p);try{return await p;}finally{locks.delete(id);}}
function getQuote(id){const q=db.quotes[id];if(!q)throw new Error('Quote not found. Draft a new scope.');return q;}
function checkedQuote(q){if(!q)return null;try{validateDraft(q,q.budgetCents/100);return q;}catch(e){return {...q,reviewError:e.message};}}
const server=http.createServer(async(req,res)=>{try{
 const allowedHosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`,new URL(base).host]);if(!allowedHosts.has(req.headers.host))return json(res,403,{error:'Host is not allowed.'});
 if(!admin(req)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="ScopePay workspace"'});res.end('Workspace authorization required.');return;}
 const u=new URL(req.url,'http://localhost');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method==='GET'&&u.pathname==='/api/state')return json(res,200,{csrf,catalog,aiConfigured:!!(process.env.AI_BASE_URL&&process.env.AI_MODEL),model:process.env.AI_MODEL||null,paypalConfigured:paypal.configured(),activity:db.activity,quote:checkedQuote(Object.values(db.quotes).at(-1))});
 if(req.method==='GET'&&u.pathname==='/api/quotes')return json(res,200,{quotes:Object.values(db.quotes).reverse().map(checkedQuote)});
 if(req.method==='POST'&&u.pathname.startsWith('/api/')){
  if(req.headers['x-csrf-token']!==csrf)return json(res,403,{error:'Refresh the workspace before making changes.'});const b=await body(req);
  if(u.pathname==='/api/draft'){
   if(Object.keys(db.quotes).length>500)throw new Error('Local quote limit reached. Archive completed data before adding more.');
   let draft,source;if(b.rehearsal===true){draft={title:'Pottery studio website',items:[{sku:'landing',quantity:1},{sku:'accessibility',quantity:1}],notes:['One responsive landing page with studio details and a contact section.','Review keyboard access, headings and color contrast; provide a prioritized issue list.']};source='rehearsal';}
   else{draft=await draftScope(b.brief,b.budget);source='ai';}
   const q=validateDraft(draft,b.budget);q.source=source;q.model=source==='ai'?process.env.AI_MODEL:null;db.quotes[q.id]=q;log(`${source==='ai'?'AI':'Rehearsal'} scope drafted. Catalog total $${(q.totalCents/100).toFixed(2)}.`);return json(res,200,{quote:q,activity:db.activity});
  }
  if(u.pathname==='/api/order'){
   if(b.approved!==true)throw new Error('Review and approve the scope before checkout.');const q=getQuote(b.quoteId);
   if(q.source!=='ai')throw new Error('Rehearsal scopes cannot create PayPal orders. Draft a scope with a configured AI service.');
   validateDraft(q,q.budgetCents/100);
   const result=await once(q.id,async()=>{
    if(q.orderId)return {quote:q,approvalUrl:q.approvalUrl};
    const order=await paypal.create(orderPayload(q,base),`create-${q.id}`);const link=order.links?.find(l=>['approve','payer-action'].includes(l.rel));
    if(!order.id||!link?.href)throw new Error('PayPal returned no approval link. No payment success is assumed.');const dest=new URL(link.href);if(dest.protocol!=='https:'||dest.hostname!=='www.sandbox.paypal.com')throw new Error('Unexpected checkout destination; stopped.');
    q.orderId=order.id;q.approvalUrl=link.href;q.status='awaiting buyer approval';log('PayPal sandbox order created. Buyer approval is required.');return {quote:q,approvalUrl:link.href};
   });return json(res,200,{...result,activity:db.activity});
  }
  if(u.pathname==='/api/capture'){
   const q=getQuote(b.quoteId);if(!q.orderId||b.orderId!==q.orderId)throw new Error('Checkout order does not match this quote.');
   const result=await once(q.id,async()=>{if(q.status==='captured')return q;
    const result=await paypal.capture(q.orderId,`capture-${q.id}`);const captures=result.purchase_units?.flatMap(p=>p.payments?.captures||[])||[];const total=captures.reduce((n,c)=>n+Math.round(Number(c.amount?.value)*100),0);
    if(result.status!=='COMPLETED'||!captures.length||captures.some(c=>c.status!=='COMPLETED'||c.amount?.currency_code!=='USD')||total!==q.totalCents)throw new Error('Capture is not confirmed for the expected amount. Inspect PayPal sandbox activity before retrying.');
    q.status='captured';q.captureIds=captures.map(c=>c.id);q.capturedAt=new Date().toISOString();log(`PayPal sandbox capture confirmed: $${(q.totalCents/100).toFixed(2)} USD.`);return q;
   });return json(res,200,{quote:result,activity:db.activity});
  }
  return json(res,404,{error:'Unknown action.'});
 }
 const vendor={'/vendor/ag-grid.js':'dist/ag-grid-community.min.noStyle.js','/vendor/ag-grid.css':'styles/ag-grid.css','/vendor/ag-theme-quartz.css':'styles/ag-theme-quartz.css'};
 if(req.method==='GET'&&vendor[u.pathname]){res.writeHead(200,{'Content-Type':u.pathname.endsWith('.css')?'text/css':'text/javascript'});return res.end(readFileSync(dir+'node_modules/ag-grid-community/'+vendor[u.pathname]));}
 const files={'/':'index.html','/style.css':'style.css','/app.js':'app.js'};const f=files[u.pathname];if(req.method!=='GET'||!f)return json(res,404,{error:'Not found.'});const type=f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css':'text/javascript';res.writeHead(200,{'Content-Type':type,'Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self' data:; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'"});res.end(readFileSync(dir+'public/'+f));
}catch(e){json(res,400,{error:e instanceof SyntaxError?'Invalid request.':e.message});}});
server.listen(port,host,()=>console.log(`ScopePay: http://${host}:${port} — sandbox only; AI ${process.env.AI_BASE_URL?'configured':'not configured'}, PayPal ${paypal.configured()?'configured':'not configured'}`));
process.on('SIGTERM',()=>server.close());
