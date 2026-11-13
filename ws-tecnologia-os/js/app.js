/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   app.js · Inicialização e ações gerais
   Equipe, tema claro/escuro, navegação, modais, backup/importação e início do sistema.
   ========================================================= */
"use strict";

/* ================= Equipe / perfil / tema ================= */
const equipe=()=>config.equipe||[];
const membro=id=>equipe().find(m=>m.id===id)||null;
const fotoDe=m=>m?(m.foto||FOTOS_PADRAO[m.id]||''):'';
function avatarHTML(m,cls=''){
  const ini=esc(((m&&m.nome)||'?').trim()[0]||'?').toUpperCase(), f=fotoDe(m);
  return f?`<img class="avatar ${cls}" src="${f}" alt="${esc(m.nome)}" title="${esc(m.nome)} — ${esc(m.cargo)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar fb ${cls}',textContent:'${ini}'}))">`
          :`<span class="avatar fb ${cls}" title="${esc(m&&m.nome)}">${ini}</span>`;
}
function aplicarPerfil(){
  $('#teamSide').innerHTML=equipe().map(m=>`<div class="member">${avatarHTML(m)}<div><b>${esc(m.nome)}</b><small>${esc(m.cargo)}</small></div></div>`).join('');
  $('#nomeEmpresa').textContent=config.empresa||'WS Tecnologia';
  document.querySelectorAll('.logo,.sp-logo').forEach(l=>{l.classList.toggle('img',!!config.logo);l.innerHTML=config.logo?`<img src="${config.logo}" alt="">`:'WS';});
  const nomes=equipe().map(m=>esc(m.nome));
  $('#rodape').innerHTML=`© ${new Date().getFullYear()} <b>${esc(config.empresa||'WS Tecnologia')}</b> · Desenvolvido por ${nomes.length>1?nomes.slice(0,-1).join(', ')+' &amp; '+nomes.at(-1):nomes[0]||''} · <a href="#docs" data-goto="docs">Documentação</a>`;
  document.querySelector('.brand small').textContent=config.slogan||'';
  const opts=equipe().map(m=>`<option value="${m.id}">${esc(m.nome)} — ${esc(m.cargo)}</option>`).join('');
  $('#selRespNova').innerHTML=opts; $('#selRespSis').innerHTML=opts;
}
function setTema(t,animar){
  const aplicar=()=>{document.documentElement.dataset.theme=t;
    document.querySelectorAll('[data-t]').forEach(b=>{b.classList.toggle('on',b.dataset.t===t);b.setAttribute('aria-pressed',b.dataset.t===t);});};
  try{localStorage.setItem('ws-tema',t);}catch(e){}
  if(animar&&document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.startViewTransition(aplicar);
  else{if(animar){document.documentElement.classList.add('trocando');setTimeout(()=>document.documentElement.classList.remove('trocando'),400);}aplicar();}
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='light'?'#ffffff':'#0a0f1c';}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(!b||b.classList.contains('on'))return;setTema(b.dataset.t,true);toast(b.dataset.t==='light'?'☀️ Tema claro ativado':'🌙 Tema escuro ativado');});

/* ================= Navegação ================= */
let animarView=true,view='painel',busca='',filtroStatus='ativas',modoOrdens='lista',filtroFin='pendentes',filtroSis='todos';
const TITULOS={painel:['Painel','Visão geral da WS Tecnologia'],ordens:['Ordens de serviço','Cadastre, acompanhe e entregue seus projetos'],
  sistemas:['Sistemas criados','Portfólio de sistemas desenvolvidos e seus links'],
  clientes:['Clientes','Quem vocês atendem e quanto cada um representa'],financeiro:['Financeiro','Recebimentos, parcelas e vencimentos'],config:['Configurações','Empresa, equipe, logo, fotos e backup'],docs:['Documentação','README.md do sistema — escreva, visualize e baixe']};
function irPara(v){
  view=v; animarView=true;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===v));
  try{if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);}catch(e){}
  render(); window.scrollTo(0,0);
}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)irPara(b.dataset.view);});
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(TITULOS[h]&&h!==view)irPara(h);});
$('#busca').addEventListener('input',e=>{busca=e.target.value;if(!['ordens','clientes','sistemas','financeiro'].includes(view))irPara('ordens');else render();});


/* ================= Ações gerais ================= */
function proxNumero(){return ordens.reduce((m,o)=>Math.max(m,o.numero||0),0)+1;}
function novaOS(d){
  const o={id:uid(),numero:proxNumero(),titulo:d.titulo,cliente:{nome:d.cliente,tel:'',email:'',doc:''},tipo:d.tipo||TIPOS[0],prioridade:d.prioridade||'media',
    responsavel:d.responsavel||equipe()[0]?.id||'',status:'orcamento',abertura:hojeISO(),prazo:d.prazo||'',entregueEm:'',descricao:d.descricao||'',
    itens:[{id:uid(),desc:d.titulo,qtd:1,valor:d.valor||0}],desconto:0,pg:{forma:'pix',qtd:1,entrada:0,venc:d.prazo||''},parcelas:[],
    links:{producao:'',homolog:'',repo:''},arquivos:[],garantia:90,obsCliente:'',historico:[{t:Date.now(),txt:'OS criada'}],criado:Date.now()};
  const ex=ordens.filter(x=>norm(x.cliente?.nome)===norm(d.cliente)).sort((a,b)=>(b.criado||0)-(a.criado||0))[0];
  if(ex&&d.cliente){o.cliente={...ex.cliente,nome:d.cliente};}
  gerarParcelas(o); return o;
}
document.addEventListener('click',async e=>{
  if(e.target.closest('#drawer')||e.target.closest('.modal')||e.target.closest('a[target=_blank]')) return;
  const op=e.target.closest('[data-open]');
  if(op&&!e.target.closest('input,a,button[data-act]')) return abrirOS(op.dataset.open,op.dataset.tab);
  const g=e.target.closest('[data-goto]'); if(g) return irPara(g.dataset.goto);
  const fs=e.target.closest('[data-filtro]'); if(fs){filtroStatus=fs.dataset.filtro;modoOrdens='lista';return view==='ordens'?render():irPara('ordens');}
  const md=e.target.closest('[data-modo]'); if(md){modoOrdens=md.dataset.modo;return render();}
  const ff=e.target.closest('[data-fin]'); if(ff){filtroFin=ff.dataset.fin;return render();}
  const fsis=e.target.closest('[data-fsis]'); if(fsis){filtroSis=fsis.dataset.fsis;return render();}
  const cl=e.target.closest('[data-cliente]'); if(cl){busca=cl.dataset.cliente;$('#busca').value=busca;filtroStatus='todas';return irPara('ordens');}
  const b=e.target.closest('[data-act]'); if(!b) return;
  const id=b.dataset.id;
  switch(b.dataset.act){
    case 'nova': return abrirNova();
    case 'novo-sis': return abrirSis(null);
    case 'editar-sis': return abrirSis(sistemas.find(s=>s.id===id));
    case 'sis-da-os': return abrirSis(null,sisDaOS(ordens.find(o=>o.id===id)));
    case 'copiar-link': return copiar(sistemas.find(s=>s.id===id)?.link||'','Link copiado');
    case 'apagar-sis':{const s=sistemas.find(x=>x.id===id);
      if(!await confirmar('Excluir sistema?',`“${s.nome}” sai do portfólio. A OS ligada a ele (se houver) não é afetada.`,'Excluir'))return;
      sistemas=sistemas.filter(x=>x.id!==id); await apagarSistemaDb(id); render(); return toast('Sistema excluído');}
    case 'salvar-cfg':
      document.querySelectorAll('[data-cfg]').forEach(i=>config[i.dataset.cfg]=i.value.trim());
      await salvarConfig(); aplicarPerfil(); render(); return toast('Dados da empresa salvos');
    case 'foto': fotoAlvo=id; return $('#fileFoto').click();
    case 'logo': return $('#fileLogo').click();
    case 'exemplo': return carregarExemplo();
    case 'rm-logo': config.logo=''; await salvarConfig(); aplicarPerfil(); render(); return toast('Logo removida');
    case 'foto-padrao':{const m=membro(id);m.foto='';await salvarConfig();aplicarPerfil();render();return toast('Foto original restaurada');}
    case 'add-membro': config.equipe.push({id:uid(),nome:'Novo integrante',cargo:'Cargo',foto:''}); await salvarConfig(); aplicarPerfil(); return render();
    case 'rm-membro':{const m=membro(id);if(!await confirmar('Remover '+m.nome+'?','A pessoa sai da equipe. As ordens dela ficam sem responsável definido.','Remover'))return;
      config.equipe=config.equipe.filter(x=>x.id!==id);await salvarConfig();aplicarPerfil();render();return toast('Removido da equipe');}
    case 'exportar': return exportar();
    case 'importar': importModo='backup'; return $('#fileImport').click();
    case 'importar-antigo': importModo='antigo'; return $('#fileImport').click();
  }
});
document.addEventListener('change',async e=>{
  const el=e.target; if(el.closest('#drawer')) return;
  if(el.dataset.pagar){const[oid,pid]=el.dataset.pagar.split('|');const o=ordens.find(x=>x.id===oid);const p=o?.parcelas.find(x=>x.id===pid);if(!p)return;
    marcarParcela(o,p,el.checked); await salvarOS(o); render();}
  if(el.dataset.mb){const m=membro(el.dataset.mb);if(!m)return;m[el.dataset.k]=el.value.trim()||m[el.dataset.k];await salvarConfig();aplicarPerfil();toast('Equipe atualizada');}
});
let fotoAlvo=null;
$('#fileFoto').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; const m=membro(fotoAlvo); if(!f||!m) return;
  try{m.foto=await redimensionarFoto(f);await salvarConfig();aplicarPerfil();render();toast('Foto de '+m.nome+' atualizada');}
  catch(err){toast('Não foi possível usar essa imagem');}
};

$('#fileLogo').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f) return;
  try{config.logo=await redimensionarLogo(f);await salvarConfig();aplicarPerfil();render();toast('Logo atualizada');}
  catch(err){toast('Não foi possível usar essa imagem');}
};
function redimensionarLogo(file){return new Promise((res,rej)=>{const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{const k=Math.min(1,256/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/png'));};
  img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('imagem inválida'));};img.src=u;});}
/* Dados de exemplo (para conhecer o sistema) */
async function carregarExemplo(){
  const h=hojeISO(),d=n=>{const x=new Date();x.setDate(x.getDate()+n);return isoDe(x);};
  const eq=equipe(),r1=eq[0]?.id,r2=(eq[1]||eq[0])?.id;
  const lista=[
    {cliente:'Clínica Bem Estar',titulo:'Sistema de Agendamento Online',valor:4800,prazo:d(8),responsavel:r1,st:'desenvolvimento',forma:'parcelado',qtd:3,ent:30,pagas:1,link:'https://agenda-bemestar.com.br',tel:'(11) 98888-1234',desc:'Agenda de consultas, confirmação por WhatsApp, cadastro de pacientes e painel do médico.'},
    {cliente:'Mercado Silva',titulo:'Controle de Estoque Inteligente',valor:3200,prazo:d(-3),responsavel:r2,st:'testes',forma:'pix',qtd:1,ent:50,pagas:1,tel:'(11) 97777-5678',desc:'Produtos, fornecedores, entradas, saídas e alertas de estoque baixo.'},
    {cliente:'Construtora Alves',titulo:'Sistema Financeiro Empresarial',valor:6500,prazo:d(-12),responsavel:r2,st:'entregue',forma:'boleto',qtd:3,ent:0,pagas:3,link:'https://financeiro-alves.com.br',tel:'(21) 96666-4321',desc:'Receitas, despesas, contas a pagar e a receber, fluxo de caixa e relatórios mensais.'},
    {cliente:'Studio Bella',titulo:'Site institucional + landing page',valor:1800,prazo:d(16),responsavel:r1,st:'aprovada',forma:'debito',qtd:1,ent:0,pagas:0,tel:'(31) 95555-0000',desc:'Site responsivo com galeria, agendamento e integração com Instagram.'},
    {cliente:'Oficina do Zé',titulo:'Ordem de Serviço para oficina mecânica',valor:2500,prazo:d(28),responsavel:r1,st:'orcamento',forma:'parcelado',qtd:5,ent:20,pagas:0,tel:'(41) 94444-1111',desc:'Clientes, veículos, peças, orçamentos e etapas do atendimento.'},
  ];
  for(const x of lista){
    const o=novaOS({cliente:x.cliente,titulo:x.titulo,valor:x.valor,prazo:x.prazo,responsavel:x.responsavel});
    o.descricao=x.desc;o.cliente.tel=x.tel;o.pg={forma:x.forma,qtd:x.qtd,entrada:x.ent,venc:x.prazo,entradaVenc:h};gerarParcelas(o);
    o.parcelas.slice(0,x.pagas).forEach(p=>{p.pago=true;p.pagoEm=h;});
    if(x.link)o.links.producao=x.link;
    if(x.st!=='orcamento')mudarStatus(o,x.st);
    ordens.push(o);await salvarOS(o);
    if(x.link){const s={id:uid(),criado:Date.now(),osId:o.id,nome:o.titulo,cliente:x.cliente,status:x.st==='entregue'?'ar':'dev',link:x.link,repo:'',tec:'HTML, CSS, JavaScript',descricao:x.desc,data:x.st==='entregue'?o.entregueEm:x.prazo,responsavel:x.responsavel};sistemas.push(s);await salvarSistema(s);}
  }
  const p={id:uid(),criado:Date.now(),osId:'',nome:'Portfólio WS Tecnologia',cliente:'',status:'demo',link:'https://wstecnologia.com.br',repo:'',tec:'HTML, CSS, JavaScript',descricao:'Site da empresa com os projetos entregues.',data:h,responsavel:r1};
  sistemas.push(p);await salvarSistema(p);
  animarView=true;render();toast('Dados de exemplo carregados — explore à vontade!');
}

/* Tela de abertura */
const splashT0=performance.now();
function fecharSplash(){const s=$('#splash');if(!s||s.classList.contains('out'))return;
  setTimeout(()=>{s.classList.add('out');setTimeout(()=>s.remove(),500);},Math.max(0,650-(performance.now()-splashT0)));}
setTimeout(fecharSplash,4000);

/* Modais */
const mNova=$('#mNova'),fNova=$('#fNova');
$('#selTipoNova').innerHTML=TIPOS.map(t=>`<option>${t}</option>`).join('');
function abrirNova(){fNova.reset();fNova.responsavel.value=equipe()[0]?.id||'';mNova.classList.add('open');setTimeout(()=>fNova.cliente.focus(),50);}
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(m.id!=='mConf'&&(e.target===m||e.target.closest('[data-close]')))m.classList.remove('open');}));
fNova.addEventListener('submit',async e=>{
  e.preventDefault();
  const o=novaOS({cliente:fNova.cliente.value.trim(),titulo:fNova.titulo.value.trim(),tipo:fNova.tipo.value,prioridade:fNova.prioridade.value,
    prazo:fNova.prazo.value,valor:parseMoney(fNova.valor.value),responsavel:fNova.responsavel.value});
  ordens.push(o); mNova.classList.remove('open'); await salvarOS(o); render(); abrirOS(o.id,'valores'); toast(osNum(o)+' criada');
});
function confirmar(titulo,msg,ok='Confirmar'){
  return new Promise(res=>{const m=$('#mConf');$('#confT').textContent=titulo;$('#confM').textContent=msg;$('#confS').textContent=ok;m.classList.add('open');
    const fim=v=>{m.classList.remove('open');$('#confS').onclick=$('#confN').onclick=null;res(v);};
    $('#confS').onclick=()=>fim(true);$('#confN').onclick=()=>fim(false);setTimeout(()=>$('#confS').focus(),30);});
}
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;
  if($('#mConf').classList.contains('open'))return $('#confN').click();
  const aberto=document.querySelector('.modal.open'); if(aberto)return aberto.classList.remove('open');
  if(drawerOS)fecharDrawer();});

/* ================= Backup ================= */
async function exportar(){
  toast('Gerando backup…');
  const arquivos=[];
  if(idb){const todos=await tx('arquivos','readonly',s=>s.getAll())||[];
    for(const a of todos) arquivos.push({id:a.id,osId:a.osId,name:a.name,size:a.size,type:a.type,data:await lerDataURL(a.blob)});}
  const data=JSON.stringify({app:'ws-tecnologia-os',versao:4,exportado:new Date().toISOString(),config,ordens,sistemas,readme:readmeMD,arquivos});
  baixarBlob(new Blob([data],{type:'application/json'}),'backup-ws-tecnologia-'+hojeISO()+'.json');
  toast('Backup exportado');
}
let importModo='backup';
function converterAntigo(s,n){
  const mapSt={afazer:'aprovada',andamento:'desenvolvimento',concluido:'entregue'};
  const o=novaOS({cliente:s.cliente||'',titulo:s.titulo||'Serviço',valor:+s.valor||0,prazo:s.entrega||''});
  o.numero=n; o.descricao=s.descricao||''; o.status=mapSt[s.status]||'orcamento'; o.links.producao=s.link||'';
  o.prioridade={'Fácil':'baixa','Média':'media','Difícil':'alta'}[s.dificuldade]||'media';
  if(o.status==='entregue') o.entregueEm=s.entrega||hojeISO();
  o.pg.forma=['pix','dinheiro','debito','credito','parcelado'].includes(s.pagamento)?s.pagamento:'pix';
  if(s.pagamento==='parcelado') o.pg.qtd=s.parcelas||2;
  gerarParcelas(o);
  if(s.pagamento==='parcelado') o.parcelas.forEach((p,i)=>{if(s.parcelasPagas?.[i]){p.pago=true;p.pagoEm=hojeISO();}});
  else if(s.recebido) o.parcelas.forEach(p=>{p.pago=true;p.pagoEm=hojeISO();});
  o.historico=[{t:s.criado||Date.now(),txt:'Importada do sistema antigo'}]; o.criado=s.criado||Date.now();
  return o;
}
$('#fileImport').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f) return;
  let d; try{d=JSON.parse(await f.text());}catch{return toast('Arquivo de backup inválido');}
  try{
    if(importModo==='antigo'){
      if(!Array.isArray(d.servicos)) return toast('Esse não parece um backup do sistema antigo');
      if(!await confirmar('Importar '+d.servicos.length+' ordens?','Elas serão adicionadas às que você já tem, junto com os arquivos anexados.','Importar'))return;
      let n=proxNumero(); const mapa={};
      for(const s of [...d.servicos].sort((a,b)=>(a.numero||0)-(b.numero||0))){const o=converterAntigo(s,n++);mapa[s.id]=o;ordens.push(o);}
      if(idb) for(const a of d.arquivos||[]){const o=mapa[a.servicoId];if(!o||!a.data)continue;
        const id=uid();await salvarArquivo({id,osId:o.id,name:a.name,size:a.size,type:a.type,blob:await dataURLParaBlob(a.data)});o.arquivos.push({id,name:a.name,size:a.size,type:a.type,em:Date.now()});}
      for(const o of Object.values(mapa)) await salvarOS(o);
      render(); return toast(Object.keys(mapa).length+' ordens importadas');
    }
    if(!Array.isArray(d.ordens)) return toast('Esse não parece um backup deste sistema');
    if(!await confirmar('Restaurar backup?',`Os dados atuais serão SUBSTITUÍDOS por este backup (${d.ordens.length} ordens, ${(d.sistemas||[]).length} sistemas).`,'Restaurar'))return;
    if(idb){for(const n of ['ordens','sistemas','arquivos'])await tx(n,'readwrite',s=>s.clear());}
    if(typeof d.readme==='string'){readmeMD=d.readme;readmeAtualizado=Date.now();await salvarReadme();}
    ordens=d.ordens; sistemas=d.sistemas||[]; config={...clone(CONFIG_PADRAO),...(d.config||{}),id:'empresa'};
    if(!Array.isArray(config.equipe)||!config.equipe.length) config.equipe=clone(EQUIPE_PADRAO);
    if(idb){for(const o of ordens)await salvarOS(o);for(const s of sistemas)await salvarSistema(s);
      for(const a of d.arquivos||[]) if(a.data) await salvarArquivo({id:a.id,osId:a.osId,name:a.name,size:a.size,type:a.type,blob:await dataURLParaBlob(a.data)});}
    await salvarConfig(); aplicarPerfil(); render(); toast('Backup restaurado');
  }catch(err){console.error(err);toast('Erro ao importar o backup');}
};

/* ================= Início ================= */
setTema(document.documentElement.dataset.theme||'dark');
aplicarPerfil();
{const h=location.hash.slice(1); view=TITULOS[h]?h:'painel'; document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.view===view));}
render();
carregar();
