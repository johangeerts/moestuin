/* =====================================================================
   DE MOESTUIN, app-logica
   Vereist js/data.js (DATA, GLY, gicon, SYN, resolve, byId, *_LABEL, MND)
   ===================================================================== */
'use strict';

const NOW=new Date();
const CURM=NOW.getMonth()+1;
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ---- opslag: alleen de zelfgekozen planner (per browser, met fallback) ---- */
const mem={};
const STORE={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return k in mem?mem[k]:d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){mem[k]=v;}}
};
let PLAN=STORE.get('mt_plan',[]);
const savePlan=()=>STORE.set('mt_plan',PLAN);

/* ---- kleine icoonhelpers ---- */
const tiny=(d,w)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(w||1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const ICO={
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  kas:'<path d="M3 10l9-6 9 6v10H3z"/><path d="M12 4v16M3 10h18"/>',
  cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  leaf:'<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19C8 16 12 12 16 8"/>',
  cross:'<path d="M7 7l10 10M17 7L7 17"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  pin:'<path d="M12 21s-6-5.7-6-10a6 6 0 0 1 12 0c0 4.3-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>',
  drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  rule:'<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  hand:'<path d="M12 22V12M12 12c0-3-2-5-5-5 0 3 2 5 5 5zM12 11c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  seed:'<path d="M12 21c-4 0-7-3-7-7 4 0 7 3 7 7zM12 21c0-5 3-9 8-9 0 5-3 9-8 9z"/>',
};
const famLabel=f=>({vrucht:'Vruchtgroente',knol:'Knolgewas',wortel:'Wortelgewas',ui:'Ui-familie',blad:'Bladgewas',peul:'Vlinderbloemige',kool:'Koolfamilie',fruit:'Fruit',struik:'Bes / struik',kruid:'Kruid',bloem:'Bloem / helper'}[f]||f);

/* =====================================================================
   NAV / ROUTER
   ===================================================================== */
const NAVS=[
  {id:'soorten',label:'Soorten',ic:ICO.search},
  {id:'maatjes',label:'Maatjes',ic:'<path d="M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M11 7h3a3 3 0 0 1 3 3v3"/>'},
  {id:'planner',label:'Planner',ic:ICO.cal},
  {id:'maand',label:'Maandwijzer',ic:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4"/>'},
];
const navIcon=d=>'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
function buildNav(){
  const top=document.getElementById('topnav'),bot=document.getElementById('tabbar');
  NAVS.forEach(n=>{
    const make=()=>{const b=document.createElement('button');b.innerHTML=navIcon(n.ic)+'<span>'+n.label+'</span>';b.dataset.nav=n.id;b.onclick=()=>go(n.id);return b;};
    top.appendChild(make());bot.appendChild(make());
  });
}
let CURRENT='soorten';
function go(id){
  CURRENT=id;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+id));
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===id));
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='planner')renderPlanner();
  if(id==='maand')renderMaand();
}

/* =====================================================================
   gedeelde bouwstenen
   ===================================================================== */
function chip(label,kind){
  const id=resolve(label);
  return '<span class="chip '+kind+(id?' link':'')+'"'+(id?' data-jump="'+id+'"':'')+'>'+label+'</span>';
}
function bindJumps(scope){
  scope.querySelectorAll('[data-jump]').forEach(el=>{
    el.style.cursor='pointer';
    el.onclick=e=>{e.stopPropagation();hideTip();openDetail(el.dataset.jump);};
    const p=byId(el.dataset.jump);
    if(p&&p.tip){
      el.addEventListener('mouseenter',()=>showTip(el,p.tip));
      el.addEventListener('mouseleave',hideTip);
      el.addEventListener('focus',()=>showTip(el,p.tip));
      el.addEventListener('blur',hideTip);
    }
  });
}
function miniCal(p){
  let h='<div class="mini-cal">';
  for(let m=1;m<=12;m++){
    const s=p.voor.includes(m)||p.zaai.includes(m),pl=p.uit.includes(m),hv=p.oogst.includes(m);
    let c='';if(s&&pl)c='sp';else if(pl&&hv)c='ph';else if(hv)c='h';else if(pl)c='p';else if(s)c='s';
    h+='<i class="'+c+'"></i>';
  }
  return h+'</div>';
}

/* =====================================================================
   SOORTEN
   ===================================================================== */
const FILTERS={q:'',type:'alle',loc:'alle',maand:false};
function buildFilters(){
  const f=document.getElementById('filters');
  const groups=[
    {key:'type',label:'Soort',opts:[['alle','Alles'],['groente','Groenten'],['fruit','Fruit'],['kruid','Kruiden']]},
    {key:'loc',label:'Plek',opts:[['alle','Overal'],['kas','Kas'],['openlucht','Open lucht']]},
  ];
  let h='';
  groups.forEach(g=>{h+='<div class="filtergroup"><span class="glab">'+g.label+'</span>';g.opts.forEach(o=>{h+='<button class="chipbtn" data-fk="'+g.key+'" data-fv="'+o[0]+'">'+o[1]+'</button>';});h+='</div>';});
  h+='<div class="filtergroup"><button class="chipbtn t-gold" data-month="1">Wat kan ik deze maand?</button></div>';
  f.innerHTML=h;
  f.querySelectorAll('[data-fk]').forEach(b=>b.onclick=()=>{FILTERS[b.dataset.fk]=b.dataset.fv;renderSoorten();});
  f.querySelector('[data-month]').onclick=()=>{FILTERS.maand=!FILTERS.maand;renderSoorten();};
}
function syncFilterUI(){
  document.querySelectorAll('[data-fk]').forEach(b=>b.classList.toggle('on',FILTERS[b.dataset.fk]===b.dataset.fv));
  const mb=document.querySelector('[data-month]');if(mb)mb.classList.toggle('on',FILTERS.maand);
}
const activeMonths=p=>[].concat(p.voor,p.zaai,p.uit,p.oogst);
function matchFilters(p){
  if(FILTERS.type!=='alle'&&p.type!==FILTERS.type)return false;
  if(FILTERS.loc==='kas'&&!(p.loc==='kas'||p.loc==='beide'))return false;
  if(FILTERS.loc==='openlucht'&&!(p.loc==='openlucht'||p.loc==='beide'))return false;
  if(FILTERS.maand&&!activeMonths(p).includes(CURM))return false;
  if(FILTERS.q){const q=FILTERS.q.toLowerCase();
    const inRas=(p.rassen||[]).some(r=>r.naam.toLowerCase().includes(q)||r.type.toLowerCase().includes(q));
    if(!(p.naam.toLowerCase().includes(q)||p.lat.toLowerCase().includes(q)||inRas))return false;}
  return true;
}
function pcard(p){
  const locTag=p.loc==='kas'?'<span class="tag kas">'+tiny(ICO.kas)+'Kas</span>'
    :p.loc==='openlucht'?'<span class="tag lucht">'+tiny(ICO.sun)+'Buiten</span>'
    :'<span class="tag">'+tiny(ICO.kas)+'Kas of buiten</span>';
  const rasTag=p.rassen&&p.rassen.length?'<span class="tag rassen-tag">'+tiny(ICO.seed)+p.rassen.length+' rassen</span>':'';
  return '<button class="pcard t-'+p.type+'" data-open="'+p.id+'">'
    +'<div class="top"><span class="gly">'+gicon(p.fam)+'</span><div><h3>'+p.naam+'</h3><div class="lat">'+p.lat+'</div></div></div>'
    +miniCal(p)+'<div class="tags">'+locTag+'<span class="tag">'+TYPE_LABEL[p.type]+'</span>'+rasTag+'</div></button>';
}
function renderSoorten(){
  syncFilterUI();
  const list=DATA.filter(matchFilters),grid=document.getElementById('soortenGrid');
  document.getElementById('resultMeta').textContent=list.length+' van '+DATA.length+' soorten'+(FILTERS.maand?' • teelbaar in '+MND[CURM-1]:'');
  if(!list.length){grid.innerHTML='<div class="empty" style="grid-column:1/-1">'+tiny(ICO.search)+'<b>Niets gevonden</b>Pas je zoekterm of filters aan.</div>';return;}
  grid.innerHTML=list.map(pcard).join('');
  grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDetail(b.dataset.open));
}

/* =====================================================================
   MAATJES
   ===================================================================== */
function buildChecker(){
  const sel=document.getElementById('checkerSel');
  sel.innerHTML='<option value="">,  kies een soort , </option>'+DATA.map(p=>'<option value="'+p.id+'">'+p.naam+' ('+TYPE_LABEL[p.type]+')</option>').join('');
  sel.onchange=()=>{
    const p=byId(sel.value),out=document.getElementById('checkerOut');
    if(!p){out.classList.remove('show');return;}
    out.classList.add('show');
    document.getElementById('checkGood').innerHTML=p.vrienden.map(v=>chip(v,'good')).join('')||'<span class="chip good">geen bekend</span>';
    document.getElementById('checkBad').innerHTML=p.vijanden.length?p.vijanden.map(v=>chip(v,'bad')).join(''):'<span class="chip good">geen, een gemakkelijke buur</span>';
    bindJumps(out);
  };
}
let MSUB='groente';
function buildMaatjesSub(){
  const s=document.getElementById('maatjesSub');
  [['groente','Groenten'],['fruit','Fruit'],['kruid','Kruiden']].forEach(([k,l])=>{
    const b=document.createElement('button');b.textContent=l;b.dataset.sub=k;b.onclick=()=>{MSUB=k;renderMaatjesTable();};s.appendChild(b);
  });
}
function renderMaatjesTable(){
  document.querySelectorAll('[data-sub]').forEach(b=>b.classList.toggle('active',b.dataset.sub===MSUB));
  const rows=DATA.filter(p=>p.type===MSUB),isHerb=MSUB==='kruid';
  let h='<div class="tablewrap"><table class="maatjes"><thead><tr><th>'+(isHerb?'Kruid / bloem':'Soort')+'</th><th>Goede buren</th>'+(isHerb?'<th>Werking in de tuin</th>':'<th>Liever niet samen</th>')+'</tr></thead><tbody>';
  rows.forEach(p=>{
    h+='<tr><td><div class="namecell t-'+p.type+'" data-jump="'+p.id+'"><span class="gly">'+gicon(p.fam)+'</span><span><span class="nm-n">'+p.naam+'</span><span class="nm-l">'+p.lat+'</span></span></div></td>';
    h+='<td class="lbl-good" data-label="Goede buren"><div class="chips">'+p.vrienden.map(v=>chip(v,'good')).join('')+'</div></td>';
    if(isHerb)h+='<td class="cell-work lbl-gold" data-label="Werking in de tuin">'+p.tip+'</td>';
    else h+='<td class="lbl-bad" data-label="Liever niet samen">'+(p.vijanden.length?'<div class="chips">'+p.vijanden.map(v=>chip(v,'bad')).join('')+'</div>':'<span class="cell-work">, </span>')+'</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  const wrap=document.getElementById('maatjesTable');wrap.innerHTML=h;bindJumps(wrap);
}

/* =====================================================================
   PLANNER (zelf samen te stellen zaaikalender)
   ===================================================================== */
function buildPlannerControls(){
  const add=document.getElementById('plannerAdd');
  add.innerHTML='<option value="">+ Voeg een soort toe…</option>'+DATA.map(p=>'<option value="'+p.id+'">'+p.naam+'</option>').join('');
  add.onchange=()=>{if(add.value&&!PLAN.includes(add.value)){PLAN.push(add.value);savePlan();renderPlanner();}add.value='';};
  document.getElementById('plannerStarter').onclick=()=>{PLAN=['tomaat','sla','wortel','radijs','boon','courgette','aardbei','basilicum'];savePlan();renderPlanner();toast('Startset toegevoegd');};
  document.getElementById('plannerClear').onclick=()=>{PLAN=[];savePlan();renderPlanner();};
}
function renderPlanner(){
  const cal=document.getElementById('plannerCal');
  if(!PLAN.length){cal.innerHTML='<div class="empty">'+tiny(ICO.cal)+'<b>Je kalender is nog leeg</b>Voeg soorten toe of begin met een startset.</div>';return;}
  let h='<table class="calendar"><thead><tr><th class="plant-col">Soort</th>';
  for(let m=1;m<=12;m++)h+='<th class="'+(m===CURM?'now':'')+'">'+MND[m-1]+'</th>';
  h+='</tr></thead><tbody>';
  PLAN.map(byId).filter(Boolean).forEach(p=>{
    h+='<tr><td class="cal-name t-'+p.type+'"><div class="nmrow"><span class="gly" data-jump="'+p.id+'">'+gicon(p.fam)+'</span><span class="nn" data-jump="'+p.id+'">'+p.naam+'</span><span class="rm" data-rm="'+p.id+'" title="Verwijderen">'+tiny(ICO.x,2)+'</span></div></td>';
    for(let m=1;m<=12;m++){
      const s=p.voor.includes(m)||p.zaai.includes(m),pl=p.uit.includes(m),hv=p.oogst.includes(m);
      h+='<td class="cal-cell '+(m===CURM?'now':'')+'"><div class="bars">'+(s?'<div class="bar s"></div>':'')+(pl?'<div class="bar p"></div>':'')+(hv?'<div class="bar h"></div>':'')+'</div></td>';
    }
    h+='</tr>';
  });
  cal.innerHTML=h+'</tbody></table>';
  cal.querySelectorAll('[data-rm]').forEach(el=>el.onclick=e=>{e.stopPropagation();PLAN=PLAN.filter(x=>x!==el.dataset.rm);savePlan();renderPlanner();});
  bindJumps(cal);
}

/* =====================================================================
   MAANDWIJZER (wat zaai / plant / oogst ik in maand X), puur uit de data
   ===================================================================== */
let MAAND=CURM;
function buildMonthSelect(){
  const sel=document.getElementById('monthSelect');
  sel.innerHTML=MND.map((m,i)=>'<button data-m="'+(i+1)+'">'+m+'</button>').join('');
  sel.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{MAAND=+b.dataset.m;renderMaand();});
}
function maandChips(list){
  if(!list.length)return '<div class="none">Niets deze maand.</div>';
  return '<div class="chips">'+list.map(p=>'<span class="chip" data-jump="'+p.id+'">'+p.naam+'</span>').join('')+'</div>';
}
function renderMaand(){
  document.querySelectorAll('#monthSelect [data-m]').forEach(b=>b.classList.toggle('on',+b.dataset.m===MAAND));
  const zaai=DATA.filter(p=>p.voor.includes(MAAND)||p.zaai.includes(MAAND));
  const plant=DATA.filter(p=>p.uit.includes(MAAND));
  const oogst=DATA.filter(p=>p.oogst.includes(MAAND));
  const col=(cls,icoOn,title,list)=>'<div class="mcol '+cls+'"><h3><span class="dot"></span>'+title+'</h3><div class="cnt">'+list.length+' soort'+(list.length===1?'':'en')+'</div>'+maandChips(list)+'</div>';
  const wrap=document.getElementById('maandCols');
  wrap.innerHTML=col('sow','','Zaaien / voorzaaien',zaai)+col('plant','','Uitplanten / poten',plant)+col('harvest','','Oogsten',oogst);
  bindJumps(wrap);
}

/* =====================================================================
   DETAIL MODAL
   ===================================================================== */
const modal=document.getElementById('modal');
const factRow=(k,v,ic)=>'<div class="fact"><div class="k">'+ic+k+'</div><div class="v">'+v+'</div></div>';
const sowStrip=a=>{let h='';for(let m=1;m<=12;m++)h+='<i class="'+(a.includes(m)?'on-s':'')+'"></i>';return h;};
const plantStrip=a=>{let h='';for(let m=1;m<=12;m++)h+='<i class="'+(a.includes(m)?'on-p':'')+'"></i>';return h;};
const harvStrip=a=>{let h='';for(let m=1;m<=12;m++)h+='<i class="'+(a.includes(m)?'on-h':'')+'"></i>';return h;};
function successieNote(p){
  if(!['sla','radijs','spinazie','andijvie'].includes(p.id))return '';
  return '<div class="tip-box" style="background:var(--sow-bg);margin-top:10px">'+tiny(ICO.repeat)+'<div><b>Successie-zaaien.</b> Zaai om de 2–3 weken een nieuwe rij '+p.naam.toLowerCase()+' voor een oogst die de hele zomer doorloopt.</div></div>';
}
function rassenBlock(p){
  if(!p.rassen||!p.rassen.length)return '';
  return '<div class="m-block"><h4>'+tiny(ICO.seed)+'Populaire rassen ('+p.rassen.length+')</h4><div class="rassen">'
    +p.rassen.map(r=>'<div class="ras"><div class="ras-h"><span class="ras-n">'+r.naam+'</span><span class="ras-t">'+r.type+'</span></div><div class="ras-k">'+r.kort+'</div></div>').join('')
    +'</div></div>';
}
function spacingCalc(p){
  if(!p.afstand)return '';
  const rij=p.rij||p.afstand;
  const hint=rij===p.afstand
    ? 'Op basis van '+p.afstand+' cm in een vierkant raster.'
    : p.afstand+' cm in de rij, '+rij+' cm tussen de rijen.';
  return '<div class="m-block"><h4>'+tiny(ICO.grid)+'Hoeveel passen er?</h4><div class="calc">'
    +'<div class="row">Bed van <input id="calcL" type="number" min="10" value="120"> × <input id="calcB" type="number" min="10" value="80"> cm</div>'
    +'<div class="res" id="calcRes"></div>'
    +'<div class="hint">'+hint+' Een ruwe richtlijn; de randen tellen niet altijd mee.</div>'
    +'</div></div>';
}
function bindCalc(p){
  const L=document.getElementById('calcL'),B=document.getElementById('calcB'),res=document.getElementById('calcRes');
  if(!L)return;
  const rij=p.rij||p.afstand;
  const upd=()=>{
    const rijen=Math.max(0,Math.floor((+B.value)/rij));
    const perRij=Math.max(0,Math.floor((+L.value)/p.afstand));
    const n=rijen*perRij;
    res.innerHTML='Daar passen ongeveer <b>'+n+'</b> planten in'+(n?' ('+rijen+' rijen van '+perRij+')':'')+'.';
  };
  L.oninput=upd;B.oninput=upd;upd();
}
function openDetail(id){
  const p=byId(id);if(!p)return;
  const sow=[].concat(p.voor,p.zaai);
  let cal='<div class="m-cal">';
  if(sow.length)cal+='<div class="m-cal-row"><span class="rl">Zaaien</span><div class="m-cal-strip">'+sowStrip(sow)+'</div></div>';
  if(p.uit.length)cal+='<div class="m-cal-row"><span class="rl">Uitplanten</span><div class="m-cal-strip">'+plantStrip(p.uit)+'</div></div>';
  if(p.oogst.length)cal+='<div class="m-cal-row"><span class="rl">Oogsten</span><div class="m-cal-strip">'+harvStrip(p.oogst)+'</div></div>';
  cal+='<div class="m-cal-months">'+MND.map((m,i)=>'<i class="'+(i+1===CURM?'now':'')+'">'+m[0]+'</i>').join('')+'</div></div>';
  const friends=p.vrienden.map(v=>chip(v,'good')).join('');
  const foes=p.vijanden.length?p.vijanden.map(v=>chip(v,'bad')).join(''):'<span class="chip good">geen, makkelijke buur</span>';
  const duur=p.duur?p.duur+' dagen tot oogst':'meerjarig';
  const sheet=document.getElementById('modalSheet');
  sheet.innerHTML=
    '<div class="hdr"><button class="close" data-close>'+tiny(ICO.x,2)+'</button>'
    +'<div class="m-eyebrow"><span class="gly t-'+p.type+'">'+gicon(p.fam)+'</span>'+TYPE_LABEL[p.type]+' · '+famLabel(p.fam)+'</div>'
    +'<h2 id="m-title">'+p.naam+'<span class="lat">'+p.lat+'</span></h2></div>'
    +'<div class="body">'
    +'<div class="facts">'
      +factRow('Plek',LOC_LABEL[p.loc],tiny(ICO.pin))
      +factRow('Zon',cap(p.zon),tiny(ICO.sun))
      +factRow('Water',WATER_LABEL[p.water],tiny(ICO.drop))
      +factRow('Plantafstand',p.afstand+' cm'+(p.rij&&p.rij!==p.afstand?' · rij '+p.rij+' cm':''),tiny(ICO.rule))
      +factRow('Zaaidiepte',p.diepte?p.diepte+' cm':'oppervlakkig',tiny(ICO.rule))
      +factRow('Duur',duur,tiny(ICO.clock))
    +'</div>'
    +'<div class="m-block"><h4>'+tiny(ICO.cal)+'Beste moment</h4>'+cal+'</div>'
    +'<div class="m-block"><h4>'+tiny(ICO.leaf)+'Goede buren</h4><div class="chips">'+friends+'</div></div>'
    +'<div class="m-block"><h4>'+tiny(ICO.cross,2)+'Liever niet samen</h4><div class="chips">'+foes+'</div></div>'
    +'<div class="tip-box">'+tiny(ICO.bulb)+'<div><b>Maatjestip.</b> '+p.tip+'</div></div>'
    +'<div class="care-box">'+tiny(ICO.hand)+'<div><b>Verzorging.</b> '+p.zorg+'</div></div>'
    +successieNote(p)
    +rassenBlock(p)
    +spacingCalc(p)
    +'</div>'
    +'<div class="m-actions"><button class="btn" data-addplan="'+p.id+'">'+tiny(ICO.cal)+'Zet in mijn kalender</button></div>';
  bindJumps(sheet);bindCalc(p);
  sheet.querySelector('[data-addplan]').onclick=()=>{if(!PLAN.includes(p.id)){PLAN.push(p.id);savePlan();}toast(p.naam+' staat in je kalender');};
  sheet.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
  modal.classList.add('open');lockBody();
}
let _scrollY=0;
function lockBody(){
  _scrollY=window.scrollY;
  const b=document.body.style;
  b.position='fixed';b.top=(-_scrollY)+'px';b.left='0';b.right='0';b.width='100%';
}
function unlockBody(){
  const b=document.body.style;
  b.position='';b.top='';b.left='';b.right='';b.width='';
  window.scrollTo(0,_scrollY);
}
function closeModal(){modal.classList.remove('open');unlockBody();}
modal.querySelector('.scrim').onclick=closeModal;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

/* =====================================================================
   MISC + INIT
   ===================================================================== */
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}

/* tooltip met de maatjestip, bij hover of focus op een plantverwijzing */
const tipPop=document.createElement('div');tipPop.className='tip-pop';document.body.appendChild(tipPop);
function showTip(el,text){
  tipPop.innerHTML='<div class="tl">'+tiny(ICO.bulb)+'Maatjestip</div>'+text;
  tipPop.classList.add('show');
  const r=el.getBoundingClientRect(),sx=window.scrollX,sy=window.scrollY;
  const pw=tipPop.offsetWidth,ph=tipPop.offsetHeight,vw=document.documentElement.clientWidth;
  let left=sx+r.left+r.width/2-pw/2;
  left=Math.max(sx+8,Math.min(left,sx+vw-pw-8));
  let top=sy+r.top-ph-9;
  if(r.top-ph-9<0)top=sy+r.bottom+9;
  tipPop.style.left=left+'px';tipPop.style.top=top+'px';
}
function hideTip(){tipPop.classList.remove('show');}
window.addEventListener('scroll',hideTip,true);
document.getElementById('monthPill').innerHTML='Nu: <b>'+cap(NOW.toLocaleDateString('nl-NL',{month:'long'}))+'</b>';

buildNav();
buildFilters();
document.getElementById('search').addEventListener('input',e=>{FILTERS.q=e.target.value;renderSoorten();});
renderSoorten();
buildChecker();buildMaatjesSub();renderMaatjesTable();
buildPlannerControls();
buildMonthSelect();
