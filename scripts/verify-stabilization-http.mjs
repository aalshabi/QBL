import assert from 'node:assert/strict';
const base='http://localhost:3407';
let checks=0;
function verify(name,actual,expected){assert.deepEqual(actual,expected,name);checks++;console.log('PASS '+name);}
async function login(email){const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Qbl-Local-Verification-Only-2026!'})});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];}
const clientCookie=await login('client-user@example.invalid');
for(const path of ['/api/admin/orders','/api/admin/reports','/api/admin/cod','/api/admin/fleet','/api/operations/cases']){
 verify('anonymous denied '+path,(await fetch(base+path)).status,401);
 verify('client denied '+path,(await fetch(base+path,{headers:{Cookie:clientCookie}})).status,403);
}
const cookie=await login('operator@example.invalid'),headers={'Content-Type':'application/json','x-qbl-ops-request':'v1',Origin:base,Cookie:cookie};
const listResponse=await fetch(base+'/api/operations/cases',{headers:{Cookie:cookie}});verify('case worklist available',listResponse.status,200);const list=await listResponse.json();
const body={orderId:list.orders[0].id,clientAccountId:list.clients[0].id,caseType:'DELIVERY_DISPUTE',priority:'P1',ownerId:list.users[0].id,backupOwnerId:list.users[1].id,ackDueAt:new Date(Date.now()+3600000).toISOString(),resolutionDueAt:new Date(Date.now()+7200000).toISOString()};
verify('case mutation rejects missing origin marker',(await fetch(base+'/api/operations/cases',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)})).status,403);
verify('case rejects cross-origin mutation',(await fetch(base+'/api/operations/cases',{method:'POST',headers:{...headers,Origin:'https://unrelated.invalid'},body:JSON.stringify(body)})).status,403);
const created=await fetch(base+'/api/operations/cases',{method:'POST',headers,body:JSON.stringify(body)});verify('case persisted over HTTP',created.status,200);const incident=await created.json();
verify('case closure without evidence rejected',(await fetch(base+'/api/operations/cases',{method:'PATCH',headers,body:JSON.stringify({id:incident.id,version:0,status:'CLOSED',resolution:'Synthetic closure attempt',evidence:[]})})).status,409);
verify('case closure with evidence and confirmation succeeds',(await fetch(base+'/api/operations/cases',{method:'PATCH',headers,body:JSON.stringify({id:incident.id,version:0,status:'CLOSED',resolution:'Synthetic recipient confirmed receipt',evidence:['SYNTHETIC-VERIFICATION-EVIDENCE'],customerConfirmed:true})})).status,200);
verify('closed case mutation rejected',(await fetch(base+'/api/operations/cases',{method:'PATCH',headers,body:JSON.stringify({id:incident.id,version:1,status:'IN_PROGRESS'})})).status,409);
for(const path of ['/api/cron/logestechs-reconcile','/api/cron/operations-cases'])verify('unauthorized job denied '+path,(await fetch(base+path)).status,401);
for(const path of ['/api/tracking/synthetic','/api/ops/stream','/cold-chain-system/client-dashboard','/courier'])verify('production demo blocked '+path,(await fetch(base+path)).status,503);
const report=await fetch(base+'/admin/reports',{headers:{Cookie:cookie}});verify('management report renders',report.status,200);verify('unknown margin remains unavailable',(await report.text()).includes('غير متاح'),true);
const result=await fetch(base+'/api/operations/reconciliation',{method:'POST',headers,body:JSON.stringify({clientAccountId:list.clients[0].id,source:'LOGESTECHS_CONTROLLED_EXPORT',sourceCapturedAt:new Date().toISOString(),windowStart:new Date(Date.now()-172800000).toISOString(),windowEnd:new Date(Date.now()-86400000).toISOString(),expectedCount:1,shipmentIds:['SYNTHETIC-MISSING-001']})});verify('controlled reconciliation persisted',result.status,200);const reconciled=await result.json();verify('source-only shipment prevents completeness',reconciled.complete,false);verify('missing shipment is identified',reconciled.missingIds,['SYNTHETIC-MISSING-001']);
console.log('HTTP_CHECKS_PASSED='+checks);
