const MACHINES=[{id:"W1",name:"Washer 1",type:"Washer"},{id:"W2",name:"Washer 2",type:"Washer"},{id:"W3",name:"Washer 3",type:"Washer"},{id:"D1",name:"Dryer 1",type:"Dryer"}];
const SLOTS=["06:00-08:00","08:00-10:00","10:00-12:00","12:00-14:00","14:00-16:00","16:00-18:00","18:00-20:00","20:00-22:00"];
const MAX_PER_DAY=2,MAX_TRIES=5,LOCK_MS=120000,MAX_ITEMS=40,MAX_EACH=20;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const get=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const today=()=>new Date().toISOString().slice(0,10);
const cls=s=>s.replace(" ","");

/* ---------- data (demo: stored in the browser) ---------- */
let users=get("ll_users",null);
if(!users){users=[
 {reg:"12614875",name:"Ritesh Lekhi",room:"B-214",pw:"lpu12345",role:"student"},
 {reg:"12614487",name:"Vikas Salaria",room:"B-216",pw:"lpu12345",role:"student"},
 {reg:"12627880",name:"Dev Chaudhary",room:"B-220",pw:"lpu12345",role:"student"},
 {reg:"WARDEN01",name:"Hostel Warden",room:"-",pw:"warden123",role:"warden"}];put("ll_users",users)}
let bookings=get("ll_bookings",null);
if(!bookings){const d=today();bookings=[
 {id:"s1",date:d,machine:"W1",slot:"18:00-20:00",reg:"12614487",name:"Vikas Salaria",room:"B-216",load:"Shirts x4, Pants x3, Socks x4",items:{shirt:4,pant:3,socks:4},svc:"Wash only",status:"Booked"},
 {id:"s2",date:d,machine:"W2",slot:"18:00-20:00",reg:"12627880",name:"Dev Chaudhary",room:"B-220",load:"Bedsheets x2, Pillow covers x2, Blankets x1",items:{bedsheet:2,pillow:2,blanket:1},svc:"Wash only",status:"Booked"},
 {id:"s3",date:d,machine:"D1",slot:"20:00-22:00",reg:"12627880",name:"Dev Chaudhary",room:"B-220",load:"Shirts x6, Pants x2, Towels x2",items:{shirt:6,pant:2,towel:2},svc:"Dry only",status:"Booked"}];put("ll_bookings",bookings)}
users.forEach(u=>{if(!u.pin)u.pin="1234"});
let roster=get("ll_roster",null);
if(!roster){roster=[{reg:"12614875",name:"Ritesh Lekhi",room:"B-214"},{reg:"12614487",name:"Vikas Salaria",room:"B-216"},{reg:"12627880",name:"Dev Chaudhary",room:"B-220"},{reg:"12611001",name:"Aarav Sharma",room:"B-101"},{reg:"12611002",name:"Simran Kaur",room:"B-102"}];put("ll_roster",roster)}
let me=users.find(u=>u.reg===get("ll_session",null));
let pending=null;
const save=()=>put("ll_bookings",bookings);
const active=(d,m,s)=>bookings.find(b=>b.date===d&&b.machine===m&&b.slot===s&&b.status!=="Cancelled");
const machine=id=>MACHINES.find(m=>m.id===id);

/* ---------- helpers ---------- */
function toast(msg,err){const t=$("toast");t.textContent=msg;t.className="show"+(err?" error":"");clearTimeout(toast.t);toast.t=setTimeout(()=>t.className="",2800)}
const bad=(i,m)=>{i.classList.add("bad");i.closest("label").querySelector(".err").textContent=m;return false};
const clr=f=>f.querySelectorAll("input,select").forEach(i=>{i.classList.remove("bad");const e=i.closest("label")?.querySelector(".err");if(e)e.textContent=""});
function num(el,v){const s=+el.textContent||0,t0=performance.now();(function step(n){const p=Math.min((n-t0)/400,1);el.textContent=Math.round(s+(v-s)*p);if(p<1)requestAnimationFrame(step)})(t0)}

/* ---------- login / sign up ---------- */
function showView(){
  $("auth").hidden=!!me;$("app").hidden=!me;
  if(!me){liveCount();return}
  $("hello").textContent="Hi, "+me.name.split(" ")[0]+".";$("uname").textContent=me.name;$("av").textContent=me.name[0];dateText();
  $("role").textContent=me.role==="warden"?"Warden":"Reg. "+me.reg;
  $("listTitle").textContent=me.role==="warden"?"All bookings":"My bookings";
  $("gridHint").textContent=me.role==="warden"?"Wardens manage bookings from the list below. Students book from this grid.":"Tap a free slot to book it. You can hold up to "+MAX_PER_DAY+" slots per day.";
  $("reset").hidden=me.role!=="warden";$("rosterCard").hidden=me.role!=="warden";$("clearMine").hidden=me.role==="warden";
  render();go(TITLES[location.hash.slice(1)]?location.hash.slice(1):"dash");
}
function dateText(){const d=new Date($("date").value+"T00:00");$("dateLong").textContent=d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
function liveCount(){const d=today(),n=bookings.filter(b=>b.date===d&&b.status!=="Cancelled").length;$("liveFree").textContent=MACHINES.length*SLOTS.length-n}
function loginAs(u){me=u;put("ll_session",u.reg);showView();toast("Welcome back, "+u.name.split(" ")[0]+".")}
function tab(v){$("loginForm").hidden=v!=="login";$("signForm").hidden=v!=="sign";$("resetForm").hidden=v!=="reset";$("tabs").hidden=v==="reset";$("tLogin").classList.toggle("on",v==="login");$("tSign").classList.toggle("on",v==="sign")}
$("tLogin").onclick=()=>tab("login");$("tSign").onclick=()=>tab("sign");$("forgot").onclick=()=>{$("rr").value=$("lid").value.trim();tab("reset")};$("backLogin").onclick=()=>tab("login");
document.querySelectorAll(".eye").forEach(b=>b.onclick=()=>{const i=$(b.dataset.t);i.type=i.type==="password"?"text":"password";b.textContent=i.type==="password"?"Show":"Hide"});
document.querySelectorAll(".demo button").forEach(b=>b.onclick=()=>{$("lid").value=b.dataset.u;$("lpw").value=b.dataset.p;toast("Demo details filled in. Press Log in.")});
const shake=()=>{const p=$("panel");p.classList.remove("shake");void p.offsetWidth;p.classList.add("shake")};

const norm=x=>x.trim().toLowerCase().replace(/\s+/g," ");
const roomOk=r=>/^[A-Za-z]{0,2}-?\d{1,4}[A-Za-z]?$/.test(r);
const sameRoom=(a,b)=>a.replace("-","").toUpperCase()===b.replace("-","").toUpperCase();
const locks=get("ll_locks",{});
$("loginForm").onsubmit=e=>{
  e.preventDefault();clr(e.target);let ok=true;
  const id=$("lid").value.trim().toUpperCase(),pw=$("lpw").value;
  if(!/^(\d{8}|WARDEN\d{2})$/.test(id))ok=bad($("lid"),"Enter your 8-digit registration number (for example 12614875) or staff ID.");
  if(pw.length<6)ok=bad($("lpw"),"Password must be at least 6 characters.");
  if(!ok)return shake();
  const L=locks[id]||{n:0,until:0};
  if(L.until>Date.now()){bad($("lpw"),"Login is blocked for "+Math.ceil((L.until-Date.now())/1000)+" more seconds. Wait, or use Forgot password to reset and unblock.");return shake()}
  const u=users.find(x=>x.reg===id&&x.pw===pw);
  if(!u){
    L.n=(L.n||0)+1;
    if(L.n>=MAX_TRIES){L.until=Date.now()+LOCK_MS;L.n=0;bad($("lpw"),"Too many wrong attempts. Login is blocked for 2 minutes. Use Forgot password to unblock it sooner.")}
    else bad($("lpw"),"Registration number or password is incorrect. "+(MAX_TRIES-L.n)+" attempts left.");
    locks[id]=L;put("ll_locks",locks);return shake();
  }
  delete locks[id];put("ll_locks",locks);loginAs(u);
};
$("signForm").onsubmit=e=>{
  e.preventDefault();clr(e.target);let ok=true;
  const n=$("sn").value.trim(),r=$("sr").value.trim(),rm=$("sm").value.trim(),pin=$("spin").value,p=$("sp").value;
  if(!/^[A-Za-z][A-Za-z .'-]{2,39}$/.test(n))ok=bad($("sn"),"Enter your full name (letters only).");
  if(!/^\d{8}$/.test(r))ok=bad($("sr"),"Registration number must be exactly 8 digits.");
  if(!roomOk(rm))ok=bad($("sm"),"Enter a room like B-214 or 305.");
  if(!/^\d{4}$/.test(pin))ok=bad($("spin"),"Recovery PIN must be exactly 4 digits.");
  if(p.length<6)ok=bad($("sp"),"Use at least 6 characters.");
  if($("sc").value!==p)ok=bad($("sc"),"Passwords do not match.");
  if(!ok)return shake();
  if(users.some(u=>u.reg===r)){bad($("sr"),"An account already exists for this number. Use Forgot password if you cannot log in.");return shake()}
  const h=roster.find(x=>x.reg===r);
  if(!h||norm(h.name)!==norm(n)||!sameRoom(h.room,rm)){bad($("sr"),"These details do not match the hostel roster. Ask your warden to add or correct them.");return shake()}
  const u={reg:r,name:h.name,room:h.room,pw:p,pin,role:"student"};
  users.push(u);put("ll_users",users);e.target.reset();loginAs(u);
};
$("resetForm").onsubmit=e=>{
  e.preventDefault();clr(e.target);let ok=true;
  const r=$("rr").value.trim().toUpperCase(),rm=$("rm2").value.trim(),pin=$("rpin").value,p=$("rp").value,staff=r.startsWith("WARDEN");
  if(!/^(\d{8}|WARDEN\d{2})$/.test(r))ok=bad($("rr"),"Enter your 8-digit registration number.");
  if(!staff&&!roomOk(rm))ok=bad($("rm2"),"Enter your room like B-214.");
  if(!/^\d{4}$/.test(pin))ok=bad($("rpin"),"Enter your 4-digit recovery PIN.");
  if(p.length<6)ok=bad($("rp"),"Use at least 6 characters.");
  if($("rc").value!==p)ok=bad($("rc"),"Passwords do not match.");
  if(!ok)return shake();
  const u=users.find(x=>x.reg===r);
  if(!u||u.pin!==pin||(!staff&&!sameRoom(u.room,rm))){bad($("rpin"),"These details do not match the account. Check your room and recovery PIN.");return shake()}
  u.pw=p;put("ll_users",users);delete locks[r];put("ll_locks",locks);
  e.target.reset();tab("login");$("lid").value=r;$("lpw").value="";toast("Password changed. Log in with your new password.");
};
function renderRoster(){
  if(!me||me.role!=="warden")return;
  $("rosterList").innerHTML=roster.map(x=>{const y=users.some(u=>u.reg===x.reg);return `<span class="pill${y?" yes":""}"><b>${esc(x.name)}</b> ${x.reg} | ${esc(x.room)} <em>${y?"Registered":"Not registered yet"}</em></span>`}).join("");
}
$("rosterForm").onsubmit=e=>{
  e.preventDefault();clr(e.target);let ok=true;
  const r=$("wr").value.trim(),n=$("wn").value.trim(),m=$("wm").value.trim();
  if(!/^\d{8}$/.test(r))ok=bad($("wr"),"Registration number must be 8 digits.");
  else if(roster.some(x=>x.reg===r))ok=bad($("wr"),"This student is already on the roster.");
  if(!/^[A-Za-z][A-Za-z .'-]{2,39}$/.test(n))ok=bad($("wn"),"Enter the full name.");
  if(!roomOk(m))ok=bad($("wm"),"Enter a room like B-214.");
  if(!ok)return;
  roster.push({reg:r,name:n,room:m.toUpperCase()});put("ll_roster",roster);e.target.reset();renderRoster();toast("Student added. They can now create an account.");
};
$("logout").onclick=()=>{me=null;try{localStorage.removeItem("ll_session")}catch(e){}tab("login");showView();toast("You have been logged out.")};
$("reset").onclick=async()=>{if(await ask("Delete all accounts and bookings and restore the demo data?","Reset everything")){["ll_users","ll_bookings","ll_session","ll_roster","ll_locks"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});location.reload()}};
$("theme").onclick=()=>{const t=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=t;put("ll_theme",t)};
document.documentElement.dataset.theme=get("ll_theme",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");

/* ---------- rendering ---------- */
function renderGrid(){
  const d=$("date").value,nowH=new Date().getHours();
  let h="<thead><tr><th>Time</th>"+MACHINES.map(m=>`<th>${m.name}<small>${m.type}</small></th>`).join("")+"</tr></thead><tbody>";
  SLOTS.forEach(s=>{
    h+=`<tr><th>${s}</th>`;
    MACHINES.forEach(m=>{
      const b=active(d,m.id,s),past=d===today()&&+s.slice(6,8)<=nowH;
      if(b){const mine=b.reg===me.reg;h+=`<td><button class="slot ${cls(b.status)}${mine?" mine":""}" disabled title="${esc(b.name)}">${mine?"Yours":b.status}</button></td>`}
      else if(past||me.role==="warden")h+=`<td><button class="slot off" disabled>${past?"Passed":"Free"}</button></td>`;
      else h+=`<td><button class="slot" data-m="${m.id}" data-s="${s}">Book</button></td>`;
    });
    h+="</tr>";
  });
  $("grid").innerHTML=h+"</tbody>";
}
function renderStats(){
  const d=$("date").value,day=bookings.filter(b=>b.date===d&&b.status!=="Cancelled"),total=MACHINES.length*SLOTS.length,pct=Math.round(day.length/total*100);
  num($("sTotal"),total);num($("sBooked"),day.length);num($("sFree"),total-day.length);num($("sDone"),day.filter(b=>b.status==="Completed").length);
  $("sPct").textContent=pct+"%";$("ring").style.setProperty("--p",pct);
}
function renderList(){
  const q=$("q").value.trim().toLowerCase(),st=F.st,ty=F.ty,d=$("date").value,only=F.day;
  const list=bookings.filter(b=>(me.role==="warden"||b.reg===me.reg)&&(!only||b.date===d)&&(!st||b.status===st)&&(!ty||machine(b.machine).type===ty)&&(!F.cat||(F.cat==="Bedding"?/^Bed/.test(categoryOf(b)):categoryOf(b)===F.cat))&&(!q||[b.name,b.room,b.reg].some(v=>v.toLowerCase().includes(q))))
    .sort((a,b)=>(a.date+a.slot).localeCompare(b.date+b.slot));
  $("empty").hidden=list.length>0;
  $("rows").innerHTML=list.map(b=>{
    const own=b.reg===me.reg,can=own||me.role==="warden";let a="";
    if(can&&b.status==="Booked")a=`<button data-a="start" data-id="${b.id}">Start</button>${own?`<button class="ghost" data-a="edit" data-id="${b.id}">Edit</button>`:""}<button class="del" data-a="cancel" data-id="${b.id}">Cancel</button>`;
    else if(can&&b.status==="In progress")a=`<button data-a="done" data-id="${b.id}">Mark done</button>`;
    else if(can)a=`<button class="del" data-a="del" data-id="${b.id}">Delete</button>`;
    return `<tr><td data-l="Date">${b.date}</td><td data-l="Slot">${b.slot}</td><td data-l="Machine">${machine(b.machine).name}</td><td data-l="Student">${esc(b.name)}<small>${esc(b.reg)}</small></td><td data-l="Room">${esc(b.room)}</td><td data-l="Items">${itemCell(b)}</td><td data-l="Status"><span class="tag ${cls(b.status)}">${b.status}</span></td><td data-l="" class="acts">${a}${can&&(b.status==="Booked"||b.status==="In progress")?`<button class="del" data-a="del" data-id="${b.id}">Delete</button>`:""}<button class="ghost" data-a="slip" data-id="${b.id}">Slip</button></td></tr>`;
  }).join("");
}
function render(){renderRoster();dateText();renderGrid();renderStats();renderList();renderDash()}
const ITEMS=[["shirt","Shirts","c"],["tshirt","T-shirts","c"],["pant","Pants / jeans","c"],["shorts","Shorts","c"],["innerwear","Innerwear","c"],["socks","Socks (pairs)","c"],["towel","Towels","c"],["bedsheet","Bedsheets","b"],["blanket","Blankets / quilts","b"],["pillows","Pillows","b"],["pillow","Pillow covers","b"]];
const PRESETS={daily:{n:"Daily wash",i:{tshirt:1,shorts:1,innerwear:1,socks:1}},weekly:{n:"Weekly wash",i:{shirt:5,pant:3,innerwear:5,socks:5,towel:1}},bedding:{n:"Bedding",i:{bedsheet:2,blanket:1,pillows:2,pillow:2}},all:{n:"Everything",i:{shirt:5,pant:3,innerwear:5,socks:5,towel:1,bedsheet:2,blanket:1,pillows:2,pillow:2}}};
let view="all",svcSel="Wash only",pack="",okLast=null;
const sameItems=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].every(x=>(a[x]||0)===(b[x]||0));
function categoryOf(b){const it=b.items||{};if(!cartTotal(it))return b.load||"Laundry";const P=PRESETS[b.pack];if(P&&sameItems(it,P.i))return P.n;
  const u=ITEMS.filter(([k])=>it[k]>0),cl=u.some(x=>x[2]==="c"),bd=u.some(x=>x[2]==="b");
  if(bd&&!cl)return u.every(x=>x[0]==="bedsheet")?"Bedsheets":"Bedding";return cl&&!bd?"Clothes":"Mixed load"}
function drawSvc(type,sel){const o=type==="Washer"?["Wash only","Wash + Dry"]:["Dry only"];svcSel=o.includes(sel)?sel:o[0];
  $("svc").innerHTML=o.map(x=>`<button type="button" class="${x===svcSel?"on":""}">${x}</button>`).join("");
  $("svcHint").textContent=type==="Washer"?"Need it dried too? Choose Wash + Dry, then pick a dryer slot after this one.":"Dryer slot: for clothes that are already washed. To wash as well, book a washer slot with Wash + Dry."}
$("svc").onclick=e=>{const b=e.target.closest("button");if(!b)return;svcSel=b.textContent;$("svc").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b))};
$("cartTabs").onclick=e=>{const b=e.target.closest("button");if(b){view=b.dataset.t;drawCart()}};
let cart={};
const cartTotal=(c=cart)=>Object.values(c).reduce((a,b)=>a+b,0);
const loadText=c=>ITEMS.filter(([k])=>c[k]>0).map(([k,l])=>l.replace(/ \/ jeans| \(pairs\)/,"")+" x"+c[k]).join(", ");
const itemCell=b=>b.items&&cartTotal(b.items)?`<b>${cartTotal(b.items)} items</b> <span class="cat">${esc(categoryOf(b))}</span><small>${esc(loadText(b.items))}${b.note?"; "+esc(b.note):""}${b.svc?" | "+b.svc:""}</small>`:esc(b.load||"-");
function drawCart(){const g={c:"Clothes",b:"Bedding"};let h="";
  ["c","b"].forEach(x=>{if(view!=="all"&&view!==x)return;h+=`<p class="gh">${g[x]}</p>`+ITEMS.filter(i=>i[2]===x).map(([k,l])=>`<div class="it"><span>${l}</span><div class="step"><button type="button" data-k="${k}" data-d="-1" aria-label="Fewer ${l}">-</button><output>${cart[k]||0}</output><button type="button" data-k="${k}" data-d="1" aria-label="More ${l}">+</button></div></div>`).join("")});
  $("items").innerHTML=h;$("itemTotal").textContent=cartTotal();$("itemErr").textContent="";
  document.querySelectorAll("#cartTabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===view))}
function setCart(c,note,p){cart={...c};pack=p||"";$("itemNote").value=note||"";drawCart()}
$("items").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset.k,d=+b.dataset.d,n=(cart[k]||0)+d;if(n<0||n>MAX_EACH)return;if(d>0&&cartTotal()>=MAX_ITEMS){$("itemErr").textContent="Maximum "+MAX_ITEMS+" items per slot.";return}cart[k]=n;drawCart()};
document.querySelectorAll(".presets button").forEach(b=>b.onclick=()=>{const p=b.dataset.p;setCart(p==="clear"?{}:PRESETS[p].i,$("itemNote").value,p==="clear"?"":p);view="all";drawCart()});
function showSlip(b){const it=b.items||{},rows=ITEMS.filter(([k])=>it[k]>0).map(([k,l])=>`<tr><td>${l}</td><td>${it[k]}</td></tr>`).join("");$("slipInfo").textContent=machine(b.machine).name+" | "+b.date+" | "+b.slot+" | "+b.name+", room "+b.room+" | "+categoryOf(b)+(b.svc?" | "+b.svc:"");$("slipTable").innerHTML=rows||`<tr><td>${esc(b.load||"No items listed")}</td><td></td></tr>`;$("slipTotal").textContent=cartTotal(it);$("slipNote").textContent=b.note?"Other: "+b.note:"";$("slipMsg").textContent="";
  slipText="SPINSLOT LAUNDRY SLIP\n"+$("slipInfo").textContent+"\n"+ITEMS.filter(([k])=>it[k]>0).map(([k,l])=>l+": "+it[k]).join("\n")+"\nTotal: "+cartTotal(it)+" items"+(b.note?"\nOther: "+b.note:"");
  $("slipDlg").showModal()}
let slipText="";
$("slipClose").onclick=()=>$("slipDlg").close();
$("slipPrint").onclick=()=>{try{window.print()}catch(e){}$("slipMsg").textContent="If no print window opened, printing is blocked in this preview. Use Copy slip, or open the deployed site (GitHub Pages, Netlify or Live Server) and print from there."};
$("slipCopy").onclick=async()=>{let ok=false;try{await navigator.clipboard.writeText(slipText);ok=true}catch(e){const t=document.createElement("textarea");t.value=slipText;document.body.appendChild(t);t.select();try{ok=document.execCommand("copy")}catch(_){}t.remove()}
  $("slipMsg").textContent=ok?"Slip copied. Paste it anywhere.":"Could not copy here. Take a screenshot of the slip instead."};
function ask(text,yes){return new Promise(res=>{const d=$("cfDlg");$("cfText").textContent=text;$("cfYes").textContent=yes||"Yes";
  const done=v=>{d.close();res(v)};$("cfYes").onclick=()=>done(true);$("cfNo").onclick=()=>done(false);d.oncancel=()=>res(false);d.showModal()})}
$("clearMine").onclick=async()=>{const n=bookings.filter(b=>b.reg===me.reg).length;if(!n)return toast("You have no bookings to clear.",true);
  if(!await ask("Delete all "+n+" of your bookings? This cannot be undone.","Delete all"))return;bookings=bookings.filter(b=>b.reg!==me.reg);save();render();toast("Your bookings were deleted.")};
const F={st:"",ty:"",cat:"",day:false};let lastB=null;
const TITLES={dash:"Dashboard",book:"Book a slot",list:"Bookings",about:"Problem and solution"};
function go(v){document.querySelectorAll(".view").forEach(s=>s.hidden=s.id!=="v-"+v);document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.go===v));$("pageTitle").textContent=TITLES[v];scrollTo(0,0);try{history.replaceState(null,"","#"+v)}catch(e){}}
document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g)go(g.dataset.go)});
function showOk(b){$("okInfo").textContent=machine(b.machine).name+" | "+b.date+" | "+b.slot;okLast=b;$("okDry").hidden=b.svc!=="Wash + Dry";$("okDlg").showModal()}
$("okDry").onclick=()=>{$("okDlg").close();go("book");toast("Pick a dryer slot from "+okLast.slot.split("-")[1]+" onwards.")};
$("okClose").onclick=()=>$("okDlg").close();$("okList").onclick=()=>{$("okDlg").close();go("list")};
$("smart").onclick=()=>{const d=$("date").value,h=new Date().getHours();for(const s of SLOTS){if(d===today()&&+s.slice(6,8)<=h)continue;const m=MACHINES.find(m=>!active(d,m.id,s));if(m)return openForm({machine:m.id,slot:s})}toast("No free slots left on this date. Try another day.",true)};
function renderDash(){
  const d=$("date").value,day=bookings.filter(b=>b.date===d),act=day.filter(b=>b.status!=="Cancelled");
  const cn=SLOTS.map(s=>act.filter(b=>b.slot===s).length),mx=Math.max(...cn);
  $("peak").innerHTML=SLOTS.map((s,i)=>`<div class="bar${mx&&cn[i]===mx?" top":""}" title="${s}"><div class="track"><i style="height:${cn[i]/MACHINES.length*100}%"></i></div><b>${cn[i]}</b><span>${s.slice(0,2)}:00</span></div>`).join("");
  $("mach").innerHTML=MACHINES.map(m=>{const n=act.filter(b=>b.machine===m.id).length;return `<div class="mrow"><div><b>${m.name}</b><span>${n}/${SLOTS.length} slots</span></div><div class="meter"><i style="width:${n/SLOTS.length*100}%"></i></div></div>`}).join("");
  const S=["Booked","In progress","Completed","Cancelled"],c=S.map(x=>day.filter(b=>b.status===x).length);
  $("stk").innerHTML=c.some(Boolean)?S.map((x,i)=>c[i]?`<i class="${cls(x)}" style="flex:${c[i]}"></i>`:"").join(""):"<em>No bookings on this date yet</em>";
  $("stkl").innerHTML=S.map((x,i)=>`<span><i class="dot ${cls(x)}"></i>${x} <b>${c[i]}</b></span>`).join("")+`<span>Items to wash <b>${act.reduce((n,b)=>n+cartTotal(b.items||{}),0)}</b></span>`;
  const nx=bookings.filter(b=>(me.role==="warden"||b.reg===me.reg)&&b.date>=today()&&(b.status==="Booked"||b.status==="In progress")).sort((a,b)=>(a.date+a.slot).localeCompare(b.date+b.slot))[0];
  $("next").innerHTML=nx?`<div class="nextbig"><b>${machine(nx.machine).name}</b><span>${nx.date} | ${nx.slot}</span><span class="tag ${cls(nx.status)}">${nx.status}</span><span>${esc(nx.name)}, room ${esc(nx.room)}</span></div>`:`<p class="sub">Nothing coming up.</p><button class="primary stuonly" data-go="book">Book a slot</button>`;
  document.querySelectorAll(".stuonly").forEach(e=>e.hidden=me.role==="warden");
}
const P=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON={dash:P('<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>'),book:P('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M12 13v5M9.5 15.5h5"/>'),list:P('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),info:P('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>'),moon:P('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>'),out:P('<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9"/>'),bolt:P('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),washer:P('<rect x="4" y="2" width="16" height="20" rx="3"/><circle cx="12" cy="14" r="5"/><path d="M8 6h.01M11 6h.01"/>'),check:P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),clock:P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),plus:P('<path d="M12 5v14M5 12h14"/>'),search:P('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>')};
document.querySelectorAll("[data-i]").forEach(el=>el.innerHTML=ICON[el.dataset.i]);

/* ---------- booking form ---------- */
function openForm(ctx){
  pending=ctx;const e=ctx.editId?bookings.find(b=>b.id===ctx.editId):null;
  const m=machine(e?e.machine:ctx.machine),s=e?e.slot:ctx.slot;
  $("dTitle").textContent=e?"Update booking":"Confirm booking";$("saveBtn").textContent=e?"Save changes":"Book slot";
  $("dInfo").textContent=`${m.name}, ${e?e.date:$("date").value}, ${s}`;
  $("room").value=e?e.room:(me.room!=="-"?me.room:"");view="all";setCart(e&&e.items?e.items:{},e?e.note:"",e?e.pack:"");drawSvc(m.type,e&&e.svc);
  clr($("form"));$("dlg").showModal();$("room").focus();
}
$("form").onsubmit=e=>{
  e.preventDefault();clr(e.target);const room=$("room").value.trim();
  if(!/^[A-Za-z]{0,2}-?\d{1,4}[A-Za-z]?$/.test(room))return bad($("room"),"Enter a room like B-214 or 305.");
  if(cartTotal()<1||cartTotal()>MAX_ITEMS){$("itemErr").textContent=cartTotal()<1?"Add at least one item so the laundry knows what to expect.":"Maximum "+MAX_ITEMS+" items per slot.";return}
  if(pending.editId){
    Object.assign(bookings.find(x=>x.id===pending.editId),{room:room.toUpperCase(),items:{...cart},note:$("itemNote").value.trim(),load:loadText(cart),pack,svc:svcSel});toast("Booking updated.");
  }else{
    const d=$("date").value;
    if(active(d,pending.machine,pending.slot)){$("dlg").close();render();return toast("That slot was just taken. Pick another.",true)}
    if(bookings.filter(b=>b.date===d&&b.reg===me.reg&&b.status!=="Cancelled").length>=MAX_PER_DAY)return bad($("room"),"You already hold "+MAX_PER_DAY+" slots on this day.");
    if(bookings.some(b=>b.date===d&&b.slot===pending.slot&&b.reg===me.reg&&b.status!=="Cancelled"))return bad($("room"),"You already have a booking in this time slot.");
    bookings.push({id:Date.now().toString(36),date:d,machine:pending.machine,slot:pending.slot,reg:me.reg,name:me.name,room:room.toUpperCase(),items:{...cart},note:$("itemNote").value.trim(),load:loadText(cart),pack,svc:svcSel,status:"Booked"});
    lastB=bookings[bookings.length-1];
  }
  save();$("dlg").close();render();if(lastB){showOk(lastB);lastB=null}
};
$("cancelDlg").onclick=()=>$("dlg").close();
$("grid").onclick=e=>{const b=e.target.closest("[data-m]");if(b)openForm({machine:b.dataset.m,slot:b.dataset.s})};
$("rows").onclick=async e=>{
  const b=e.target.closest("[data-a]");if(!b)return;const r=bookings.find(x=>x.id===b.dataset.id),a=b.dataset.a;
  if(a==="slip")return showSlip(r);
  if(a==="edit")return openForm({editId:r.id});
  if(a==="start"){r.status="In progress";toast("Laundry started.")}
  if(a==="done"){r.status="Completed";toast("Marked as completed.")}
  if(a==="del"){if(!await ask("Delete this record permanently?","Delete"))return;bookings=bookings.filter(x=>x!==r);toast("Record deleted.")}
  if(a==="cancel"){if(!await ask("Cancel this booking? The slot becomes free again.","Cancel booking"))return;r.status="Cancelled";toast("Booking cancelled. The slot is free again.")}
  save();render();
};
$("q").addEventListener("input",renderList);
document.querySelectorAll(".chips").forEach(c=>c.onclick=e=>{const b=e.target.closest("button");if(!b)return;c.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));F[c.dataset.f]=c.dataset.f==="day"?!!b.dataset.v:b.dataset.v;renderList()});
$("date").onchange=()=>{if(!$("date").value)$("date").value=today();render()};
$("date").min=today();$("date").value=today();
showView();
