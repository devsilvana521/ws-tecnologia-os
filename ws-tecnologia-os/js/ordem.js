/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   ordem.js · Detalhe da OS
   Painel lateral da OS: abas, edição, pagamento, arquivos, histórico, WhatsApp e impressão/PDF.
   ========================================================= */
"use strict";

/* ================= Drawer (detalhe da OS) ================= */
let drawerOS=null,drawerTab='resumo',saveT=null,salvando=false;
function abrirOS(id,tab){
  const o=ordens.find(x=>x.id===id); if(!o) return;
  drawerOS=o; drawerTab=tab||'resumo';
  renderDrawer(); $('#drawer').classList.add('open'); $('#overlay').classList.add('open'); document.body.style.overflow='hidden';
}
function fecharDrawer(){ if(saveT){clearTimeout(saveT);saveT=null;if(drawerOS)salvarOS(drawerOS);}
  drawerOS=null; $('#drawer').classList.remove('open'); $('#overlay').classList.remove('open'); document.body.style.overflow=''; render(); }
$('#overlay').onclick=fecharDrawer;
function marcarSalvo(){const s=$('#savedInd'); if(!s)return; const ing=!!saveT||salvando; s.className='saved'+(ing?' ing':''); s.innerHTML=ing?'<span class="spin"></span>Salvando…':I.check.replace('class="i"','class="i" style="width:14px;height:14px"')+' Tudo salvo';}
/* Salvar na hora (botão Salvar, tecla Enter) — além do salvamento automático */
async function salvarAgora(fechar){
  const o=drawerOS; if(!o) return;
  clearTimeout(saveT); saveT=null; salvando=true; marcarSalvo();
  await salvarOS(o); salvando=false; marcarSalvo(); render();
  const b=$('#btnSalvarOS'); if(b){b.classList.add('ok');b.innerHTML=I.check+'Salvo!';setTimeout(()=>{if(b.isConnected){b.classList.remove('ok');b.innerHTML=I.check+'Salvar';}},1600);}
  toast(osNum(o)+' salva — valor total '+brl(totalOS(o)));
  if(fechar) fecharDrawer();
}
function agendarSalvar(){ clearTimeout(saveT); const o=drawerOS; saveT=setTimeout(async()=>{saveT=null;salvando=true;marcarSalvo();await salvarOS(o);salvando=false;marcarSalvo();},500); marcarSalvo(); }

function renderDrawer(){
  const o=drawerOS; if(!o) return;
  const sc=$('.db')?.scrollTop||0;
  const tabs=[['resumo','Resumo'],['valores','Itens e valores'],['pagamento','Pagamento'],['entrega','Entrega e arquivos'],['historico','Histórico']];
  $('#drawer').innerHTML=`
  <div class="dh"><div class="row1"><span class="osn" style="font-size:13px">${osNum(o)}</span>
    <select class="statussel c-${STATUS[o.status].c}" data-st title="Etapa">${Object.entries(STATUS).map(([k,s])=>`<option value="${k}" ${o.status===k?'selected':''}>${s.n}</option>`).join('')}</select>
    <span class="sp"></span><span class="saved" id="savedInd"></span><button class="iconbtn" data-act="fechar" title="Fechar (Esc)">${I.x}</button></div>
    <h2>${esc(o.titulo||'Sem título')}</h2>
    <div class="meta"><span>${esc(o.cliente?.nome||'Sem cliente')}</span><span>Aberta em ${dataBR(o.abertura)}</span><span>${prazoInfo(o)}</span><span class="mono" style="color:var(--text);font-weight:600">${brl(totalOS(o))}</span></div>
    <div class="tabs">${tabs.map(([k,n])=>`<button data-tab="${k}" class="${drawerTab===k?'on':''}">${n}</button>`).join('')}</div></div>
  <div class="db">${({resumo:tResumo,valores:tValores,pagamento:tPagamento,entrega:tEntrega,historico:tHistorico})[drawerTab](o)}</div>
  <div class="dfoot">
    <button class="btn sm pri" id="btnSalvarOS" data-act="salvar-os" title="Salvar agora (Ctrl+S)">${I.check}Salvar</button>
    <button class="btn sm" data-act="salvar-fechar" title="Salvar e fechar a OS">Salvar e fechar</button>
    <button class="btn sm" data-act="imprimir" title="Abre a OS formatada para imprimir ou salvar em PDF">${I.print}Imprimir / PDF</button>
    <button class="btn sm" data-act="copiar">${I.copy}Copiar p/ WhatsApp</button>
    <button class="btn sm ghost" data-act="duplicar">${I.dup}Duplicar</button>
    <span class="sp"></span><button class="btn sm danger" data-act="excluir" title="Excluir esta OS">${I.trash}</button></div>`;
  marcarSalvo(); const db=$('.db'); if(db) db.scrollTop=sc;
}
const inp=(path,val,attrs='')=>`<input class="field" data-b="${path}" value="${esc(val??'')}" ${attrs}>`;
function tResumo(o){
  return `<h4>Serviço</h4><div class="grid">
    <div><label class="lbl">Nome do serviço / sistema</label>${inp('titulo',o.titulo,'data-rr')}</div>
    <div class="grid g2">
      <div><label class="lbl">Tipo</label><select class="field" data-b="tipo">${TIPOS.map(t=>`<option ${o.tipo===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div><label class="lbl">Responsável</label><select class="field" data-b="responsavel">${equipe().map(m=>`<option value="${m.id}" ${o.responsavel===m.id?'selected':''}>${esc(m.nome)} — ${esc(m.cargo)}</option>`).join('')}</select></div>
    </div>
    <div class="grid g4">
      <div><label class="lbl">Prioridade</label><select class="field" data-b="prioridade">${Object.entries(PRIOR).map(([k,p])=>`<option value="${k}" ${o.prioridade===k?'selected':''}>${p.n}</option>`).join('')}</select></div>
      <div><label class="lbl">Abertura</label>${inp('abertura',o.abertura,'type="date" data-rr')}</div>
      <div><label class="lbl">Prazo de entrega</label>${inp('prazo',o.prazo,'type="date" data-rr')}</div>
      <div><label class="lbl">Garantia (dias)</label>${inp('garantia',o.garantia,'type="number" min="0" data-num')}</div>
    </div>
    <div><label class="lbl">Escopo / o que será desenvolvido</label><textarea class="field" data-b="descricao" placeholder="Funcionalidades, telas, integrações, requisitos…">${esc(o.descricao)}</textarea></div>
  </div>
  <h4>Cliente</h4><div class="grid">
    <div class="grid g2"><div><label class="lbl">Nome / empresa</label>${inp('cliente.nome',o.cliente?.nome,'list="dlClientes" data-rr')}</div>
      <div><label class="lbl">CPF / CNPJ</label>${inp('cliente.doc',o.cliente?.doc)}</div></div>
    <div class="grid g2"><div><label class="lbl">Telefone / WhatsApp</label>${inp('cliente.tel',o.cliente?.tel,'inputmode="tel"')}</div>
      <div><label class="lbl">E-mail</label>${inp('cliente.email',o.cliente?.email,'type="email"')}</div></div>
  </div>`;
}
function tValores(o){
  const it=o.itens||[];
  return `<div class="dica">${I.money}<span><b>Como lançar o valor:</b> digite só os números, sem vírgula (ex.: <b>150000</b> vira <b>R$ 1.500,00</b>). Depois aperte <b>Enter</b> ou clique em <b>Salvar</b> no rodapé. O sistema também salva sozinho enquanto você digita.</span></div>
  <h4>Itens do orçamento</h4>
  <div class="items"><div class="ih"><span>Descrição</span><span>Qtd</span><span>Valor unit.</span><span style="text-align:right">Total</span><span></span></div>
  ${it.map(i=>`<div class="ir"><input class="field" data-item="${i.id}" data-k="desc" value="${esc(i.desc)}" placeholder="Ex.: Módulo de cadastro">
    <input class="field mono" data-item="${i.id}" data-k="qtd" type="number" min="0" step="1" value="${+i.qtd||0}">
    <span class="money"><input class="field" data-item="${i.id}" data-k="valor" data-mask="money" inputmode="numeric" value="${i.valor?num2(i.valor):''}" placeholder="0,00"></span>
    <span class="tot">${brl((+i.qtd||0)*(+i.valor||0))}</span>
    <button class="iconbtn del" data-act="rm-item" data-id="${i.id}" title="Remover">${I.trash}</button></div>`).join('')}
  ${it.length?'':'<div class="empty" style="padding:22px">Nenhum item. Adicione as etapas ou módulos do serviço.</div>'}</div>
  <button class="btn sm" data-act="add-item" style="margin-top:10px">${I.plus}Adicionar item</button>
  <div class="totals"><div>Subtotal<b>${brl(subtotal(o))}</b></div>
    <div style="align-items:center">Desconto<span class="money" style="width:150px"><input class="field" style="height:34px" data-b="desconto" data-mask="money" data-rr inputmode="numeric" value="${o.desconto?num2(o.desconto):''}" placeholder="0,00"></span></div>
    <div class="big">Total<b>${brl(totalOS(o))}</b></div></div>`;
}
function tPagamento(o){
  const t=totalOS(o),r=recebidoOS(o),pg=o.pg||{},f=formaDe(o);const soma=(o.parcelas||[]).reduce((s,p)=>s+(+p.valor||0),0);
  return `<div class="resumo-pg"><div><small>Total da OS</small><b>${brl(t)}</b></div><div><small>Recebido</small><b style="color:var(--ok)">${brl(r)}</b></div><div><small>Em aberto</small><b style="color:${t-r>0.004?'var(--warn)':'var(--ok)'}">${brl(Math.max(0,t-r))}</b></div></div>
  <h4>Forma de pagamento</h4>
  <div class="pays">${Object.entries(FORMAS).map(([k,x])=>`<button class="pay ${pg.forma===k?'on':''}" data-forma="${k}"><span class="pi">${x.ic}</span><span>${x.n}<small>${x.s}</small></span></button>`).join('')}</div>
  <h4>Condições</h4><div class="grid ${f.parc?'g4':'g3'}">
    ${f.parc?`<div><label class="lbl">Nº de parcelas</label><select class="field" data-b="pg.qtd" data-pg>${Array.from({length:23},(_,i)=>i+2).map(n=>`<option value="${n}" ${+pg.qtd===n?'selected':''}>${n}x de ${brl((t*(1-(+pg.entrada||0)/100))/n)}</option>`).join('')}</select></div>`:''}
    <div><label class="lbl">Entrada</label><select class="field" data-b="pg.entrada" data-pg>${[0,10,20,30,40,50,60,70].map(n=>`<option value="${n}" ${+pg.entrada===n?'selected':''}>${n?n+'% ('+brl(t*n/100)+')':'Sem entrada'}</option>`).join('')}</select></div>
    ${+pg.entrada?`<div><label class="lbl">Data da entrada</label>${inp('pg.entradaVenc',pg.entradaVenc||o.abertura,'type="date" data-pg')}</div>`:''}
    <div><label class="lbl">${f.parc?'1º vencimento':+pg.entrada?'Vencimento do saldo':'Data do pagamento'}</label>${inp('pg.venc',pg.venc,'type="date" data-pg')}</div></div>
  <h4>${f.parc||+pg.entrada?'Parcelas':'Pagamento'} <span class="muted" style="font-weight:600;font-size:12px">— marque quando receber</span><span style="flex:1"></span><button class="btn sm" data-act="regerar">Recalcular</button></h4>
  ${Math.abs(soma-t)>0.009&&(o.parcelas||[]).length?`<div class="banner show" style="margin-bottom:12px">A soma das parcelas (${brl(soma)}) está diferente do total da OS (${brl(t)}). Clique em “Recalcular”.</div>`:''}
  <div class="parcs">${(o.parcelas||[]).map(p=>{const d=diasAte(p.venc);const st=p.pago?`<span class="pill c-ok">Pago ${dataBR(p.pagoEm)}</span>`:d!==null&&d<0?'<span class="pill c-bad">Vencida</span>':'<span class="pill c-gray">A vencer</span>';
    return `<div class="pc ${p.pago?'pago':''}"><input type="checkbox" data-parc="${p.id}" ${p.pago?'checked':''} title="Marcar como recebido">
    <b style="font-size:13px">${esc(p.desc)}</b>
    <input class="field" type="date" data-pv="${p.id}" value="${p.venc||''}" title="Vencimento">
    <span class="mono" style="text-align:right;font-weight:600">${brl(p.valor)}</span>${st}</div>`;}).join('')||'<div class="empty" style="padding:22px">Adicione itens com valor na aba “Itens e valores”.</div>'}</div>
  ${config.pix&&pg.forma==='pix'?`<p class="muted" style="font-size:12.5px;margin-top:12px">Chave Pix da empresa: <b style="color:var(--text)">${esc(config.pix)}</b></p>`:''}`;
}
function tEntrega(o){
  const L=o.links||{};const lk=(k,l,ph)=>`<div><label class="lbl">${l}</label><div class="linkrow">${inp('links.'+k,L[k],`placeholder="${ph}" data-link data-rr`)}
    ${L[k]?`<a class="btn" href="${esc(L[k])}" target="_blank" rel="noopener">${I.ext}Abrir</a>`:''}</div></div>`;
  const noPort=sistemas.some(s=>s.osId===o.id);
  return `<h4>Links do sistema</h4><div class="grid">${lk('producao','Sistema pronto (link de acesso)','https://…')}${lk('homolog','Ambiente de testes','https://…')}${lk('repo','Repositório / código-fonte','https://github.com/…')}</div>
  <div style="margin-top:12px">${noPort?`<span class="pill c-ok">Já está em Sistemas criados</span>`:`<button class="btn sm" data-act="sis-da-os" data-id="${o.id}">${I.monitor}Adicionar aos Sistemas criados</button>`}</div>
  <h4>Arquivos do projeto</h4>
  ${idb?`<div class="drop" data-act="upload" id="dropZone">Arraste arquivos aqui (.zip, .html, .pdf, imagens…) ou <b>clique para escolher</b></div>`
    :`<div class="drop" style="cursor:default">Envio de arquivos indisponível neste navegador.</div>`}
  <div class="files">${(o.arquivos||[]).map(a=>`<div class="file">${I.file}<span class="fn" title="${esc(a.name)}">${esc(a.name)}</span><span class="fs">${tamanho(a.size||0)}</span>
    <button class="iconbtn" data-act="baixar" data-id="${a.id}" title="Baixar">${I.down}</button><button class="iconbtn del" data-act="rm-arq" data-id="${a.id}" title="Remover">${I.trash}</button></div>`).join('')}</div>
  <h4>Observações para o cliente</h4><textarea class="field" data-b="obsCliente" placeholder="Instruções de acesso, usuário de teste, próximos passos… (sai na OS impressa)">${esc(o.obsCliente)}</textarea>`;
}
function tHistorico(o){
  const h=[...(o.historico||[])].sort((a,b)=>b.t-a.t);
  return `<h4>Adicionar anotação</h4><div class="grid"><textarea class="field" id="novaNota" placeholder="Reunião com o cliente, ajuste pedido, acesso enviado…" style="min-height:70px"></textarea>
    <div><button class="btn sm pri" data-act="nota">${I.plus}Adicionar ao histórico</button></div></div>
  <h4>Linha do tempo</h4><div class="timeline">${h.map(e=>`<div class="ev ${e.nota?'nota':''}"><small>${fmtHora(e.t)}</small><p>${esc(e.txt)}</p></div>`).join('')||'<p class="muted">Sem eventos.</p>'}</div>`;
}

/* Edição dentro da OS */
function setPath(o,path,v){const ks=path.split('.');let x=o;for(let i=0;i<ks.length-1;i++)x=x[ks[i]]||(x[ks[i]]={});x[ks.at(-1)]=v;}
const drawer=$('#drawer');
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.mask==='money'){const d=el.value.replace(/\D/g,'').replace(/^0+/,'');el.value=d?num2(+d/100):'';}},true);
drawer.addEventListener('input',e=>{
  const el=e.target,o=drawerOS; if(!o) return;
  if(el.dataset.b&&el.type!=='date'&&el.tagName!=='SELECT'&&el.dataset.link===undefined){
    const v=el.dataset.mask==='money'?parseMoney(el.value):el.dataset.num!==undefined?(+el.value||0):el.value;
    setPath(o,el.dataset.b,v); if(el.dataset.b==='desconto') syncParcelas(o); agendarSalvar();
  }
  if(el.dataset.item){const i=o.itens.find(x=>x.id===el.dataset.item); if(!i)return;
    i[el.dataset.k]=el.dataset.k==='desc'?el.value:el.dataset.k==='valor'?parseMoney(el.value):(+el.value||0);
    syncParcelas(o); el.closest('.ir').querySelector('.tot').textContent=brl((+i.qtd||0)*(+i.valor||0)); agendarSalvar();}
});
drawer.addEventListener('change',e=>{
  const el=e.target,o=drawerOS; if(!o) return;
  if(el.matches('[data-st]')){mudarStatus(o,el.value);agendarSalvar();renderDrawer();render();toast('Etapa: '+STATUS[o.status].n);return;}
  if(el.dataset.b){
    let v=el.value;
    if(el.dataset.link!==undefined){v=urlOk(v);el.value=v;}
    if(el.dataset.mask==='money')v=parseMoney(v);
    else if(el.dataset.num!==undefined||(el.dataset.pg!==undefined&&el.type!=='date'))v=+v||0;
    setPath(o,el.dataset.b,v);
    if(el.dataset.pg!==undefined) syncParcelas(o);
    agendarSalvar();
    if(el.dataset.rr!==undefined||el.dataset.pg!==undefined||el.tagName==='SELECT'){renderDrawer();render();}
    return;
  }
  if(el.dataset.item){agendarSalvar();renderDrawer();render();return;}
  if(el.dataset.parc){const p=o.parcelas.find(x=>x.id===el.dataset.parc);marcarParcela(o,p,el.checked);agendarSalvar();renderDrawer();render();return;}
  if(el.dataset.pv){const p=o.parcelas.find(x=>x.id===el.dataset.pv);p.venc=el.value;agendarSalvar();renderDrawer();render();}
});
function marcarParcela(o,p,pago){
  p.pago=pago;p.pagoEm=pago?hojeISO():'';
  (o.historico||(o.historico=[])).push({t:Date.now(),txt:(pago?'Recebido: ':'Pagamento desmarcado: ')+p.desc+' — '+brl(p.valor)+' ('+rotuloPg(o)+')'});
  toast(pago?'Pagamento registrado':'Pagamento desmarcado');
}
drawer.addEventListener('click',async e=>{
  const t=e.target.closest('.tabs [data-tab]'); if(t){drawerTab=t.dataset.tab;renderDrawer();return;}
  const fm=e.target.closest('[data-forma]'); if(fm){const o=drawerOS;const nova=fm.dataset.forma;
    if(o.parcelas.some(p=>p.pago)&&!await confirmar('Mudar forma de pagamento?','Já existem parcelas marcadas como pagas. Mudar a forma recalcula as parcelas e apaga essas marcações.','Mudar'))return;
    o.pg.forma=nova; if(FORMAS[nova].parc&&(+o.pg.qtd||1)<2)o.pg.qtd=3; gerarParcelas(o);
    o.historico.push({t:Date.now(),txt:'Forma de pagamento: '+rotuloPg(o)}); agendarSalvar(); renderDrawer(); render(); return;}
  const b=e.target.closest('[data-act]'); if(!b) return; const o=drawerOS;
  switch(b.dataset.act){
    case 'fechar': return fecharDrawer();
    case 'salvar-os': return salvarAgora(false);
    case 'salvar-fechar': return salvarAgora(true);
    case 'add-item': o.itens.push({id:uid(),desc:'',qtd:1,valor:0}); agendarSalvar(); renderDrawer(); setTimeout(()=>{const l=[...drawer.querySelectorAll('[data-k=desc]')].at(-1);l&&l.focus();},30); return;
    case 'rm-item': o.itens=o.itens.filter(i=>i.id!==b.dataset.id); syncParcelas(o); agendarSalvar(); renderDrawer(); render(); return;
    case 'regerar':
      if(o.parcelas.some(p=>p.pago)&&!await confirmar('Recalcular parcelas?','Já existem parcelas marcadas como pagas. Recalcular apaga essas marcações.','Recalcular'))return;
      gerarParcelas(o); agendarSalvar(); renderDrawer(); render(); toast('Parcelas recalculadas'); return;
    case 'upload': return $('#fileUp').click();
    case 'baixar': return baixarArquivo(b.dataset.id);
    case 'rm-arq':{
      const a=o.arquivos.find(x=>x.id===b.dataset.id);
      if(!await confirmar('Remover arquivo?',`“${a.name}” será apagado definitivamente.`,'Remover'))return;
      await apagarArquivo(a.id); o.arquivos=o.arquivos.filter(x=>x.id!==a.id); agendarSalvar(); renderDrawer(); toast('Arquivo removido'); return;}
    case 'sis-da-os': return abrirSis(null,sisDaOS(o));
    case 'nota':{const v=$('#novaNota').value.trim(); if(!v)return; o.historico.push({t:Date.now(),txt:v,nota:true}); agendarSalvar(); renderDrawer(); toast('Anotação adicionada'); return;}
    case 'copiar': return copiar(resumoTexto(o),'Resumo copiado — cole no WhatsApp');
    case 'imprimir': return imprimirOS(o);
    case 'duplicar':{
      const n=clone(o); n.id=uid(); n.numero=proxNumero(); n.titulo=o.titulo+' (cópia)'; n.status='orcamento'; n.abertura=hojeISO(); n.entregueEm='';
      n.arquivos=[]; n.criado=Date.now(); n.historico=[{t:Date.now(),txt:'OS criada a partir de '+osNum(o)}]; gerarParcelas(n);
      ordens.push(n); await salvarOS(n); fecharDrawer(); abrirOS(n.id); toast('OS duplicada'); return;}
    case 'excluir':
      if(!await confirmar('Excluir '+osNum(o)+'?',`“${o.titulo}” e os arquivos anexados serão apagados. Isso não pode ser desfeito.`,'Excluir'))return;
      clearTimeout(saveT); saveT=null;
      for(const a of o.arquivos||[]) await apagarArquivo(a.id);
      ordens=ordens.filter(x=>x.id!==o.id); await apagarOSdb(o.id); drawerOS=null; fecharDrawer(); toast('OS excluída'); return;
  }
});
const sisDaOS=o=>({nome:o.titulo,cliente:o.cliente?.nome||'',status:o.status==='entregue'?'ar':'dev',link:o.links?.producao||'',repo:o.links?.repo||'',
  descricao:(o.descricao||'').slice(0,240),data:o.entregueEm||o.prazo||hojeISO(),responsavel:o.responsavel,osId:o.id});

/* Arquivos */
drawer.addEventListener('dragover',e=>{const z=e.target.closest('#dropZone');if(z){e.preventDefault();z.classList.add('over');}});
drawer.addEventListener('dragleave',e=>{const z=e.target.closest('#dropZone');if(z&&!z.contains(e.relatedTarget))z.classList.remove('over');});
drawer.addEventListener('drop',e=>{const z=e.target.closest('#dropZone');if(!z)return;e.preventDefault();z.classList.remove('over');
  const files=[...e.dataTransfer.files]; if(files.length) return enviarArquivos(files);
  const url=(e.dataTransfer.getData('text/uri-list')||e.dataTransfer.getData('text/plain')||'').split('\n')[0].trim();
  if(/^https?:\/\//i.test(url)&&drawerOS){drawerOS.links.producao=url;agendarSalvar();renderDrawer();toast('Link salvo');}});
window.addEventListener('dragover',e=>e.preventDefault());
window.addEventListener('drop',e=>e.preventDefault());
$('#fileUp').onchange=e=>{enviarArquivos([...e.target.files]);e.target.value='';};
async function enviarArquivos(files){
  const o=drawerOS; if(!o||!idb||!files.length) return;
  let ok=0;
  for(const f of files){
    try{const meta={id:uid(),name:f.name,size:f.size,type:f.type,em:Date.now()};
      await salvarArquivo({...meta,osId:o.id,blob:f}); o.arquivos.push(meta); ok++;}
    catch(err){toast('Não foi possível salvar '+f.name);}
  }
  if(ok){o.historico.push({t:Date.now(),txt:ok+' arquivo(s) anexado(s)'}); agendarSalvar(); renderDrawer(); toast(ok+(ok>1?' arquivos salvos':' arquivo salvo'));}
}
async function baixarArquivo(id){const a=await pegarArquivo(id); if(!a) return toast('Arquivo não encontrado'); baixarBlob(a.blob,a.name);}
async function copiar(txt,msg){
  try{await navigator.clipboard.writeText(txt);toast(msg);}
  catch(e){const t=document.createElement('textarea');t.value=txt;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
    try{document.execCommand('copy');toast(msg);}catch(e2){toast('Não foi possível copiar');}t.remove();}
}

/* Resumo para WhatsApp */
function resumoTexto(o){
  const t=totalOS(o),r=recebidoOS(o),m=membro(o.responsavel);
  let s=`*${config.empresa||'WS Tecnologia'}* — ${osNum(o)}\n*Serviço:* ${o.titulo}\n*Cliente:* ${o.cliente?.nome||'-'}\n*Etapa:* ${STATUS[o.status].n}\n`;
  if(o.prazo) s+=`*Prazo de entrega:* ${dataBR(o.prazo)}\n`;
  s+=`\n*Itens:*\n`+(o.itens||[]).map(i=>`• ${i.desc||'Item'}${+i.qtd>1?' ('+i.qtd+'x)':''} — ${brl((+i.qtd||0)*(+i.valor||0))}`).join('\n');
  if(+o.desconto) s+=`\nDesconto: -${brl(o.desconto)}`;
  s+=`\n*Total: ${brl(t)}*\n*Pagamento:* ${rotuloPg(o)}\n`;
  if(r>0) s+=`Recebido: ${brl(r)} · Em aberto: ${brl(Math.max(0,t-r))}\n`;
  const pend=(o.parcelas||[]).filter(p=>!p.pago);
  if(pend.length) s+=`\n*Vencimentos:*\n`+pend.map(p=>`• ${p.desc}: ${brl(p.valor)} — ${dataBR(p.venc)}`).join('\n')+'\n';
  if(config.pix&&pend.length&&o.pg?.forma==='pix') s+=`Chave Pix: ${config.pix}\n`;
  if(o.links?.producao) s+=`\nAcesse o sistema: ${o.links.producao}\n`;
  s+=`\n${m?m.nome+' — '+m.cargo:''}${config.telefone?'\n'+config.telefone:''}`;
  return s;
}

/* OS formatada para imprimir / PDF */
function htmlImpressao(o){
  const c=config,t=totalOS(o),m=membro(o.responsavel);
  const linha=(k,v)=>v?`<div><span>${k}</span><b>${esc(v)}</b></div>`:'';
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${osNum(o)} — ${esc(o.titulo)}</title>
<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:12.5px/1.5 "Segoe UI",Helvetica,Arial,sans-serif;color:#111827;margin:0 auto;padding:24px;max-width:820px}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #2563eb;padding-bottom:14px}
.lg{display:flex;gap:12px;align-items:center}.mk{width:46px;height:46px;border-radius:11px;background:linear-gradient(135deg,#2563eb,#6d4aff);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:17px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.lg b{font-size:19px;display:block}.lg small{color:#6b7280}.em{text-align:right;font-size:11.5px;color:#374151}
.tt{display:flex;justify-content:space-between;align-items:center;margin:18px 0 6px;gap:10px}.tt h1{font-size:20px;margin:0}.st{background:#eef2ff;color:#3730a3;padding:4px 12px;border-radius:20px;font-weight:700;font-size:11.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h3{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#2563eb;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:5px}
.gr{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}.gr div{display:flex;gap:8px}.gr span{color:#6b7280;min-width:110px}
table{width:100%;border-collapse:collapse}th{background:#f3f4f6;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;padding:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}td{padding:8px;border-bottom:1px solid #e5e7eb}.r{text-align:right}
.tot{margin-left:auto;width:260px;margin-top:8px}.tot div{display:flex;justify-content:space-between;padding:3px 0}.tot .g{border-top:2px solid #111827;margin-top:4px;padding-top:7px;font-size:15px;font-weight:800}
.tx{white-space:pre-wrap;color:#374151}.sg{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:56px;text-align:center;font-size:11.5px}.sg div{border-top:1px solid #111827;padding-top:6px}
.ft{margin-top:30px;text-align:center;color:#9ca3af;font-size:10.5px}.pg{color:#059669;font-weight:700}
.np{background:#2563eb;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:18px;font-size:13px}
@media print{body{padding:0}.np{display:none}}@media (max-width:600px){.gr{grid-template-columns:1fr}.hd{flex-direction:column}.em{text-align:left}}</style></head><body>
<button class="np" onclick="print()">Imprimir / salvar em PDF</button>
<div class="hd"><div class="lg">${c.logo?`<img src="${c.logo}" alt="" style="width:46px;height:46px;object-fit:contain;border-radius:10px">`:'<div class="mk">WS</div>'}<div><b>${esc(c.empresa)}</b><small>${esc(c.slogan||'')}</small></div></div>
<div class="em">${[c.cnpj&&'CNPJ/CPF: '+esc(c.cnpj),esc(c.telefone),esc(c.email),esc(c.site),esc(c.cidade)].filter(Boolean).join('<br>')}</div></div>
<div class="tt"><h1>Ordem de Serviço ${osNum(o)}</h1><span class="st">${STATUS[o.status].n}</span></div>
<div class="gr">${linha('Abertura',dataBR(o.abertura))}${linha('Prazo de entrega',o.prazo?dataBR(o.prazo):'')}${linha('Tipo',o.tipo)}${linha('Responsável',m?m.nome+' — '+m.cargo:'')}${linha('Garantia',o.garantia?o.garantia+' dias':'')}</div>
<h3>Cliente</h3><div class="gr">${linha('Nome / empresa',o.cliente?.nome)}${linha('CPF / CNPJ',o.cliente?.doc)}${linha('Telefone',o.cliente?.tel)}${linha('E-mail',o.cliente?.email)}</div>
<h3>Serviço</h3><p style="margin:0 0 4px;font-size:14px"><b>${esc(o.titulo)}</b></p>${o.descricao?`<div class="tx">${esc(o.descricao)}</div>`:''}
<h3>Itens</h3><table><thead><tr><th>Descrição</th><th class="r">Qtd</th><th class="r">Valor unit.</th><th class="r">Total</th></tr></thead><tbody>
${(o.itens||[]).map(i=>`<tr><td>${esc(i.desc)}</td><td class="r">${+i.qtd||0}</td><td class="r">${brl(i.valor)}</td><td class="r">${brl((+i.qtd||0)*(+i.valor||0))}</td></tr>`).join('')}</tbody></table>
<div class="tot"><div><span>Subtotal</span><span>${brl(subtotal(o))}</span></div>${+o.desconto?`<div><span>Desconto</span><span>- ${brl(o.desconto)}</span></div>`:''}<div class="g"><span>Total</span><span>${brl(t)}</span></div></div>
${(o.parcelas||[]).length?`<h3>Pagamento — ${esc(rotuloPg(o))}</h3><table><thead><tr><th>Parcela</th><th>Vencimento</th><th class="r">Valor</th><th class="r">Situação</th></tr></thead><tbody>
${o.parcelas.map(p=>`<tr><td>${esc(p.desc)}</td><td>${dataBR(p.venc)}</td><td class="r">${brl(p.valor)}</td><td class="r">${p.pago?'<span class="pg">Pago em '+dataBR(p.pagoEm)+'</span>':'Em aberto'}</td></tr>`).join('')}</tbody></table>
${c.pix&&o.pg?.forma==='pix'?`<p style="margin-top:8px">Chave Pix: <b>${esc(c.pix)}</b></p>`:''}`:''}
${o.links?.producao?`<h3>Acesso ao sistema</h3><p>${esc(o.links.producao)}</p>`:''}
${o.obsCliente?`<h3>Observações</h3><div class="tx">${esc(o.obsCliente)}</div>`:''}
${c.termos?`<h3>Termos e condições</h3><div class="tx" style="font-size:11.5px">${esc(c.termos)}</div>`:''}
<div class="sg"><div>${esc(m?m.nome:'')} — ${esc(c.empresa)}</div><div>${esc(o.cliente?.nome||'Cliente')}</div></div>
<div class="ft">Documento gerado em ${new Date().toLocaleDateString('pt-BR')} · ${esc(c.empresa)}</div>
<script>window.addEventListener('load',function(){setTimeout(function(){print()},350)})<\/script></body></html>`;
}
function imprimirOS(o){
  const html=htmlImpressao(o);
  const w=window.open('','_blank');
  if(w){w.document.open();w.document.write(html);w.document.close();}
  else{baixarBlob(new Blob([html],{type:'text/html'}),osNum(o)+'.html');toast('OS baixada — abra o arquivo para imprimir');}
}

/* Enter num campo da OS (exceto textos longos) salva na hora; Ctrl+S salva em qualquer lugar da OS */
drawer.addEventListener('keydown',e=>{
  if(!drawerOS) return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();e.target.dispatchEvent(new Event('change',{bubbles:true}));return salvarAgora(false);}
  if(e.key==='Enter'&&e.target.matches('input.field')){e.preventDefault();e.target.dispatchEvent(new Event('change',{bubbles:true}));e.target.blur();salvarAgora(false);}
});
