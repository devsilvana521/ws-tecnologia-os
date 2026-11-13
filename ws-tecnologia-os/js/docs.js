/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   docs.js · Documentação (README.md)
   Editor de Markdown com visualização ao vivo, sumário automático,
   importar/baixar .md e barra de formatação. Sem bibliotecas externas.
   ========================================================= */
"use strict";

let readmeMD='', readmeAtualizado=0, docsModo='dividido', docsT=null;

/* ---------- Conversor Markdown → HTML ---------- */
const slug=s=>norm(s).replace(/<[^>]+>/g,'').replace(/[^\w\s-]/g,'').trim().replace(/\s+/g,'-');
function mdInline(t){
  const codes=[];
  t=t.replace(/`([^`]+)`/g,(_,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000';});
  t=esc(t)
    .replace(/&lt;br\s*\/?&gt;/gi,'<br>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g,(_,a,s,ti)=>`<img src="${s}" alt="${a}"${ti?` title="${ti}"`:''}>`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,'<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>').replace(/(^|\W)_([^_\s][^_]*)_(?=\W|$)/g,'$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g,'<del>$1</del>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,'$1<a href="$2">$2</a>');
  return t.replace(/\u0000(\d+)\u0000/g,(_,i)=>`<code>${esc(codes[+i])}</code>`);
}
function mdTabela(linhas){
  const cel=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  const al=cel(linhas[1]).map(c=>/^:-+:$/.test(c)?'center':/-+:$/.test(c)?'right':'');
  const td=(tag,c,i)=>`<${tag}${al[i]?` align="${al[i]}"`:''}>${mdInline(c)}</${tag}>`;
  return `<div class="md-table"><table><thead><tr>${cel(linhas[0]).map((c,i)=>td('th',c,i)).join('')}</tr></thead><tbody>${
    linhas.slice(2).map(l=>`<tr>${cel(l).map((c,i)=>td('td',c,i)).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function mdLista(linhas){
  const ind=l=>l.match(/^\s*/)[0].length, base=ind(linhas[0]);
  const ord=/^\s*\d+[.)]\s/.test(linhas[0]);
  const itens=[];
  for(const l of linhas){
    if(ind(l)<=base+1&&/^\s*([-*+]|\d+[.)])\s+/.test(l)) itens.push([l.replace(/^\s*([-*+]|\d+[.)])\s+/,'')]);
    else if(itens.length) itens.at(-1).push(l);
  }
  const html=itens.map(([p,...sub])=>{
    let pre='',cls='';const m=p.match(/^\[([ xX])\]\s+/);
    if(m){pre=`<input type="checkbox" disabled${m[1]!==' '?' checked':''}> `;p=p.slice(m[0].length);cls=' class="task"';}
    const filhos=sub.filter(s=>s.trim());
    return `<li${cls}>${pre}${mdInline(p)}${filhos.length?mdBlocos(filhos.join('\n')):''}</li>`;
  }).join('');
  return ord?`<ol>${html}</ol>`:`<ul${itens.some(i=>/^\[[ xX]\]/.test(i[0]))?' class="tasks"':''}>${html}</ul>`;
}
function mdBlocos(md){
  const L=md.replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0;
  const vazio=l=>!l.trim();
  while(i<L.length){
    const l=L[i];
    if(vazio(l)){i++;continue;}
    let m;
    if((m=l.match(/^\s*(```|~~~)\s*([\w+-]*)/))){const fim=m[1];const buf=[];i++;
      while(i<L.length&&!L[i].trim().startsWith(fim))buf.push(L[i++]);i++;
      out.push(`<pre${m[2]?` data-lang="${esc(m[2])}"`:''}><code>${esc(buf.join('\n'))}</code></pre>`);continue;}
    if((m=l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/))){const n=m[1].length;out.push(`<h${n} id="${slug(m[2])}">${mdInline(m[2])}</h${n}>`);i++;continue;}
    if(/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)){out.push('<hr>');i++;continue;}
    if(/^\s*>/.test(l)){const buf=[];while(i<L.length&&/^\s*>/.test(L[i]))buf.push(L[i++].replace(/^\s*>\s?/,''));out.push(`<blockquote>${mdBlocos(buf.join('\n'))}</blockquote>`);continue;}
    if(l.includes('|')&&i+1<L.length&&/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(L[i+1])){
      const buf=[l,L[i+1]];i+=2;while(i<L.length&&L[i].includes('|')&&!vazio(L[i]))buf.push(L[i++]);out.push(mdTabela(buf));continue;}
    if(/^\s*([-*+]|\d+[.)])\s+/.test(l)){const buf=[];
      while(i<L.length&&(/^\s*([-*+]|\d+[.)])\s+/.test(L[i])||(/^\s{2,}\S/.test(L[i])&&buf.length)||(vazio(L[i])&&i+1<L.length&&/^\s{2,}([-*+]|\d+[.)])\s+/.test(L[i+1]))))buf.push(L[i++]);
      out.push(mdLista(buf));continue;}
    if(/^\s*<\/?[a-zA-Z][^>]*>/.test(l)){const buf=[];while(i<L.length&&!vazio(L[i]))buf.push(L[i++]);out.push(buf.join('\n'));continue;}
    const buf=[];
    while(i<L.length&&!vazio(L[i])&&!/^(#{1,6}\s|\s*```|\s*~~~|\s*>|\s*([-*+]|\d+[.)])\s+|\s*<\/?[a-zA-Z])/.test(L[i])&&!(L[i].includes('|')&&/^\s*\|?\s*:?-+:?\s*\|/.test(L[i+1]||'')))buf.push(L[i++]);
    if(!buf.length){buf.push(L[i++]);}
    out.push(`<p>${buf.map((l,k)=>mdInline(l.replace(/(\s{2,}|\\)$/,''))+(k<buf.length-1?(/(\s{2,}|\\)$/.test(l)?'<br>':' '):'')).join('')}</p>`);
  }
  return out.join('\n');
}
/* Limpa o HTML gerado: só tags e atributos seguros (protege contra scripts colados no README) */
const MD_TAGS=new Set('a abbr b blockquote br caption code dd del details div dl dt em h1 h2 h3 h4 h5 h6 hr i img input kbd li mark ol p picture pre q s section small source span strong sub summary sup table tbody td tfoot th thead tr u ul center'.split(' '));
const MD_ATTR=new Set('href src alt title width height align id colspan rowspan start type checked disabled open data-lang class srcset media'.split(' '));
function mdSanitizar(html){
  const doc=new DOMParser().parseFromString(`<div>${html}</div>`,'text/html'),raiz=doc.body.firstChild;
  (function limpar(n){
    for(const c of [...n.childNodes]){
      if(c.nodeType===8){c.remove();continue;}
      if(c.nodeType!==1)continue;
      const t=c.tagName.toLowerCase();
      if(['script','style','iframe','object','embed','form','link','meta','svg','math','template'].includes(t)){c.remove();continue;}
      limpar(c);
      if(!MD_TAGS.has(t)){c.replaceWith(...c.childNodes);continue;}
      for(const a of [...c.attributes]){
        const n2=a.name.toLowerCase(),v=a.value.trim();
        if(!MD_ATTR.has(n2)||((n2==='href'||n2==='src'||n2==='srcset')&&/^\s*(javascript|vbscript|data:text)/i.test(v)))c.removeAttribute(a.name);
      }
      if(t==='input'&&c.getAttribute('type')!=='checkbox')c.remove();
      if(t==='input')c.setAttribute('disabled','');
      if(t==='a'){const h=c.getAttribute('href')||'';if(h&&!h.startsWith('#')){c.setAttribute('target','_blank');c.setAttribute('rel','noopener');}}
      if(t==='img'){c.setAttribute('loading','lazy');c.setAttribute('onerror',"this.classList.add('quebrada')");}
    }
  })(raiz);
  return raiz.innerHTML;
}
const mdParaHTML=md=>mdSanitizar(mdBlocos(md||''));

/* ---------- Tela ---------- */
function sumarioDoc(md){
  return (md.match(/^#{1,3}\s+.+$/gm)||[]).map(h=>{const n=h.match(/^#+/)[0].length,t=h.replace(/^#+\s+/,'').replace(/\s*#*$/,'');
    return {n,t:t.replace(/[*_`]/g,''),id:slug(t)};}).filter(x=>x.t);
}
function statsDoc(md){const pal=(md.match(/[\wÀ-ÿ]+/g)||[]).length;return `${md.split('\n').length} linhas · ${pal} palavras`;}
function vDocs(){
  const sum=sumarioDoc(readmeMD);
  const fb=(a,ic,t)=>`<button class="fbtn" data-md="${a}" title="${t}">${ic}</button>`;
  return `<div class="docbar card">
    <div class="seg">${[['editar','Editar'],['dividido','Lado a lado'],['ver','Visualizar']].map(([k,n])=>`<button data-docmodo="${k}" class="${docsModo===k?'on':''}">${n}</button>`).join('')}</div>
    <span class="doc-meta"><span id="docStats">${statsDoc(readmeMD)}</span> · <span id="docSalvo">${readmeAtualizado?'salvo '+fmtHora(readmeAtualizado):'modelo padrão'}</span></span>
    <span class="sp"></span>
    <button class="btn sm" data-act="md-importar">${I.up}Importar</button>
    <button class="btn sm" data-act="md-baixar">${I.down}Baixar .md</button>
    <button class="btn sm ghost" data-act="md-copiar">${I.copy}Copiar</button>
    <button class="btn sm ghost" data-act="md-padrao" title="Voltar ao README padrão do sistema">Restaurar</button>
  </div>
  <div class="docwrap modo-${docsModo}">
    <div class="doc-ed card">
      <div class="fbar">
        ${fb('h1','H1','Título')}${fb('h2','H2','Subtítulo')}${fb('h3','H3','Seção')}<span class="fsep"></span>
        ${fb('b','<b>B</b>','Negrito')}${fb('i','<i>I</i>','Itálico')}${fb('s','<s>S</s>','Riscado')}${fb('code','&lt;/&gt;','Código')}<span class="fsep"></span>
        ${fb('ul','• Lista','Lista')}${fb('ol','1. Lista','Lista numerada')}${fb('task','☑ Tarefa','Lista de tarefas')}${fb('quote','❝','Citação')}<span class="fsep"></span>
        ${fb('link','🔗 Link','Link')}${fb('img','🖼 Imagem','Imagem')}${fb('table','▦ Tabela','Tabela')}${fb('pre','{ } Bloco','Bloco de código')}${fb('hr','―','Linha divisória')}<span class="fsep"></span>
        ${fb('tree','📁 Estrutura','Inserir a estrutura de pastas do sistema')}${fb('badges','🏷 Selos','Inserir selos das tecnologias')}
      </div>
      <textarea id="mdEditor" spellcheck="false" placeholder="Cole aqui o conteúdo do seu README.md…">${esc(readmeMD)}</textarea>
    </div>
    <div class="doc-pv card">
      <div class="pv-h"><span class="dots"><i></i><i></i><i></i></span><b>README.md</b><span class="muted">pré-visualização</span></div>
      <div class="pv-body"><article class="md" id="mdPreview">${mdParaHTML(readmeMD)}</article>
        ${sum.length>2?`<nav class="toc" id="mdToc"><b>Neste documento</b>${sum.map(s=>`<a href="#${s.id}" data-toc="${s.id}" class="l${s.n}">${esc(s.t)}</a>`).join('')}</nav>`:''}</div>
    </div>
  </div>`;
}
function atualizarPreview(){
  const pv=$('#mdPreview'); if(!pv) return;
  pv.innerHTML=mdParaHTML(readmeMD); $('#docStats').textContent=statsDoc(readmeMD);
  const toc=$('#mdToc'); if(toc){const sum=sumarioDoc(readmeMD);toc.innerHTML='<b>Neste documento</b>'+sum.map(s=>`<a href="#${s.id}" data-toc="${s.id}" class="l${s.n}">${esc(s.t)}</a>`).join('');}
}
function salvarDocDepois(){
  clearTimeout(docsT); const s=$('#docSalvo'); if(s) s.textContent='salvando…';
  docsT=setTimeout(async()=>{docsT=null;readmeAtualizado=Date.now();await salvarReadme();const s2=$('#docSalvo');if(s2)s2.textContent='salvo '+fmtHora(readmeAtualizado);},600);
}
/* Barra de formatação */
const ESTRUTURA_MD=`## 📁 Estrutura de pastas

\`\`\`text
ws-tecnologia-os/
├── index.html          # Página principal
├── css/
│   └── style.css       # Visual, temas claro/escuro e responsivo
├── js/
│   ├── tema.js         # Tema salvo
│   ├── config.js       # Etapas, formas de pagamento e equipe
│   ├── utils.js        # Cálculos e utilidades
│   ├── db.js           # Banco de dados (IndexedDB)
│   ├── views.js        # Telas do sistema
│   ├── ordem.js        # Detalhe da OS
│   ├── docs.js         # Documentação (este README)
│   ├── readme-padrao.js# README inicial
│   └── app.js          # Inicialização
├── img/                # Fotos e logo
└── README.md
\`\`\`
`;
const SELOS_MD=`![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
`;
function formatar(tipo){
  const ta=$('#mdEditor'); if(!ta) return;
  const a=ta.selectionStart,b=ta.selectionEnd,sel=ta.value.slice(a,b);
  const inicioLinha=ta.value.lastIndexOf('\n',a-1)+1;
  const envolver=(x,y,ph)=>{const t=sel||ph;return [ta.value.slice(0,a)+x+t+y+ta.value.slice(b),a+x.length,a+x.length+t.length];};
  const prefixo=(p,ph)=>{const bloco=sel||ph;const novo=bloco.split('\n').map((l,i)=>(typeof p==='function'?p(i):p)+l).join('\n');
    return [ta.value.slice(0,inicioLinha)+ta.value.slice(inicioLinha,a)+novo+ta.value.slice(b),a+(typeof p==='function'?p(0):p).length,a+novo.length];};
  const bloco=(txt)=>{const pre=a>0&&ta.value[a-1]!=='\n'?'\n\n':'';return [ta.value.slice(0,a)+pre+txt+ta.value.slice(b),a+pre.length,a+pre.length+txt.length];};
  const r={
    h1:()=>prefixo('# ','Título'),h2:()=>prefixo('## ','Subtítulo'),h3:()=>prefixo('### ','Seção'),
    b:()=>envolver('**','**','negrito'),i:()=>envolver('*','*','itálico'),s:()=>envolver('~~','~~','riscado'),code:()=>envolver('`','`','código'),
    ul:()=>prefixo('- ','item'),ol:()=>prefixo(i=>(i+1)+'. ','item'),task:()=>prefixo('- [ ] ','tarefa'),quote:()=>prefixo('> ','citação'),
    link:()=>envolver('[',']('+'https://)','texto do link'),img:()=>envolver('![','](img/arquivo.png)','descrição'),
    table:()=>bloco('| Coluna 1 | Coluna 2 | Coluna 3 |\n|---|---|---|\n| valor | valor | valor |\n'),
    pre:()=>bloco('```js\n'+(sel||'// código')+'\n```\n'),hr:()=>bloco('---\n'),
    tree:()=>bloco(ESTRUTURA_MD),badges:()=>bloco(SELOS_MD)}[tipo];
  if(!r) return; const [v,s,e]=r();
  ta.value=v; ta.focus(); ta.setSelectionRange(s,e); readmeMD=v; atualizarPreview(); salvarDocDepois();
}
/* Eventos da tela */
document.addEventListener('input',e=>{if(e.target.id==='mdEditor'){readmeMD=e.target.value;atualizarPreview();salvarDocDepois();}});
document.addEventListener('keydown',e=>{
  if(e.target.id!=='mdEditor')return;
  if(e.key==='Tab'){e.preventDefault();const ta=e.target,a=ta.selectionStart;ta.setRangeText('  ',a,ta.selectionEnd,'end');readmeMD=ta.value;atualizarPreview();salvarDocDepois();}
  if((e.ctrlKey||e.metaKey)&&['b','i','k'].includes(e.key.toLowerCase())){e.preventDefault();formatar({b:'b',i:'i',k:'link'}[e.key.toLowerCase()]);}
});
document.addEventListener('click',async e=>{
  const fm=e.target.closest('[data-md]'); if(fm){e.preventDefault();return formatar(fm.dataset.md);}
  const dm=e.target.closest('[data-docmodo]'); if(dm){docsModo=dm.dataset.docmodo;try{localStorage.setItem('ws-docs-modo',docsModo);}catch(err){}return render();}
  const tl=e.target.closest('#mdToc a, #mdPreview a[href^="#"]');
  if(tl){e.preventDefault();const id=decodeURIComponent(tl.getAttribute('href').slice(1));const alvo=document.getElementById(id);
    if(alvo){const box=alvo.closest('.pv-body');if(box&&box.scrollHeight>box.clientHeight)box.scrollTo({top:alvo.offsetTop-box.offsetTop-12,behavior:'smooth'});else alvo.scrollIntoView({behavior:'smooth',block:'start'});}return;}
  const b=e.target.closest('[data-act^="md-"]'); if(!b) return;
  switch(b.dataset.act){
    case 'md-importar': return $('#fileMd').click();
    case 'md-baixar': baixarBlob(new Blob([readmeMD],{type:'text/markdown;charset=utf-8'}),'README.md'); return toast('README.md baixado');
    case 'md-copiar': return copiar(readmeMD,'README copiado');
    case 'md-padrao':
      if(!await confirmar('Restaurar o README padrão?','O texto atual do editor será substituído pelo README original do sistema.','Restaurar'))return;
      readmeMD=README_PADRAO; readmeAtualizado=Date.now(); await salvarReadme(); render(); return toast('README padrão restaurado');
  }
});
$('#fileMd').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f) return;
  const txt=await f.text();
  if(readmeMD.trim()&&!await confirmar('Substituir o README?',`O conteúdo do editor será trocado por “${f.name}”.`,'Substituir'))return;
  readmeMD=txt; readmeAtualizado=Date.now(); await salvarReadme(); render(); toast(f.name+' importado');
};
try{const m=localStorage.getItem('ws-docs-modo');if(m)docsModo=m;}catch(e){}
