/* =========================================================
   WS Tecnologia — Sistema de Ordens de Serviço
   config.js · Configurações e constantes
   Etapas, prioridades, formas de pagamento, equipe padrão e dados da empresa.
   ========================================================= */
"use strict";

/* ================= Fotos padrão da equipe (pasta img/) ================= */
const FOTOS_PADRAO={silvana:'img/silvana.jpg',eng:'img/engenheiro.jpg'};

/* ================= Constantes ================= */
const STATUS={
  orcamento:{n:'Orçamento',c:'violet'},aprovada:{n:'Aprovada',c:'cyan'},
  desenvolvimento:{n:'Em desenvolvimento',c:'brand'},testes:{n:'Em testes',c:'warn'},
  entregue:{n:'Entregue',c:'ok'},cancelada:{n:'Cancelada',c:'bad'}};
const PRIOR={baixa:{n:'Baixa',c:'gray'},media:{n:'Média',c:'cyan'},alta:{n:'Alta',c:'warn'},urgente:{n:'Urgente',c:'bad'}};
const TIPOS=['Sistema web','Site / Landing page','Aplicativo','Automação','Integração / API','Manutenção','Suporte técnico','Consultoria','Outro'];
const FORMAS={
  pix:{n:'Pix',s:'à vista',ic:'PIX'},
  dinheiro:{n:'Dinheiro',s:'à vista',ic:'R$'},
  debito:{n:'Cartão de débito',s:'à vista',ic:'DÉB'},
  credito:{n:'Crédito à vista',s:'1x no cartão',ic:'CRÉ'},
  parcelado:{n:'Crédito parcelado',s:'2x a 24x',ic:'12x',parc:true},
  boleto:{n:'Boleto / carnê',s:'parcelado',ic:'BOL',parc:true},
  transferencia:{n:'Transferência',s:'TED / DOC',ic:'TED'}};
const SIS_ST={ar:{n:'No ar',c:'ok'},dev:{n:'Em desenvolvimento',c:'brand'},pausado:{n:'Pausado',c:'gray'},demo:{n:'Demonstração',c:'violet'}};
const EQUIPE_PADRAO=[
  {id:'silvana',nome:'Silvana',cargo:'Desenvolvedora Plena',foto:''},
  {id:'eng',nome:'Wanderson',cargo:'Engenheiro de Software',foto:''}];
const CONFIG_PADRAO={id:'empresa',empresa:'WS Tecnologia',slogan:'Desenvolvimento de sistemas',cnpj:'',telefone:'',email:'',cidade:'',pix:'',site:'',
  termos:'Garantia de correção de falhas pelo prazo indicado a partir da entrega. Alterações de escopo serão orçadas à parte. O código-fonte é entregue após a quitação total.',
  equipe:EQUIPE_PADRAO};
