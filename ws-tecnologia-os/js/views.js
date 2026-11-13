/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   views.js · Telas
   Renderização do Painel, Ordens (lista e quadro), Sistemas criados, Clientes, Financeiro e Configurações.
   ========================================================= */
"use strict";

/* ================= Render ================= */
function render(){
  const[t,s]=TITULOS[view]; $('#pgTitulo').textContent=t; $('#pgSub').textContent=s;
  $('#cntOS').textContent=ordens.filter(ativa).length||'';
  $('#cntSis').textContent=sistemas.length||'';
  $('#dlClientes').innerHTML=clientesLista().map(c=>`<option value="${esc(c.nome)}">`).join('');
  if(!pronto){$('#view').innerHTML='<div class="card empty"><b>Carregando…</b></div>';return;}
  const fn={painel:vPainel,ordens:vOrdens,sistemas:vSistemas,clientes:vClientes,financeiro:vFinanceiro,config:vConfig,docs:vDocs}[view];
  const v=$('#view'); v.innerHTML=fn(); if(animarView){v.classList.remove('entra');void v.offsetWidth;v.classList.add('entra');contarNumeros();animarView=false;}
  if(view==='ordens'&&modoOrdens==='kanban') ligarKanban();
}
const kpi=(c,ic,k,v,d)=>`<div class="card kpi"><div class="k"><span class="ic c-${c}">${I[ic]}</span>${k}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;

/* ---------- Painel ---------- */
function vPainel(){
  const vivas=ordens.filter(o=>o.status!=='cancelada');
  const fat=vivas.reduce((t,o)=>t+totalOS(o),0), rec=vivas.reduce((t,o)=>t+recebidoOS(o),0);
  const atr=ordens.filter(atrasada).length, at=ordens.filter(ativa).length;
  const mes=hojeISO().slice(0,7);
  const recMes=ordens.flatMap(o=>o.parcelas||[]).filter(p=>p.pago&&(p.pagoEm||'').startsWith(mes)).reduce((t,p)=>t+(+p.valor||0),0);
  const h=new Date().getHours(), saud=h<5?'Boa noite':h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  const dataExt=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const entregas=ordens.filter(ativa).sort((a,b)=>(a.prazo||'9999').localeCompare(b.prazo||'9999')).slice(0,6);
  const parcs=ordens.filter(o=>o.status!=='cancelada').flatMap(o=>(o.parcelas||[]).filter(p=>!p.pago&&+p.valor>0).map(p=>({o,p})))
    .sort((a,b)=>(a.p.venc||'9999').localeCompare(b.p.venc||'9999')).slice(0,6);
  const maxSt=Math.max(1,...Object.keys(STATUS).map(k=>ordens.filter(o=>o.status===k).length));
  const nomes=equipe().map(m=>esc(m.nome.split(' ')[0]));
  const recentes=[...sistemas].sort((a,b)=>(b.data||'').localeCompare(a.data||'')||(b.criado||0)-(a.criado||0)).slice(0,4);
  return `
  <section class="hero">
    <div class="hero-txt">
      <span class="eyebrow">${dataExt[0].toUpperCase()+dataExt.slice(1)}</span>
      <h2>${saud}, ${nomes.length>1?nomes.slice(0,-1).join(', ')+' e '+nomes.at(-1):nomes[0]||'equipe'}!</h2>
      <p>${at?`Vocês têm <b>${at}</b> ${at===1?'ordem ativa':'ordens ativas'}`:'Nenhuma ordem ativa no momento'}, <b>${sistemas.length}</b> sistema${sistemas.length===1?'':'s'} no portfólio${atr?` e <b class="hero-alert">${atr} entrega${atr>1?'s':''} atrasada${atr>1?'s':''}</b>`:''}.</p>
      <div class="hero-act"><button class="btn hero-pri" data-act="nova">${I.plus}Nova OS</button><button class="btn hero-sec" data-act="novo-sis">${I.monitor}Novo sistema</button><button class="btn hero-sec" data-goto="docs">${I.file}Documentação</button>${!ordens.length&&!sistemas.length?`<button class="btn hero-sec" data-act="exemplo">✨ Ver com dados de exemplo</button>`:''}</div>
    </div>
    <div class="hero-team">${equipe().map(m=>`<div class="ht">${avatarHTML(m)}<div><b>${esc(m.nome)}</b><small>${esc(m.cargo)}</small></div></div>`).join('')}</div>
  </section>
  <div class="kpis">
    ${kpi('brand','brief','Faturamento total',brl(fat),vivas.length+' ordens (exceto canceladas)')}
    ${kpi('ok','check','Recebido',brl(rec),fat?Math.round(rec/fat*100)+'% do total':'—')}
    ${kpi('warn','money','A receber',brl(fat-rec),'saldo em aberto')}
    ${kpi('cyan','up','Recebido no mês',brl(recMes),new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'}))}
    ${kpi(atr?'bad':'violet',atr?'alert':'clock','Em andamento',String(at),atr?atr+' com prazo vencido':'nenhuma atrasada')}
  </div>
  <div class="cols">
    ${graficoRecebimentos()}
    <div class="card"><div class="card-h"><h3>Sistemas recentes</h3><span class="sp"></span><button class="btn sm ghost" data-goto="sistemas">Ver portfólio</button></div>
      <div class="rows">${recentes.length?recentes.map(s=>`<div class="r" data-goto="sistemas"><div class="ico-sm" style="background:${corDe(s.nome)}">${esc(iniciais(s.nome))}</div>
        <div class="t"><b>${esc(s.nome)}</b><small>${esc(s.cliente||'Projeto próprio')}${s.link?' · '+esc(urlCurta(s.link)):''}</small></div>${pill(SIS_ST,s.status)}
        ${s.link?`<a class="iconbtn" href="${esc(s.link)}" target="_blank" rel="noopener" title="Abrir sistema">${I.ext}</a>`:''}</div>`).join('')
        :'<div class="empty"><b>Portfólio vazio</b>Cadastre os sistemas que vocês já entregaram.</div>'}</div></div>
  </div>
  <div class="cols">
    <div class="card"><div class="card-h"><h3>Próximas entregas</h3><span class="sp"></span><button class="btn sm ghost" data-goto="ordens">Ver todas</button></div>
      <div class="rows">${entregas.length?entregas.map(o=>`<div class="r" data-open="${o.id}">
        ${avatarHTML(membro(o.responsavel),'sm')}
        <div class="t"><span class="osn">${osNum(o)}</span><b>${esc(o.titulo)}</b><small>${esc(o.cliente?.nome||'Sem cliente')}</small></div>
        ${pill(STATUS,o.status)}<div style="min-width:92px;text-align:right">${prazoInfo(o)}</div></div>`).join('')
        :'<div class="empty"><b>Nada pendente</b>Clique em “Nova OS” para cadastrar um serviço.</div>'}</div></div>
    <div style="display:grid;gap:18px;align-content:start">
      <div class="card"><div class="card-h"><h3>Recebimentos pendentes</h3><span class="sp"></span><button class="btn sm ghost" data-goto="financeiro">Financeiro</button></div>
        <div class="rows">${parcs.length?parcs.map(({o,p})=>{const d=diasAte(p.venc);return `<div class="r" data-open="${o.id}" data-tab="pagamento">
          <div class="t"><b>${esc(o.cliente?.nome||o.titulo)}</b><small>${esc(p.desc)} · ${esc(rotuloPg(o))}</small></div>
          <div style="text-align:right"><div class="mono" style="font-weight:600">${brl(p.valor)}</div>
          <small style="color:${d!==null&&d<0?'var(--bad)':'var(--muted)'};font-size:11.5px">${d===null?'sem vencimento':d<0?'venceu '+dataBR(p.venc):'vence '+dataBR(p.venc)}</small></div></div>`;}).join('')
          :'<div class="empty"><b>Tudo em dia</b>Nenhuma parcela em aberto.</div>'}</div></div>
      <div class="card"><div class="card-h"><h3>Ordens por etapa</h3></div>
        <div class="statusbars">${Object.entries(STATUS).map(([k,s])=>{const n=ordens.filter(o=>o.status===k).length;
          return `<div class="sb" data-filtro="${k}"><span>${pill(STATUS,k)}</span><div class="bar" style="color:var(--${s.c})"><i style="width:${n/maxSt*100}%"></i></div><span class="n">${n}</span></div>`;}).join('')}</div></div>
    </div>
  </div>`;
}

/* ---------- Ordens ---------- */
function filtrarOrdens(){
  const q=norm(busca);
  return ordens.filter(o=>{
    if(filtroStatus==='ativas'&&!ativa(o))return false;
    if(filtroStatus==='atrasadas'&&!atrasada(o))return false;
    if(STATUS[filtroStatus]&&o.status!==filtroStatus)return false;
    if(q&&!norm([osNum(o),o.titulo,o.cliente?.nome,o.cliente?.email,o.tipo,o.descricao].join(' ')).includes(q))return false;
    return true;
  }).sort((a,b)=>b.numero-a.numero);
}
function vOrdens(){
  const cnt=k=>k==='todas'?ordens.length:k==='ativas'?ordens.filter(ativa).length:k==='atrasadas'?ordens.filter(atrasada).length:ordens.filter(o=>o.status===k).length;
  const fs=[['ativas','Ativas'],['atrasadas','Atrasadas'],...Object.entries(STATUS).map(([k,s])=>[k,s.n]),['todas','Todas']];
  const head=`<div class="toolbar">
    <div class="seg"><button data-modo="lista" class="${modoOrdens==='lista'?'on':''}">${I.list}Lista</button><button data-modo="kanban" class="${modoOrdens==='kanban'?'on':''}">${I.board}Quadro</button></div>
    ${modoOrdens==='lista'?`<div class="chips">${fs.map(([k,n])=>`<button class="chipf ${filtroStatus===k?'on':''}" data-filtro="${k}">${n}<span>${cnt(k)}</span></button>`).join('')}</div>`:''}
  </div>`;
  if(modoOrdens==='kanban') return head+vKanban();
  const l=filtrarOrdens();
  if(!l.length) return head+`<div class="card empty"><b>${ordens.length?'Nenhuma OS encontrada':'Nenhuma ordem de serviço ainda'}</b>${ordens.length?'Ajuste os filtros ou a busca.':'Clique em <b>Nova OS</b> para cadastrar a primeira.'}</div>`;
  return head+`<div class="card tblwrap"><table class="tbl resp"><thead><tr><th>OS</th><th>Serviço / cliente</th><th>Responsável</th><th>Etapa</th><th>Entrega</th><th>Pagamento</th><th class="r">Valor</th></tr></thead><tbody>
  ${l.map(o=>{const t=totalOS(o),r=recebidoOS(o),[pc,pn]=statusPg(o),m=membro(o.responsavel);return `<tr data-open="${o.id}">
    <td><span class="osn">${osNum(o)}</span><div class="muted" style="font-size:11.5px">${dataBR(o.abertura)}</div></td>
    <td class="tt"><b>${esc(o.titulo)}</b><small>${esc(o.cliente?.nome||'Sem cliente')} · ${esc(o.tipo||'')}</small></td>
    <td data-l="Responsável"><span style="display:inline-flex;align-items:center;gap:8px">${avatarHTML(m,'sm')}<span style="font-size:12.5px">${esc(m?.nome||'—')}</span></span></td>
    <td data-l="Etapa">${pill(STATUS,o.status)}</td><td data-l="Entrega">${prazoInfo(o)}</td>
    <td data-l="Pagamento"><span style="font-size:12.5px;font-weight:600">${esc(rotuloPg(o))}</span><br><span class="pill c-${pc} nodot" style="margin-top:3px;padding:1px 7px">${pn}</span></td>
    <td class="r" data-l="Valor"><span class="mono" style="font-weight:600">${brl(t)}</span><div class="prog"><i style="width:${t?Math.min(100,r/t*100):0}%"></i></div></td></tr>`;}).join('')}
  </tbody></table></div>`;
}
function vKanban(){
  const q=norm(busca); const cols=['orcamento','aprovada','desenvolvimento','testes','entregue'];
  const l=ordens.filter(o=>!q||norm([osNum(o),o.titulo,o.cliente?.nome].join(' ')).includes(q));
  return `<div class="kanban">${cols.map(k=>{const its=l.filter(o=>o.status===k).sort((a,b)=>(a.prazo||'9999').localeCompare(b.prazo||'9999'));
    return `<div class="col" data-col="${k}"><div class="col-h">${pill(STATUS,k)}<span class="n">${its.length}</span></div>
    ${its.map(o=>`<div class="kc" draggable="true" data-open="${o.id}" data-drag="${o.id}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="osn">${osNum(o)}</span>${avatarHTML(membro(o.responsavel),'sm')}</div><b>${esc(o.titulo)}</b><small>${esc(o.cliente?.nome||'Sem cliente')}</small>
      <div class="ft"><span class="mono" style="font-size:12.5px;font-weight:600">${brl(totalOS(o))}</span>${prazoInfo(o)}</div></div>`).join('')}</div>`;}).join('')}</div>
  <p class="muted" style="font-size:12.5px">Arraste os cartões entre as colunas para mudar a etapa (no celular, mude pela própria OS). Ordens canceladas aparecem só na lista.</p>`;
}
function ligarKanban(){
  document.querySelectorAll('.kc').forEach(c=>c.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain','os:'+c.dataset.drag);e.dataTransfer.effectAllowed='move';}));
  document.querySelectorAll('.col').forEach(col=>{
    col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('over');});
    col.addEventListener('dragleave',e=>{if(!col.contains(e.relatedTarget))col.classList.remove('over');});
    col.addEventListener('drop',e=>{e.preventDefault();col.classList.remove('over');
      const v=e.dataTransfer.getData('text/plain')||'';if(!v.startsWith('os:'))return;
      const o=ordens.find(x=>x.id===v.slice(3)); if(o&&o.status!==col.dataset.col){mudarStatus(o,col.dataset.col);salvarOS(o);render();toast(osNum(o)+' → '+STATUS[o.status].n);}});
  });
}
function mudarStatus(o,st){
  if(o.status===st) return;
  o.status=st; (o.historico||(o.historico=[])).push({t:Date.now(),txt:'Etapa alterada para "'+STATUS[st].n+'"'});
  if(st==='entregue'&&!o.entregueEm) o.entregueEm=hojeISO();
  if(st!=='entregue') o.entregueEm='';
}

/* ---------- Sistemas criados ---------- */
const CORES=['#4f8cff','#7b5cff','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#8b5cf6'];
const corDe=s=>CORES[[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%CORES.length];
const iniciais=s=>String(s||'?').split(/\s+/).filter(w=>w.length>2||/^[A-Z]/.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'S';
function vSistemas(){
  const q=norm(busca);
  let l=sistemas.filter(s=>(filtroSis==='todos'||s.status===filtroSis)&&(!q||norm([s.nome,s.cliente,s.tec,s.descricao,s.link].join(' ')).includes(q)))
    .sort((a,b)=>(b.data||'').localeCompare(a.data||'')||(b.criado||0)-(a.criado||0));
  const jaTem=new Set(sistemas.map(s=>s.osId).filter(Boolean));
  const sugestoes=ordens.filter(o=>o.links?.producao&&!jaTem.has(o.id));
  const cnt=k=>k==='todos'?sistemas.length:sistemas.filter(s=>s.status===k).length;
  return `<div class="toolbar"><div class="chips">${[['todos','Todos'],...Object.entries(SIS_ST).map(([k,s])=>[k,s.n])].map(([k,n])=>`<button class="chipf ${filtroSis===k?'on':''}" data-fsis="${k}">${n}<span>${cnt(k)}</span></button>`).join('')}</div>
    <span class="sp"></span><button class="btn" data-act="novo-sis">${I.plus}Adicionar sistema</button></div>
  ${sugestoes.length?`<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>OS com link que ainda não estão no portfólio</h3></div><div class="rows">
    ${sugestoes.map(o=>`<div class="r" style="cursor:default"><div class="t"><span class="osn">${osNum(o)}</span><b>${esc(o.titulo)}</b><small>${esc(urlCurta(o.links.producao))}</small></div><button class="btn sm" data-act="sis-da-os" data-id="${o.id}">${I.plus}Adicionar</button></div>`).join('')}</div></div>`:''}
  ${l.length?`<div class="sysgrid">${l.map(s=>{const m=membro(s.responsavel);return `<div class="card sys">
    <div class="top2"><div class="ico" style="background:${corDe(s.nome)}">${esc(iniciais(s.nome))}</div><div style="flex:1;min-width:0"><h3>${esc(s.nome)}</h3><div class="cl">${esc(s.cliente||'Projeto próprio')}${s.data?' · '+dataBR(s.data):''}</div><div style="margin-top:6px">${pill(SIS_ST,s.status)}</div></div></div>
    ${s.descricao?`<div class="ds">${esc(s.descricao)}</div>`:'<div class="ds"></div>'}
    ${s.tec?`<div class="tech">${s.tec.split(',').map(t=>t.trim()).filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
    ${s.link?`<div class="url" title="${esc(s.link)}">${esc(urlCurta(s.link))}</div>`:'<div class="url" style="color:var(--faint)">Sem link cadastrado</div>'}
    <div class="ft">${m?avatarHTML(m,'sm'):''}
      ${s.link?`<a class="btn sm pri" href="${esc(s.link)}" target="_blank" rel="noopener">${I.ext}Abrir</a><button class="btn sm" data-act="copiar-link" data-id="${s.id}" title="Copiar link">${I.copy}</button>`:''}
      ${s.repo?`<a class="btn sm" href="${esc(s.repo)}" target="_blank" rel="noopener" title="Código-fonte">${I.code}</a>`:''}
      <span class="sp"></span><button class="iconbtn" data-act="editar-sis" data-id="${s.id}" title="Editar">${I.edit}</button><button class="iconbtn del" data-act="apagar-sis" data-id="${s.id}" title="Excluir">${I.trash}</button></div></div>`;}).join('')}</div>`
  :`<div class="card empty"><b>${sistemas.length?'Nenhum sistema encontrado':'Nenhum sistema cadastrado ainda'}</b>${sistemas.length?'Ajuste o filtro ou a busca.':'Clique em <b>Adicionar sistema</b> para montar o portfólio da WS Tecnologia com os links de cada sistema.'}</div>`}`;
}
let sisEditando=null;
const mSis=$('#mSis'),fSis=$('#fSis');
function abrirSis(s,pre){
  sisEditando=s?s.id:null; $('#sisTitulo').textContent=s?'Editar sistema':'Novo sistema';
  const d=s||pre||{};fSis.reset();
  fSis.nome.value=d.nome||'';fSis.cliente.value=d.cliente||'';fSis.status.value=d.status||'ar';fSis.link.value=d.link||'';
  fSis.repo.value=d.repo||'';fSis.tec.value=d.tec||'';fSis.descricao.value=d.descricao||'';fSis.data.value=d.data||hojeISO();
  fSis.responsavel.value=d.responsavel||equipe()[0]?.id||''; fSis.dataset.os=d.osId||'';
  mSis.classList.add('open');setTimeout(()=>fSis.nome.focus(),50);
}
fSis.addEventListener('submit',async e=>{
  e.preventDefault();
  const d={nome:fSis.nome.value.trim(),cliente:fSis.cliente.value.trim(),status:fSis.status.value,link:urlOk(fSis.link.value),repo:urlOk(fSis.repo.value),
    tec:fSis.tec.value.trim(),descricao:fSis.descricao.value.trim(),data:fSis.data.value,responsavel:fSis.responsavel.value};
  let s=sistemas.find(x=>x.id===sisEditando);
  if(s) Object.assign(s,d); else {s={id:uid(),criado:Date.now(),osId:fSis.dataset.os||'',...d};sistemas.push(s);}
  await salvarSistema(s); mSis.classList.remove('open'); if(view!=='sistemas')irPara('sistemas');else render(); toast('Sistema salvo');
});

/* ---------- Clientes ---------- */
function clientesLista(){
  const m=new Map();
  for(const o of ordens){const n=(o.cliente?.nome||'').trim(); if(!n)continue; const k=norm(n);
    const c=m.get(k)||{nome:n,tel:'',email:'',doc:'',os:0,total:0,rec:0,ult:0};
    c.os++; if(o.status!=='cancelada'){c.total+=totalOS(o);c.rec+=recebidoOS(o);}
    if((o.criado||0)>=c.ult){c.ult=o.criado||0;c.tel=o.cliente.tel||c.tel;c.email=o.cliente.email||c.email;c.doc=o.cliente.doc||c.doc;}
    m.set(k,c);}
  return [...m.values()].sort((a,b)=>b.total-a.total);
}
function vClientes(){
  const q=norm(busca); const l=clientesLista().filter(c=>!q||norm(c.nome+' '+c.email).includes(q));
  if(!l.length) return `<div class="card empty"><b>Nenhum cliente ainda</b>Os clientes aparecem aqui automaticamente quando você cria ordens de serviço.</div>`;
  return `<div class="card tblwrap"><table class="tbl resp"><thead><tr><th>Cliente</th><th>Contato</th><th class="r">Ordens</th><th class="r">Faturado</th><th class="r">A receber</th></tr></thead><tbody>
  ${l.map(c=>`<tr data-cliente="${esc(c.nome)}"><td class="tt"><b>${esc(c.nome)}</b><small>${esc(c.doc||'')}</small></td>
    <td data-l="Contato"><span>${esc(c.tel||'—')}</span> <small class="muted">${esc(c.email||'')}</small></td>
    <td class="r mono" data-l="Ordens">${c.os}</td><td class="r mono" data-l="Faturado">${brl(c.total)}</td>
    <td class="r mono" data-l="A receber" style="color:${c.total-c.rec>0.004?'var(--warn)':'var(--ok)'}">${brl(c.total-c.rec)}</td></tr>`).join('')}
  </tbody></table></div><p class="muted" style="font-size:12.5px">Clique em um cliente para ver as ordens dele.</p>`;
}

/* ---------- Financeiro ---------- */
function vFinanceiro(){
  const all=ordens.filter(o=>o.status!=='cancelada').flatMap(o=>(o.parcelas||[]).filter(p=>+p.valor>0).map(p=>({o,p})));
  const pend=all.filter(x=>!x.p.pago), venc=pend.filter(x=>x.p.venc&&diasAte(x.p.venc)<0);
  const prox30=pend.filter(x=>{const d=diasAte(x.p.venc);return d!==null&&d>=0&&d<=30;});
  const mes=hojeISO().slice(0,7), recMes=all.filter(x=>x.p.pago&&(x.p.pagoEm||'').startsWith(mes));
  const soma=a=>a.reduce((t,x)=>t+(+x.p.valor||0),0);
  let l=filtroFin==='pendentes'?pend:filtroFin==='vencidas'?venc:filtroFin==='pagas'?all.filter(x=>x.p.pago):all;
  const q=norm(busca); if(q) l=l.filter(x=>norm([x.o.cliente?.nome,x.o.titulo,osNum(x.o)].join(' ')).includes(q));
  l=l.sort((a,b)=>filtroFin==='pagas'?(b.p.pagoEm||'').localeCompare(a.p.pagoEm||''):(a.p.venc||'9999').localeCompare(b.p.venc||'9999'));
  /* Recebido por forma de pagamento */
  const porForma={};all.filter(x=>x.p.pago).forEach(x=>{const k=x.o.pg?.forma||'pix';porForma[k]=(porForma[k]||0)+(+x.p.valor||0);});
  return `<div class="kpis" style="grid-template-columns:repeat(4,1fr)">
    ${kpi('ok','check','Recebido no mês',brl(soma(recMes)),recMes.length+' pagamento(s)')}
    ${kpi('warn','clock','Próximos 30 dias',brl(soma(prox30)),prox30.length+' parcela(s)')}
    ${kpi('bad','alert','Vencidas',brl(soma(venc)),venc.length+' parcela(s)')}
    ${kpi('brand','money','Total a receber',brl(soma(pend)),pend.length+' parcela(s) em aberto')}</div>
  ${Object.keys(porForma).length?`<div class="card" style="padding:14px 18px;margin-bottom:16px;display:flex;gap:10px 22px;flex-wrap:wrap;align-items:center"><b style="font-size:13px">Recebido por forma:</b>
    ${Object.entries(porForma).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<span style="font-size:13px"><span class="muted">${esc(FORMAS[k]?.n||k)}</span> <b class="mono">${brl(v)}</b></span>`).join('')}</div>`:''}
  <div class="toolbar"><div class="chips">${[['pendentes','Em aberto'],['vencidas','Vencidas'],['pagas','Pagas'],['todas','Todas']].map(([k,n])=>`<button class="chipf ${filtroFin===k?'on':''}" data-fin="${k}">${n}</button>`).join('')}</div></div>
  ${l.length?`<div class="card tblwrap"><table class="tbl resp"><thead><tr><th>Vencimento</th><th>Cliente / serviço</th><th>Parcela</th><th>Situação</th><th class="r">Valor</th><th class="r">Recebido</th></tr></thead><tbody>
  ${l.map(({o,p})=>{const d=diasAte(p.venc);const sit=p.pago?`<span class="pill c-ok">Pago ${dataBR(p.pagoEm)}</span>`:d!==null&&d<0?`<span class="pill c-bad">Vencida há ${-d}d</span>`:d===0?'<span class="pill c-warn">Vence hoje</span>':'<span class="pill c-gray">A vencer</span>';
    return `<tr data-open="${o.id}" data-tab="pagamento"><td class="mono" data-l="Vencimento">${dataBR(p.venc)}</td><td class="tt"><b>${esc(o.cliente?.nome||'Sem cliente')}</b><small>${osNum(o)} · ${esc(o.titulo)}</small></td>
    <td data-l="Parcela">${esc(p.desc)} <span class="muted" style="font-size:11.5px">· ${esc(rotuloPg(o))}</span></td><td data-l="Situação">${sit}</td><td class="r mono" data-l="Valor" style="font-weight:600">${brl(p.valor)}</td>
    <td class="r" data-l="Recebido"><input type="checkbox" data-pagar="${o.id}|${p.id}" ${p.pago?'checked':''} style="width:20px;height:20px;accent-color:var(--ok);cursor:pointer;vertical-align:middle"></td></tr>`;}).join('')}
  </tbody></table></div>`:`<div class="card empty"><b>Nada por aqui</b>As parcelas são geradas na aba Pagamento de cada OS.</div>`}`;
}

/* ---------- Configurações ---------- */
function vConfig(){
  const f=(k,l,ph='')=>`<div><label class="lbl">${l}</label><input class="field" data-cfg="${k}" value="${esc(config[k])}" placeholder="${ph}"></div>`;
  return `<div class="grid" style="max-width:900px;gap:18px">
  <div class="card"><div class="card-h"><h3>Equipe</h3><span class="sp"></span><button class="btn sm" data-act="add-membro">${I.plus}Adicionar pessoa</button></div><div style="padding:18px" class="grid">
    ${equipe().map(m=>`<div class="cfg-member">${avatarHTML(m)}<div class="grid">
      <div class="grid g2"><div><label class="lbl">Nome</label><input class="field" data-mb="${m.id}" data-k="nome" value="${esc(m.nome)}"></div>
      <div><label class="lbl">Cargo</label><input class="field" data-mb="${m.id}" data-k="cargo" value="${esc(m.cargo)}"></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="foto" data-id="${m.id}">${I.up}Trocar foto</button>
      ${m.foto&&FOTOS_PADRAO[m.id]?`<button class="btn sm ghost" data-act="foto-padrao" data-id="${m.id}">Foto original</button>`:''}
      ${equipe().length>1?`<button class="btn sm ghost danger" data-act="rm-membro" data-id="${m.id}">${I.trash}Remover</button>`:''}</div></div></div>`).join('')}
  </div></div>
  <div class="card"><div class="card-h"><h3>Identidade visual</h3><span class="muted" style="font-size:12px">Logo no menu, na tela de abertura e na OS impressa</span></div>
    <div style="padding:18px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
      <div class="logo-prev">${config.logo?`<img src="${config.logo}" alt="Logo">`:'<span>WS</span>'}</div>
      <div><b>Logo da empresa</b><div class="muted" style="font-size:12.5px;margin:2px 0 10px">PNG ou JPG, de preferência quadrada e com fundo transparente.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="logo">${I.up}Enviar logo</button>${config.logo?`<button class="btn sm ghost danger" data-act="rm-logo">${I.trash}Remover logo</button>`:''}</div></div>
    </div></div>
  <div class="card"><div class="card-h"><h3>Dados da empresa</h3><span class="muted" style="font-size:12px">Saem no cabeçalho da OS impressa</span></div><div style="padding:18px" class="grid">
    <div class="grid g2">${f('empresa','Nome da empresa')}${f('slogan','Slogan / área')}</div>
    <div class="grid g3">${f('cnpj','CNPJ / CPF','00.000.000/0001-00')}${f('telefone','Telefone / WhatsApp','(00) 00000-0000')}${f('email','E-mail','contato@…')}</div>
    <div class="grid g3">${f('site','Site / Instagram')}${f('cidade','Cidade / UF')}${f('pix','Chave Pix')}</div>
    <div><label class="lbl">Termos padrão da OS (garantia, condições)</label><textarea class="field" data-cfg="termos">${esc(config.termos)}</textarea></div>
    <div><button class="btn pri" data-act="salvar-cfg">${I.check}Salvar dados da empresa</button></div></div></div>
  <div class="card"><div class="card-h"><h3>Backup e dados</h3></div><div style="padding:18px">
    <p class="muted" style="margin:0 0 14px">Tudo fica salvo neste navegador, neste computador. Para não perder nada (ou levar para outro computador/celular), exporte um backup com frequência — ele inclui as ordens, os sistemas, as fotos e os arquivos anexados.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="exportar">${I.down}Exportar backup</button><button class="btn" data-act="importar">${I.up}Restaurar backup</button><button class="btn" data-act="importar-antigo">${I.up}Importar do sistema antigo</button></div>
  </div></div>
  </div>`;
}

/* ---------- Gráfico: recebido por mês (uma série, últimos 6 meses) ---------- */
function topoEscala(max){const p=Math.pow(10,Math.floor(Math.log10(max)));for(const f of [1,2,2.5,5,10])if(f*p>=max)return f*p;return 10*p;}
const brlCurto=v=>v>=1e6?'R$ '+(v/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':v>=1000?'R$ '+(v/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':'R$ '+Math.round(v);
function graficoRecebimentos(){
  const hoje=new Date(),meses=[];
  for(let i=5;i>=0;i--){const x=new Date(hoje.getFullYear(),hoje.getMonth()-i,1);
    const nm=x.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');meses.push({k:isoDe(x).slice(0,7),n:nm[0].toUpperCase()+nm.slice(1),a:x.getFullYear(),v:0,q:0});}
  ordens.filter(o=>o.status!=='cancelada').forEach(o=>(o.parcelas||[]).forEach(p=>{if(!p.pago)return;const m=meses.find(x=>(p.pagoEm||'').startsWith(x.k));if(m){m.v+=+p.valor||0;m.q++;}}));
  const max=Math.max(0,...meses.map(m=>m.v)),topo=max>0?topoEscala(max):1000,total=meses.reduce((t,m)=>t+m.v,0);
  const ant=meses[4].v,atual=meses[5].v,varia=ant>0?Math.round((atual-ant)/ant*100):null;
  return `<div class="card chart-card"><div class="card-h"><div><h3>Recebido por mês</h3><small class="muted">Últimos 6 meses · ${brl(total)}</small></div><span class="sp"></span>
    ${varia!==null?`<span class="pill nodot ${varia>=0?'c-ok':'c-bad'}">${varia>=0?'▲':'▼'} ${Math.abs(varia)}% vs mês anterior</span>`:''}</div>
    <div class="chart" role="img" aria-label="Recebido por mês nos últimos 6 meses">
      <div class="ch-y"><span>${brlCurto(topo)}</span><span>${brlCurto(topo/2)}</span><span>R$ 0</span></div>
      <div class="ch-plot"><div class="ch-grid"><i></i><i></i><i></i></div>
        ${meses.map((m,i)=>`<div class="ch-col" tabindex="0" data-tip="${m.n[0].toUpperCase()+m.n.slice(1)}/${m.a} · ${brl(m.v)} · ${m.q} pagamento${m.q===1?'':'s'}">
          <div class="ch-bar${i===5?' cur':''}" style="height:${m.v?Math.max(2,m.v/topo*100):0}%">${(i===5||m.v===max)&&m.v>0?`<span class="ch-lbl">${brlCurto(m.v)}</span>`:''}</div>
          <span class="ch-x">${m.n}</span></div>`).join('')}
      </div>
    </div>
    <table class="sr-only"><caption>Recebido por mês</caption>${meses.map(m=>`<tr><th>${m.n}/${m.a}</th><td>${brl(m.v)}</td></tr>`).join('')}</table></div>`;
}
/* Números dos indicadores sobem de 0 até o valor (efeito ao abrir a tela) */
function contarNumeros(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.kpi .v').forEach(el=>{
    const txt=el.textContent.trim(),dinheiro=txt.startsWith('R$');
    const alvo=dinheiro?+txt.replace(/[^\d,]/g,'').replace(',','.'):parseInt(txt,10);
    if(!alvo||isNaN(alvo))return;
    const t0=performance.now(),dur=750;
    const passo=t=>{const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3),v=alvo*e;
      el.textContent=dinheiro?brl(p<1?v:alvo):String(Math.round(v));if(p<1)requestAnimationFrame(passo);};
    requestAnimationFrame(passo);
  });
}
