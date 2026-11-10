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
$("#resort").addEventListener("change",e=>set("resort",e.target.value));
["day","scope","hours","sh"].forEach(id=>$("#"+id).addEventListener("click",e=>{const b=e.target.closest("button");if(b)set(id,b.dataset.v)}));
$("#minus").addEventListener("click",()=>set("people",Math.max(1,st.people-1)));
$("#plus").addEventListener("click",()=>set("people",Math.min(20,st.people+1)));
$("#sortBtn").addEventListener("click",()=>set("sort",st.sort==="total"?"hours":"total"));
$("#resetBtn").addEventListener("click",()=>{st=init();render()});
$("#ebOnly").addEventListener("click",()=>set("eb",!st.eb));
$("#newOnly").addEventListener("click",()=>set("nw",!st.nw));
$("#offShow").addEventListener("click",()=>set("off",!st.off));
$("#ebBtn").addEventListener("click",()=>{st={...init(),eb:true,hours:"any"};render();$("#pills").scrollIntoView({behavior:"smooth",block:"start"})});
$$(".nav button").forEach(b=>b.addEventListener("click",()=>{
  $$(".nav button").forEach(x=>x.setAttribute("aria-selected",x===b));
  ["home","official","report"].forEach(v=>$("#v-"+v).hidden=v!==b.dataset.v); window.scrollTo(0,0);
}));
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
window.addEventListener("hashchange",()=>{const k=enc();dec();if(enc()!==k)render()});
$("#ntBtn").addEventListener("click",openNotice);
$("#ntClose").addEventListener("click",()=>closeNotice(false));
$("#ntDay").addEventListener("click",()=>closeNotice(true));
$("#nt").addEventListener("click",e=>{if(e.target.id==="nt")closeNotice(false)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNotice(false)});
dec();render();renderOfficial();renderNotice();
(function(){let seen=false;try{seen=localStorage.getItem("ntDay")===today()||sessionStorage.getItem("ntS")==="1";sessionStorage.setItem("ntS","1")}catch(e){}
  if(seen||location.hash)return;setTimeout(openNotice,$("#splash").hidden?600:1900)})();
