(function(){
  var aliases={
    'rainha das lagrimas':'Queen of Tears',
    'pousando no amor':'Crash Landing on You',
    'beleza verdadeira':'True Beauty',
    'pretendente surpresa':'Business Proposal',
    'sorriso real':'King the Land',
    'uma advogada extraordinaria':'Extraordinary Attorney Woo',
    'meu demonio favorito':'My Demon',
    'meu demonio':'My Demon',
    'vinte e cinco vinte e um':'Twenty Five Twenty One',
    'descendentes do sol':'Descendants of the Sun',
    'desgraca ao seu dispor':'Doom at Your Service',
    'quando o telefone toca':'When the Phone Rings',
    'amor na porta ao lado':'Love Next Door',
    'o amor mora ao lado':'Love Next Door',
    'a licao':'The Glory',
    'a gloria':'The Glory',
    'mulher forte do bong soon':'Strong Woman Do Bong Soon',
    'mulher forte kang nam soon':'Strong Girl Nam Soon',
    'o que ha de errado com a secretaria kim':'What Is Wrong with Secretary Kim',
    'porque esta e a minha primeira vida':'Because This Is My First Life',
    'tudo bem nao ser normal':'It Is Okay to Not Be Okay',
    'esta tudo bem nao ser normal':'It Is Okay to Not Be Okay',
    'alquimia das almas':'Alchemy of Souls',
    'o rei de porcelana':'The King’s Affection',
    'nosso eterno verao':'Our Beloved Summer',
    'caes de caca':'Bloodhounds',
    'familia por escolha':'Family by Choice',
    'hierarquia':'Hierarchy',
    'medicos em colapso':'Doctor Slump',
    'doutor slump':'Doctor Slump'
  };

  function setupNavigation(){
    var nav=document.querySelector('.nav'), wrap=document.querySelector('.wrap');
    if(!nav||!wrap)return;
    var st=document.createElement('style');
    st.textContent='.wrap{padding-bottom:28px!important}.nav{position:sticky!important;left:auto!important;right:auto!important;bottom:auto!important;top:8px!important;margin:-8px 0 13px!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;background:rgba(255,255,255,.97)!important;padding:8px!important;border-radius:22px!important;box-shadow:0 10px 24px rgba(105,61,76,.16)!important;z-index:20!important}.nav button{padding:11px 6px!important}';
    document.head.appendChild(st);
    wrap.insertBefore(nav,wrap.firstChild);
    var n=document.getElementById('name'); if(n)n.placeholder='Ex.: Rainha das Lágrimas';
  }
  setupNavigation();

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function asianCode(s){return (s.network&&s.network.country&&s.network.country.code)||(s.webChannel&&s.webChannel.country&&s.webChannel.country.code)||''}
  function rank(data){var asian=['KR','JP','CN','TH','TW','HK'];return data.sort(function(a,b){var ap=a.show._ptTitle?0:1,bp=b.show._ptTitle?0:1;if(ap!==bp)return ap-bp;var aa=asian.indexOf(asianCode(a.show))>=0?0:1,bb=asian.indexOf(asianCode(b.show))>=0?0:1;if(aa!==bb)return aa-bb;return (b.score||0)-(a.score||0)})}
  async function tv(q){var r=await fetch(API+encodeURIComponent(q));if(!r.ok)throw new Error('TVmaze '+r.status);return await r.json()}
  async function wikidataCandidates(q){
    try{
      var u='https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=pt&uselang=pt&type=item&limit=6&search='+encodeURIComponent(q);
      var r=await fetch(u);if(!r.ok)return[];var j=await r.json();var hits=(j.search||[]);
      var good=hits.filter(function(x){return /s[eé]rie|televis|dorama|drama|novela|programa/i.test(x.description||'')});
      if(!good.length)good=hits.slice(0,3);else good=good.slice(0,3);
      if(!good.length)return[];
      var ids=good.map(function(x){return x.id}).join('|');
      var d='https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=labels%7Caliases&languages=pt%7Cen%7Cko%7Cja%7Czh&ids='+encodeURIComponent(ids);
      var rr=await fetch(d);if(!rr.ok)return[];var jj=await rr.json();
      return good.map(function(h){var e=(jj.entities||{})[h.id]||{},labs=e.labels||{},als=e.aliases||{};var en=(labs.en&&labs.en.value)||((als.en&&als.en[0]&&als.en[0].value)||'');var pt=(labs.pt&&labs.pt.value)||h.label||q;return en?{pt:pt,en:en,id:h.id}:null}).filter(Boolean)
    }catch(e){return[]}
  }
  function renderResults(mode,data){
    var box=$(mode==='main'?'mainResults':'queueResults');
    if(!data.length){box.innerHTML='<div class="results"><div class="loading">Nenhum resultado. Você pode cadastrar manualmente.</div></div>';return}
    apiCache={...apiCache,...Object.fromEntries(data.map(function(x){return[String(x.show.id),x.show]}))};
    box.innerHTML='<div class="results">'+data.map(function(x){var s=x.show,p=imgOf(s),pt=s._ptTitle||s.name,sub=(pt!==s.name?'Título internacional: '+s.name+' · ':'')+showMeta(s);return '<div class="result" onclick="pickShow(\''+mode+'\','+s.id+')">'+(p?'<img src="'+escAttr(p)+'">':'<div class="poster"></div>')+'<div><b>'+esc(pt)+'</b><div class="muted">'+esc(sub)+'</div></div><button>Usar</button></div>'}).join('')+'</div>'
  }
  searchApi=async function(mode,q){
    var box=$(mode==='main'?'mainResults':'queueResults');
    box.innerHTML='<div class="results"><div class="loading">Buscando doramas, inclusive títulos em português…</div></div>';
    try{
      var key=norm(q),alt=aliases[key],direct=await tv(q),merged=direct.slice();
      if(alt){
        var ad=await tv(alt);
        ad.forEach(function(x){x.show._ptTitle=q;x.show._ptSource='alias';merged.push(x)});
      }
      var hasAsian=direct.some(function(x){return ['KR','JP','CN','TH','TW','HK'].indexOf(asianCode(x.show))>=0});
      if(!alt&&(!direct.length||!hasAsian)){
        var cands=await wikidataCandidates(q);
        var sets=await Promise.all(cands.slice(0,3).map(async function(c){try{var a=await tv(c.en);a.slice(0,4).forEach(function(x){x.show._ptTitle=c.pt||q;x.show._wikidataId=c.id});return a.slice(0,4)}catch(e){return[]}}));
        sets.forEach(function(a){merged=merged.concat(a)});
      }
      var seen={},unique=[];rank(merged).forEach(function(x){var id=String(x.show.id);if(!seen[id]){seen[id]=1;unique.push(x)}});
      renderResults(mode,unique.slice(0,8));
    }catch(e){box.innerHTML='<div class="results"><div class="loading">Não foi possível consultar o catálogo agora. O cadastro manual continua disponível.</div></div>'}
  };
  pickShow=function(mode,id){var s=apiCache[String(id)];if(!s)return;var display=s._ptTitle||s.name;if(mode==='main'){selectedMain=s;$('name').value=display;$('mainResults').innerHTML=''}else{selectedQueue=s;$('queueName').value=display;$('queueResults').innerHTML=''}renderSelected(mode)};
  renderSelected=function(mode){var s=mode==='main'?selectedMain:selectedQueue,box=$(mode==='main'?'mainSelected':'queueSelected');if(!s){box.innerHTML='';return}var p=imgOf(s),pt=s._ptTitle||s.name,sub=(pt!==s.name?'Título internacional: '+s.name+' · ':'')+showMeta(s);box.innerHTML='<div class="selected">'+(p?'<img src="'+escAttr(p)+'">':'')+'<div><b>'+esc(pt)+'</b><br>'+esc(sub)+'</div></div>'};
  metaFrom=function(s){if(!s)return{};return{tvmazeId:s.id||null,image:imgOf(s),premiered:s.premiered||'',country:(s.network&&s.network.country&&s.network.country.name)||(s.webChannel&&s.webChannel.country&&s.webChannel.country.name)||'',originalName:s.name||'',ptTitle:s._ptTitle||'',wikidataId:s._wikidataId||''}};
})();
