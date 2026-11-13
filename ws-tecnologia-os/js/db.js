/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   db.js · Banco de dados
   Persistência no navegador com IndexedDB (ordens, sistemas, arquivos e configurações).
   ========================================================= */
"use strict";

/* ================= Banco de dados (IndexedDB — fica salvo no navegador) ================= */
let idb=null, ordens=[], sistemas=[], config=clone(CONFIG_PADRAO), pronto=false;
function abrirIDB(){return new Promise((res,rej)=>{
  if(!window.indexedDB) return rej(new Error('sem IndexedDB'));
  const r=indexedDB.open('ws-tecnologia-os',1);
  r.onupgradeneeded=()=>{const d=r.result;['ordens','sistemas','arquivos','config'].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'});});};
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); r.onblocked=()=>rej(new Error('bloqueado'));});}
function tx(nome,modo,fn){return new Promise((res,rej)=>{
  if(!idb) return res(undefined);
  const t=idb.transaction(nome,modo);let rq;try{rq=fn(t.objectStore(nome));}catch(e){rej(e);return;}
  t.oncomplete=()=>res(rq&&'result' in rq?rq.result:undefined);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error);});}
const LSK='ws-os-reserva';
function salvarReserva(){if(idb)return;try{localStorage.setItem(LSK,JSON.stringify({ordens,sistemas,config,readme:readmeMD,readmeAt:readmeAtualizado}));}catch(e){}}
function erroSalvar(e){console.error(e);toast(e&&e.name==='QuotaExceededError'?'Espaço do navegador cheio — exporte um backup e remova arquivos grandes':'Erro ao salvar');}
const salvarOS=o=>idb?tx('ordens','readwrite',s=>s.put(clone(o))).catch(erroSalvar):Promise.resolve(salvarReserva());
const apagarOSdb=id=>idb?tx('ordens','readwrite',s=>s.delete(id)):Promise.resolve(salvarReserva());
const salvarSistema=x=>idb?tx('sistemas','readwrite',s=>s.put(clone(x))).catch(erroSalvar):Promise.resolve(salvarReserva());
const apagarSistemaDb=id=>idb?tx('sistemas','readwrite',s=>s.delete(id)):Promise.resolve(salvarReserva());
const salvarConfig=()=>idb?tx('config','readwrite',s=>s.put(clone(config))).catch(erroSalvar):Promise.resolve(salvarReserva());
const salvarReadme=()=>idb?tx('config','readwrite',s=>s.put({id:'readme',md:readmeMD,atualizado:readmeAtualizado})).catch(erroSalvar):Promise.resolve(salvarReserva());
const salvarArquivo=a=>tx('arquivos','readwrite',s=>s.put(a));
const pegarArquivo=id=>tx('arquivos','readonly',s=>s.get(id));
const apagarArquivo=id=>tx('arquivos','readwrite',s=>s.delete(id)).catch(()=>{});

async function carregar(){
  try{
    idb=await abrirIDB();
    ordens=await tx('ordens','readonly',s=>s.getAll())||[];
    sistemas=await tx('sistemas','readonly',s=>s.getAll())||[];
    const c=await tx('config','readonly',s=>s.get('empresa'));
    if(c) config={...clone(CONFIG_PADRAO),...c};
    const rd=await tx('config','readonly',s=>s.get('readme'));
    if(rd){readmeMD=rd.md||'';readmeAtualizado=rd.atualizado||0;}
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
  }catch(e){
    idb=null;
    try{const d=JSON.parse(localStorage.getItem(LSK)||'null');if(d){ordens=d.ordens||[];sistemas=d.sistemas||[];config={...clone(CONFIG_PADRAO),...(d.config||{})};if(d.readme){readmeMD=d.readme;readmeAtualizado=d.readmeAt||0;}}}catch(e2){}
    banner('Este navegador não permitiu o banco de dados completo. Os dados ficam salvos de forma simples e o envio de arquivos fica desativado. Use Chrome, Edge ou Firefox atualizados.');
  }
  if(!Array.isArray(config.equipe)||!config.equipe.length) config.equipe=clone(EQUIPE_PADRAO);
  if(!readmeMD) readmeMD=README_PADRAO;
  pronto=true; aplicarPerfil(); render(); fecharSplash();
}
function banner(msg){const b=$('#banner');b.textContent=msg||'';b.classList.toggle('show',!!msg);}
