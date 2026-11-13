/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   utils.js · Utilidades e regras de negócio
   Formatação de moeda/data, ícones SVG, cálculo de totais e geração de parcelas.
   ========================================================= */
"use strict";

/* ================= Utilidades ================= */
const $=s=>document.querySelector(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=v=>(+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num2=v=>(+v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const parseMoney=s=>+(String(s).replace(/\D/g,'')||0)/100;
const pad=n=>String(n).padStart(2,'0');
const isoDe=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const hojeISO=()=>isoDe(new Date());
const dataBR=iso=>iso?iso.split('-').reverse().join('/'):'—';
function diasAte(iso){if(!iso)return null;const[y,m,d]=iso.split('-').map(Number);const h=new Date();h.setHours(0,0,0,0);return Math.round((new Date(y,m-1,d)-h)/864e5);}
function addMeses(iso,n){const[y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1+n,1);const ult=new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate();dt.setDate(Math.min(d,ult));return isoDe(dt);}
const tamanho=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(1)+' MB';
const fmtHora=t=>{const d=new Date(t);return d.toLocaleDateString('pt-BR')+' '+pad(d.getHours())+':'+pad(d.getMinutes());};
const osNum=o=>'OS-'+String(o.numero||0).padStart(4,'0');
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const clone=o=>JSON.parse(JSON.stringify(o));
const urlOk=v=>{v=String(v||'').trim();if(!v)return'';return /^https?:\/\//i.test(v)?v:'https://'+v;};
const urlCurta=v=>String(v||'').replace(/^https?:\/\//i,'').replace(/\/$/,'');
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600);}
function pill(map,k,extra=''){const x=map[k]||{n:k,c:'gray'};return `<span class="pill c-${x.c} ${extra}">${esc(x.n)}</span>`;}
function baixarBlob(blob,nome){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
const lerDataURL=b=>new Promise((r,j)=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=()=>j(f.error);f.readAsDataURL(b);});
async function dataURLParaBlob(d){const[h,b64]=d.split(',');const mime=(h.match(/:(.*?);/)||[])[1]||'application/octet-stream';const bin=atob(b64);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime});}
/* Reduz a foto para 320px e salva como dataURL */
function redimensionarFoto(file){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{const s=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=320;
    c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,320,320);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.86));};
  img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('imagem inválida'));};img.src=u;});}

const I={
  x:'<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  ext:'<svg class="i" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
  down:'<svg class="i" viewBox="0 0 24 24"><path d="M12 4v12M6 11l6 6 6-6M4 20h16"/></svg>',
  up:'<svg class="i" viewBox="0 0 24 24"><path d="M12 20V8M6 13l6-6 6 6M4 4h16"/></svg>',
  file:'<svg class="i" viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>',
  copy:'<svg class="i" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  print:'<svg class="i" viewBox="0 0 24 24"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>',
  dup:'<svg class="i" viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  trash:'<svg class="i" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
  edit:'<svg class="i" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  plus:'<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  list:'<svg class="i" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  board:'<svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="4" height="8" rx="1.5"/></svg>',
  money:'<svg class="i" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  check:'<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  clock:'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert:'<svg class="i" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  brief:'<svg class="i" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  code:'<svg class="i" viewBox="0 0 24 24"><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg>',
  monitor:'<svg class="i" viewBox="0 0 24 24"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
};

/* ================= Regras de negócio ================= */
const subtotal=o=>(o.itens||[]).reduce((t,i)=>t+(+i.qtd||0)*(+i.valor||0),0);
const totalOS=o=>Math.max(0,subtotal(o)-(+o.desconto||0));
const recebidoOS=o=>(o.parcelas||[]).reduce((t,p)=>t+(p.pago?+p.valor||0:0),0);
const ativa=o=>o.status!=='entregue'&&o.status!=='cancelada';
const atrasada=o=>ativa(o)&&o.prazo&&diasAte(o.prazo)<0;
const formaDe=o=>FORMAS[o.pg?.forma]||FORMAS.pix;
function rotuloPg(o){const f=formaDe(o),n=+o.pg?.qtd||1;return f.parc?`${f.n} ${n}x`:f.n;}
function gerarParcelas(o){
  const pg=o.pg||(o.pg={forma:'pix',qtd:1,entrada:0,venc:''});
  const f=FORMAS[pg.forma]||FORMAS.pix;
  const n=f.parc?Math.max(2,Math.min(24,+pg.qtd||2)):1; pg.qtd=n;
  const tot=Math.round(totalOS(o)*100);
  const ent=Math.round(tot*Math.min(100,Math.max(0,+pg.entrada||0))/100);
  const resto=tot-ent, base=pg.venc||o.prazo||o.abertura||hojeISO();
  const l=[];
  if(ent>0) l.push({id:uid(),desc:'Entrada',valor:ent/100,venc:pg.entradaVenc||o.abertura||hojeISO(),pago:false});
  if(resto>0||!l.length){
    const b=Math.floor(resto/n);
    for(let i=0;i<n;i++) l.push({id:uid(),desc:n===1?(ent?'Saldo na entrega':'Pagamento único'):`Parcela ${i+1}/${n}`,
      valor:(i===n-1?resto-b*(n-1):b)/100,venc:addMeses(base,i),pago:false});
  }
  o.parcelas=l;
}
function syncParcelas(o){ if(!(o.parcelas||[]).some(p=>p.pago)) gerarParcelas(o); }
function statusPg(o){
  const t=totalOS(o),r=recebidoOS(o);
  if(t<=0) return ['gray','Sem valor'];
  if(r>=t-0.005) return ['ok','Quitado'];
  if((o.parcelas||[]).some(p=>!p.pago&&p.venc&&diasAte(p.venc)<0)) return ['bad','Em atraso'];
  if(r>0) return ['warn','Parcial'];
  return ['gray','Pendente'];
}
function prazoInfo(o){
  if(o.status==='entregue') return `<span class="pill c-ok nodot">Entregue ${o.entregueEm?dataBR(o.entregueEm):''}</span>`;
  if(o.status==='cancelada') return '<span class="muted">—</span>';
  if(!o.prazo) return '<span class="muted">Sem prazo</span>';
  const d=diasAte(o.prazo);
  if(d<0) return `<span class="pill c-bad nodot">Atrasada ${-d}d</span>`;
  if(d===0) return `<span class="pill c-warn nodot">Entrega hoje</span>`;
  if(d<=3) return `<span class="pill c-warn nodot">${d===1?'Amanhã':'Em '+d+' dias'}</span>`;
  return `<span class="mono" style="font-size:12.5px">${dataBR(o.prazo)}</span>`;
}
