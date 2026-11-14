const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const won=n=>Math.round(n).toLocaleString("ko-KR")+"원";
const init=()=>({resort:"all",people:2,day:"wd",scope:"gear",hours:"any",sort:"total",sh:"car",eb:false,nw:false,off:true});
let st=init();
const bucket=h=>h===0?"x":h<=3?"s":h===4?"m":h<=6?"l":"f";
const SCOPE={lift:"리프트만",gear:"리프트 + 장비",wear:"리프트 + 장비 + 의류"};

RESORTS.forEach(([n])=>{const o=document.createElement("option");o.value=n;o.textContent=n;$("#resort").appendChild(o)});
$("#grid").innerHTML=RESORTS.map(([n,a])=>{const c=new Set(DATA.filter(d=>d.resort===n&&!d.off).map(d=>d.shop)).size;
  return `<button class="rz${c?"":" none"}" data-r="${n}" aria-pressed="false"><span class="dot">${a}${c?`<span class="n">${c}</span>`:""}</span><span class="l">${n.replace("엘리시안 ","")}</span></button>`}).join("");

function rows(res=st.resort){
  let out=[];
  DATA.forEach(d=>{
    if(res!=="all"&&d.resort!==res) return;
    if(st.hours!=="any"&&bucket(d.h)!==st.hours) return;
    if(st.eb&&!d.eb) return; if(st.nw&&d.season!=="26/27") return; if(!st.off&&d.off) return;
    let per=d[st.day],normal=st.day==="wd"?d.nwd:d.nwe,added=false;
    if(d.scope!==st.scope){ if(st.scope==="wear"&&d.scope==="gear"&&d.wa){per+=d.wa;normal=null;added=true}else return; }
    const base=per,bus=st.sh==="bus",sh=SHUTTLE[d.resort],shAdd=bus&&sh&&sh.rt?sh.rt:0,shUnknown=bus&&!shAdd;
    if(shAdd){per+=shAdd;normal=null}
    out.push({...d,per,base,shAdd,shUnknown,normal,added,total:per*st.people});
  });
  out.sort((a,b)=>(a.shUnknown-b.shUnknown)||(st.sort==="total"?a.total-b.total||a.h-b.h:b.h-a.h||a.total-b.total));
  return out;
}
function render(){
  syncHub();
  $("#people").textContent=st.people+"명"; $("#resort").value=st.resort;
  $$("#grid .rz").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===st.resort));
  [["day","day"],["scope","scope"],["hours","hours"],["sh","sh"]].forEach(([id,k])=>$$("#"+id+" button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===st[k])));
  $("#ebOnly").setAttribute("aria-pressed",st.eb);$("#newOnly").setAttribute("aria-pressed",st.nw);$("#offShow").setAttribute("aria-pressed",st.off);
  $("#sortBtn").textContent=st.sort==="total"?"↕ 총액 낮은 순":"↕ 이용시간 긴 순";
  const cond=`${SCOPE[st.scope]} · ${st.people}명 · ${st.day==="wd"?"주중":"주말"}${st.sh==="bus"?" · 셔틀 포함":""}`;
  $("#crumb").hidden=st.resort==="all"; $("#dir").innerHTML=dirHtml(st.resort);
  if(st.resort==="all"){summary(cond);return}
  const r=rows(),known=r.filter(x=>!x.shUnknown),min=known.length?Math.min(...known.map(x=>x.total)):-1; cur=r;
  $("#count").textContent=`${st.resort==="all"?"전국":st.resort} · ${SCOPE[st.scope]} · ${st.people}명 · ${st.day==="wd"?"주중":"주말"}${st.sh==="bus"?" · 셔틀 포함":""} — ${r.length}건`;
  if(!r.length){const has=DATA.some(d=>d.resort===st.resort);
    $("#list").innerHTML=`<div class="empty">${st.resort!=="all"&&!has?st.resort+"은(는) 26/27 요금 공개 전이에요. "+openTxt(st.resort)+".":"조건에 맞는 가격이 없어요. 이용 시간을 \"상관없음\"으로 바꿔 보세요."}</div>`;return;}
  $("#list").innerHTML=r.map((d,i)=>{const pct=d.normal&&d.normal>d.per?Math.round((1-d.per/d.normal)*100):0;return `
   <article class="card${d.total===min&&!d.shUnknown?" best":""}">
     <div><div class="tags">${d.total===min&&!d.shUnknown?'<span class="tag best">내 조건 최저가</span>':""}<span class="tag">${d.resort}</span>${d.eb?'<span class="tag eb">얼리버드</span>':""}${d.off?'<span class="tag off">리조트 공식가</span>':""}${d.season==="25/26"?'<span class="tag old">25/26 가격</span>':d.season==="?"?'<span class="tag off">시즌 미표기</span>':""}</div>
       <h3>${d.shop}</h3>${d.note?`<p class="sub">${d.note}</p>`:""}</div>
     <dl class="spec"><dt>리프트</dt><dd>${d.h?d.h+"시간권":"시간 미표기"}</dd><dt>범위</dt><dd>${SCOPE[st.scope]}${d.added?` (의류 +${won(d.wa)} 포함)`:""}</dd>${d.h?`<dt>시간당</dt><dd>약 ${won(Math.round(d.base/d.h/100)*100)}</dd>`:""}${st.sh==="bus"?`<dt>셔틀</dt><dd>${d.shAdd?`왕복 +${won(d.shAdd)} 포함 (${SHUTTLE[d.resort].from})`:"요금 미확인. 총액에 빠져 있어요"}</dd>`:""}</dl>
     <div class="price-row"><div>
       ${pct?`<div class="normal"><s>${won(d.normal)}</s><b>${pct}%</b></div>`:""}
       <div class="sale">${won(d.per)}${d.from?"~":""}<small>1인</small></div>
       <div class="total">${st.people}명 총 <b>${won(d.total)}${d.from?"~":""}</b></div></div>
       <a class="btn" href="${d.url}" target="_blank" rel="noopener">${d.off||d.eb?"출처 보기":"샵 홈페이지"}</a></div>
     <div class="foot"><span>${d.tel?"전화 "+d.tel+" · ":""}${CHECKED}</span><button class="rep" data-i="${i}">가격이 달라요</button></div>
   </article>`}).join("");
}
let cur=[];
const openTxt=n=>{const o=OPEN[n]||{};return o.d?"개장 "+o.d:o.last?"작년 개장 "+o.last:"개장일 미발표"};
function priceState(n){const r=DATA.filter(d=>d.resort===n);if(r.some(d=>d.season==="26/27"))return ['<span class="ok">26/27 공개</span>',0];if(r.length)return ['<span class="wait">작년 가격만</span>',1];return ['<span class="wait">공개 대기</span>',2]}
function renderNotice(){const rows=Object.keys(OPEN).map(n=>{const o=OPEN[n];return `<tr><td>${n}</td><td>${o.d?o.d+`<small>${o.src}</small>`:'미발표'}</td><td>${o.last||"-"}</td><td>${priceState(n)[0]}</td></tr>`}).join("");
  $("#ntTable").innerHTML="<tr><th>스키장</th><th>26/27 개장</th><th>작년 개장</th><th>요금</th></tr>"+rows;
  $(".nt-f").textContent=OPEN_CHECKED+" 확인. 개장일은 기온과 제설 상황에 따라 바뀌니 방문 전 리조트 공지를 확인하세요."}
const today=()=>new Date().toISOString().slice(0,10);
function openNotice(){$("#nt").hidden=false}
function closeNotice(day){$("#nt").hidden=true;if(day){try{localStorage.setItem("ntDay",today())}catch(e){}}}
function best(n){const r=rows(n);if(!r.length)return null;const k=r.filter(x=>!x.shUnknown);const pool=k.length?k:r;return {d:pool.reduce((a,b)=>b.total<a.total?b:a),n:new Set(r.map(x=>x.shop)).size,unk:!k.length}}
function summary(cond){
  const list=RESORTS.map(([n])=>({n,b:best(n),has:DATA.some(d=>d.resort===n)}));
  list.sort((a,b)=>(!a.b-!b.b)||((a.b&&a.b.unk)-(b.b&&b.b.unk))||(a.b?a.b.d.total-b.b.d.total:b.has-a.has));
  const priced=list.filter(x=>x.b).length;
  $("#count").textContent=`전국 ${RESORTS.length}곳 중 ${priced}곳 가격 있음 · ${cond}`;
  $("#list").innerHTML=list.map((x,i)=>{const b=x.b;
    if(!b){const dn=(DIR[x.n]||[]).length;return `<button class="rrow na" data-r="${x.n}"><div><div class="nm">${x.n}</div><div class="sb">${x.has?"이 조건에 맞는 가격이 없어요":openTxt(x.n)+" · 요금 공개 대기"}</div></div><div class="pr"><b>${x.has?"조건 변경":"공개 대기"}</b></div></button>`}
    const d=b.d;return `<button class="rrow${i===0&&!b.unk?" top":""}" data-r="${x.n}"><div><div class="nm">${x.n}</div><div class="sb">${d.shop} · ${d.h?d.h+"시간권":"시간 미표기"}${d.season==="25/26"?" · 25/26 가격":""}${d.eb?" · 얼리버드":""}${b.unk?" · 셔틀 요금 미확인":""}</div></div><div class="pr"><b>${won(d.per)}${d.from?"~":""}</b><span>1인 최저 · ${b.n}곳 ›</span></div></button>`}).join("");
}
function dirHtml(n){const a=DIR[n];if(n==="all"||!a||!a.length)return "";
  return `<h4>가격표를 확인하지 못한 ${n} 렌탈샵</h4><ul>${a.map(x=>`<li><b>${x[0]}</b><p>${x[1]}</p><a href="${x[2]}" target="_blank" rel="noopener">홈페이지</a></li>`).join("")}</ul>`}
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,5000)}
function copy(text,ok){const done=()=>toast(ok),fail=()=>toast(text);try{navigator.clipboard.writeText(text).then(done,fail)}catch(e){fail()}}
const enc=()=>["q",st.resort==="all"?"all":SLUG[st.resort],"p"+st.people,st.day,st.scope,"h"+st.hours,st.sh].join("-");
function dec(){const a=location.hash.slice(1).split("-");if(a[0]!=="q"||a.length!==7)return;
  const rn=a[1]==="all"?"all":Object.keys(SLUG).find(k=>SLUG[k]===a[1]);const pp=parseInt(a[2].slice(1));
  if(!rn||!(pp>=1&&pp<=20)||!["wd","we"].includes(a[3])||!SCOPE[a[4]]||!["any","s","m","l","f"].includes(a[5].slice(1))||!["car","bus"].includes(a[6]))return;
  st={...init(),resort:rn,people:pp,day:a[3],scope:a[4],hours:a[5].slice(1),sh:a[6]}}
function renderOfficial(){
  const done=OFFICIAL.map(o=>o.r);
  $("#official").innerHTML=OFFICIAL.map(o=>`<div class="off-h"><h3>${o.r}</h3><span>${o.s}</span></div><div class="tw"><table><tr><th>권종</th><th>주중</th><th>주말</th></tr>${o.rows.map(x=>`<tr><td>${x[0]}</td><td>${won(x[1])}</td><td>${won(x[2])}</td></tr>`).join("")}</table></div>`).join("")
   +`<div class="pending">조사 중: ${RESORTS.map(r=>r[0]).filter(n=>!done.includes(n)).join(", ")}. 26/27 요금을 아직 공지하지 않았거나 확인하지 못한 곳입니다.</div>`;
}
const set=(k,v)=>{st[k]=v;render()};
$("#grid").addEventListener("click",e=>{const b=e.target.closest(".rz");if(b)set("resort",st.resort===b.dataset.r?"all":b.dataset.r)});
$("#resort").addEventListener("change",e=>{st.resort=e.target.value;if(view==="main"&&st.resort!=="all")go("guide");render()});
["day","scope","hours","sh"].forEach(id=>$("#"+id).addEventListener("click",e=>{const b=e.target.closest("button");if(b)set(id,b.dataset.v)}));
$("#minus").addEventListener("click",()=>set("people",Math.max(1,st.people-1)));
$("#plus").addEventListener("click",()=>set("people",Math.min(20,st.people+1)));
$("#sortBtn").addEventListener("click",()=>set("sort",st.sort==="total"?"hours":"total"));
$("#resetBtn").addEventListener("click",()=>{st=init();render()});
$("#ebOnly").addEventListener("click",()=>set("eb",!st.eb));
$("#newOnly").addEventListener("click",()=>set("nw",!st.nw));
$("#offShow").addEventListener("click",()=>set("off",!st.off));
$("#ebBtn").addEventListener("click",()=>{st={...init(),eb:true,hours:"any"};render();$("#pills").scrollIntoView({behavior:"smooth",block:"start"})});
$$(".nav button").forEach(b=>b.addEventListener("click",()=>go(b.dataset.v)));
$("#shuttle").innerHTML=RESORTS.map(([n])=>{const s=SHUTTLE[n];return `<div class="sh-item"><div class="t">${n}${s&&s.rt?`<span>왕복 ${won(s.rt)}</span>`:`<span class="na">${s?"요금 미확인":"조사 중"}</span>`}</div>${s?`${s.from?`<p>탑승: ${s.from}</p>`:""}<p>${s.st}</p><a href="${s.url}" target="_blank" rel="noopener">출처 보기</a>`:""}</div>`}).join("");
$("#list").addEventListener("click",e=>{
  const rr=e.target.closest(".rrow");if(rr){st.resort=rr.dataset.r;render();$("#pills").scrollIntoView({block:"start"});return}
  const rp=e.target.closest(".rep");if(rp){const d=cur[+rp.dataset.i];
    copy(`[가격 제보] ${d.shop} / ${d.resort} / ${d.h?d.h+"시간":"시간 미표기"} · ${SCOPE[st.scope]} / ${st.day==="wd"?"주중":"주말"} 표시가 ${won(d.base)} → 실제 가격: `,REPORT_URL?"제보 내용이 복사됐어요. 제보 창구에 붙여 넣어 주세요.":"제보 내용이 복사됐어요. 접수 창구는 준비 중이에요.");
    if(REPORT_URL)window.open(REPORT_URL,"_blank")}});
$("#quick").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;st={...init(),...JSON.parse(b.dataset.q)};render();$("#pills").scrollIntoView({behavior:"smooth",block:"start"})});
$("#crumb").addEventListener("click",()=>set("resort","all"));
$("#shareBtn").addEventListener("click",()=>{location.hash=enc();
  const hosted=/github\.io$|\.kr$|\.com$/.test(location.hostname)&&!/claude/.test(location.hostname);
  const b=st.resort==="all"?null:best(st.resort);
  const line=`${st.resort==="all"?"전국 스키장":st.resort} · ${SCOPE[st.scope]} · ${st.people}명 · ${st.day==="wd"?"주중":"주말"}${st.sh==="bus"?" · 셔틀 포함":""}${b?`\n최저 ${b.d.shop} 1인 ${won(b.d.per)}${b.d.from?"~":""}`:""}`;
  copy(hosted?line+"\n"+location.href:line,hosted?"조건과 링크가 복사됐어요.":"조건이 복사됐고 주소에도 담겼어요. 링크는 화면 위 공유 메뉴에서 복사해 주세요.")});
window.addEventListener("hashchange",route);window.addEventListener("popstate",route);
/* ── 동행 구하기 ── */
const esc=t=>String(t==null?"":t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const DEMO=/[?&]demo=1/.test(location.search);
const J={ready:false,posts:[],uid:null,store:null};
const jMine=()=>{try{return JSON.parse(localStorage.getItem("jRep")||"[]")}catch(e){return []}};
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function fbStore(){
  await fbReady();
  const col=firebase.firestore().collection("joins"),inc=firebase.firestore.FieldValue.increment(1);
  return {
    list:async()=>(await col.where("date",">=",today()).orderBy("date").limit(200).get()).docs.map(d=>({id:d.id,...d.data()})),
    add:p=>col.add({...p,uid:J.uid,reports:0,created:firebase.firestore.FieldValue.serverTimestamp()}),
    del:id=>col.doc(id).delete(),
    report:id=>col.doc(id).update({reports:inc}),
  };
}
function demoStore(){J.uid="me";let n=3;const d=k=>{const t=new Date(Date.now()+k*864e5);return t.toISOString().slice(0,10)};
  const a=[{id:"1",resort:"곤지암",date:d(9),have:2,want:4,from:"강남",memo:"주간권 끊고 같이 타실 분 구해요. 보드 2년차입니다.",link:"https://open.kakao.com/o/example1",nick:"곤지암보더",uid:"x",reports:0},
           {id:"2",resort:"하이원",date:d(16),have:1,want:4,from:"수원, 자차 카풀",memo:"1박 2일로 가요. 초보 환영!",link:"https://open.kakao.com/o/example2",nick:"눈사람",uid:"me",reports:0}];
  return {list:async()=>a.slice(),add:async p=>{a.push({...p,id:String(n++),uid:"me",reports:0})},del:async id=>{a.splice(a.findIndex(x=>x.id===id),1)},report:async id=>{a.find(x=>x.id===id).reports++}}}
async function joinInit(){
  if(J.ready){joinRender();return}
  $("#jList").innerHTML='<div class="empty">모집글을 불러오는 중이에요.</div>';
  try{J.store=DEMO?demoStore():await fbStore();J.ready=true;await joinLoad()}
  catch(e){$("#jList").innerHTML='<div class="empty">모집글을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>'}
}
async function joinLoad(){M.at=0;J.posts=await J.store.list();joinRender()}
function joinRender(){
  const r=$("#jResort").value,hid=jMine();
  const a=J.posts.filter(p=>(r==="all"||p.resort===r)&&(p.reports||0)<3&&!hid.includes(p.id)).sort((x,y)=>x.date<y.date?-1:1);
  $("#jCount").textContent=a.length?`모집 중 ${a.length}건 · 가는 날 빠른 순`:"";
  if(!a.length){$("#jList").innerHTML=`<div class="empty">${r==="all"?"아직 모집글이 없어요.":esc(r)+" 모집글이 아직 없어요."}<br>첫 글을 올려 보세요.</div>`;return}
  $("#jList").innerHTML=a.map(p=>{const dt=new Date(p.date+"T00:00:00"),wd="일월화수목금토"[dt.getDay()],need=Math.max(0,p.want-p.have);
    return `<article class="jcard"><div><div class="tags"><span class="tag">${esc(p.resort)}</span><span class="tag off">${dt.getMonth()+1}월 ${dt.getDate()}일 (${wd})</span></div>
      <h3>${esc(p.nick)}<span class="jbadge">${need?need+"명 더 구해요":"모집 완료"}</span></h3>
      <div class="jm">지금 ${p.have}명 · 총 ${p.want}명 목표${p.from?" · "+esc(p.from)+" 출발":""}</div></div>
      ${p.memo?`<div class="jmemo">${esc(p.memo)}</div>`:""}
      <div class="jact"><a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener nofollow">오픈채팅 참여</a><button class="btn ghost" data-a="price" data-id="${esc(p.id)}">${p.want}명 최저가 보기</button>
      ${p.uid===J.uid?`<button class="rep" data-a="del" data-id="${esc(p.id)}">내 글 삭제</button>`:`<button class="rep" data-a="rep" data-id="${esc(p.id)}">신고</button>`}</div></article>`}).join("");
}
function joinForm(open){const f=$("#jf");f.hidden=!open;if(open){$("#jfErr").textContent="";$("#jfDate").min=today();if($("#jResort").value!=="all")$("#jfResort").value=$("#jResort").value}}
RESORTS.forEach(([n])=>{for(const id of ["jResort","jfResort"]){const o=document.createElement("option");o.value=n;o.textContent=n;$("#"+id).appendChild(o)}});
if(FB||DEMO)$("#navJoin").hidden=false;
/* ── 스키장 허브 ── */
let view="main";
const VIEWS={main:["main"],guide:["guide"],home:["home"],talk:["talk"],join:["join"],more:["official","report"],official:["official"],report:["report"]};
const LIVE=FB||DEMO;
function go(v,keep){view=v;$$(".nav button").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===v));
  ["main","guide","home","talk","join","official","report"].forEach(k=>$("#v-"+k).hidden=!VIEWS[v].includes(k));
  if(v==="main"&&location.hash){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
  if(!keep)window.scrollTo(0,0);if(v==="join")joinInit();if(v==="talk")talkSync();if(v==="guide")renderGuide();if(v==="main")renderMain()}
function syncHub(){if(view==="guide")renderGuide();if(view==="talk")talkSync()}
function renderGuide(){
  const n=st.resort,h=$("#gHero"),b=$("#gBody"),want=n==="all"?"":"#g-"+SLUG[n];
  if(view==="guide"&&location.hash!==want&&!location.hash.startsWith("#q-")){try{history.replaceState(null,"",want||location.pathname+location.search)}catch(e){}}
  if(n==="all"){
    h.innerHTML=`<h1>스키장 갈 땐<br><em>스노우딜</em>부터</h1><p class="hsub">슬로프·셔틀·요금·동행까지, 스키장별로 한곳에 모았어요.</p><button class="live" data-a="nt"><i></i>26/27 요금, 공개되는 대로 바로 업데이트 중<span>개장 일정 ›</span></button>`;
    const card=([r])=>{const g=GUIDE[r],c=new Set(DATA.filter(d=>d.resort===r&&!d.off).map(d=>d.shop)).size;
      return `<button class="hcard${g?" g":""}" data-r="${r}"><b>${r}</b><span>${REGION[r]}${g&&g.from?" · "+g.from:""}</span><span>${openTxt(r)}</span><em>${g?"가이드":"기본 정보"}${c?" · 렌탈샵 "+c+"곳":""} ›</em></button>`};
    b.className="gut";
    b.innerHTML=`<h2>수도권에서 가까운 스키장</h2><div class="hub">${RESORTS.filter(([r])=>GUIDE[r]).map(card).join("")}</div><h2>강원·그 외 스키장</h2><div class="hub">${RESORTS.filter(([r])=>!GUIDE[r]).map(card).join("")}</div><p class="note">가이드는 리조트 안내와 보도자료를 바탕으로 쓴 초안이에요. 수도권 4곳부터 채우고 있고, 다녀온 분들의 이야기는 각 스키장 톡에 모읍니다.</p>`;
    return}
  const g=GUIDE[n],bs=best(n),s=SHUTTLE[n],o=OPEN[n]||{};
  h.innerHTML=`<button class="back" data-a="all">‹ 전체 스키장</button><h1>${n}</h1><p class="hsub">${REGION[n]}${g&&g.from?" · "+g.from:""} · ${openTxt(n)}</p><div class="hact"><button class="on" data-a="home">최저가 보기</button>${LIVE?'<button data-a="talk">톡</button><button data-a="join">동행 구하기</button>':""}</div>`;
  const sec=x=>`<div class="gsec"><h3>${x.t}</h3>${x.tb?`<div class="tw"><table><tr>${x.tb.h.map(c=>`<th>${c}</th>`).join("")}</tr>${x.tb.r.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`:""}${x.li?`<ul>${x.li.map(c=>`<li>${c}</li>`).join("")}</ul>`:""}</div>`;
  const price=`<div class="gsec"><h3>요금<small>${SCOPE[st.scope]} · ${st.people}명 · ${st.day==="wd"?"주중":"주말"} 기준</small></h3>${bs?`<button class="rrow top" data-a="home"><div><div class="nm">1인 최저 ${won(bs.d.per)}${bs.d.from?"~":""}</div><div class="sb">${bs.d.shop} · ${bs.d.h?bs.d.h+"시간권":"시간 미표기"}${bs.d.season==="25/26"?" · 25/26 가격":""}${bs.d.eb?" · 얼리버드":""}</div></div><div class="pr"><span>${bs.n}곳 비교 ›</span></div></button>`:`<button class="rrow na" data-a="home"><div><div class="nm">26/27 요금 공개 대기</div><div class="sb">${openTxt(n)} · 공개되는 대로 올려요</div></div><div class="pr"><span>조건 바꾸기 ›</span></div></button>`}</div>`;
  const bus=`<div class="gsec"><h3>서울 출발 셔틀버스</h3>${s?`<ul><li>${s.rt?"왕복 "+won(s.rt):"요금 미확인"}${s.from?" · 탑승: "+s.from:""}</li><li>${s.st}</li></ul><p class="gsrc"><a href="${s.url}" target="_blank" rel="noopener">출처 보기</a></p>`:`<p>아직 확인하지 못했어요.</p>`}</div>`;
  const ask=`<div class="gask"><b>${g?"아직 확인하지 못한 것":"가이드를 준비하고 있어요"}</b>${g?`<ul>${g.todo.map(c=>`<li>${c}</li>`).join("")}</ul>`:`<p>${n}은(는) 기본 정보만 먼저 올렸어요. 슬로프, 주차, 셔틀처럼 다녀온 사람만 아는 이야기를 기다리고 있어요.</p>`}${LIVE?`<p>아는 분은 ${n} 톡에 한 줄 남겨 주세요. 확인해서 가이드에 반영할게요.</p><button data-a="talk">${n} 톡에 남기기</button>`:""}</div>`;
  b.className="gut one";
  b.innerHTML=(g?`<div class="facts">${g.facts.map(f=>`<div><span>${f[0]}</span><b>${f[1]}</b></div>`).join("")}</div>`+g.secs.map(sec).join(""):`<div class="gsec"><h3>개장 일정</h3><ul><li>${o.d?"26/27 개장 "+o.d+" ("+o.src+")":"26/27 개장일은 아직 발표되지 않았어요."}</li>${o.last?`<li>지난 시즌에는 ${o.last}에 개장했어요.</li>`:""}</ul></div>`)
    +price+bus+ask+(g?`<p class="gsrc">${g.base}. 출처: ${g.src.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${x[0]}</a>`).join(", ")}. 운영 내용은 시즌마다 바뀌니 방문 전 리조트 공지를 확인하세요.</p>`:"");
}
$("#v-guide").addEventListener("click",e=>{
  const c=e.target.closest(".hcard");
  if(c){try{history.pushState(null,"","#g-"+SLUG[c.dataset.r])}catch(x){}set("resort",c.dataset.r);window.scrollTo(0,0);return}
  const a=e.target.closest("[data-a]");if(!a)return;const k=a.dataset.a;
  if(k==="nt")openNotice();else if(k==="all"){try{history.pushState(null,"",location.pathname+location.search)}catch(x){}set("resort","all");window.scrollTo(0,0)}else go(k)});
function route(){const a=location.hash.slice(1);
  if(a.startsWith("q-")){dec();go("home",true);render();return}
  const m=/^([gt])-([a-z0-9]+)$/.exec(a),rn=m&&Object.keys(SLUG).find(k=>SLUG[k]===m[2]);
  if(rn){st.resort=rn;go(m[1]==="t"&&LIVE?"talk":"guide",true);render();return}
  if(!a&&view==="guide"&&st.resort!=="all"){st.resort="all";render()}}
/* ── 스키장 톡 ── */
const T={posts:[],store:null,resort:null,loaded:false,last:0};
let fbP;
function fbReady(){return fbP||(fbP=(async()=>{if(DEMO){J.uid="me";return}
  const v="10.12.2",b="https://www.gstatic.com/firebasejs/"+v+"/";
  await loadScript(b+"firebase-app-compat.js");await loadScript(b+"firebase-auth-compat.js");await loadScript(b+"firebase-firestore-compat.js");
  if(!firebase.apps.length)firebase.initializeApp(FB);const cred=await firebase.auth().signInAnonymously();J.uid=cred.user.uid})().catch(e=>{fbP=null;throw e}))}
function talkStore(){
  if(DEMO){const m={"곤지암":[{id:"t1",nick:"곤지암보더",text:"토요일 9시 도착했는데 리프트 대기 15분쯤이었어요.",uid:"x",reports:0,ts:Date.now()-72e5},{id:"t2",nick:"눈사람",text:"셔틀은 잠실에서 탔고 앉아서 갔습니다.",uid:"me",reports:0,ts:Date.now()-864e5*2}]};let n=3;const g=r=>m[r]||(m[r]=[]);
    return {list:async(r,k=100)=>g(r).slice().sort((x,y)=>y.ts-x.ts).slice(0,k),add:async(r,p)=>{g(r).push({...p,id:"t"+n++,uid:"me",reports:0,ts:Date.now()})},del:async(r,id)=>{const a=g(r);a.splice(a.findIndex(x=>x.id===id),1)},report:async(r,id)=>{g(r).find(x=>x.id===id).reports++}}}
  const db=firebase.firestore(),col=r=>db.collection("talk").doc(SLUG[r]).collection("posts"),inc=firebase.firestore.FieldValue.increment(1);
  return {list:async(r,k=100)=>(await col(r).orderBy("created","desc").limit(k).get()).docs.map(d=>{const x=d.data({serverTimestamps:"estimate"});return {id:d.id,...x,ts:x.created&&x.created.toMillis?x.created.toMillis():Date.now()}}),
    add:(r,p)=>col(r).add({...p,uid:J.uid,reports:0,created:firebase.firestore.FieldValue.serverTimestamp()}),del:(r,id)=>col(r).doc(id).delete(),report:(r,id)=>col(r).doc(id).update({reports:inc})}}
const ago=ts=>{const m=Math.floor((Date.now()-ts)/6e4);if(m<1)return "방금";if(m<60)return m+"분 전";if(m<1440)return Math.floor(m/60)+"시간 전";const d=new Date(ts);return (d.getMonth()+1)+"월 "+d.getDate()+"일"};
const ASK=["주말 리프트 대기 시간","주차장이 차는 시간과 매표소까지 거리","셔틀버스 탑승 위치와 좌석 상황","초보가 타기 좋은 슬로프"];
function talkSide(r){const g=GUIDE[r],bs=best(r);
  $("#tkSide").innerHTML=`<div class="tkcard"><b>${r} 한눈에</b><p class="sub">${REGION[r]}${g&&g.from?" · "+g.from:""} · ${openTxt(r)}</p>${g?`<div class="facts">${g.facts.map(f=>`<div><span>${f[0]}</span><b>${f[1]}</b></div>`).join("")}</div>`:""}<button class="rrow${bs?"":" na"}" data-a="price"><div><div class="nm">${bs?"1인 최저 "+won(bs.d.per)+(bs.d.from?"~":""):"26/27 요금 공개 대기"}</div><div class="sb">${bs?`${bs.d.shop} · ${SCOPE[st.scope]} · ${st.people}명 ${st.day==="wd"?"주중":"주말"}`:"공개되는 대로 올려요"}</div></div><div class="pr"><span>${bs?bs.n+"곳 비교 ›":"특가 보기 ›"}</span></div></button><div class="act"><button data-a="guide">${g?"가이드 전체 보기":"기본 정보 보기"}</button>${LIVE?'<button data-go="join">동행 구하기</button>':""}</div></div><div class="gask"><b>이런 이야기를 기다려요</b><ul>${(g?g.todo:ASK).map(c=>`<li>${c}</li>`).join("")}</ul><p>아는 만큼 한 줄만 남겨 주세요. 확인해서 ${r} 가이드에 반영할게요.</p></div>`}
$("#tkSide").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b||!T.resort)return;const r=T.resort;
  if(b.dataset.a==="guide"){try{history.pushState(null,"","#g-"+SLUG[r])}catch(x){}st.resort=r;go("guide");render()}
  else if(b.dataset.a==="price"){st.resort=r;go("home");render()}});
async function talkSync(force){
  const r=st.resort!=="all"?st.resort:(T.resort||FOCUS);$("#tkResort").value=r;if(force)M.at=0;$("#tkT").textContent=r+" 톡";talkSide(r);
  if(T.resort===r&&T.loaded&&!force){talkRender();return}
  T.resort=r;T.loaded=false;$("#tkCount").textContent="";$("#tkList").innerHTML='<div class="empty">글을 불러오는 중이에요.</div>';
  try{await fbReady();T.store=T.store||talkStore();const a=await T.store.list(r);if(T.resort!==r)return;T.posts=a;T.loaded=true;talkRender()}
  catch(e){if(T.resort===r)$("#tkList").innerHTML='<div class="empty">글을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>'}}
function talkRender(){const hid=jMine(),a=T.posts.filter(p=>(p.reports||0)<3&&!hid.includes(p.id));
  $("#tkCount").textContent=a.length?`글 ${a.length}개 · 최신순`:"";
  $("#tkList").innerHTML=a.length?a.map(p=>`<div class="tk"><div class="h"><b>${esc(p.nick)}</b><span>${ago(p.ts)}</span><button class="rep" data-a="${p.uid===J.uid?"del":"rep"}" data-id="${esc(p.id)}">${p.uid===J.uid?"삭제":"신고"}</button></div><p>${esc(p.text)}</p></div>`).join(""):`<div class="empty">${esc(T.resort)} 톡에 아직 글이 없어요.<br>첫 글을 남겨 보세요.</div>`}
RESORTS.forEach(([n])=>{const o=document.createElement("option");o.value=n;o.textContent=n;$("#tkResort").appendChild(o)});
try{$("#tkNick").value=localStorage.getItem("tkNick")||""}catch(e){}
$("#tkResort").addEventListener("change",e=>set("resort",e.target.value));
$("#tkForm").addEventListener("submit",async e=>{e.preventDefault();const err=m=>{$("#tkErr").textContent=m},nick=$("#tkNick").value.trim(),text=$("#tkText").value.trim();err("");
  if(!nick)return err("닉네임을 넣어 주세요.");
  if(text.length<2)return err("내용을 적어 주세요.");
  if(/https?:\/\/|www\./i.test(text))return err("링크는 올릴 수 없어요.");
  if(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/.test(text+" "+nick))return err("전화번호는 올릴 수 없어요.");
  if(Date.now()-T.last<20000)return err("잠시 뒤에 다시 남겨 주세요.");
  try{await fbReady();T.store=T.store||talkStore();await T.store.add(T.resort,{nick,text});T.last=Date.now();try{localStorage.setItem("tkNick",nick)}catch(x){}$("#tkText").value="";toast("글을 남겼어요.");await talkSync(true)}
  catch(x){err("남기지 못했어요. 잠시 뒤 다시 시도해 주세요.")}});
$("#tkList").addEventListener("click",async e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.dataset.id;
  if(!b.dataset.sure){b.dataset.sure="1";b.textContent=b.dataset.a==="del"?"한 번 더 누르면 삭제":"한 번 더 누르면 신고";return}
  if(b.dataset.a==="del"){try{await T.store.del(T.resort,id);toast("글을 삭제했어요.")}catch(x){toast("삭제하지 못했어요.")}}
  else{try{await T.store.report(T.resort,id)}catch(x){}try{localStorage.setItem("jRep",JSON.stringify([...jMine(),id]))}catch(x){}toast("신고했어요. 이 글은 내 화면에서 가려집니다.")}
  await talkSync(true)});
if(LIVE)$("#navTalk").hidden=false;
$("#jResort").addEventListener("change",joinRender);
$("#jNew").addEventListener("click",()=>joinForm(true));
$("#jfCancel").addEventListener("click",()=>joinForm(false));
$("#jf").addEventListener("click",e=>{if(e.target.id==="jf")joinForm(false)});
$("#jForm").addEventListener("submit",async e=>{e.preventDefault();const g=id=>$("#"+id).value.trim(),err=m=>{$("#jfErr").textContent=m};
  const p={resort:g("jfResort"),date:g("jfDate"),have:+g("jfHave"),want:+g("jfWant"),from:g("jfFrom"),memo:g("jfMemo"),link:g("jfLink"),nick:g("jfNick")};
  if(!SLUG[p.resort])return err("스키장을 골라 주세요.");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||p.date<today())return err("가는 날을 오늘 이후로 골라 주세요.");
  if(!(p.have>=1&&p.have<=20&&p.want>=2&&p.want<=20&&p.want>=p.have))return err("인원을 확인해 주세요. 총 인원은 지금 인원보다 같거나 많아야 해요.");
  if(!/^https:\/\/open\.kakao\.com\/[A-Za-z0-9/_-]+$/.test(p.link))return err("카카오톡 오픈채팅 링크(https://open.kakao.com/...)를 넣어 주세요.");
  if(!p.nick)return err("닉네임을 넣어 주세요.");
  if(/01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/.test(p.from+" "+p.memo+" "+p.nick))return err("전화번호는 올릴 수 없어요. 연락은 오픈채팅으로 해 주세요.");
  if(!$("#jfOk").checked)return err("만 19세 이상 확인에 체크해 주세요.");
  try{await J.store.add(p);joinForm(false);$("#jForm").reset();toast("모집글을 올렸어요.");await joinLoad()}catch(x){err("올리지 못했어요. 잠시 뒤 다시 시도해 주세요.")}});
$("#jList").addEventListener("click",async e=>{const b=e.target.closest("[data-a]");if(!b)return;const p=J.posts.find(x=>x.id===b.dataset.id);if(!p)return;
  if(b.dataset.a==="price"){st={...init(),resort:p.resort,people:p.want,day:[0,6].includes(new Date(p.date+"T00:00:00").getDay())?"we":"wd"};go("home");render();return}
  if(b.dataset.a==="del"){if(b.dataset.sure){try{await J.store.del(p.id);toast("글을 삭제했어요.");await joinLoad()}catch(x){toast("삭제하지 못했어요.")}}else{b.dataset.sure="1";b.textContent="한 번 더 누르면 삭제"}return}
  if(b.dataset.a==="rep"){if(b.dataset.sure){try{await J.store.report(p.id)}catch(x){}try{localStorage.setItem("jRep",JSON.stringify([...jMine(),p.id]))}catch(x){}toast("신고했어요. 이 글은 내 화면에서 가려집니다.");await joinLoad()}else{b.dataset.sure="1";b.textContent="한 번 더 누르면 신고"}}});
$("#ntBtn").addEventListener("click",openNotice);
$("#ntClose").addEventListener("click",()=>closeNotice(false));
$("#ntDay").addEventListener("click",()=>closeNotice(true));
$("#nt").addEventListener("click",e=>{if(e.target.id==="nt")closeNotice(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNotice(false)});
/* ── 홈: 개장 임박 · 이야기 · 동행 · 특가. FOCUS는 먼저 채우는 스키장, SY는 시즌 시작 연도 ── */
const FOCUS="곤지암",SY=2026;
const M={posts:null,joins:null,at:0};
function dday(n){const m=/(\d+)월 (\d+)일/.exec((OPEN[n]||{}).d||"");if(!m)return null;
  const t=new Date(+m[1]>=7?SY:SY+1,+m[1]-1,+m[2]),now=new Date();now.setHours(0,0,0,0);const k=Math.round((t-now)/864e5);return k<0?null:k}
function renderMain(){
  $("#mHero").innerHTML=`<h1>스키·보드 타는<br>사람들의 <em>스노우딜</em></h1><p class="hsub">스키장 소식, 다녀온 이야기, 같이 갈 사람, 특가까지 한곳에 모았어요.</p><div class="hact">${LIVE?`<button class="on" data-t="${FOCUS}">이야기 남기기</button><button data-go="join">동행 구하기</button>`:""}<button data-go="home">특가 보기</button></div>`;
  const op=Object.keys(OPEN).filter(n=>OPEN[n].d).map((n,i)=>({n,i,k:dday(n)})).sort((a,b)=>(a.k===null)-(b.k===null)||(a.k-b.k)||(a.i-b.i));
  const opens=`<div class="mfull"><div class="mh"><h2>개장 임박</h2><button data-a="nt">전체 일정 ›</button></div><div class="opens" style="--oc:${op.length<=9?op.length:Math.ceil(op.length/2)}">${op.map(x=>{const o=OPEN[x.n];return `<button data-r="${x.n}"><span>${x.n}</span><b${x.k===null&&o.d.length>6?' class="s"':""}>${x.k===null?o.d.replace("~","~<wbr>"):x.k?"D-"+x.k:"오늘"}</b><small>${x.k===null?o.src:o.d}</small></button>`}).join("")}</div></div>`;
  const talk=LIVE?`<div class="msec"><div class="mh"><h2>지금 올라온 이야기</h2><button data-t="${FOCUS}">톡 가기 ›</button></div><div id="mTalk"><div class="empty">이야기를 불러오는 중이에요.</div></div><div class="gask"><b>${FOCUS} 다녀오셨어요?</b><p>설질, 리프트 대기, 주차, 셔틀. 한 줄이면 충분해요. 다음에 가는 사람에게 큰 도움이 됩니다.</p><button data-t="${FOCUS}">${FOCUS} 톡에 한 줄 남기기</button></div></div>`:"";
  const join=LIVE?`<div class="msec"><div class="mh"><h2>같이 갈 사람</h2><button data-go="join">전체 보기 ›</button></div><div id="mJoin" class="msec"></div></div>`:"";
  const eb=DATA.filter(d=>d.eb),ebR=[...new Set(eb.map(d=>d.resort))],ebMin=eb.length?Math.min(...eb.map(d=>Math.min(d.wd,d.we))):0,
    ebPct=Math.max(0,...eb.map(d=>Math.max(d.nwd?1-d.wd/d.nwd:0,d.nwe?1-d.we/d.nwe:0))),priced=RESORTS.filter(([n])=>DATA.some(d=>d.resort===n)).length;
  const deals=`<div class="msec"><div class="mh"><h2>특가</h2><button data-go="home">전체 보기 ›</button></div>${eb.length?`<button class="rrow top" data-a="eb"><div><div class="nm">얼리버드 특가</div><div class="sb">${ebR.join("·")}${ebPct?` · 정상가 대비 최대 ${Math.round(ebPct*100)}%`:""}</div></div><div class="pr"><b>${won(ebMin)}~</b><span>1인 · 보러 가기 ›</span></div></button>`:""}<button class="rrow" data-go="home"><div><div class="nm">렌탈샵·리프트권 최저가 비교</div><div class="sb">전국 ${RESORTS.length}곳 중 ${priced}곳 가격 있음 · ${CHECKED}</div></div><div class="pr"><span>비교하기 ›</span></div></button></div>`;
  const chips=`<div><h2>스키장 바로가기</h2><div class="mchips">${[FOCUS,...RESORTS.map(r=>r[0]).filter(n=>n!==FOCUS)].map(n=>`<button class="chip" data-r="${n}">${n}</button>`).join("")}</div><div class="mlinks"><button data-go="official">리조트 공식 요금·셔틀</button><button data-go="report">가격 제보·렌탈샵 등록</button></div></div>`;
  $("#mBody").innerHTML=opens+talk+join+deals+chips;
  mainLoad();
}
function mainFeed(){const hid=jMine(),ok=p=>(p.reports||0)<3&&!hid.includes(p.id),t=$("#mTalk"),j=$("#mJoin");
  if(t){const a=(M.posts||[]).filter(ok).slice(0,6);
    t.innerHTML=a.length?a.map(p=>`<button class="tk mt" data-t="${esc(p.resort)}"><div class="h"><span class="tag">${esc(p.resort)}</span><b>${esc(p.nick)}</b><span>${ago(p.ts)}</span></div><p>${esc(p.text)}</p></button>`).join(""):`<div class="empty">아직 올라온 이야기가 없어요.<br>첫 글을 남겨 보세요.</div>`}
  if(j){const a=(M.joins||[]).filter(ok).sort((x,y)=>x.date<y.date?-1:1).slice(0,2);
    j.innerHTML=a.length?a.map(p=>{const dt=new Date(p.date+"T00:00:00"),need=Math.max(0,p.want-p.have);
      return `<button class="rrow" data-go="join"><div><div class="nm">${esc(p.resort)} · ${dt.getMonth()+1}월 ${dt.getDate()}일 (${"일월화수목금토"[dt.getDay()]})</div><div class="sb">${esc(p.nick)}${p.from?" · "+esc(p.from)+" 출발":""}</div></div><div class="pr"><b>${need?need+"명 구해요":"모집 완료"}</b></div></button>`}).join("")
      :`<button class="rrow na" data-go="join"><div><div class="nm">아직 모집글이 없어요</div><div class="sb">스키장과 날짜를 올리고 같이 갈 사람을 찾아보세요</div></div><div class="pr"><b>글쓰기 ›</b></div></button>`}}
async function mainLoad(){if(!LIVE)return;if(M.posts&&Date.now()-M.at<60000){mainFeed();return}
  try{await fbReady();T.store=T.store||talkStore();J.store=J.store||(DEMO?demoStore():await fbStore());
    const [ps,js]=await Promise.all([Promise.all(RESORTS.map(([r])=>T.store.list(r,3).then(a=>a.map(p=>({...p,resort:r})),()=>[]))),
      J.store.list().then(a=>{J.posts=a;J.ready=true;return a},()=>[])]);
    M.posts=ps.flat().sort((x,y)=>y.ts-x.ts);M.joins=js;M.at=Date.now();mainFeed()}
  catch(e){const t=$("#mTalk"),j=$("#mJoin");if(t)t.innerHTML='<div class="empty">이야기를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>';if(j)j.innerHTML=""}}
$("#v-main").addEventListener("click",e=>{const b=e.target.closest("[data-r],[data-t],[data-a]");if(!b)return;
  if(b.dataset.r){try{history.pushState(null,"","#g-"+SLUG[b.dataset.r])}catch(x){}st.resort=b.dataset.r;go("guide");render();return}
  if(b.dataset.t){st.resort=b.dataset.t;render();go("talk");return}
  if(b.dataset.a==="nt")openNotice();else if(b.dataset.a==="eb"){st={...init(),eb:true};go("home");render()}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b)go(b.dataset.go)});
$("#chkDate").textContent=CHECKED.replace(" 확인","");
(function(){const k=RESORTS.map(r=>r[0]).filter(n=>SHUTTLE[n]&&SHUTTLE[n].rt),o=Object.keys(OPEN).filter(n=>OPEN[n].d);
  $("#shKnown").textContent=`확인된 ${k.length}곳(${k.join("·")})`;
  $("#offNote").textContent=`개장일(${OPEN_CHECKED} 확인): ${o.map(n=>n+" "+OPEN[n].d).join(", ")}. 나머지는 미발표이고, 기온과 제설 상황에 따라 바뀔 수 있습니다.`})();
route();render();renderOfficial();renderNotice();if(view==="main")renderMain();
