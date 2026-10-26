const BASE='https://api-m.sandbox.paypal.com';
export class PayPalSandbox {
 constructor({clientId,secret,fetcher=fetch}={}){Object.assign(this,{clientId,secret,fetcher});this.token=null;this.expiry=0;}
 configured(){return !!(this.clientId&&this.secret);}
 async accessToken(){if(!this.configured())throw new Error('Sandbox credentials are not configured. No payment was created.');if(this.token&&this.expiry>Date.now())return this.token;
  const r=await this.fetcher(`${BASE}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${this.clientId}:${this.secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error(`PayPal sandbox authorization failed (${r.status}). Check sandbox credentials.`);const j=await r.json();if(!j.access_token)throw new Error('PayPal sandbox returned no access token.');this.token=j.access_token;this.expiry=Date.now()+Math.max(0,(j.expires_in||300)-60)*1000;return this.token;
 }
 async request(path,body,key){const token=await this.accessToken();const r=await this.fetcher(`${BASE}${path}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','PayPal-Request-Id':key,Prefer:'return=representation'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!r.ok){if(r.status===401)this.token=null;throw new Error(`PayPal sandbox request failed (${r.status}). Retry or check sandbox activity; no success is assumed.`);}return r.json();}
 create(body,key){return this.request('/v2/checkout/orders',body,key);}
 capture(orderId,key){if(!/^[A-Za-z0-9]{6,40}$/.test(orderId))throw new Error('Invalid sandbox order ID.');return this.request(`/v2/checkout/orders/${orderId}/capture`,{},key);}
}
