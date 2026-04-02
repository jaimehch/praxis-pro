// ═══════════════════════════════════════════════════════════════════
// PRAXIS Pro V9 — Motor JavaScript
// Arquitectura limpia · Proxy seguro · Claude streaming · docx.js
// ═══════════════════════════════════════════════════════════════════
'use strict';

// ── CONSTANTES ──────────────────────────────────────────────────────
const V9 = {
  storage:    'praxis_v9',
  obsStorage: 'praxis_v9_obs',
  aiStorage:  'praxis_v9_ai',
  ver:        1,
  proxyUrl:   '/api/claude',   // Edge Function: API key nunca llega al browser
};

const PRECIOS = {
  diagnostico: { pequeño:150000, mediano:220000, grande:320000 },
  cierre:      { pequeño:380000, mediano:520000, grande:720000 },
  total:       { pequeño:650000, mediano:890000, grande:1200000 },
};
const PKG_NOMBRES = {
  diagnostico:'🔍 Diagnóstico DS N°44',
  cierre:     '📋 Cierre de Brechas',
  total:      '⭐ Servicio Total PRAXIS',
};
const ADDONS_PRECIOS = {
  capacitacion:{ nombre:'Capacitación 8h DS N°44',        precio:95000,  sufijo:'' },
  simulacro:   { nombre:'Simulacro + acta certificada',   precio:75000,  sufijo:'' },
  mapa:        { nombre:'Mapa de riesgos vectorial',      precio:60000,  sufijo:'' },
  acomp:       { nombre:'Acompañamiento inspección',      precio:120000, sufijo:'' },
  retainer:    { nombre:'Retainer mensual preventivo',    precio:180000, sufijo:'/mes' },
  rx:          { nombre:'Gestión autorización RX SEREMI', precio:150000, sufijo:'' },
};
const SECCIONES = {
  s1:'Sistema de Gestión SST',s2:'Identificación de Peligros (MIPER)',
  s3:'Programa Preventivo',s4:'Información y Formación',s5:'Consulta y Participación',
  s6:'Riesgo Grave e Inminente / Emergencias',s7:'Coordinación Preventiva',
  s8:'Comités Paritarios (CPHS)',s9:'Departamentos de Prevención',
  s10:'Reglamentos Internos (RIHS)',s11:'Mapas de Riesgos',
  s12:'Vigilancia Ambiental y de Salud',s13:'Traslado de Puesto',
  s14:'Investigación AT y EP',s15:'Registros e Indicadores',
};
const SEV = {
  1:'Crítica',2:'Crítica',3:'Alta',4:'Alta',5:'Alta',6:'Alta',7:'Alta',
  8:'Crítica',9:'Alta',10:'Alta',11:'Media',12:'Crítica',13:'Alta',14:'Alta',
  15:'Alta',16:'Media',17:'Media',18:'Media',19:'Media',20:'Media',
  21:'Alta',22:'Alta',23:'Alta',24:'Alta',25:'Media',26:'Media',
  27:'Alta',28:'Alta',29:'Media',30:'Alta',31:'Media',32:'Media',
  33:'Media',34:'Media',35:'Media',36:'Media',37:'Media',38:'Media',
  39:'Alta',40:'Alta',41:'Media',42:'Media',43:'Media',44:'Media',
  45:'Media',46:'Alta',47:'Media',48:'Media',49:'Crítica',50:'Crítica',
  51:'Crítica',52:'Crítica',53:'Crítica',54:'Alta',55:'Alta',56:'Alta',
  57:'Media',58:'Media',59:'Media',60:'Alta',
};

const _st = { pkg: null, ai: { last: null } };

// ── UTILIDADES ──────────────────────────────────────────────────────
const esc = s => s == null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const get = id => document.getElementById(id);
const qa  = sel => document.querySelectorAll(sel);
const q   = sel => document.querySelector(sel);

function safe(el, html) {
  if (!el) return;
  el.innerHTML = typeof DOMPurify !== 'undefined'
    ? DOMPurify.sanitize(html, { ALLOWED_TAGS:['div','span','p','strong','em','b','i','ul','ol','li','h3','h4','br','small','table','tr','td','th','a'], ALLOWED_ATTR:['class','style','href','target'] })
    : html;
}

function showToast(msg) {
  const el = get('v9-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), 3000);
}

function fmtCLP(n) { return '$' + Number(n).toLocaleString('es-CL'); }

// ── NAVEGACIÓN ──────────────────────────────────────────────────────
function showTab(tabId, el) {
  qa('.section').forEach(s => s.classList.remove('active'));
  qa('.tab-btn').forEach(b => b.classList.remove('active'));
  const sec = get('tab-' + tabId);
  if (sec) sec.classList.add('active');
  if (el) el.classList.add('active');
  else qa('.tab-btn').forEach(b => {
    if ((b.getAttribute('onclick')||'').includes("'"+tabId+"'")) b.classList.add('active');
  });
  if (tabId === 'ia') renderV5(buildCtx(), _st.ai.last?.payload || null);
}

// ── FUF ─────────────────────────────────────────────────────────────
function toggleFufSection(hdr) { hdr.parentElement.classList.toggle('open'); }

function handleRadioChange(radio) {
  const group = radio.closest('.fuf-radio-group');
  if (!group) return;
  const n = group.getAttribute('data-q');
  const obs = get('obs-q'+n);
  if (obs) obs.classList.toggle('visible', radio.value==='nc');
  updateFUF(); saveAll();
}

function updateFUF() {
  let c=0,nc=0,na=0;
  ['s1','s2','s3','s4','s5','s6','s7','s8','s9','s10','s11','s12','s13','s14','s15'].forEach(s => {
    let sc=0,snc=0,sna=0;
    qa('[data-s="'+s+'"]').forEach(g => {
      const chk = q('input[name="q'+g.getAttribute('data-q')+'"]:checked');
      if (!chk) return;
      if (chk.value==='c')  { sc++; c++; }
      else if (chk.value==='nc') { snc++; nc++; }
      else { sna++; na++; }
    });
    const st = get('stats-'+s);
    if (st) st.innerHTML = (sc?'<span class="stat-mini c">✅ '+sc+'</span>':'') + (snc?'<span class="stat-mini nc">❌ '+snc+'</span>':'') + (sna?'<span class="stat-mini na">— '+sna+'</span>':'');
  });
  const eval_ = c+nc, pct = eval_>0 ? Math.round(c/eval_*100) : 0, pend = 60-c-nc-na;
  if(get('sc-cumple'))    get('sc-cumple').textContent    = c;
  if(get('sc-nocumple'))  get('sc-nocumple').textContent  = nc;
  if(get('sc-noaplica'))  get('sc-noaplica').textContent  = na;
  if(get('sc-pendiente')) get('sc-pendiente').textContent = pend;
  if(get('sc-pct'))       get('sc-pct').textContent       = pct+'%';
}

function resetFUF() {
  qa('#tab-fuf input[type=radio]').forEach(r => r.checked=false);
  qa('[id^="stats-"]').forEach(el => el.innerHTML='');
  qa('.fuf-nc-obs').forEach(el => { el.value=''; el.classList.remove('visible'); });
  ['sc-cumple','sc-nocumple','sc-noaplica','sc-pct'].forEach(id => { const e=get(id); if(e) e.textContent=id==='sc-pct'?'0%':'0'; });
  if(get('sc-pendiente')) get('sc-pendiente').textContent='60';
  saveAll();
}

function expandAll()   { qa('#tab-fuf .fuf-section').forEach(s=>s.classList.add('open')); }
function collapseAll() { qa('#tab-fuf .fuf-section').forEach(s=>s.classList.remove('open')); }

function filtrarFUF(tipo) {
  qa('.fuf-filter-btn').forEach(b=>b.classList.remove('active'));
  const btn=get('btn-filter-'+tipo); if(btn) btn.classList.add('active');
  qa('#tab-fuf .fuf-q').forEach(qEl => {
    const n=qEl.querySelector('.fuf-q-num')?.textContent?.trim();
    if(!n) return;
    const chk=q('input[name="q'+n+'"]:checked');
    let show=true;
    if(tipo==='nc')   show=chk?.value==='nc';
    else if(tipo==='c') show=chk?.value==='c';
    else if(tipo==='pend') show=!chk;
    qEl.classList.toggle('hidden-by-filter',!show);
  });
  if(tipo!=='all') expandAll();
}

// ── DOCUMENTOS ──────────────────────────────────────────────────────
function showCenter(center) {
  qa('.doc-list').forEach(d=>d.classList.remove('active'));
  qa('.cs-btn').forEach(b=>b.classList.remove('active'));
  const l=get('docs-'+center); if(l) l.classList.add('active');
  if(event?.target) event.target.classList.add('active');
  updateProgress();
}
function toggleGroup(hdr) { hdr.parentElement.classList.toggle('open'); }
function toggleCheck(el) { el.classList.toggle('checked'); updateProgress(); saveAll(); }
function updateProgress() {
  const al=q('.doc-list.active'); if(!al) return;
  const all=al.querySelectorAll('.doc-check').length, chk=al.querySelectorAll('.doc-check.checked').length;
  const pct=all>0?Math.round(chk/all*100):0;
  const bar=get('progress-bar'), txt=get('progress-pct');
  if(bar) bar.style.width=pct+'%';
  if(txt) txt.textContent=pct+'% completado ('+chk+'/'+all+')';
}

// ── SOLUCIONES ──────────────────────────────────────────────────────
function showSolList(center,btn) {
  qa('.sol-list').forEach(d=>d.classList.remove('active'));
  qa('.sol-btn').forEach(b=>b.classList.remove('active'));
  const l=get('sol-'+center); if(l) l.classList.add('active');
  if(btn) btn.classList.add('active');
  updateSolProgress();
}
function toggleSol(hdr) { hdr.parentElement.classList.toggle('open'); }
function updateSolProgress() {
  const a=q('.sol-list.active'); if(!a) return;
  const all=a.querySelectorAll('.sol-check-done').length, done=a.querySelectorAll('.sol-check-done.done').length;
  const pct=all>0?Math.round(done/all*100):0;
  const f=get('sol-prog-fill'), t=get('sol-prog-pct');
  if(f) f.style.width=pct+'%';
  if(t) t.textContent=done+' / '+all+' completados';
}
function goToSol(center) {
  showTab('soluciones');
  showSolList(center, q('.sol-btn[onclick*="'+center+'"]'));
  window.scrollTo({top:0,behavior:'smooth'});
}
function toggleCluster(hdr) { hdr.parentElement.classList.toggle('open'); }
function toggleTbRow(hdr)   { hdr.parentElement.classList.toggle('open'); }

// ── SCOPING ─────────────────────────────────────────────────────────
function calcScoping() {
  const ntrab=parseInt(get('sc-ntrab')?.value)||0;
  const contrat=get('sc-contratistas')?.value==='si';
  const domicil=get('sc-domicilio')?.value==='si';
  const activos=[]; qa('#sc-instalaciones .sc-check-row.sc-on').forEach(r=>activos.push(r.querySelector('.sc-check-text')?.textContent?.trim()||''));
  const t=k=>activos.some(a=>a.includes(k));
  let out='<ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px">';
  const li=txt=>out+='<li style="padding:8px 12px;background:rgba(255,255,255,0.1);border-radius:6px;font-size:0.8rem;line-height:1.5">'+txt+'</li>';
  li('✅ <strong>MIPER</strong> — obligatoria. Factores: ergonómicos, psicosociales, violencia y acoso, EP, enfoque de género.');
  li('✅ <strong>Programa Preventivo</strong> — en plazo de 30 días desde MIPER.');
  li('✅ <strong>Información de riesgos</strong> — al inicio de la relación laboral. Art. 9 DS N°44.');
  li('✅ <strong>Capacitación mínima 8 horas</strong> + 1 hora específica EPP con registro firmado.');
  li('✅ <strong>EPP</strong> — entrega gratuita con registro firmado.');
  li('✅ <strong>Mapa de riesgos</strong> del establecimiento.');
  li('✅ <strong>Plan de emergencias y evacuación</strong> + simulacro anual con acta. Art. 19.');
  li('✅ <strong>Investigación y registro de accidentes</strong>. Art. 22.');
  if(ntrab>0&&ntrab<=25) li('✅ <strong>Autoevaluación OA</strong> — alternativa MIPER para ≤25 trabajadores.');
  if(ntrab>10&&ntrab<=25) li('✅ <strong>Delegado de SST</strong> — obligatorio entre 10 y 25 trabajadores.');
  if(ntrab>25) li('✅ <strong>Comité Paritario (CPHS)</strong> — obligatorio para >25 trabajadores.');
  if(contrat) li('✅ <strong>Coordinación con contratistas</strong> — Art. 20 DS N°44.');
  if(domicil) li('✅ <strong>PTS para trabajo fuera del local</strong>.');
  if(t('Sala de procedimientos')||t('utoclave')||t('Rayos X')||t('REAS')||t('AEB')) {
    out+='<li style="grid-column:1/-1;padding:10px 0 4px;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#93c5fd;border-top:1px solid rgba(255,255,255,.15);margin-top:8px">🏥 Obligaciones Sanitarias SEREMI</li>';
  }
  if(t('Sala de procedimientos')) li('🚨 <strong>Autorización sanitaria DS N°58</strong> — clausura sin ella.');
  if(t('utoclave')) li('⚠️ <strong>Protocolo esterilización NT N°199/2018</strong> + registro de ciclos.');
  if(t('Rayos X')) li('🚨 <strong>Autorización RX SEREMI + ISP/CCHEN</strong> — clausura sin ella.');
  if(t('REAS'))    li('⚠️ <strong>Protocolo REAS + convenio autorizado DS N°6/2009</strong>.');
  if(t('AEB'))     li('⚠️ <strong>Protocolo AEB</strong> + vacunación hepatitis B.');
  if(t('Gases'))   li('⚠️ <strong>Protocolo gases anestésicos</strong> DS N°594+595.');
  if(t('Violencia'))li('⚠️ <strong>Módulo Violencia de Terceros</strong> en MIPER. DS N°44 Art. 7.');
  if(t('animales')){
    out+='<li style="grid-column:1/-1;padding:10px 0 4px;font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#86efac;border-top:1px solid rgba(255,255,255,.15);margin-top:8px">🐾 Obligaciones Veterinaria</li>';
    li('⚠️ <strong>Protocolos zoonosis y mordeduras</strong> — DIAT, lavado, seguimiento.');
    li('⚠️ <strong>MIPER con riesgo biológico veterinario</strong>.');
  }
  if(t('ármacos controlados')) li('⚠️ <strong>Registro SAG fármacos controlados</strong> + libro diario.');
  out+='</ul>';
  const outEl=get('sc-output'), resEl=get('sc-resultado');
  if(outEl) safe(outEl,out);
  if(resEl){ resEl.style.display='block'; resEl.scrollIntoView({behavior:'smooth',block:'start'}); }
}

// ── COTIZACIÓN ──────────────────────────────────────────────────────
function selectPkg(id,silent) {
  _st.pkg=id;
  qa('.cot-pkg').forEach(p=>p.classList.remove('selected'));
  const el=get('pkg-'+id); if(el) el.classList.add('selected');
  updateSummary(); if(!silent) saveAll();
}
function toggleAddon(id) { const el=get('addon-'+id); if(el) el.classList.toggle('selected'); updateSummary(); saveAll(); }
function updateSummary() {
  const trab=get('cot-trab')?.value||'mediano', cliente=get('cot-cliente')?.value||'Cliente', validez=get('cot-validez')?.value||'30 días';
  Object.keys(PRECIOS).forEach(pkg=>{ const e=get('price-'+pkg); if(e) e.textContent=fmtCLP(PRECIOS[pkg][trab]); });
  if(get('sum-cliente')) get('sum-cliente').textContent=cliente;
  if(get('sum-validez')) get('sum-validez').textContent=validez;
  const rowsEl=get('sum-rows'); if(!rowsEl) return;
  if(!_st.pkg){ rowsEl.innerHTML='<div class="cot-summary-row"><span style="color:#9a8f84;font-style:italic">← Selecciona un paquete</span><span></span></div>'; return; }
  const base=PRECIOS[_st.pkg][trab]; let rows='<div class="cot-summary-row"><span>'+esc(PKG_NOMBRES[_st.pkg])+'</span><span class="cot-summary-val">'+fmtCLP(base)+'</span></div>';
  let tot=0;
  qa('.cot-addon.selected').forEach(a=>{ const aid=a.id.replace('addon-',''), info=ADDONS_PRECIOS[aid]; if(info){ tot+=info.precio; rows+='<div class="cot-summary-row"><span>'+esc(info.nombre)+'</span><span class="cot-summary-val">'+fmtCLP(info.precio)+esc(info.sufijo)+'</span></div>'; } });
  rows+='<div class="cot-summary-row total"><span>TOTAL PROPUESTA</span><span class="cot-summary-val total">'+fmtCLP(base+tot)+'</span></div>';
  rowsEl.innerHTML=rows;
}
function copiarResumen() {
  const cliente=get('cot-cliente')?.value||'Cliente', trab=get('cot-trab')?.value||'mediano', empresa=get('cfg-empresa')?.value||'PRAXIS Salud & Seguridad SpA', prev=get('cfg-prev')?.value||'', tel=get('cfg-tel')?.value||'';
  if(!_st.pkg){ showToast('⚠ Selecciona un paquete primero'); return; }
  const base=PRECIOS[_st.pkg][trab], validez=get('cot-validez')?.value||'30 días';
  let addTxt=''; qa('.cot-addon.selected').forEach(a=>{ const aid=a.id.replace('addon-',''),info=ADDONS_PRECIOS[aid]; if(info) addTxt+='\n  • '+info.nombre+': '+fmtCLP(info.precio)+info.sufijo; });
  const txt=`*PROPUESTA DE SERVICIOS*\n*${empresa}*\n\n*Cliente:* ${cliente}\n*Tamaño:* ${trab} trabajadores\n*Servicio:* ${PKG_NOMBRES[_st.pkg]}\n*Valor:* ${fmtCLP(base)}\n${addTxt?'*Adicionales:*'+addTxt:''}\n\nVálida ${validez}. Pago: 50% inicio · 50% cierre.\n${prev?'Asesor: '+prev:''}\n${tel?'Contacto: '+tel:''}\n\n_DS N°44 · Ley 16.744_`;
  navigator.clipboard.writeText(txt).then(()=>showToast('📋 Copiado para WhatsApp')).catch(()=>showToast('⚠ No se pudo copiar'));
}
function imprimirPropuesta(){ window.print(); }
function exportarPDF(){ window.print(); }

// ── BRANDING ─────────────────────────────────────────────────────────
function applyBranding() {
  const empresa=get('cfg-empresa')?.value||'', prev=get('cfg-prev')?.value||'', tel=get('cfg-tel')?.value||'', email=get('cfg-email')?.value||'', rut=get('cfg-rut')?.value||'';
  const en=get('print-empresa-name'); if(en) en.textContent=empresa||'PRAXIS';
  const pd=get('print-empresa-data'); if(pd) pd.textContent=[rut,prev,tel,email].filter(Boolean).join(' · ');
}
function saveBranding(){ applyBranding(); saveAll(); toggleBrandBar(); }
function toggleBrandBar(){ const b=get('brand-bar'); if(b) b.classList.toggle('open'); }

// ── PERSISTENCIA ─────────────────────────────────────────────────────
function saveAll() {
  try {
    const fufSt={};
    qa('#tab-fuf input[type=radio]:checked').forEach(r=>{ fufSt[r.name]=r.value; });
    const addons=[]; qa('.cot-addon.selected').forEach(a=>addons.push(a.id.replace('addon-','')));
    const state={
      _v: V9.ver,
      branding:{ empresa:get('cfg-empresa')?.value||'', rut:get('cfg-rut')?.value||'', prev:get('cfg-prev')?.value||'', enf:get('cfg-enf')?.value||'', tel:get('cfg-tel')?.value||'', email:get('cfg-email')?.value||'', web:get('cfg-web')?.value||'' },
      fuf: fufSt,
      cot:{ cliente:get('cot-cliente')?.value||'', tipo:get('cot-tipo')?.value||'', trab:get('cot-trab')?.value||'', ciudad:get('cot-ciudad')?.value||'', fecha:get('cot-fecha')?.value||'', validez:get('cot-validez')?.value||'', pkg:_st.pkg||'', addons },
    };
    localStorage.setItem(V9.storage, JSON.stringify(state));
    // Observaciones FUF
    const obs={};
    for(let n=1;n<=60;n++){ const e=get('obs-q'+n); if(e&&e.value) obs['obs'+n]=e.value; }
    localStorage.setItem(V9.obsStorage, JSON.stringify(obs));
    // Checks documentos
    const checks=[];
    qa('.doc-check.checked').forEach(ch=>{ const nm=ch.closest('.doc-item')?.querySelector('.doc-name')?.textContent?.trim(); if(nm) checks.push(nm); });
    localStorage.setItem(V9.storage+'_checks', JSON.stringify(checks));
  } catch(e){ console.warn('saveAll error:',e); }
}

function loadAll() {
  try {
    const raw=localStorage.getItem(V9.storage);
    if(!raw) return;
    const state=JSON.parse(raw);
    if(state._v && state._v > V9.ver){ console.warn('PRAXIS: datos de versión superior'); return; }
    if(state.branding){ const b=state.branding; ['rut','prev','enf','tel','email','empresa','web'].forEach(k=>{ const e=get('cfg-'+k); if(e&&b[k]) e.value=b[k]; }); applyBranding(); }
    if(state.fuf){ Object.entries(state.fuf).forEach(([name,val])=>{ const e=q('input[name="'+name+'"][value="'+val+'"]'); if(e) e.checked=true; }); updateFUF(); }
    if(state.cot){
      ['cliente','tipo','trab','ciudad','fecha','validez'].forEach(k=>{ const e=get('cot-'+k); if(e&&state.cot[k]) e.value=state.cot[k]; });
      if(state.cot.pkg) selectPkg(state.cot.pkg,true);
      if(state.cot.addons) state.cot.addons.forEach(a=>{ const e=get('addon-'+a); if(e) e.classList.add('selected'); });
      updateSummary();
    }
    const obsRaw=localStorage.getItem(V9.obsStorage);
    if(obsRaw){ const obs=JSON.parse(obsRaw); Object.keys(obs).forEach(k=>{ const e=get('obs-q'+k.replace('obs','')); if(e){ e.value=obs[k]; if(obs[k]) e.classList.add('visible'); } }); }
    const chkRaw=localStorage.getItem(V9.storage+'_checks');
    if(chkRaw){ const checks=JSON.parse(chkRaw); qa('.doc-check').forEach(ch=>{ const nm=ch.closest('.doc-item')?.querySelector('.doc-name')?.textContent?.trim(); if(nm&&checks.includes(nm)) ch.classList.add('checked'); }); }
  } catch(e){ console.warn('loadAll error:',e); }
}

// ── MOTOR IA ─────────────────────────────────────────────────────────

function setAIStatus(msg, kind) {
  const el=get('ai-status');
  if(!el) return;
  el.textContent=msg;
  el.className='ai-status'+(kind?' ai-status-'+kind:'');
  el.style.display=msg?'block':'none';
}

function buildCtx() {
  let c=0,nc=0,na=0;
  const brechas=[];
  for(let n=1;n<=60;n++){
    const chk=q('input[name="q'+n+'"]:checked');
    const grp=q('[data-q="'+n+'"]');
    const sec=grp?.getAttribute('data-s')||'s1';
    if(!chk) continue;
    if(chk.value==='c') c++;
    else if(chk.value==='nc'){
      nc++;
      const qEl=grp?.closest('.fuf-q');
      const texto=qEl?.querySelector('strong')?.textContent?.trim()||'Pregunta '+n;
      const art=qEl?.querySelector('.fuf-q-art')?.textContent?.trim()||'';
      const obs=get('obs-q'+n)?.value?.trim()||'';
      brechas.push({ q:n, texto, art, obs, criticidad:SEV[n]||'Media', seccion:SECCIONES[sec]||sec });
    }
    else na++;
  }
  const eval_=c+nc, pct=eval_>0?Math.round(c/eval_*100):0;
  const activos=[]; qa('#sc-instalaciones .sc-check-row.sc-on').forEach(r=>activos.push(r.querySelector('.sc-check-text')?.textContent?.trim()||''));
  return {
    establecimiento:{ nombre:get('fuf-nombre')?.value||'—', tipo:get('fuf-tipo')?.options?.[get('fuf-tipo')?.selectedIndex]?.text||'—', trabajadores:get('fuf-ntrab')?.value||'—', fecha:get('fuf-fecha-diag')?.value||new Date().toISOString().slice(0,10), asesor:get('fuf-asesor')?.value||'—' },
    fuf:{ cumple:c, nocumple:nc, noaplica:na, pct, pendientes:60-c-nc-na },
    brechas:{ todas:brechas, criticas:brechas.filter(b=>b.criticidad==='Crítica'), altas:brechas.filter(b=>b.criticidad==='Alta') },
    scoping:{ activos },
    extra:get('ai-extra-context')?.value?.trim()||'',
  };
}

// Llamada al proxy /api/claude con streaming real
async function callProxy(system, userMessage, onToken) {
  const MAX_RETRY = 3;
  const DELAYS = [0, 3000, 8000];
  let lastErr = null;
  for (let i=0; i<MAX_RETRY; i++) {
    if (i>0) {
      if (onToken) onToken(0, '');
      setAIStatus('Reintentando ('+i+'/'+MAX_RETRY+')…','show');
      await new Promise(r=>setTimeout(r,DELAYS[i]));
    }
    try { return await _callProxyOnce(system, userMessage, onToken); }
    catch(e) { lastErr=e; if(!e.message.includes('temporalmente')&&!e.message.includes('504')&&!e.message.includes('503')) break; }
  }
  throw lastErr||new Error('No se pudo conectar con el servidor de IA.');
}
async function _callProxyOnce(system, userMessage, onToken) {
  const res = await fetch(V9.proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages:[{ role:'user', content:userMessage }] }),
  });
  if (!res.ok) {
    const err = await res.text();
    let msg = 'Error '+res.status;
    try { const d=JSON.parse(err); msg=d.error?.message||d.error||msg; } catch(e) {}
    throw new Error(msg);
  }
  const reader=res.body.getReader(), decoder=new TextDecoder();
  let buffer='', fullText='', tokens=0;
  while(true) {
    const { done, value }=await reader.read();
    if(done) break;
    buffer+=decoder.decode(value,{stream:true});
    const lines=buffer.split('\n');
    buffer=lines.pop()||'';
    for(const line of lines){
      if(!line.startsWith('data: ')) continue;
      const data=line.slice(6).trim();
      if(!data||data==='[DONE]') continue;
      try {
        const ev=JSON.parse(data);
        if(ev.type==='content_block_delta'&&ev.delta?.type==='text_delta'){
          fullText+=ev.delta.text; tokens++;
          if(tokens%15===0) onToken(tokens, fullText);
        }
        if(ev.type==='message_stop') return fullText;
      } catch(e){}
    }
  }
  return fullText;
}

function extractJSON(text) {
  if(!text) return null;
  try { return JSON.parse(text); } catch(e){}
  const m=text.match(/\{[\s\S]*\}/);
  if(m){ try{ return JSON.parse(m[0]); }catch(e){} }
  return null;
}

function buildPrompt(task, ctx) {
  const brechasTexto = ctx.brechas.todas.length
    ? ctx.brechas.todas.map(b=>`Q${b.q} [${b.criticidad}] ${b.texto}${b.art?' ('+b.art+')':''}${b.obs?' — Obs: '+b.obs:''}`).join('\n')
    : 'Sin brechas registradas.';
  const desc = { diagnostico:'Diagnóstico ejecutivo para reunión con gerente.', plan:'Plan de cierre priorizado por impacto regulatorio.', evidencia:'Listado de evidencia documental faltante.' }[task]||'Diagnóstico.';
  const system = 'Eres consultor senior en prevención de riesgos DS N°44/2024 en Chile. Trabajas para PRAXIS Salud & Seguridad SpA. No inventes normativa. Sé ejecutivo y preciso. RESPONDE SOLO JSON: {"resumen_ejecutivo":"...","riesgo_global":{"nivel":"Crítico|Alto|Medio|Bajo","justificacion":"..."},"prioridades":[{"titulo":"...","prioridad":"Crítica|Alta|Media|Baja","accion":"...","fundamento":"...","evidencia":"...","responsable":"...","plazo":"...","norma":"..."}],"brechas_transversales":["..."],"solicitudes_cliente":["..."],"advertencias":["..."]}';
  const user = JSON.stringify({ objetivo:desc, establecimiento:ctx.establecimiento, fuf:{ cumple:ctx.fuf.cumple, no_cumple:ctx.fuf.nocumple, porcentaje:ctx.fuf.pct, pendientes:ctx.fuf.pendientes }, brechas_nc:brechasTexto, scoping:ctx.scoping.activos.slice(0,8).join(', ')||'Sin scoping completado', contexto_extra:ctx.extra||'Sin notas.' }, null, 2);
  return { system, user };
}

async function runPraxisAI(task) {
  const ctx=buildCtx();
  setAIStatus('Conectando con Claude…','show');
  try {
    const prompt=buildPrompt(task,ctx);
    const fullText=await callProxy(prompt.system, prompt.user, (tk,txt)=>{
      setAIStatus('Recibiendo análisis… ('+tk+' tokens)','show');
    });
    const payload=extractJSON(fullText);
    if(!payload||!payload.resumen_ejecutivo) throw new Error('El análisis no tiene el formato esperado. Intenta de nuevo.');
    renderAI(task,ctx,payload);
    renderV5(ctx,payload);
    setAIStatus('✅ Análisis completado.','ok');
    showToast('🤖 Análisis listo');
    _st.ai.last={task,ctx,payload,at:new Date().toISOString()};
    try{ localStorage.setItem('praxis_ai_last',JSON.stringify(_st.ai.last)); }catch(e){}
  } catch(e) {
    console.error(e);
    setAIStatus('❌ '+e.message,'error');
  }
}

function renderAI(task,ctx,p) {
  const out=get('ai-output'); if(!out) return;
  let h='<div class="ai-panel"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">';
  h+='<span class="ai-tag">Cumplimiento: '+esc(ctx.fuf.pct)+'%</span>';
  h+='<span class="ai-tag">No Cumple: '+esc(ctx.fuf.nocumple)+'</span>';
  h+='<span class="ai-tag">Brechas críticas: '+esc(ctx.brechas.criticas.length)+'</span>';
  h+='</div><h4>Resumen ejecutivo</h4><p>'+esc(p.resumen_ejecutivo||'—')+'</p></div>';
  if(p.riesgo_global) h+='<div class="ai-panel"><h4>Riesgo global</h4><div class="ai-mini-item"><strong>'+esc(p.riesgo_global.nivel||'—')+'</strong> — '+esc(p.riesgo_global.justificacion||'—')+'</div></div>';
  if((p.prioridades||[]).length){
    h+='<div class="ai-panel"><h4>Prioridades de intervención</h4><div class="ai-priority">';
    (p.prioridades||[]).forEach(item=>{
      const badge=(item.prioridad||'Media').toLowerCase();
      h+='<div class="ai-priority-item"><div class="ai-priority-head"><div class="ai-priority-title">'+esc(item.titulo||'Acción')+'</div><span class="ai-priority-badge '+esc(badge)+'">'+esc(item.prioridad||'Media')+'</span></div>';
      h+='<div class="ai-mini-item"><strong>Acción:</strong> '+esc(item.accion||'—')+'</div>';
      h+='<div class="ai-split" style="margin-top:8px"><div class="ai-mini-item"><strong>Fundamento:</strong> '+esc(item.fundamento||'—')+'</div><div class="ai-mini-item"><strong>Evidencia:</strong> '+esc(item.evidencia||'—')+'</div></div>';
      h+='<div class="ai-split" style="margin-top:8px"><div class="ai-mini-item"><strong>Responsable:</strong> '+esc(item.responsable||'—')+'</div><div class="ai-mini-item"><strong>Plazo:</strong> '+esc(item.plazo||'—')+'</div></div>';
      h+='<div class="ai-mini-item" style="margin-top:8px"><strong>Norma:</strong> '+esc(item.norma||'—')+'</div></div>';
    });
    h+='</div></div>';
  }
  const bt=p.brechas_transversales||[], sc=p.solicitudes_cliente||[], ad=p.advertencias||[];
  if(bt.length||sc.length){ h+='<div class="ai-split">'; if(bt.length){ h+='<div class="ai-panel"><h4>Brechas transversales</h4><div class="ai-mini-list">'; bt.forEach(b=>h+='<div class="ai-mini-item">'+esc(b)+'</div>'); h+='</div></div>'; } if(sc.length){ h+='<div class="ai-panel"><h4>Solicitudes al cliente</h4><div class="ai-mini-list">'; sc.forEach(s=>h+='<div class="ai-mini-item">'+esc(s)+'</div>'); h+='</div></div>'; } h+='</div>'; }
  if(ad.length){ h+='<div class="ai-panel"><h4>Advertencias</h4><div class="ai-mini-list">'; ad.forEach(a=>h+='<div class="ai-mini-item">'+esc(a)+'</div>'); h+='</div></div>'; }
  h+='<div class="ai-actions" style="margin-top:12px"><button class="ai-btn secondary" onclick="copyAIOut()">📋 Copiar análisis</button><button class="ai-btn warn" onclick="clearAIOut()">🗑 Limpiar</button></div>';
  safe(out,h);
}

function copyAIOut(){ const out=get('ai-output'); const t=out?.innerText?.trim()||''; if(!t){ setAIStatus('No hay análisis para copiar.','error'); return; } navigator.clipboard.writeText(t).then(()=>showToast('📋 Copiado')).catch(()=>setAIStatus('No se pudo copiar.','error')); }
function clearAIOut(){ const out=get('ai-output'); if(out) safe(out,'<div class="ai-note">Análisis limpiado.</div>'); _st.ai.last=null; renderV5(buildCtx(),null); try{ localStorage.removeItem('praxis_ai_last'); }catch(e){} }

// ── V5 SEMÁFORO ──────────────────────────────────────────────────────
function renderV5(ctx,payload){
  ctx=ctx||buildCtx();
  const nc=ctx.fuf.nocumple||0, crit=ctx.brechas.criticas.length||0, altas=ctx.brechas.altas.length||0, pend=ctx.fuf.pendientes||0;
  const eval_=Math.max(1,ctx.fuf.cumple+nc), ncRate=nc/eval_;
  let imp=1,prob=1;
  if(crit>=3||nc>=18) imp=4; else if(crit>=1||altas>=6||nc>=12) imp=3; else if(altas>=2||nc>=6) imp=2;
  if(ncRate>=0.45||pend>=18) prob=4; else if(ncRate>=0.30||pend>=10) prob=3; else if(ncRate>=0.15||pend>=4) prob=2;
  const score=imp*prob;
  let level='Bajo',tone='green',advice='Mantener control documental y seguimiento preventivo.';
  if(score>=13){ level='Crítico'; tone='red'; advice='Alta probabilidad de observación o multa. Intervenir de inmediato.'; }
  else if(score>=8){ level='Alto'; tone='orange'; advice='Requiere cierre priorizado de brechas críticas.'; }
  else if(score>=4){ level='Medio'; tone='yellow'; advice='Hay margen, pero no conviene postergar el cierre.'; }
  const just=payload?.riesgo_global?.justificacion||advice;
  const sem=get('v5-semaforo'); if(!sem) return;
  let h='<div class="v5-semaforo"><div class="v5-light '+esc(tone)+'">'+esc(level)+'</div><div>';
  h+='<div class="v5-risk-title">Riesgo '+esc(level)+' · Score '+esc(score)+'/16</div>';
  h+='<div class="v5-risk-sub">'+esc(just)+'</div>';
  h+='<div class="v5-badge-row"><span class="v5-badge '+esc(tone)+'">Impacto '+esc(imp)+'/4</span><span class="v5-badge '+esc(tone)+'">Probabilidad '+esc(prob)+'/4</span><span class="v5-badge slate">Cumplimiento '+esc(ctx.fuf.pct)+'%</span></div>';
  h+='</div></div>';
  safe(sem,h);
}

// ── INFORME DE BRECHAS ────────────────────────────────────────────────
function generarInformeBrechas() {
  const nombre=get('fuf-nombre')?.value||'—', tipoEl=get('fuf-tipo'), tipoText=tipoEl?tipoEl.options[tipoEl.selectedIndex]?.text:'—', ntrab=get('fuf-ntrab')?.value||'—', fechaRaw=get('fuf-fecha-diag')?.value, fecha=fechaRaw?new Date(fechaRaw+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}):new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'}), asesor=get('fuf-asesor')?.value||'—', rut=get('fuf-rut-emp')?.value||'—';
  let c=0,nc=0,na=0,pend=0; const bPorSec={};
  for(let n=1;n<=60;n++){
    const chk=q('input[name="q'+n+'"]:checked'), grp=q('[data-q="'+n+'"]'), sec=grp?.getAttribute('data-s')||'s1';
    if(!chk){ pend++; continue; }
    if(chk.value==='c') c++;
    else if(chk.value==='nc'){
      nc++;
      if(!bPorSec[sec]) bPorSec[sec]=[];
      const qEl=grp?.closest('.fuf-q'), texto=qEl?.querySelector('strong')?.textContent?.trim()||'Q'+n, art=qEl?.querySelector('.fuf-q-art')?.textContent?.trim()||'', obs=get('obs-q'+n)?.value?.trim()||'';
      bPorSec[sec].push({ q:n, texto, art, obs, criticidad:SEV[n]||'Media' });
    }
    else na++;
  }
  const eval_=c+nc, pct=eval_>0?Math.round(c/eval_*100):0;
  let h='<div class="informe-header"><div class="informe-logo">'+esc(get('cfg-empresa')?.value||'PRAXIS Salud & Seguridad SpA')+'</div><div class="informe-meta"><span><strong>Establecimiento:</strong> '+esc(nombre)+'</span><span><strong>Tipo:</strong> '+esc(tipoText)+'</span><span><strong>RUT:</strong> '+esc(rut)+'</span><span><strong>N° trabajadores:</strong> '+esc(ntrab)+'</span><span><strong>Fecha:</strong> '+esc(fecha)+'</span><span><strong>Asesor:</strong> '+esc(asesor)+'</span></div></div>';
  h+='<div class="informe-score-row"><div class="informe-score-chip c"><span class="sc-num">'+c+'</span>Cumple</div><div class="informe-score-chip nc"><span class="sc-num">'+nc+'</span>No Cumple</div><div class="informe-score-chip na"><span class="sc-num">'+na+'</span>No Aplica</div><div class="informe-score-chip na"><span class="sc-num">'+pend+'</span>Pendiente</div><div class="informe-score-chip '+(pct>=80?'c':pct>=60?'na':'nc')+'"><span class="sc-num">'+pct+'%</span>Cumplimiento</div></div>';
  Object.entries(bPorSec).forEach(([sec,items])=>{
    h+='<div class="informe-section-title">'+esc(SECCIONES[sec]||sec)+'</div>';
    items.forEach(b=>{
      h+='<div class="informe-item"><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><span class="informe-q-num">Q'+b.q+'</span><span class="badge-multa-'+(b.criticidad==='Crítica'?'alta':'media')+'">'+esc(b.criticidad)+'</span>'+(b.art?'<span class="informe-art">'+esc(b.art)+'</span>':'')+'</div><div>'+esc(b.texto)+'</div>'+(b.obs?'<div class="ii-obs">'+esc(b.obs)+'</div>':'')+'</div>';
    });
  });
  if(_st.ai.last?.payload){ const p=_st.ai.last.payload; h+='<div class="informe-section-title">🤖 Análisis IA (Claude)</div><div class="informe-item"><strong>Resumen:</strong><div class="ii-obs">'+esc(p.resumen_ejecutivo||'—')+'</div></div>'; if(p.riesgo_global) h+='<div class="informe-item"><strong>Riesgo global:</strong> '+esc(p.riesgo_global.nivel||'—')+'</div>'; (p.prioridades||[]).slice(0,5).forEach((item,i)=>{ h+='<div class="informe-item"><strong>Prioridad '+(i+1)+':</strong> '+esc(item.titulo||'')+'<div class="ii-obs">'+esc(item.accion||'—')+' · Plazo: '+esc(item.plazo||'—')+'</div></div>'; }); }
  h+='<div class="informe-actions"><button class="informe-btn primary" onclick="window.print()">🖨 Imprimir / PDF</button><button class="informe-btn secondary" onclick="get(\'informe-overlay\').classList.remove(\'visible\')">Cerrar</button></div>';
  const container=get('informe-content'), overlay=get('informe-overlay');
  if(container) safe(container,h);
  if(overlay) overlay.classList.add('visible');
}

// ═══════════════════════════════════════════════════════════════════
// GENERACIÓN DE DOCUMENTOS WORD (.docx) — la función que convierte
// PRAXIS de herramienta de diagnóstico en herramienta de producción
// ═══════════════════════════════════════════════════════════════════

// Prompt para MIPER
function buildMiperPrompt(ctx) {
  const sistema = `Eres experto en prevención de riesgos para centros de salud en Chile. Genera una MIPER completa, realista y conforme al DS N°44/2024 y la Guía GEMA del ISP.
RESPONDE SOLO JSON VÁLIDO con esta estructura exacta:
{"procesos":[{"proceso":"nombre del proceso","tareas":[{"tarea":"nombre de la tarea","peligros":[{"peligro":"descripción","tipo":"físico|químico|biológico|ergonómico|psicosocial|mecánico|eléctrico","efecto":"daño a la salud","probabilidad":1,"consecuencia":1,"nivel":"Bajo|Medio|Alto|Crítico","controles":["control 1","control 2"],"plazo":"Inmediato|30 días|60 días|90 días","responsable":"Dirección|Jefatura|CPHS|OA"}]}]}]}`;
  const usuario = JSON.stringify({
    tipo_centro: ctx.establecimiento.tipo,
    nombre: ctx.establecimiento.nombre,
    n_trabajadores: ctx.establecimiento.trabajadores,
    instalaciones: ctx.scoping.activos.join(', ')||'No especificado',
    brechas_fuf: ctx.brechas.todas.slice(0,10).map(b=>b.texto).join('; ')||'Sin brechas',
    instruccion: 'Genera procesos y peligros específicos y realistas para este tipo de centro de salud. Incluye mínimo 3 procesos con al menos 2 tareas y 2 peligros cada uno. Los niveles deben respetar la matriz: nivel=Crítico si P×C≥15, Alto si ≥8, Medio si ≥4, Bajo si <4.',
  }, null, 2);
  return { system: sistema, user: usuario };
}

// Prompt para RIHS
function buildRihsPrompt(ctx) {
  const sistema = `Eres experto en derecho laboral y prevención de riesgos en Chile. Genera un RIHS completo y legalmente válido conforme al DS N°44/2024, Ley 16.744 y Código del Trabajo.
RESPONDE SOLO JSON VÁLIDO:
{"capitulos":[{"numero":1,"titulo":"título del capítulo","articulos":[{"numero":1,"titulo":"título del artículo","contenido":"texto legal completo del artículo"}]}]}`;
  const usuario = JSON.stringify({
    tipo_centro: ctx.establecimiento.tipo,
    nombre: ctx.establecimiento.nombre,
    n_trabajadores: ctx.establecimiento.trabajadores,
    instruccion: 'Genera un RIHS completo con al menos 8 capítulos: Disposiciones generales, Obligaciones del empleador, Obligaciones y prohibiciones del trabajador, EPP, Prevención y control de riesgos, Procedimiento de accidentes, Sanciones, Disposiciones finales. Incluye artículos específicos para centro de salud.',
  }, null, 2);
  return { system: sistema, user: usuario };
}

// Prompt para Programa Preventivo
function buildProgPrompt(ctx) {
  const sistema = `Eres experto en prevención de riesgos en Chile. Genera un Programa Preventivo de SST conforme al DS N°44/2024, con actividades concretas y plazos reales.
RESPONDE SOLO JSON VÁLIDO:
{"actividades":[{"actividad":"nombre","objetivo":"para qué","norma":"referencia normativa","responsable":"quién","plazo":"Mes 1|Mes 2|Trimestral|Semestral|Anual","recursos":"costo o herramienta","indicador":"cómo se verifica","estado":"Pendiente"}]}`;
  const usuario = JSON.stringify({
    tipo_centro: ctx.establecimiento.tipo,
    nombre: ctx.establecimiento.nombre,
    n_trabajadores: ctx.establecimiento.trabajadores,
    brechas_nc: ctx.brechas.todas.slice(0,8).map(b=>b.texto).join('; ')||'Sin brechas',
    instruccion: 'Genera mínimo 15 actividades preventivas específicas para este centro de salud. Incluye: capacitaciones, SUSESO-ISTAS21, simulacros, vigilancia de salud, mantenimiento de equipos, y actividades específicas para cerrar las brechas NC detectadas.',
  }, null, 2);
  return { system: sistema, user: usuario };
}

// Generador MIPER
async function generarMIPER() {
  const ctx = buildCtx();
  const btn = get('btn-gen-miper'), prog = get('prog-miper');
  if(btn) btn.disabled = true;
  if(prog) prog.textContent = 'Generando con Claude…';
  setDocStatus('Generando MIPER con Claude… (puede tomar 30-60 segundos)', true);
  try {
    const prompt = buildMiperPrompt(ctx);
    const fullText = await callProxy(prompt.system, prompt.user, (tk)=>{
      if(prog) prog.textContent = 'Recibiendo… '+tk+' tokens';
    });
    const data = extractJSON(fullText);
    if(!data?.procesos?.length) throw new Error('La IA no generó procesos válidos. Intenta de nuevo.');
    await docxMIPER(ctx, data);
    setDocStatus('✅ MIPER descargada como archivo Word (.docx)', false);
    showToast('📄 MIPER descargada');
    if(prog) prog.textContent = '✅ Descargado';
  } catch(e) {
    setDocStatus('❌ Error generando MIPER: '+e.message, false);
    if(prog) prog.textContent = '❌ Error';
  } finally {
    if(btn) btn.disabled = false;
  }
}

// Generador RIHS
async function generarRIHS() {
  const ctx = buildCtx();
  const btn = get('btn-gen-rihs'), prog = get('prog-rihs');
  if(btn) btn.disabled = true;
  if(prog) prog.textContent = 'Generando con Claude…';
  setDocStatus('Generando RIHS con Claude…', true);
  try {
    const prompt = buildRihsPrompt(ctx);
    const fullText = await callProxy(prompt.system, prompt.user, (tk)=>{
      if(prog) prog.textContent = 'Recibiendo… '+tk+' tokens';
    });
    const data = extractJSON(fullText);
    if(!data?.capitulos?.length) throw new Error('La IA no generó capítulos válidos. Intenta de nuevo.');
    await docxRIHS(ctx, data);
    setDocStatus('✅ RIHS descargado como archivo Word (.docx)', false);
    showToast('📄 RIHS descargado');
    if(prog) prog.textContent = '✅ Descargado';
  } catch(e) {
    setDocStatus('❌ Error: '+e.message, false);
    if(prog) prog.textContent = '❌ Error';
  } finally {
    if(btn) btn.disabled = false;
  }
}

// Generador Programa Preventivo
async function generarPrograma() {
  const ctx = buildCtx();
  const btn = get('btn-gen-prog'), prog = get('prog-prog');
  if(btn) btn.disabled = true;
  if(prog) prog.textContent = 'Generando con Claude…';
  setDocStatus('Generando Programa Preventivo con Claude…', true);
  try {
    const prompt = buildProgPrompt(ctx);
    const fullText = await callProxy(prompt.system, prompt.user, (tk)=>{
      if(prog) prog.textContent = 'Recibiendo… '+tk+' tokens';
    });
    const data = extractJSON(fullText);
    if(!data?.actividades?.length) throw new Error('La IA no generó actividades válidas. Intenta de nuevo.');
    await docxPrograma(ctx, data);
    setDocStatus('✅ Programa Preventivo descargado (.docx)', false);
    showToast('📄 Programa Preventivo descargado');
    if(prog) prog.textContent = '✅ Descargado';
  } catch(e) {
    setDocStatus('❌ Error: '+e.message, false);
    if(prog) prog.textContent = '❌ Error';
  } finally {
    if(btn) btn.disabled = false;
  }
}

function setDocStatus(msg, loading) {
  const el = get('docgen-status');
  if(!el) return;
  el.textContent = msg;
  el.classList.toggle('visible', !!msg);
  el.style.background = loading ? 'var(--surface2)' : (msg.startsWith('✅') ? '#e8f5ee' : '#fde8e8');
}

// ── docx.js: generación de archivos Word ─────────────────────────────

// Helpers docx
function mkParagraph(text, opts={}) {
  const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } = window.docx;
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    heading: opts.heading || undefined,
    spacing: { before: opts.spaceBefore||0, after: opts.spaceAfter||120 },
    children: [new TextRun({
      text: String(text||''),
      bold: !!opts.bold,
      size: opts.size || 22,
      color: opts.color || '000000',
      font: 'Calibri',
    })],
  });
}

function mkTableCell(text, opts={}) {
  const { TableCell, Paragraph, TextRun, ShadingType, WidthType } = window.docx;
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: [new Paragraph({
      children: [new TextRun({
        text: String(text||''),
        bold: !!opts.bold,
        size: opts.size || 18,
        color: opts.color || '000000',
        font: 'Calibri',
      })]
    })]
  });
}

async function docxMIPER(ctx, data) {
  if(!window.docx) throw new Error('Librería docx.js no cargada. Verifica la conexión a internet.');
  const { Document, Packer, Table, TableRow, WidthType, PageOrientation } = window.docx;

  const NAVY='0D2447', RED='C0392B', AMBER='B8922A', GREEN='1E8A4A', GRAY='F5F5F5';
  const nivelColor = n => n==='Crítico'?RED:n==='Alto'?'D35400':n==='Medio'?AMBER:'155724';
  const nivelBg    = n => n==='Crítico'?'FFEEEE':n==='Alto'?'FFF3E0':n==='Medio'?'FFFDE7':'EAFAF1';

  // Encabezado
  const header = [
    mkParagraph('MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y EVALUACIÓN DE RIESGOS', { center:true, bold:true, size:28, color:NAVY, spaceBefore:200 }),
    mkParagraph(ctx.establecimiento.nombre, { center:true, bold:true, size:24, color:NAVY }),
    mkParagraph('Tipo de centro: '+ctx.establecimiento.tipo+'  ·  N° trabajadores: '+ctx.establecimiento.trabajadores+'  ·  Fecha: '+new Date().toLocaleDateString('es-CL'), { center:true, size:20, color:'555555' }),
    mkParagraph('Conforme a DS N°44/2024, Guía GEMA ISP y Ley 16.744', { center:true, size:18, color:'888888', spaceAfter:300 }),
  ];

  // Tabla MIPER
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      mkTableCell('Proceso',        { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Tarea',          { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Peligro',        { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Tipo',           { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Efecto',         { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('P', { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('C', { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Nivel',          { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Controles propuestos', { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Responsable',    { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
      mkTableCell('Plazo',          { bold:true, bg:NAVY, color:'FFFFFF', size:18 }),
    ]
  });

  const dataRows = [];
  for(const proc of (data.procesos||[])) {
    for(const tarea of (proc.tareas||[])) {
      for(const p of (tarea.peligros||[])) {
        const nivel = p.nivel||'Medio';
        const bg = nivelBg(nivel);
        const controles = Array.isArray(p.controles) ? p.controles.join('; ') : String(p.controles||'—');
        dataRows.push(new TableRow({
          children: [
            mkTableCell(proc.proceso,  { bg:GRAY }),
            mkTableCell(tarea.tarea,   { bg:GRAY }),
            mkTableCell(p.peligro||'—'),
            mkTableCell(p.tipo||'—'),
            mkTableCell(p.efecto||'—'),
            mkTableCell(String(p.probabilidad||'—'), { center:true }),
            mkTableCell(String(p.consecuencia||'—'), { center:true }),
            mkTableCell(nivel, { bold:true, color:nivelColor(nivel), bg, center:true }),
            mkTableCell(controles),
            mkTableCell(p.responsable||'—'),
            mkTableCell(p.plazo||'—'),
          ]
        }));
      }
    }
  }

  // Firma
  const firma = [
    mkParagraph('', { spaceBefore:600 }),
    mkParagraph('___________________________________', { center:true }),
    mkParagraph(ctx.establecimiento.asesor||'Prevencionista de Riesgos', { center:true, bold:true }),
    mkParagraph('Elaborado y aprobado conforme DS N°44/2024', { center:true, size:18, color:'888888' }),
  ];

  const doc = new Document({
    sections:[{
      properties:{ page:{ orientation: PageOrientation.LANDSCAPE, size:{ width:16838, height:11906 } } },
      children:[
        ...header,
        new Table({ width:{ size:100, type:WidthType.PERCENTAGE }, rows:[headerRow,...dataRows] }),
        ...firma,
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'MIPER_'+(ctx.establecimiento.nombre||'Centro').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');
}

async function docxRIHS(ctx, data) {
  if(!window.docx) throw new Error('Librería docx.js no cargada.');
  const { Document, Packer } = window.docx;
  const NAVY='0D2447';

  const children = [
    mkParagraph('REGLAMENTO INTERNO DE HIGIENE Y SEGURIDAD', { center:true, bold:true, size:32, color:NAVY, spaceBefore:200 }),
    mkParagraph(ctx.establecimiento.nombre, { center:true, bold:true, size:26, color:NAVY }),
    mkParagraph('Conforme a DS N°44/2024 · Ley 16.744 · Código del Trabajo', { center:true, size:20, color:'888888' }),
    mkParagraph('Fecha de emisión: '+new Date().toLocaleDateString('es-CL'), { center:true, size:18, color:'888888', spaceAfter:400 }),
  ];

  for(const cap of (data.capitulos||[])) {
    children.push(mkParagraph('CAPÍTULO '+cap.numero+': '+cap.titulo, { bold:true, size:24, color:NAVY, spaceBefore:400, spaceAfter:200 }));
    for(const art of (cap.articulos||[])) {
      children.push(mkParagraph('Artículo '+art.numero+'. '+art.titulo, { bold:true, size:22, spaceBefore:200 }));
      children.push(mkParagraph(art.contenido||'', { size:20, spaceAfter:200 }));
    }
  }

  children.push(
    mkParagraph('', { spaceBefore:600 }),
    mkParagraph('___________________________________', { center:true }),
    mkParagraph(ctx.establecimiento.asesor||'Representante Legal', { center:true, bold:true }),
    mkParagraph('RUT empresa: '+ctx.establecimiento.nombre, { center:true, size:18 }),
  );

  const doc = new Document({ sections:[{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'RIHS_'+(ctx.establecimiento.nombre||'Centro').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');
}

async function docxPrograma(ctx, data) {
  if(!window.docx) throw new Error('Librería docx.js no cargada.');
  const { Document, Packer, Table, TableRow, WidthType } = window.docx;
  const NAVY='0D2447', GRAY='F5F5F5';

  const header = [
    mkParagraph('PROGRAMA DE TRABAJO EN PREVENCIÓN DE RIESGOS', { center:true, bold:true, size:28, color:NAVY, spaceBefore:200 }),
    mkParagraph(ctx.establecimiento.nombre, { center:true, bold:true, size:24, color:NAVY }),
    mkParagraph('DS N°44/2024 · Ley 16.744 · Período: '+new Date().getFullYear(), { center:true, size:18, color:'888888', spaceAfter:300 }),
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      mkTableCell('Actividad',   { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Objetivo',    { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Norma',       { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Responsable', { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Plazo',       { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Indicador',   { bold:true, bg:NAVY, color:'FFFFFF' }),
      mkTableCell('Estado',      { bold:true, bg:NAVY, color:'FFFFFF' }),
    ]
  });

  const dataRows = (data.actividades||[]).map((act, i) =>
    new TableRow({
      children: [
        mkTableCell(act.actividad||'—', { bg: i%2===0?GRAY:'FFFFFF' }),
        mkTableCell(act.objetivo||'—'),
        mkTableCell(act.norma||'—'),
        mkTableCell(act.responsable||'—'),
        mkTableCell(act.plazo||'—'),
        mkTableCell(act.indicador||'—'),
        mkTableCell(act.estado||'Pendiente'),
      ]
    })
  );

  const doc = new Document({
    sections:[{
      properties:{ page:{ size:{ width:16838, height:11906 } } },
      children:[
        ...header,
        new Table({ width:{ size:100, type:WidthType.PERCENTAGE }, rows:[headerRow,...dataRows] }),
        mkParagraph('', { spaceBefore:500 }),
        mkParagraph('___________________________________    ___________________________________', { center:true }),
        mkParagraph('Representante legal                        Encargado/a de Prevención', { center:true, size:18 }),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'ProgramaPreventivo_'+(ctx.establecimiento.nombre||'Centro').replace(/[^a-zA-Z0-9]/g,'_')+'.docx');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

// ── INICIALIZACIÓN ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  const fechaEl=get('cot-fecha'); if(fechaEl&&!fechaEl.value) fechaEl.value=new Date().toISOString().slice(0,10);
  loadAll(); updateSummary(); updateFUF(); updateProgress();
  // Restaurar último análisis IA
  try{
    const last=JSON.parse(localStorage.getItem('praxis_ai_last')||'null');
    if(last?.payload){ _st.ai.last=last; renderAI(last.task||'diagnostico',last.ctx,last.payload); }
  }catch(e){}
  renderV5(buildCtx(), _st.ai.last?.payload||null);
  // Auto-save observaciones FUF
  qa('.fuf-nc-obs').forEach(el=>el.addEventListener('change',saveAll));
});
