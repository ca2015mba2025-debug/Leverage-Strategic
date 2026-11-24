/* Leverage Strategic first-party analytics. Anonymous IDs, no personal data, starts only after consent. Honors Do Not Track / Global Privacy Control. */
(function(){
var EP=window.LV_TRACK_URL||'/api/track';
if(location.protocol==='file:'||navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
var started=0;window.lvStart=start;
try{if(localStorage.getItem('lv_consent')==='yes')start()}catch(e){}
function start(){if(started)return;started=1;
var ls=function(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){}};
var ss=function(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){}};
var id=function(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)};
var vid=ls('lv_vid')||id();ls('lv_vid',vid);var sid=ss('lv_sid')||id();ss('lv_sid',sid);
var q=new URLSearchParams(location.search),utm={};['source','medium','campaign','term','content'].forEach(function(k){var v=q.get('utm_'+k)||ss('lv_utm_'+k);if(v){utm[k]=v;ss('lv_utm_'+k,v)}});
function send(ev,props){var p={event:ev,visitor_id:vid,session_id:sid,path:location.pathname,title:document.title.slice(0,150),referrer:(document.referrer||'').slice(0,300),utm:utm,props:props||{},vw:innerWidth};
 var b=JSON.stringify(p);try{if(navigator.sendBeacon&&navigator.sendBeacon(EP,new Blob([b],{type:'application/json'})))return}catch(e){}
 try{fetch(EP,{method:'POST',headers:{'Content-Type':'application/json'},body:b,keepalive:true})}catch(e){}}
window.lvTrack=send;send('pageview');
var seen={};addEventListener('scroll',function(){var h=document.documentElement,pct=Math.round((scrollY+innerHeight)/h.scrollHeight*100);[25,50,75,100].forEach(function(m){if(pct>=m&&!seen[m]){seen[m]=1;send('scroll',{depth:m})}})},{passive:true});
var clicks=[];
document.addEventListener('click',function(e){var now=Date.now();clicks.push([now,e.pageX,e.pageY]);clicks=clicks.filter(function(c){return now-c[0]<800});
 if(clicks.length>=3&&Math.abs(clicks[0][1]-e.pageX)<40&&Math.abs(clicks[0][2]-e.pageY)<40){send('rage_click',{x:Math.round(e.pageX/document.documentElement.clientWidth*100),y:Math.round(e.pageY)});clicks=[]}
 var a=e.target.closest('a,button');var pos={x:Math.round(e.pageX/document.documentElement.clientWidth*100),y:Math.round(e.pageY)};if(!a){send('click',Object.assign({label:'(non-link)'},pos));return}
 var sec=a.closest('section[id],nav,footer'),href=a.getAttribute('href')||'',label=(a.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
 var props=Object.assign({label:label,href:href.slice(0,200),section:sec?(sec.id||sec.tagName.toLowerCase()):''},pos);
 if(/\.pdf($|\?)/i.test(href)){props.file=href.split('/').pop();send('download',props)}
 else if(/^mailto:/i.test(href))send('email_click',props);else if(/^tel:/i.test(href))send('phone_click',props);
 else if(/calendly\.com/i.test(href))send('booking_click',props);
 else if(/^https?:/i.test(href)&&href.indexOf(location.host)<0)send('outbound_click',props);else send('click',props)});
/* cursor activity: sampled positions (x as % of width, y in 50px rows), flushed once on exit */
var pts=[],last=0,mx=0,my=0,moved=0;document.addEventListener('mousemove',function(e){mx=Math.round(e.pageX/document.documentElement.clientWidth*100);my=Math.round(e.pageY/50);moved=1},{passive:true});
setInterval(function(){if(!moved||pts.length>=60)return;moved=0;var k=mx+','+my;if(k!==last){last=k;pts.push([mx,my])}},500);
/* section dwell: seconds each section is at least half visible */
var dw={},cur={};if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){var i=en.target.id;if(en.isIntersecting){cur[i]=Date.now()}else if(cur[i]){dw[i]=(dw[i]||0)+(Date.now()-cur[i])/1000;delete cur[i]}})},{threshold:.5});
 [].forEach.call(document.querySelectorAll('section[id]'),function(s){io.observe(s)})}
var t0=Date.now(),sent=0;function exit(){if(sent)return;sent=1;
 Object.keys(cur).forEach(function(i){dw[i]=(dw[i]||0)+(Date.now()-cur[i])/1000});
 Object.keys(dw).forEach(function(i){if(dw[i]>=2)send('section',{id:i,seconds:Math.round(dw[i])})});
 if(pts.length)send('mouse',{pts:pts});send('engaged',{seconds:Math.round((Date.now()-t0)/1000)})}
addEventListener('pagehide',exit);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')exit()});
}
})();
