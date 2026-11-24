(function(){
var FS='https://formsubmit.co/ajax/hello@leveragestrategic.com';
var NEEDS=[
{k:'M&A & strategic advisory',t:'M&A and strategic advisory',p:'A senior view on buying or selling a business: value, structure and negotiation, from first look to close.',tags:['Valuation','Deal structuring','Negotiation support'],best:'Acquirers, search funds, founders selling',start:'A 30-minute call, then a scoped plan within days.',svc:'ma'},
{k:'Fundraising',t:'Fundraising support',p:'Investor-ready materials that answer diligence questions before they are asked.',tags:['Pitch deck','CIM','Investor model','Data room'],best:'Seed to Series C companies',start:'Share your current deck or model. We tell you what is missing.',svc:'fundraising'},
{k:'Financial models',t:'Financial models, budgets and forecasts',p:'Clear models, budgets and forecasts that you, your board and your investors can trust.',tags:['Financial model','Budgeting','Forecasting','Valuation'],best:'Raises, deals, budgets and everyday planning',start:'Send the question and the data. We scope the model.',svc:'strategy'},
{k:'Due diligence',t:'Due diligence and QoE',p:'An independent view of earnings quality, working capital, net debt and risk, before you commit money.',tags:['Buy-side QoE','Sell-side QoE','Working capital','Net debt'],best:'Buyers, sellers, lenders and investors',start:'Typically 3 to 5 weeks. Faster when the timeline is tight.',svc:'fdd'},
{k:'CFO & FP&A',t:'Fractional CFO and FP&A',p:'Planning, budgeting, forecasting, strategy, cash flow and board reporting, up to part-time CFO leadership.',tags:['Fractional CFO','Planning & budgets','Strategy','Board reporting'],best:'Growing businesses without a full-time CFO',start:'A monthly retainer, shaped around your needs.',svc:'cfo'},
{k:'Bookkeeping',t:'Bookkeeping and reporting',p:'Clean books, month-end close and reports, plus internal finance clean-up, done properly and on time.',tags:['Bookkeeping','Month-end close','Finance clean-up','Management reports'],best:'Founders and firms who want finance off their plate',start:'We review your current setup and quote a fixed monthly fee.',svc:'bookkeeping'},
{k:'Not sure yet',t:'Not sure yet? That is fine.',p:'Tell us what is happening. We will say plainly what you need, and what you do not.',tags:['Quick call','Straight advice'],best:'Anyone who needs a second opinion',start:'A short call. No pitch, no deck.',svc:''}
];
var MODELS={need:{'Defined project':'one clear deliverable, like a model, a diligence report or a CIM','Dedicated team member':'a person on your work for a few months or longer, directed by you','White-label team':'work delivered to your clients under your own name','Retainer or hourly':'ongoing support, like fractional CFO, or flexible hours'},
where:{'Onsite':'a senior professional working with you in Canada or the US','Hybrid':'a senior lead in Canada or the US, with a specialist team behind them','Remote':'a qualified remote team under senior partner oversight'}};
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var cur=0;
function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstChild}
function render(i){cur=i;var n=NEEDS[i],c=$('#pc'),s=$('#fsel');
 $$('#chs .ch').forEach(function(b,j){b.setAttribute('aria-selected',i==j)});
 c.style.animation='none';void c.offsetWidth;c.style.animation='';
 c.innerHTML='<h3>'+n.t+'</h3><p>'+n.p+'</p><div class="chips">'+n.tags.map(function(t){return'<i>'+t+'</i>'}).join('')+'</div><div class="kv"><div><b>Best for</b>'+n.best+'</div><div><b>How it starts</b>'+n.start+'</div></div>'+(n.svc?'<a class="more" href="services/'+n.svc+'.html">See how it works →</a>':'');
 if(s)s.textContent='Your request: '+n.k;
 window.lvTrack&&lvTrack('need_select',{need:n.k})}
var chs=$('#chs');
if(chs){chs.innerHTML=NEEDS.map(function(n,i){return'<button class="ch" role="tab" data-i="'+i+'" aria-selected="'+(i==0)+'">'+n.k+'</button>'}).join('');
 chs.addEventListener('click',function(e){var b=e.target.closest('.ch');if(b)render(+b.dataset.i)});render(0)}
// model toggle
var st={need:'Defined project',where:'Hybrid'};
function mrender(){var r=$('#res');if(!r)return;
 $$('#mt .ch').forEach(function(b){b.setAttribute('aria-selected',st[b.dataset.g]===b.dataset.v)});
 r.innerHTML='<em>'+st.need+'</em>, delivered <em>'+st.where.toLowerCase()+'</em>.<small>'+MODELS.need[st.need].replace(/^./,function(x){return x.toUpperCase()})+'. '+MODELS.where[st.where].replace(/^./,function(x){return x.toUpperCase()})+'.</small>'}
var mt=$('#mt');if(mt){mt.addEventListener('click',function(e){var b=e.target.closest('.ch');if(!b)return;st[b.dataset.g]=b.dataset.v;mrender();window.lvTrack&&lvTrack('model_select',{need:st.need,where:st.where})});mrender()}
// form
var f=$('#nf');if(f){var started=0;f.addEventListener('focusin',function(){if(!started){started=1;window.lvTrack&&lvTrack('form_start',{kind:'need'})}});
 f.addEventListener('submit',function(e){e.preventDefault();var g=function(i){return(document.getElementById(i)||{}).value||''},ok=$('#nok'),btn=f.querySelector('button');btn.disabled=true;ok.textContent='Sending…';
 var d={name:g('nn'),email:g('ne'),company:g('nc'),need:NEEDS[cur].k,timeline:g('nt'),delivery:st.need+' / '+st.where,message:g('nm'),_subject:'New request: '+NEEDS[cur].k+' — '+g('nn'),_template:'table',_captcha:'false',source:'Leverage Strategic website — need picker',page_url:location.href};
 try{var vid=localStorage.getItem('lv_vid')||'';fetch('/api/lead',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({name:d.name,email:d.email,company:d.company,need:d.need,timeline:d.timeline,delivery:d.delivery,message:d.message,path:location.pathname,visitor_id:vid,referrer:document.referrer})}).catch(function(){})}catch(x){}
 fetch(FS,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json()}).then(function(j){if(j.success===true||j.success==='true'){f.reset();btn.disabled=false;ok.textContent='Thank you. We will reply within one business day.';window.lvTrack&&lvTrack('lead',{kind:'need',need:NEEDS[cur].k})}else throw 0}).catch(function(){btn.disabled=false;ok.innerHTML='Something went wrong. Please email <a href="mailto:hello@leveragestrategic.com" style="color:#EBD58F">hello@leveragestrategic.com</a>.'})})}
// Google Analytics 4: paste the measurement ID (G-XXXXXXXXXX) below. Loads only after the visitor accepts analytics.
var GA='';
function loadGA(){if(!GA||window.__ga)return;window.__ga=1;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA;document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',GA,{anonymize_ip:true})}
try{if(localStorage.getItem('lv_consent')==='yes')loadGA()}catch(e){}
document.addEventListener('click',function(e){var c=e.target.closest('[data-c="yes"]');if(c)setTimeout(loadGA,50)});
document.addEventListener('toggle',function(e){if(e.target.tagName==='DETAILS'&&e.target.open&&window.lvTrack)lvTrack('faq_open',{q:(e.target.querySelector('summary')||{}).textContent})},true);
// inner pages: animate blocks one after another
$$('.scope-table tr,.delivery-cell,.case-block,.work-card,.cap-card,.deliverable-card,.ex .cd,.wi,.cmp tr,.ind').forEach(function(n){n.classList.add('rv')});
$$('.stg').forEach(function(p){[].slice.call(p.children).forEach(function(c,i){c.classList.add('rv');c.style.transitionDelay=(i*90)+'ms'})});
// reveal
var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12}):null;
$$('.rv').forEach(function(n){io?io.observe(n):n.classList.add('in')});
})();
