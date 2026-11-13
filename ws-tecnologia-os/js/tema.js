/* WS Tecnologia — aplica o tema salvo (claro/escuro) antes da página aparecer, evitando "piscar". */
try{document.documentElement.dataset.theme=localStorage.getItem('ws-tema')||'dark';}catch(e){}
