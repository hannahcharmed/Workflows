import { useState, useEffect, useMemo } from "react";
const C = {
  dark:"#0f172a", mid:"#1e293b", slate:"#334155",
  purple:"#7c3aed", purpleL:"#a78bfa", purpleXL:"#ede9fe",
  green:"#16a34a", greenL:"#dcfce7",
  red:"#dc2626", redL:"#fee2e2",
  yellow:"#d97706", yellowL:"#fef3c7",
  blue:"#2563eb", blueL:"#dbeafe",
  pink:"#db2777", pinkL:"#fce7f3",
  orange:"#ea580c",
  text:"#0f172a", muted:"#64748b", border:"#e2e8f0", bg:"#f8fafc", white:"#ffffff",
};
const roleColors={leadership:C.purple,am:C.blue,chatlead:C.green,chatter:C.pink,"ops-assistant":C.orange};
const roleLabel={leadership:"Leadership",am:"Account Manager",chatlead:"Chat Lead",chatter:"Chatter","ops-assistant":"Ops Assistant"};
const CONTENT_TYPES=["PS","VID","PPV","CUS","LIVE","CLIP","BTS"];
const PRICE_TIERS=["$","$$","$$$"];
const DEFAULT_PLATFORMS=["Instagram","TikTok","Snapchat","X / Twitter","Reddit","Other"];
const DEFAULT_MODEL_PLATFORMS=["OnlyFans","Passes","Both"];
const SHIFTS=["11-7","7-3","3-11"];
const ALL_ROLES=["leadership","am","chatlead","chatter","ops-assistant"];
const TTK_SECTIONS=["identity","voice","interests","physical","personal","rules","scripts"];
const OUTREACH_GROUPS=["Subs","Whales","Online Fans","VIPs","Recent Spenders L7","Recent Spenders MTD","Followers"];
function today(){return new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function fmtMoney(n){return"$"+Number(n).toLocaleString();}
function generateTag(t,th,ti,o){return`${t||"PS"}-${(th||"Untitled").replace(/\s+/g,"")}-${ti||"$"}-${o||1}`;}
const INIT_USERS=[
  {id:1,name:"Hannah",role:"leadership",email:"hannah@charmed.com",password:"charmed123"},
  {id:2,name:"Tate",role:"am",email:"tate@charmed.com",password:"charmed123"},
  {id:3,name:"Jonathan",role:"am",email:"jonathan@charmed.com",password:"charmed123"},
  {id:4,name:"Kayla",role:"chatlead",email:"kayla@charmed.com",password:"charmed123"},
  {id:5,name:"Cell",role:"chatlead",email:"cell@charmed.com",password:"charmed123"},
  {id:6,name:"Chatter1",role:"chatter",email:"chatter1@charmed.com",password:"charmed123"},
  {id:7,name:"Chatter2",role:"chatter",email:"chatter2@charmed.com",password:"charmed123"},
  {id:8,name:"OpsUser",role:"ops-assistant",email:"ops@charmed.com",password:"charmed123"},
];
const INIT_MODELS=[
  {id:1,name:"Autumn",am:"Tate",platform:"Passes",status:"Active",flirtLevel:"PG-17",archived:false},
  {id:2,name:"Mia",am:"Tate",platform:"OnlyFans",status:"Active",flirtLevel:"R",archived:false},
  {id:3,name:"Jordan",am:"Jonathan",platform:"Passes",status:"Active",flirtLevel:"PG-13",archived:false},
  {id:4,name:"Brianna",am:"Jonathan",platform:"Both",status:"Onboarding",flirtLevel:"PG",archived:false},
];
function initTasks(){return[
  {id:1,am:"Tate",model:"Autumn",date:today(),bos:null,eos:null,content:null,notion:null,promos:null,notes:"",outreach:{}},
  {id:2,am:"Jonathan",model:"Jordan",date:today(),bos:null,eos:null,content:null,notion:null,promos:null,notes:"",outreach:{}},
  {id:3,am:"Tate",model:"Mia",date:today(),bos:null,eos:null,content:null,notion:null,promos:null,notes:"",outreach:{}},
  {id:4,am:"Jonathan",model:"Brianna",date:today(),bos:null,eos:null,content:null,notion:null,promos:null,notes:"",outreach:{}},
];}
const INIT_TTKS=[
  {id:1,model:"Autumn",flirtLevel:"PG-17",voice:"Lowercase, casual, lots of emojis 🍂",endearments:"babe, bb",hardNos:"Politics, religion, ex names",offlineTimes:"6am–10am EST",lastUpdated:"2024-01-08",updatedBy:"Tate",age:"25",location:"California",personality:"Adventurous, outdoorsy",interests:"Hiking, photography, coffee",physicalDesc:'5\'6", athletic, auburn hair',personalFacts:"Has a golden retriever named Biscuit",sections:{identity:true,voice:true,interests:true,physical:true,personal:true,rules:true,scripts:true},scripts:[{id:1,trigger:"Meetup request",response:"Omg I wish! My schedule is so crazy rn babe 🥺 but this is our little world right here 💕"}]},
  {id:2,model:"Mia",flirtLevel:"R",voice:"Uppercase, direct, minimal emojis",endearments:"baby, love",hardNos:"Real name, location, family",offlineTimes:"2am–9am EST",lastUpdated:"2024-01-05",updatedBy:"Tate",age:"23",location:"Miami",personality:"Confident, mysterious",interests:"Fashion, travel, nightlife",physicalDesc:'5\'8", slim, dark hair',personalFacts:"Former dancer",sections:{identity:true,voice:true,interests:false,physical:false,personal:true,rules:true,scripts:false},scripts:[]},
  {id:3,model:"Jordan",flirtLevel:"PG-13",voice:"Mixed case, playful, 💕👀",endearments:"love, honey",hardNos:"Meetups, phone calls, address",offlineTimes:"12am–8am EST",lastUpdated:"2024-01-10",updatedBy:"Jonathan",age:"22",location:"Nashville",personality:"Sweet, bubbly",interests:"Music, baking",physicalDesc:'5\'5", curvy, blonde',personalFacts:"Plays guitar, two cats",sections:{identity:true,voice:true,interests:true,physical:true,personal:true,rules:true,scripts:true},scripts:[{id:1,trigger:"Phone number",response:"Aww honey I keep things here where it's just us 💕"}]},
  {id:4,model:"Brianna",flirtLevel:"PG",voice:"TBD",endearments:"TBD",hardNos:"TBD",offlineTimes:"TBD",lastUpdated:"2024-01-11",updatedBy:"Jonathan",age:"",location:"",personality:"",interests:"",physicalDesc:"",personalFacts:"",sections:{identity:false,voice:false,interests:false,physical:false,personal:false,rules:false,scripts:false},scripts:[]},
];
const INIT_FANS=[
  {id:1,model:"Autumn",username:"bigspender99",type:"Whale",spend:"$4,200",notes:"Responds well to personalised intros",flag:false},
  {id:2,model:"Jordan",username:"problemfan_x",type:"Problem Fan",spend:"$0",notes:"Requested meetup twice.",flag:true},
  {id:3,model:"Mia",username:"whale_miami",type:"Whale",spend:"$8,100",notes:"Suspected reseller — monitor",flag:true},
];
const INIT_SALES=[
  {id:1,chatter:"Chatter1",model:"Autumn",type:"PPV",amount:120,fanUsername:"bigspender99",note:"Tier 2 beach set",date:today(),shift:"11-7"},
  {id:2,chatter:"Chatter2",model:"Mia",type:"PPV",amount:200,fanUsername:"whale_miami",note:"Custom video upsell",date:today(),shift:"7-3"},
];
const INIT_CAMPAIGNS=[
  {id:1,model:"Autumn",name:"Valentine's Flash Sale",type:"Flash Sale",status:"Live",startDate:"2024-02-10",endDate:"2024-02-14",revenue:1240,notes:""},
  {id:2,model:"Jordan",name:"Birthday Month Live",type:"Live",status:"Live",startDate:"2024-02-01",endDate:"2024-02-28",revenue:3200,notes:""},
  {id:3,model:"Mia",name:"Easter Bundle",type:"Bundle",status:"Planning",startDate:"2024-03-28",endDate:"2024-04-01",revenue:0,notes:""},
];
const INIT_CONTENT=[
  {id:1,model:"Autumn",type:"PS",theme:"Beach",priceTier:"$$",upsellOrder:1,assetCount:12,tag:"PS-Beach-$$-1",date:"2024-01-10",loggedBy:"Tate",notes:""},
  {id:2,model:"Jordan",type:"PS",theme:"RedDress",priceTier:"$",upsellOrder:1,assetCount:8,tag:"PS-RedDress-$-1",date:"2024-01-09",loggedBy:"Jonathan",notes:""},
];
const INIT_PROMOS=[
  {id:1,model:"Autumn",platform:"Instagram",date:"2024-01-10",loggedBy:"Tate",notes:"Story + swipe up"},
  {id:2,model:"Jordan",platform:"TikTok",date:"2024-01-09",loggedBy:"Jonathan",notes:"Teaser video"},
];
const INIT_TODOS=[
  {id:1,scope:"model",model:"Autumn",owner:"Tate",task:"Schedule Valentine mass message",priority:"High",done:false,date:today()},
  {id:2,scope:"personal",model:null,owner:"Tate",task:"Review Mia chat QA",priority:"Medium",done:false,date:today()},
];
const INIT_SHIFTS=[
  {id:1,chatter:"Chatter1",shift:"11-7",date:today(),models:["Autumn","Jordan"],source:"manual"},
  {id:2,chatter:"Chatter2",shift:"7-3",date:today(),models:["Mia","Brianna"],source:"manual"},
  {id:3,chatter:"Kayla",shift:"3-11",date:today(),models:["Autumn","Mia"],source:"manual"},
];
const INIT_MASS=[{id:1,model:"Autumn",sentBy:"Tate",message:"Hey babe 🍂 just dropped something special for my top fans 💌",target:"All subscribers",sentAt:"10:30 AM",date:today(),revenue:340,notes:"Valentine's lead-in"}];
const INIT_QA=[{id:1,chatter:"Chatter1",model:"Autumn",date:today(),reviewer:"Kayla",upsellAttempt:true,toneMatch:true,hardNoViolation:false,escalationHandled:null,score:90,notes:"Good upsell on beach set"}];
const INIT_CUSTOMS=[
  {id:1,model:"Autumn",price:250,fan:"bigspender99",description:"Personalised beach video, mention his name",paid:false,status:"In Progress",loggedBy:"Tate",date:today()},
  {id:2,model:"Mia",price:400,fan:"whale_miami",description:"Full custom set, 3 outfits",paid:true,status:"Paid",loggedBy:"Tate",date:today()},
  {id:3,model:"Jordan",price:150,fan:"regularfan22",description:"Birthday shoutout video",paid:false,status:"Pending Confirmation",loggedBy:"Jonathan",date:today()},
];
// ── DESIGN SYSTEM ────────────────────────────────────────────
const s = {
  card: {background:C.white,borderRadius:14,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)"},
  input: {width:"100%",border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box",background:C.white,transition:"border-color 0.15s",fontFamily:"inherit"},
  label: {fontSize:11,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em",display:"block"},
  section: {fontSize:15,fontWeight:700,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8},
};
const Badge=({label,color=C.purple,bg,dot})=>(
  <span style={{background:bg||color+"18",color,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>
    {dot&&<span style={{width:5,height:5,borderRadius:99,background:color,display:"inline-block"}}/>}{label}
  </span>
);
const Card=({children,style={}})=>(<div style={{...s.card,...style}}>{children}</div>);
const Btn=({children,onClick,variant="primary",size="md",color,style={}})=>{
  const colors={primary:{bg:color||C.purple,text:C.white,border:color||C.purple},secondary:{bg:"transparent",text:color||C.purple,border:color||C.border},ghost:{bg:"transparent",text:C.muted,border:"transparent"},danger:{bg:C.red,text:C.white,border:C.red}};
  const sizes={sm:{padding:"5px 12px",fontSize:12,borderRadius:8},md:{padding:"8px 18px",fontSize:13,borderRadius:10},lg:{padding:"11px 24px",fontSize:14,borderRadius:11}};
  const v=colors[variant]||colors.primary;const z=sizes[size]||sizes.md;
  return(<button onClick={onClick} style={{background:v.bg,color:v.text,border:`1.5px solid ${v.border}`,fontWeight:600,cursor:"pointer",transition:"opacity 0.15s",...z,...style}}
    onMouseEnter={e=>e.currentTarget.style.opacity="0.85"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>);
};
const Input=({label,value,onChange,placeholder,type="text",style={}})=>(
  <div style={{marginBottom:14,...style}}>
    {label&&<label style={s.label}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={s.input} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
);
const Sel=({label,value,onChange,options})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={s.label}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{...s.input,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:32}}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);
const TA=({label,value,onChange,placeholder,rows=3})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={s.label}>{label}</label>}
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{...s.input,resize:"vertical"}}
      onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
  </div>
);
const MultiSelect=({label,options,selected,onChange})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={s.label}>{label}</label>}
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {options.map(o=>{const on=selected.includes(o);return(
        <button key={o} onClick={()=>onChange(on?selected.filter(x=>x!==o):[...selected,o])}
          style={{padding:"5px 12px",borderRadius:99,border:`1.5px solid ${on?C.purple:C.border}`,background:on?C.purpleXL:C.white,color:on?C.purple:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
          {on?"✓ ":""}{o}
        </button>
      );})}
    </div>
  </div>
);
const TaskCell=({val,onChange})=>{
  const states=[null,true,false];
  const cfg={null:{l:"–",bg:"#f1f5f9",c:C.muted},true:{l:"✓",bg:C.greenL,c:C.green},false:{l:"✗",bg:C.redL,c:C.red}};
  const st=cfg[val];
  return(<button onClick={()=>{const i=states.indexOf(val);onChange(states[(i+1)%3]);}}
    style={{width:34,height:34,borderRadius:8,border:"none",background:st.bg,color:st.c,fontWeight:700,fontSize:14,cursor:"pointer",transition:"all 0.15s"}}>{st.l}</button>);
};
const SectionHeader=({icon,title,action})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {icon&&<span style={{fontSize:18}}>{icon}</span>}
      <span style={{fontSize:16,fontWeight:700,color:C.text}}>{title}</span>
    </div>
    {action}
  </div>
);
function Tabs({tabs,active,onChange}){
  return(
    <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,padding:3,gap:2,flexWrap:"wrap",marginBottom:20}}>
      {tabs.map(([k,l])=>{
        const isActive=active===k;
        return(
          <button key={k} onClick={()=>onChange(k)}
            style={{padding:"6px 14px",borderRadius:8,border:"none",background:isActive?C.white:"transparent",color:isActive?C.text:C.muted,fontWeight:isActive?700:500,fontSize:12,cursor:"pointer",boxShadow:isActive?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all 0.15s",whiteSpace:"nowrap"}}>
            {l}
          </button>
        );
      })}
    </div>
  );
}
const StatCard=({label,value,color=C.purple,sub,icon})=>(
  <Card style={{textAlign:"center",padding:16}}>
    {icon&&<div style={{fontSize:22,marginBottom:4}}>{icon}</div>}
    <div style={{fontSize:24,fontWeight:800,color,lineHeight:1}}>{value}</div>
    <div style={{fontSize:11,color:C.muted,marginTop:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
    {sub&&<div style={{fontSize:11,color,marginTop:4,fontWeight:600}}>{sub}</div>}
  </Card>
);
function Toggle({on,onToggle}){
  return(
    <button onClick={onToggle} style={{width:40,height:22,borderRadius:99,background:on?C.purple:"#cbd5e1",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",padding:0}}>
      <div style={{width:16,height:16,borderRadius:99,background:C.white,position:"absolute",top:3,left:on?21:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
    </button>
  );
}
const Modal=({title,onClose,children,width=480})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{width,maxWidth:"100%",background:C.white,borderRadius:16,boxShadow:"0 25px 60px rgba(0,0,0,0.25)",maxHeight:"85vh",overflow:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontWeight:700,fontSize:15}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:24}}>{children}</div>
    </div>
  </div>
);
// ── ALERTS ───────────────────────────────────────────────────
function buildAlerts(tasks,shifts,models,campaigns,fans){
  const a=[];
  tasks.forEach(t=>{if(t.bos===null)a.push({type:"warn",msg:`${t.model} — BOS not logged`});if(t.eos===false)a.push({type:"error",msg:`${t.model} — EOS marked incomplete`});});
  SHIFTS.forEach(s=>{if(!shifts.find(x=>x.shift===s&&x.date===today()))a.push({type:"error",msg:`${s} shift uncovered today`});});
  models.filter(m=>!m.archived&&campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length<2).forEach(m=>a.push({type:"warn",msg:`${m.name} has <2 active campaigns`}));
  fans.filter(f=>f.flag).forEach(f=>a.push({type:"flag",msg:`Flagged: ${f.username} on ${f.model}`}));
  return a;
}
function AlertsBar({alerts}){
  const [open,setOpen]=useState(false);
  if(!alerts.length)return null;
  const errors=alerts.filter(a=>a.type==="error").length;
  const col=errors>0?C.red:C.yellow;
  return(
    <div style={{marginBottom:16,borderRadius:12,overflow:"hidden",border:`1px solid ${col}25`}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",background:col+"10",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",border:"none",textAlign:"left"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:14}}>{errors>0?"🚨":"⚠️"}</span>
          <span style={{fontWeight:700,color:col,fontSize:13}}>{alerts.length} alert{alerts.length!==1?"s":""}</span>
          {errors>0&&<Badge label={`${errors} critical`} color={C.red}/>}
        </div>
        <span style={{color:col,fontSize:11,fontWeight:600}}>{open?"▲ Hide":"▼ Show"}</span>
      </button>
      {open&&alerts.map((a,i)=>(
        <div key={i} style={{padding:"9px 16px",background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",gap:10,fontSize:13,alignItems:"center"}}>
          <span>{a.type==="error"?"🔴":a.type==="flag"?"🚩":"🟡"}</span><span>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}
// ── GLOBAL SEARCH ────────────────────────────────────────────
function GlobalSearch({models,users,fans,sales,onClose}){
  const [q,setQ]=useState("");
  const results=useMemo(()=>{
    if(q.length<2)return[];
    const ql=q.toLowerCase(),out=[];
    models.filter(m=>!m.archived).forEach(m=>{if(m.name.toLowerCase().includes(ql))out.push({type:"Model",label:m.name,sub:`AM: ${m.am} · ${m.platform}`,color:C.blue});});
    users.forEach(u=>{if(u.name.toLowerCase().includes(ql)||u.email.toLowerCase().includes(ql))out.push({type:"User",label:u.name,sub:`${roleLabel[u.role]} · ${u.email}`,color:roleColors[u.role]});});
    fans.forEach(f=>{if(f.username.toLowerCase().includes(ql))out.push({type:"Fan",label:f.username,sub:`${f.type} · ${f.model} · ${f.spend}`,color:f.flag?C.red:C.purple});});
    sales.forEach(s=>{if(s.fanUsername.toLowerCase().includes(ql)||s.model.toLowerCase().includes(ql))out.push({type:"Sale",label:`${s.model} — ${fmtMoney(s.amount)}`,sub:`${s.chatter} · ${s.fanUsername}`,color:C.green});});
    return out.slice(0,10);
  },[q,models,users,fans,sales]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80}} onClick={onClose}>
      <div style={{width:540,background:C.white,borderRadius:16,boxShadow:"0 25px 60px rgba(0,0,0,0.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid ${C.border}`}}>
          <span style={{color:C.muted}}>🔍</span>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search models, users, fans, sales…"
            style={{flex:1,border:"none",outline:"none",fontSize:14,background:"transparent",color:C.text}}/>
          <kbd style={{fontSize:11,background:"#f1f5f9",border:`1px solid ${C.border}`,borderRadius:5,padding:"2px 6px",color:C.muted}}>esc</kbd>
        </div>
        {q.length<2
          ?<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>Type to search models, users, fans & sales</div>
          :!results.length
            ?<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>No results for "{q}"</div>
            :results.map((r,i)=>(
              <div key={i} style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Badge label={r.type} color={r.color}/>
                <div><div style={{fontWeight:600,fontSize:13}}>{r.label}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>{r.sub}</div></div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
// ── SLING ────────────────────────────────────────────────────
function SlingWidget({slingApiKey,setSlingApiKey}){
  const [show,setShow]=useState(false);const [val,setVal]=useState(slingApiKey||"");
  return(
    <Card style={{marginBottom:20,background:slingApiKey?"#f0fdf4":"#fffbeb",border:`1px solid ${slingApiKey?C.green:C.yellow}30`,padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:slingApiKey?C.greenL:C.yellowL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📅</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:slingApiKey?C.green:C.yellow}}>{slingApiKey?"Sling Connected":"Sling Not Connected"}</div>
            <div style={{fontSize:11,color:C.muted}}>{slingApiKey?"Shifts syncing automatically":"Connect to auto-sync shifts"}</div>
          </div>
        </div>
        <Btn variant="secondary" size="sm" color={slingApiKey?C.green:C.yellow} onClick={()=>setShow(!show)}>{slingApiKey?"Manage":"Connect"}</Btn>
      </div>
      {show&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Paste Sling API key…"
            style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
          <Btn size="sm" onClick={()=>{setSlingApiKey(val);setShow(false);}}>Save</Btn>
        </div>
      )}
    </Card>
  );
}
// ── QA REVIEW ────────────────────────────────────────────────
function QAReview({user,qaLogs,setQaLogs,users,models}){
  const [showAdd,setShowAdd]=useState(false);
  const chatters=users.filter(u=>u.role==="chatter"||u.role==="chatlead").map(u=>u.name);
  const activeModels=models.filter(m=>!m.archived).map(m=>m.name);
  const blank={chatter:chatters[0]||"",model:activeModels[0]||"",upsellAttempt:null,toneMatch:null,hardNoViolation:null,escalationHandled:null,notes:""};
  const [form,setForm]=useState(blank);
  const [fc,setFc]=useState("All");
  const calcScore=f=>{let sc=100;if(f.upsellAttempt===false)sc-=20;if(f.toneMatch===false)sc-=20;if(f.hardNoViolation===true)sc-=40;if(f.escalationHandled===false)sc-=20;return Math.max(0,sc);};
  const scoreCol=sc=>sc>=80?C.green:sc>=60?C.yellow:C.red;
  const submit=()=>{setQaLogs(p=>[{...form,id:Date.now(),reviewer:user.name,date:today(),score:calcScore(form)},...p]);setForm(blank);setShowAdd(false);};
  const visible=qaLogs.filter(q=>fc==="All"||q.chatter===fc);
  const avg=visible.length?Math.round(visible.reduce((a,q)=>a+q.score,0)/visible.length):null;
  const BoolRow=({label,field})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{fontSize:13,color:C.text}}>{label}</span>
      <div style={{display:"flex",gap:6}}>
        {[["Yes",true],["No",false],["N/A",null]].map(([l,v])=>(
          <button key={l} onClick={()=>setForm(p=>({...p,[field]:v}))}
            style={{padding:"4px 12px",borderRadius:99,border:`1.5px solid ${form[field]===v?C.purple:C.border}`,background:form[field]===v?C.purpleXL:C.white,color:form[field]===v?C.purple:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
  return(
    <div>
      <SectionHeader icon="🎯" title="Chat QA Reviews"
        action={<Btn size="sm" onClick={()=>setShowAdd(true)}>+ New Review</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Reviews" value={qaLogs.length} color={C.purple}/>
        <StatCard label="Avg Score" value={avg!==null?`${avg}%`:"—"} color={avg!==null?scoreCol(avg):C.muted}/>
        <StatCard label="Violations" value={qaLogs.filter(q=>q.hardNoViolation).length} color={C.red}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
        <label style={s.label}>Filter by chatter</label>
        <select value={fc} onChange={e=>setFc(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{chatters.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      {showAdd&&(
        <Modal title="New QA Review" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:4}}>
            <Sel label="Chatter" value={form.chatter} onChange={v=>setForm(p=>({...p,chatter:v}))} options={chatters}/>
            <Sel label="Model Account" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={activeModels}/>
          </div>
          <BoolRow label="Upsell attempt made?" field="upsellAttempt"/>
          <BoolRow label="Tone matched TTK?" field="toneMatch"/>
          <BoolRow label="Hard no violated?" field="hardNoViolation"/>
          <BoolRow label="Escalation handled correctly?" field="escalationHandled"/>
          <Input label="Notes / Feedback" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Feedback for chatter…" style={{marginTop:14}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
            <span style={{fontSize:13,color:C.muted}}>Score: <b style={{color:scoreCol(calcScore(form))}}>{calcScore(form)}%</b></span>
            <div style={{display:"flex",gap:8}}><Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn size="sm" onClick={submit}>Submit Review</Btn></div>
          </div>
        </Modal>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map(q=>(
          <Card key={q.id} style={{borderLeft:`3px solid ${scoreCol(q.score)}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontWeight:700}}>{q.chatter}</span>
                <Badge label={q.model} color={C.blue}/>
                <Badge label={`by ${q.reviewer}`} color={C.muted} bg="#f1f5f9"/>
                <span style={{fontSize:11,color:C.muted}}>{q.date}</span>
              </div>
              <span style={{fontSize:22,fontWeight:800,color:scoreCol(q.score)}}>{q.score}%</span>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
              {q.upsellAttempt!==null&&<Badge label={`Upsell ${q.upsellAttempt?"✓":"✗"}`} color={q.upsellAttempt?C.green:C.red}/>}
              {q.toneMatch!==null&&<Badge label={`Tone ${q.toneMatch?"✓":"✗"}`} color={q.toneMatch?C.green:C.red}/>}
              {q.hardNoViolation&&<Badge label="⚠ Hard No" color={C.red}/>}
              {q.escalationHandled!==null&&<Badge label={`Escalation ${q.escalationHandled?"✓":"✗"}`} color={q.escalationHandled?C.green:C.red}/>}
            </div>
            {q.notes&&<p style={{fontSize:12,color:C.muted,margin:"8px 0 0"}}>{q.notes}</p>}
          </Card>
        ))}
        {!visible.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No QA reviews yet</div>}
      </div>
    </div>
  );
}
// ── TTK EDITOR ───────────────────────────────────────────────
function TTKEditor({user,ttks,setTtks,myModels}){
  const [sel,setSel]=useState(myModels[0]||"");
  const ttk=ttks.find(t=>t.model===sel)||ttks[0];
  const [form,setForm]=useState(ttk||{});
  const [tab,setTab]=useState("identity");
  useEffect(()=>{const t=ttks.find(t=>t.model===sel);if(t)setForm({...t});},[sel]);
  const save=()=>{setTtks(p=>p.map(t=>t.model===sel?{...form,lastUpdated:new Date().toISOString().slice(0,10),updatedBy:user.name}:t));};
  const pct=Math.round(TTK_SECTIONS.filter(s=>form.sections?.[s]).length/TTK_SECTIONS.length*100);
  const col=pct===100?C.green:pct>=50?C.yellow:C.red;
  const tabs=[["identity","Identity"],["voice","Voice"],["interests","Interests"],["physical","Physical"],["personal","Personal"],["rules","Rules"],["scripts","Scripts"]];
  if(!ttk)return<div style={{color:C.muted,fontSize:13}}>No TTK found.</div>;
  return(
    <div>
      <SectionHeader icon="📖" title="TTK Editor"
        action={<Btn size="sm" onClick={save}>Save TTK</Btn>}/>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:20,flexWrap:"wrap"}}>
        <select value={sel} onChange={e=>setSel(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          {myModels.map(m=><option key={m}>{m}</option>)}
        </select>
        <div style={{flex:1,height:6,borderRadius:99,background:C.border,minWidth:100,maxWidth:200}}>
          <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:col,transition:"width 0.3s"}}/>
        </div>
        <Badge label={`${pct}% complete`} color={col}/>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
        {tabs.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${tab===k?C.purple:C.border}`,background:tab===k?C.purpleXL:C.white,color:tab===k?C.purple:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:6,height:6,borderRadius:99,background:form.sections?.[k]?C.green:C.red,display:"inline-block"}}/>
            {l}
          </button>
        ))}
      </div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontWeight:700,textTransform:"capitalize"}}>{tab}</span>
          {tab!=="scripts"&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:C.muted}}>{form.sections?.[tab]?"Complete":"Incomplete"}</span>
              <Toggle on={form.sections?.[tab]} onToggle={()=>setForm(p=>({...p,sections:{...p.sections,[tab]:!p.sections?.[tab]}}))}/>
            </div>
          )}
        </div>
        {tab==="identity"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          <Input label="Age" value={form.age||""} onChange={v=>setForm(p=>({...p,age:v}))} placeholder="25"/>
          <Input label="Location" value={form.location||""} onChange={v=>setForm(p=>({...p,location:v}))} placeholder="California"/>
          <Input label="Flirt Level" value={form.flirtLevel||""} onChange={v=>setForm(p=>({...p,flirtLevel:v}))} placeholder="PG-17"/>
          <Input label="Offline Times" value={form.offlineTimes||""} onChange={v=>setForm(p=>({...p,offlineTimes:v}))} placeholder="6am–10am EST"/>
          <Input label="Endearments" value={form.endearments||""} onChange={v=>setForm(p=>({...p,endearments:v}))} placeholder="babe, bb" style={{gridColumn:"1/-1"}}/>
        </div>}
        {tab==="voice"&&<><TA label="Voice / Tone" value={form.voice||""} onChange={v=>setForm(p=>({...p,voice:v}))} placeholder="e.g. Lowercase, casual, lots of emojis"/><TA label="Personality" value={form.personality||""} onChange={v=>setForm(p=>({...p,personality:v}))} placeholder="e.g. Adventurous, outdoorsy"/></>}
        {tab==="interests"&&<TA label="Interests & Hobbies" value={form.interests||""} onChange={v=>setForm(p=>({...p,interests:v}))} rows={5} placeholder="e.g. Hiking, photography, coffee"/>}
        {tab==="physical"&&<TA label="Physical Description" value={form.physicalDesc||""} onChange={v=>setForm(p=>({...p,physicalDesc:v}))} rows={4} placeholder='e.g. 5&apos;6", athletic, auburn hair'/>}
        {tab==="personal"&&<TA label="Personal Facts / Backstory" value={form.personalFacts||""} onChange={v=>setForm(p=>({...p,personalFacts:v}))} rows={5} placeholder="e.g. Has a golden retriever named Biscuit"/>}
        {tab==="rules"&&<TA label="Hard No's" value={form.hardNos||""} onChange={v=>setForm(p=>({...p,hardNos:v}))} placeholder="e.g. Politics, real name, location" rows={4}/>}
        {tab==="scripts"&&<div>
          {(form.scripts||[]).map((sc,i)=>(
            <div key={sc.id} style={{background:C.bg,borderRadius:10,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:C.muted}}>SCRIPT {i+1}</span>
                <button onClick={()=>setForm(p=>({...p,scripts:p.scripts.filter(x=>x.id!==sc.id)}))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12,fontWeight:600}}>Remove</button>
              </div>
              <Input label="Trigger" value={sc.trigger} onChange={v=>setForm(p=>({...p,scripts:p.scripts.map(x=>x.id===sc.id?{...x,trigger:v}:x)}))} placeholder="e.g. Meetup request"/>
              <TA label="Response" value={sc.response} onChange={v=>setForm(p=>({...p,scripts:p.scripts.map(x=>x.id===sc.id?{...x,response:v}:x)}))} placeholder="Script text…" rows={2}/>
            </div>
          ))}
          <Btn variant="secondary" size="sm" onClick={()=>setForm(p=>({...p,scripts:[...(p.scripts||[]),{id:Date.now(),trigger:"",response:""}]}))}>+ Add Script</Btn>
        </div>}
      </Card>
    </div>
  );
}
// ── MASS MESSAGE ─────────────────────────────────────────────
function MassMessageTracker({user,massMessages,setMassMessages,myModels,isLeadership,isAM}){
  const [showAdd,setShowAdd]=useState(false);
  const blank={model:myModels[0]||"",message:"",target:"All subscribers",revenue:"",notes:""};
  const [form,setForm]=useState(blank);
  const visible=massMessages.filter(m=>isLeadership||myModels.includes(m.model));
  const totalRev=visible.reduce((a,m)=>a+Number(m.revenue||0),0);
  const targetOpts=["All subscribers","Active last 7 days","Active last 30 days","Whales only","Expiring subscribers","Custom segment"];
  return(
    <div>
      <SectionHeader icon="📣" title="Mass Message Tracker"
        action={(isAM||isLeadership)&&<Btn size="sm" onClick={()=>setShowAdd(true)}>+ Log Message</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Sent" value={visible.length} color={C.purple}/>
        <StatCard label="Revenue Attributed" value={fmtMoney(totalRev)} color={C.green}/>
        <StatCard label="Avg per Blast" value={visible.length?fmtMoney(Math.round(totalRev/visible.length)):"—"} color={C.blue}/>
      </div>
      {showAdd&&(
        <Modal title="Log Mass Message" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={myModels}/>
            <Sel label="Target Audience" value={form.target} onChange={v=>setForm(p=>({...p,target:v}))} options={targetOpts}/>
            <Input label="Revenue ($)" value={form.revenue} onChange={v=>setForm(p=>({...p,revenue:v}))} placeholder="0" type="number"/>
            <Input label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Context…"/>
          </div>
          <TA label="Message Text" value={form.message} onChange={v=>setForm(p=>({...p,message:v}))} placeholder="Message content…" rows={3}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.message)return;setMassMessages(p=>[{...form,id:Date.now(),sentBy:user.name,date:today(),sentAt:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),revenue:Number(form.revenue)||0},...p]);setForm(blank);setShowAdd(false);}}>Log</Btn>
          </div>
        </Modal>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map(m=>(
          <Card key={m.id} style={{borderLeft:`3px solid ${C.purple}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <Badge label={m.model} color={C.blue}/><Badge label={m.target} color={C.muted} bg="#f1f5f9"/>
                {m.revenue>0&&<Badge label={`+${fmtMoney(m.revenue)}`} color={C.green} dot/>}
              </div>
              <span style={{fontSize:11,color:C.muted}}>{m.sentBy} · {m.sentAt} · {m.date}</span>
            </div>
            <p style={{fontSize:13,background:C.bg,borderRadius:8,padding:"9px 12px",fontStyle:"italic",color:C.muted,margin:0}}>"{m.message}"</p>
            {m.notes&&<p style={{fontSize:12,color:C.muted,margin:"6px 0 0"}}>{m.notes}</p>}
          </Card>
        ))}
        {!visible.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No mass messages logged yet</div>}
      </div>
    </div>
  );
}
// ── BOS / EOS ────────────────────────────────────────────────
function BOSEOSView({user,boseos,setBoseos,tasks,setTasks,myModels}){
  const [type,setType]=useState("BOS");
  const [form,setForm]=useState({model:myModels[0]||"",rev:"",performance:"",traffic:"High",spenders:"",newVips:"none",concerns:"none",focus:"",outreachGroups:[]});
  const [posted,setPosted]=useState(null);
  const submit=()=>{
    if(!form.rev)return;
    const e={...form,id:Date.now(),am:user.name,type,date:today(),time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
    setBoseos(p=>[e,...p]);
    setTasks(p=>p.map(t=>t.am===user.name&&t.model===form.model?{...t,[type.toLowerCase()]:true,...(type==="EOS"?{outreach:{...t.outreach,[form.model]:form.outreachGroups}}:{})}:t));
    const outreachStr=form.outreachGroups.length?form.outreachGroups.join(", "):"None";
    setPosted(type==="BOS"
      ?`📋 BOS — ${form.model}\nAM: ${user.name} | ${e.time}\nLogin Rev: $${form.rev}\nFocus: ${form.focus}`
      :`📋 EOS — ${form.model}\nAM: ${user.name} | ${e.time}\nLogout Rev: $${form.rev}\nPerformance: ${form.performance}\nTraffic: ${form.traffic}\nSpenders: ${form.spenders||"none"}\nNew VIPs: ${form.newVips}\nOutreach: ${outreachStr}\nConcerns: ${form.concerns}`
    );
  };
  return(
    <div>
      <SectionHeader icon="📋" title="BOS / EOS"/>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["BOS","EOS"].map(t=><Btn key={t} onClick={()=>setType(t)} variant={type===t?"primary":"secondary"} size="sm">{t}</Btn>)}
      </div>
      <Card style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={myModels}/>
          <Input label={type==="BOS"?"Login Rev ($)":"Logout Rev ($)"} value={form.rev} onChange={v=>setForm(p=>({...p,rev:v}))} placeholder="36420" type="number"/>
          {type==="BOS"&&<Input label="Today's Focus" value={form.focus} onChange={v=>setForm(p=>({...p,focus:v}))} placeholder="e.g. Push Valentine campaign" style={{gridColumn:"1/-1"}}/>}
          {type==="EOS"&&<>
            <Input label="Performance" value={form.performance} onChange={v=>setForm(p=>({...p,performance:v}))} placeholder="Strong — closed 2 VIPs"/>
            <Sel label="Traffic" value={form.traffic} onChange={v=>setForm(p=>({...p,traffic:v}))} options={["High","Medium","Low"]}/>
            <Input label="Spenders" value={form.spenders} onChange={v=>setForm(p=>({...p,spenders:v}))} placeholder="fan — amount"/>
            <Input label="New VIPs" value={form.newVips} onChange={v=>setForm(p=>({...p,newVips:v}))} placeholder="name or none"/>
            <Input label="Concerns" value={form.concerns} onChange={v=>setForm(p=>({...p,concerns:v}))} placeholder="or none"/>
          </>}
        </div>
        {type==="EOS"&&(
          <MultiSelect label={`Outreach Completed — ${form.model}`} options={OUTREACH_GROUPS} selected={form.outreachGroups} onChange={v=>setForm(p=>({...p,outreachGroups:v}))}/>
        )}
        <Btn onClick={submit} style={{marginTop:4}}>Submit → Posts to Discord</Btn>
      </Card>
      {posted&&(
        <Card style={{background:C.dark,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontWeight:700,color:C.white,fontSize:13}}>✅ Ready for Discord</span>
            <Btn variant="ghost" size="sm" color="#94a3b8" onClick={()=>setPosted(null)}>Dismiss</Btn>
          </div>
          <pre style={{margin:0,color:"#94a3b8",fontSize:12,whiteSpace:"pre-wrap",fontFamily:"monospace",lineHeight:1.8}}>{posted}</pre>
        </Card>
      )}
      {boseos.slice(0,5).map(e=>(
        <Card key={e.id} style={{marginBottom:8,borderLeft:`3px solid ${e.type==="BOS"?C.blue:C.purple}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontWeight:700}}>{e.model}</span><Badge label={e.type} color={e.type==="BOS"?C.blue:C.purple}/></div>
            <span style={{fontSize:12,color:C.muted}}>{e.time}</span>
          </div>
          <p style={{fontSize:13,color:C.muted,margin:"6px 0 0"}}>Rev: <b style={{color:C.text}}>${Number(e.rev).toLocaleString()}</b>{e.focus&&` · ${e.focus}`}{e.outreachGroups?.length>0&&` · Outreach: ${e.outreachGroups.join(", ")}`}</p>
        </Card>
      ))}
    </div>
  );
}
// ── SHIFT HANDOFF ────────────────────────────────────────────
function ShiftHandoff({user,handoffs,setHandoffs,isLeadership,isAM,models}){
  const activeModels=models.filter(m=>!m.archived).map(m=>m.name);
  const [form,setForm]=useState({model:activeModels[0]||"",incoming:"",shift:"11-7",activeConvos:"",whalesOnline:"",doNotContact:"none",massSent:"N",notes:""});
  const [posted,setPosted]=useState(null);
  const submit=()=>{
    if(!form.incoming)return;
    const h={...form,id:Date.now(),outgoing:user.name,date:today()};
    setHandoffs(p=>[h,...p]);
    setPosted(`🔄 HANDOFF — ${form.model}\nOutgoing: ${user.name} | Shift: ${form.shift}\nIncoming: ${form.incoming}\n\nACTIVE CONVOS:\n${form.activeConvos||"none"}\n\nWHALES ONLINE: ${form.whalesOnline||"none"}\nDO NOT CONTACT: ${form.doNotContact}\nMASS SENT: ${form.massSent}\nNOTES: ${form.notes||"none"}`);
    setForm({model:activeModels[0]||"",incoming:"",shift:"11-7",activeConvos:"",whalesOnline:"",doNotContact:"none",massSent:"N",notes:""});
  };
  return(
    <div>
      <SectionHeader icon="🔄" title="Shift Handoffs"/>
      {!isLeadership&&!isAM&&(
        <Card style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={activeModels}/>
            <Sel label="Shift" value={form.shift} onChange={v=>setForm(p=>({...p,shift:v}))} options={SHIFTS}/>
            <Input label="Incoming Chatter" value={form.incoming} onChange={v=>setForm(p=>({...p,incoming:v}))} placeholder="Name"/>
            <Input label="Whales Online" value={form.whalesOnline} onChange={v=>setForm(p=>({...p,whalesOnline:v}))} placeholder="usernames or none"/>
            <Sel label="Mass Sent?" value={form.massSent} onChange={v=>setForm(p=>({...p,massSent:v}))} options={["N","Y"]}/>
            <Input label="Do Not Contact" value={form.doNotContact} onChange={v=>setForm(p=>({...p,doNotContact:v}))} placeholder="username + reason"/>
          </div>
          <TA label="Active Convos" value={form.activeConvos} onChange={v=>setForm(p=>({...p,activeConvos:v}))} placeholder="- fanusername — context"/>
          <TA label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} rows={2}/>
          <Btn onClick={submit}>Submit → Posts to Discord</Btn>
        </Card>
      )}
      {posted&&(
        <Card style={{background:C.dark,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontWeight:700,color:C.white,fontSize:13}}>✅ Ready for Discord</span>
            <Btn variant="ghost" size="sm" color="#94a3b8" onClick={()=>setPosted(null)}>Dismiss</Btn>
          </div>
          <pre style={{margin:0,color:"#94a3b8",fontSize:12,whiteSpace:"pre-wrap",fontFamily:"monospace",lineHeight:1.8}}>{posted}</pre>
        </Card>
      )}
      <div style={{fontWeight:600,fontSize:13,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Recent Handoffs</div>
      {!handoffs.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No handoffs yet</div>}
      {handoffs.map(h=>(
        <Card key={h.id} style={{marginBottom:8,borderLeft:`3px solid ${C.green}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontWeight:700}}>{h.model}</span><span style={{color:C.muted,fontSize:13}}>{h.outgoing} → {h.incoming}</span></div>
            <Badge label={h.shift} color={C.slate} bg="#f1f5f9"/>
          </div>
          {h.activeConvos&&<p style={{fontSize:12,color:C.muted,margin:0}}>{h.activeConvos}</p>}
        </Card>
      ))}
    </div>
  );
}
// ── SALES TRACKER ────────────────────────────────────────────
function SalesTracker({user,sales,setSales,isLeadership,isAM,myModels,users}){
  const [form,setForm]=useState({model:myModels[0]||"",type:"PPV",amount:"",fanUsername:"",note:"",shift:"11-7"});
  const [fm,setFm]=useState("All");const [fc,setFc]=useState("All");
  const chatters=[...new Set(sales.map(s=>s.chatter))];
  const filtered=sales.filter(s=>(fm==="All"||s.model===fm)&&(fc==="All"||s.chatter===fc)&&(isLeadership||isAM||s.chatter===user.name));
  const tot=filtered.reduce((a,s)=>a+Number(s.amount),0);
  const chatterStats=(users||[]).filter(u=>u.role==="chatter"||u.role==="chatlead").map(u=>{const us=filtered.filter(s=>s.chatter===u.name);return{name:u.name,total:us.reduce((a,s)=>a+Number(s.amount),0),count:us.length};}).filter(s=>s.count>0).sort((a,b)=>b.total-a.total);
  return(
    <div>
      <SectionHeader icon="💰" title="Sales Tracker"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total" value={fmtMoney(tot)} color={C.purple}/>
        <StatCard label="PPV" value={fmtMoney(filtered.filter(s=>s.type==="PPV").reduce((a,s)=>a+Number(s.amount),0))} color={C.green}/>
        <StatCard label="Tips" value={fmtMoney(filtered.filter(s=>s.type==="Tip").reduce((a,s)=>a+Number(s.amount),0))} color={C.blue}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}><option>All</option>{myModels.map(m=><option key={m}>{m}</option>)}</select>
        {(isLeadership||isAM)&&<select value={fc} onChange={e=>setFc(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}><option>All</option>{chatters.map(c=><option key={c}>{c}</option>)}</select>}
      </div>
      {(isLeadership||isAM)&&chatterStats.length>0&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:12,fontSize:13}}>Leaderboard</div>
          {chatterStats.map((c,i)=>(
            <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:26,height:26,borderRadius:99,background:i===0?"#fef3c7":C.bg,color:i===0?C.yellow:C.muted,fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>#{i+1}</span>
                <div><div style={{fontWeight:600,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.count} sales</div></div>
              </div>
              <span style={{fontWeight:800,color:C.purple}}>{fmtMoney(c.total)}</span>
            </div>
          ))}
        </Card>
      )}
      <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:C.dark,color:"#94a3b8"}}>{["Chatter","Model","Type","Amount","Fan","Note","Shift"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((s,i)=>(
              <tr key={s.id} style={{background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"9px 14px",fontWeight:600}}>{s.chatter}</td>
                <td style={{padding:"9px 14px"}}>{s.model}</td>
                <td style={{padding:"9px 14px"}}><Badge label={s.type} color={s.type==="PPV"?C.purple:C.blue}/></td>
                <td style={{padding:"9px 14px",fontWeight:700,color:C.green}}>{fmtMoney(s.amount)}</td>
                <td style={{padding:"9px 14px",color:C.muted}}>{s.fanUsername}</td>
                <td style={{padding:"9px 14px",color:C.muted}}>{s.note}</td>
                <td style={{padding:"9px 14px"}}><Badge label={s.shift} color={C.muted} bg="#f1f5f9"/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
      {!isLeadership&&!isAM&&(
        <Card>
          <div style={{fontWeight:700,marginBottom:14,fontSize:13}}>Log Sale</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={myModels}/>
            <Sel label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={["PPV","Tip"]}/>
            <Input label="Amount ($)" value={form.amount} onChange={v=>setForm(p=>({...p,amount:v}))} placeholder="120" type="number"/>
            <Input label="Fan Username" value={form.fanUsername} onChange={v=>setForm(p=>({...p,fanUsername:v}))} placeholder="bigspender99"/>
            <Sel label="Shift" value={form.shift} onChange={v=>setForm(p=>({...p,shift:v}))} options={SHIFTS}/>
            <Input label="Note" value={form.note} onChange={v=>setForm(p=>({...p,note:v}))} placeholder="Beach upsell"/>
          </div>
          <Btn onClick={()=>{if(!form.amount||!form.fanUsername)return;setSales(p=>[...p,{...form,id:Date.now(),chatter:user.name,date:today(),amount:Number(form.amount)}]);setForm(p=>({...p,amount:"",fanUsername:"",note:""}));}}>Log Sale</Btn>
        </Card>
      )}
    </div>
  );
}
// ── CAMPAIGNS ────────────────────────────────────────────────
function CampaignCalendar({campaigns,setCampaigns,isLeadership,isAM,myModels,models}){
  const [fm,setFm]=useState("All");const [fs,setFs]=useState("All");const [showAdd,setShowAdd]=useState(false);
  const blank={model:myModels[0]||"",name:"",type:"Flash Sale",startDate:"",endDate:"",notes:""};const [form,setForm]=useState(blank);
  const sc={Planning:C.yellow,Scheduled:C.blue,Live:C.green,Complete:C.muted};
  const vm=isLeadership?models.filter(m=>!m.archived):models.filter(m=>myModels.includes(m.name)&&!m.archived);
  const filtered=campaigns.filter(c=>(fm==="All"||c.model===fm)&&(fs==="All"||c.status===fs));
  const low=vm.filter(m=>campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length<2);
  return(
    <div>
      <SectionHeader icon="📅" title="Campaign Planner" action={(isAM||isLeadership)&&<Btn size="sm" onClick={()=>setShowAdd(true)}>+ New Campaign</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Live" value={campaigns.filter(c=>c.status==="Live").length} color={C.green}/>
        <StatCard label="Revenue" value={fmtMoney(campaigns.filter(c=>["Complete","Live"].includes(c.status)).reduce((a,c)=>a+Number(c.revenue),0))} color={C.purple}/>
        <StatCard label="Need Campaigns" value={low.length} color={low.length>0?C.red:C.green} sub={low.length>0?low.map(m=>m.name).join(", "):"All good ✓"}/>
      </div>
      {low.length>0&&<div style={{background:C.redL,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.red,fontWeight:600}}>⚠ {low.map(m=>m.name).join(", ")} need more campaigns</div>}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}><option>All</option>{vm.map(m=><option key={m.id}>{m.name}</option>)}</select>
        <select value={fs} onChange={e=>setFs(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>{["All","Planning","Scheduled","Live","Complete"].map(st=><option key={st}>{st}</option>)}</select>
      </div>
      {showAdd&&(
        <Modal title="New Campaign" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={vm.map(m=>m.name)}/>
            <Sel label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={["Flash Sale","Bundle","Discount Code","Live","Advent","Holiday","Secret Emoji"]}/>
            <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Valentine's Flash Sale" style={{gridColumn:"1/-1"}}/>
            <Input label="Start Date" value={form.startDate} onChange={v=>setForm(p=>({...p,startDate:v}))} placeholder="2024-03-01"/>
            <Input label="End Date" value={form.endDate} onChange={v=>setForm(p=>({...p,endDate:v}))} placeholder="2024-03-07"/>
          </div>
          <Input label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Details…"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.name)return;setCampaigns(p=>[...p,{...form,id:Date.now(),revenue:0,status:"Planning"}]);setShowAdd(false);setForm(blank);}}>Add Campaign</Btn>
          </div>
        </Modal>
      )}
      {vm.map(m=>{const mc=filtered.filter(c=>c.model===m.name);if(!mc.length&&fm!=="All"&&fm!==m.name)return null;return(
        <div key={m.id} style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>{m.name}</div>
          {!mc.length?<div style={{color:C.muted,fontSize:13,padding:"8px 0"}}>No campaigns.</div>:mc.map(c=>(
            <Card key={c.id} style={{marginBottom:8,borderLeft:`3px solid ${sc[c.status]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{c.type}{c.startDate?` · ${c.startDate} → ${c.endDate}`:""}</div></div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {c.revenue>0&&<span style={{fontWeight:700,color:C.green,fontSize:13}}>{fmtMoney(c.revenue)}</span>}
                  <Badge label={c.status} color={sc[c.status]}/>
                  {(isAM||isLeadership)&&<select value={c.status} onChange={e=>setCampaigns(p=>p.map(x=>x.id===c.id?{...x,status:e.target.value}:x))} style={{...s.input,width:"auto",marginBottom:0,fontSize:12,padding:"4px 10px"}}>{["Planning","Scheduled","Live","Complete"].map(st=><option key={st}>{st}</option>)}</select>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );})}
    </div>
  );
}
// ── CONTENT LOG ──────────────────────────────────────────────
function ContentLog({user,content,setContent,promos,setPromos,myModels,isLeadership,platforms}){
  const blank={model:myModels[0]||"",type:"PS",theme:"",priceTier:"$$",upsellOrder:"1",assetCount:"",tag:"",notes:""};
  const [cForm,setCForm]=useState(blank);const [pForm,setPForm]=useState({model:myModels[0]||"",platform:(platforms||DEFAULT_PLATFORMS)[0],notes:""});
  const [sv,setSv]=useState("content");const [fm,setFm]=useState("All");
  useEffect(()=>{setCForm(p=>({...p,tag:generateTag(p.type,p.theme,p.priceTier,p.upsellOrder)}));},[cForm.type,cForm.theme,cForm.priceTier,cForm.upsellOrder]);
  const fc=content.filter(c=>(fm==="All"||c.model===fm)&&(isLeadership||myModels.includes(c.model)));
  const fp=promos.filter(p=>(fm==="All"||p.model===fm)&&(isLeadership||myModels.includes(p.model)));
  const platCol={Instagram:C.pink,TikTok:C.red,Snapchat:C.yellow,"X / Twitter":C.dark,Reddit:C.orange,Other:C.muted};
  return(
    <div>
      <SectionHeader icon="📦" title="Content & Promos"/>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        {[["content","Content"],["promos","Promos"]].map(([k,l])=><Btn key={k} onClick={()=>setSv(k)} variant={sv===k?"primary":"secondary"} size="sm">{l}</Btn>)}
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0,marginLeft:"auto"}}>
          <option>All</option>{INIT_MODELS.map(m=><option key={m.id}>{m.name}</option>)}
        </select>
      </div>
      {sv==="content"&&<>
        {!isLeadership&&(
          <Card style={{marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:14,fontSize:13}}>Log Upload</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Model" value={cForm.model} onChange={v=>setCForm(p=>({...p,model:v}))} options={myModels}/>
              <Sel label="Type" value={cForm.type} onChange={v=>setCForm(p=>({...p,type:v}))} options={CONTENT_TYPES}/>
              <Input label="Theme" value={cForm.theme} onChange={v=>setCForm(p=>({...p,theme:v}))} placeholder="Beach"/>
              <Sel label="Price Tier" value={cForm.priceTier} onChange={v=>setCForm(p=>({...p,priceTier:v}))} options={PRICE_TIERS}/>
              <Sel label="Upsell Order" value={String(cForm.upsellOrder)} onChange={v=>setCForm(p=>({...p,upsellOrder:v}))} options={["1","2","3","4","5"]}/>
              <Input label="Asset Count" value={cForm.assetCount} onChange={v=>setCForm(p=>({...p,assetCount:v}))} placeholder="12" type="number"/>
            </div>
            <div style={{background:C.mid,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Auto Tag</div>
              <div style={{display:"flex",gap:8}}>
                <input value={cForm.tag} onChange={e=>setCForm(p=>({...p,tag:e.target.value}))} style={{flex:1,background:"transparent",border:"1px solid #475569",borderRadius:8,padding:"8px 12px",fontSize:14,fontWeight:800,color:C.white,outline:"none",fontFamily:"monospace"}}/>
                <button onClick={()=>navigator.clipboard?.writeText(cForm.tag)} style={{background:"#334155",border:"none",borderRadius:8,padding:"8px 12px",color:"#94a3b8",cursor:"pointer",fontSize:12}}>Copy</button>
              </div>
            </div>
            <Btn size="sm" onClick={()=>{if(!cForm.theme||!cForm.assetCount)return;setContent(p=>[{...cForm,id:Date.now(),date:today(),loggedBy:user.name,assetCount:Number(cForm.assetCount),upsellOrder:Number(cForm.upsellOrder)},...p]);setCForm(blank);}}>Log Upload</Btn>
          </Card>
        )}
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:C.dark,color:"#94a3b8"}}>{["Model","Tag","Type","Theme","Tier","Assets","Date"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
              <tbody>{fc.map((c,i)=><tr key={c.id} style={{background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"9px 14px",fontWeight:600}}>{c.model}</td>
                <td style={{padding:"9px 14px"}}><span style={{fontFamily:"monospace",fontWeight:700,background:C.purpleXL,color:C.purple,padding:"3px 8px",borderRadius:5,fontSize:11}}>{c.tag}</span></td>
                <td style={{padding:"9px 14px"}}><Badge label={c.type} color={C.blue}/></td>
                <td style={{padding:"9px 14px",color:C.muted}}>{c.theme}</td>
                <td style={{padding:"9px 14px",fontWeight:700,color:C.purple}}>{c.priceTier}</td>
                <td style={{padding:"9px 14px",textAlign:"center"}}>{c.assetCount}</td>
                <td style={{padding:"9px 14px",color:C.muted}}>{c.date}</td>
              </tr>)}{!fc.length&&<tr><td colSpan={7} style={{padding:24,textAlign:"center",color:C.muted}}>No content yet</td></tr>}</tbody>
            </table>
          </div>
        </Card>
      </>}
      {sv==="promos"&&<>
        {!isLeadership&&(
          <Card style={{marginBottom:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Model" value={pForm.model} onChange={v=>setPForm(p=>({...p,model:v}))} options={myModels}/>
              <Sel label="Platform" value={pForm.platform} onChange={v=>setPForm(p=>({...p,platform:v}))} options={platforms||DEFAULT_PLATFORMS}/>
              <Input label="Notes" value={pForm.notes} onChange={v=>setPForm(p=>({...p,notes:v}))} placeholder="Story + swipe up" style={{gridColumn:"1/-1"}}/>
            </div>
            <Btn size="sm" onClick={()=>{setPromos(p=>[{...pForm,id:Date.now(),date:today(),loggedBy:user.name},...p]);setPForm(f=>({...f,notes:""}))}}>Log Promo</Btn>
          </Card>
        )}
        <Card style={{padding:0,overflow:"hidden"}}>
          {!fp.length?<div style={{padding:24,color:C.muted,fontSize:13,textAlign:"center"}}>No promos</div>:fp.map((p,i)=>(
            <div key={p.id} style={{padding:"12px 20px",background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,minWidth:80}}>{p.model}</span>
              <Badge label={p.platform} color={platCol[p.platform]||C.muted}/>
              <span style={{fontSize:13,color:C.muted,flex:1}}>{p.notes||"—"}</span>
              <span style={{fontSize:11,color:C.muted}}>{p.date}</span>
            </div>
          ))}
        </Card>
      </>}
    </div>
  );
}
// ── TODOS ────────────────────────────────────────────────────
function TodoPanel({user,todos,setTodos,myModels}){
  const [form,setForm]=useState({scope:"personal",model:myModels[0]||"",task:"",priority:"Medium"});
  const myTodos=todos.filter(t=>t.owner===user.name);
  const open=myTodos.filter(t=>!t.done);const done=myTodos.filter(t=>t.done);
  const pc={High:C.red,Medium:C.yellow,Low:C.green};
  return(
    <div>
      <SectionHeader icon="✅" title="To-Dos"/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Sel label="Scope" value={form.scope} onChange={v=>setForm(p=>({...p,scope:v}))} options={["personal","model"]}/>
          {form.scope==="model"&&<Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={myModels}/>}
          <Sel label="Priority" value={form.priority} onChange={v=>setForm(p=>({...p,priority:v}))} options={["High","Medium","Low"]}/>
        </div>
        <Input label="Task" value={form.task} onChange={v=>setForm(p=>({...p,task:v}))} placeholder="e.g. Schedule mass message"/>
        <Btn size="sm" onClick={()=>{if(!form.task)return;setTodos(p=>[...p,{...form,id:Date.now(),owner:user.name,done:false,date:today()}]);setForm(p=>({...p,task:""}));}}>Add Task</Btn>
      </Card>
      {open.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Open · {open.length}</div>
          {open.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.white,borderRadius:10,marginBottom:6,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",borderLeft:`3px solid ${pc[t.priority]}`}}>
              <input type="checkbox" onChange={()=>setTodos(p=>p.map(x=>x.id===t.id?{...x,done:true}:x))} style={{cursor:"pointer",width:15,height:15}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{t.task}</div><div style={{display:"flex",gap:5,marginTop:4}}><Badge label={t.priority} color={pc[t.priority]}/>{t.scope==="model"&&t.model&&<Badge label={t.model} color={C.blue}/>}</div></div>
              <button onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}
      {done.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Done · {done.length}</div>
          {done.map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.bg,borderRadius:10,marginBottom:6,opacity:0.6}}>
              <input type="checkbox" defaultChecked onChange={()=>setTodos(p=>p.map(x=>x.id===t.id?{...x,done:false}:x))} style={{cursor:"pointer"}}/>
              <span style={{flex:1,textDecoration:"line-through",fontSize:13,color:C.muted}}>{t.task}</span>
              <button onClick={()=>setTodos(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          ))}
        </div>
      )}
      {!open.length&&!done.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No to-dos yet</div>}
    </div>
  );
}
// ── SHIFT SCHEDULE ───────────────────────────────────────────
function ShiftSchedule({shifts,setShifts,users,models,slingApiKey,setSlingApiKey}){
  const chatters=users.filter(u=>u.role==="chatter"||u.role==="chatlead").map(u=>u.name);
  const activeModels=models.filter(m=>!m.archived).map(m=>m.name);
  const [form,setForm]=useState({chatter:chatters[0]||"",shift:"11-7",date:today(),models:[]});
  const [showAdd,setShowAdd]=useState(false);
  const todayShifts=shifts.filter(s=>s.date===today());
  const shiftCol={"11-7":C.blue,"7-3":C.purple,"3-11":C.green};
  return(
    <div>
      <SectionHeader icon="🗓️" title="Shift Schedule" action={<Btn size="sm" variant="secondary" onClick={()=>setShowAdd(!showAdd)}>{showAdd?"Cancel":"+ Add Shift"}</Btn>}/>
      <SlingWidget slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>
      {SHIFTS.map(sh=>{const on=todayShifts.filter(x=>x.shift===sh);return(
        <div key={sh} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{width:8,height:8,borderRadius:99,background:shiftCol[sh],display:"inline-block"}}/>
            <span style={{fontWeight:700,fontSize:13}}>{sh}</span>
            <Badge label={`${on.length} chatters`} color={shiftCol[sh]}/>
          </div>
          {!on.length?<div style={{fontSize:13,color:C.red,padding:"8px 14px",background:C.redL,borderRadius:10}}>⚠ No coverage</div>:on.map(x=>(
            <Card key={x.id} style={{marginBottom:8,borderLeft:`3px solid ${shiftCol[sh]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontWeight:700}}>{x.chatter}</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>{x.models.map(m=><Badge key={m} label={m} color={C.blue}/>)}</div></div>
                <Btn variant="danger" size="sm" onClick={()=>setShifts(p=>p.filter(r=>r.id!==x.id))}>Remove</Btn>
              </div>
            </Card>
          ))}
        </div>
      );})}
      {showAdd&&(
        <Modal title="Schedule Shift" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Chatter" value={form.chatter} onChange={v=>setForm(p=>({...p,chatter:v}))} options={chatters}/>
            <Sel label="Shift" value={form.shift} onChange={v=>setForm(p=>({...p,shift:v}))} options={SHIFTS}/>
            <Input label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} placeholder={today()} style={{gridColumn:"1/-1"}}/>
          </div>
          <MultiSelect label="Assign Models" options={activeModels} selected={form.models} onChange={v=>setForm(p=>({...p,models:v}))}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.chatter||!form.models.length)return;setShifts(p=>[...p,{...form,id:Date.now(),source:"manual"}]);setShowAdd(false);setForm({chatter:chatters[0]||"",shift:"11-7",date:today(),models:[]});}}>Add Shift</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ── MODEL MANAGEMENT ─────────────────────────────────────────
function ModelManagement({models,setModels,users,tasks,setTasks,modelPlatforms}){
  const ams=users.filter(u=>u.role==="am").map(u=>u.name);
  const [showAdd,setShowAdd]=useState(false);const [showArchived,setShowArchived]=useState(false);const [editId,setEditId]=useState(null);
  const blank={name:"",am:ams[0]||"",platform:(modelPlatforms||DEFAULT_MODEL_PLATFORMS)[0],status:"Onboarding",flirtLevel:"PG"};
  const [form,setForm]=useState(blank);
  const active=models.filter(m=>!m.archived);const archived=models.filter(m=>m.archived);
  const save=()=>{
    if(!form.name)return;
    if(editId){setModels(p=>p.map(m=>m.id===editId?{...m,...form}:m));setTasks(p=>p.map(t=>t.model===form.name?{...t,am:form.am}:t));setEditId(null);}
    else{setModels(p=>[...p,{...form,id:Date.now(),archived:false}]);setTasks(p=>[...p,{id:Date.now(),am:form.am,model:form.name,date:today(),bos:null,eos:null,content:null,notion:null,promos:null,notes:"",outreach:{}}]);}
    setForm(blank);setShowAdd(false);
  };
  const statusCol={Active:C.green,Onboarding:C.blue,Paused:C.yellow,Archived:C.muted};
  const flirtCol={"PG":C.green,"PG-13":C.blue,"PG-17":C.yellow,"R":C.red};
  return(
    <div>
      <SectionHeader icon="👥" title="Models"
        action={<div style={{display:"flex",gap:8}}>{archived.length>0&&<Btn variant="secondary" size="sm" onClick={()=>setShowArchived(!showArchived)}>{showArchived?"Hide":"Show"} Archived</Btn>}<Btn size="sm" onClick={()=>{setShowAdd(true);setEditId(null);setForm(blank);}}>+ Add Model</Btn></div>}/>
      <div style={{display:"flex",gap:8,marginBottom:16}}><Badge label={`${active.length} Active`} color={C.green}/><Badge label={`${archived.length} Archived`} color={C.muted}/></div>
      {showAdd&&(
        <Modal title={editId?"Edit Model":"New Model"} onClose={()=>{setShowAdd(false);setEditId(null);}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="e.g. Autumn"/>
            <Sel label="AM" value={form.am} onChange={v=>setForm(p=>({...p,am:v}))} options={ams}/>
            <Sel label="Platform" value={form.platform} onChange={v=>setForm(p=>({...p,platform:v}))} options={modelPlatforms||DEFAULT_MODEL_PLATFORMS}/>
            <Sel label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={["Onboarding","Active","Paused"]}/>
            <Sel label="Flirt Level" value={form.flirtLevel} onChange={v=>setForm(p=>({...p,flirtLevel:v}))} options={["PG","PG-13","PG-17","R"]}/>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>{setShowAdd(false);setEditId(null);}}>Cancel</Btn>
            <Btn size="sm" onClick={save}>{editId?"Save":"Add Model"}</Btn>
          </div>
        </Modal>
      )}
      {active.map(m=>(
        <Card key={m.id} style={{marginBottom:10,borderLeft:`3px solid ${statusCol[m.status]||C.muted}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{m.name}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                <Badge label={m.status} color={statusCol[m.status]}/><Badge label={m.platform} color={C.muted} bg="#f1f5f9"/>
                <Badge label={m.flirtLevel} color={flirtCol[m.flirtLevel]}/><Badge label={`AM: ${m.am}`} color={C.blue}/>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <select value={m.am} onChange={e=>{setModels(p=>p.map(x=>x.id===m.id?{...x,am:e.target.value}:x));setTasks(p=>p.map(t=>t.model===m.name?{...t,am:e.target.value}:t));}} style={{...s.input,width:"auto",marginBottom:0,fontSize:12}}>
                {ams.map(a=><option key={a}>{a}</option>)}
              </select>
              <Btn variant="secondary" size="sm" onClick={()=>{setForm({name:m.name,am:m.am,platform:m.platform,status:m.status,flirtLevel:m.flirtLevel});setEditId(m.id);setShowAdd(true);}}>Edit</Btn>
              <Btn variant="danger" size="sm" onClick={()=>setModels(p=>p.map(x=>x.id===m.id?{...x,archived:true,status:"Archived"}:x))}>Archive</Btn>
            </div>
          </div>
        </Card>
      ))}
      {showArchived&&archived.map(m=>(
        <Card key={m.id} style={{marginBottom:8,opacity:0.65,borderLeft:`3px solid ${C.muted}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,color:C.muted}}>{m.name}</div><div style={{fontSize:12,color:C.muted}}>{m.am} · {m.platform}</div></div>
            <Btn variant="secondary" size="sm" color={C.green} onClick={()=>setModels(p=>p.map(x=>x.id===m.id?{...x,archived:false,status:"Active"}:x))}>Restore</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
}
// ── TEAM MANAGEMENT ──────────────────────────────────────────
function TeamManagement({users,setUsers,models}){
  const [showAdd,setShowAdd]=useState(false);const [form,setForm]=useState({name:"",role:"chatter",email:"",password:"charmed123"});const [editId,setEditId]=useState(null);
  const save=()=>{if(!form.name||!form.email)return;if(editId){setUsers(p=>p.map(u=>u.id===editId?{...u,...form}:u));setEditId(null);}else setUsers(p=>[...p,{...form,id:Date.now()}]);setForm({name:"",role:"chatter",email:"",password:"charmed123"});setShowAdd(false);};
  return(
    <div>
      <SectionHeader icon="🧑‍💼" title="Team" action={<Btn size="sm" onClick={()=>setShowAdd(true)}>+ Add Member</Btn>}/>
      {showAdd&&(
        <Modal title={editId?"Edit Member":"New Team Member"} onClose={()=>{setShowAdd(false);setEditId(null);}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Sarah"/>
            <Sel label="Role" value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} options={ALL_ROLES}/>
            <Input label="Email" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} placeholder="sarah@charmed.com"/>
            <Input label="Password" value={form.password} onChange={v=>setForm(p=>({...p,password:v}))} placeholder="Password"/>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>{setShowAdd(false);setEditId(null);}}>Cancel</Btn>
            <Btn size="sm" onClick={save}>{editId?"Save":"Add"}</Btn>
          </div>
        </Modal>
      )}
      {ALL_ROLES.map(role=>{const members=users.filter(u=>u.role===role);if(!members.length)return null;return(
        <div key={role} style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:roleColors[role],marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>{roleLabel[role]}s · {members.length}</div>
          {members.map(u=>(
            <Card key={u.id} style={{marginBottom:8,borderLeft:`3px solid ${roleColors[u.role]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div><div style={{fontWeight:700}}>{u.name}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{u.email}</div>{role==="am"&&<div style={{fontSize:12,color:C.blue,marginTop:2}}>Models: {models.filter(m=>m.am===u.name&&!m.archived).map(m=>m.name).join(", ")||"None"}</div>}</div>
                <div style={{display:"flex",gap:6}}>
                  <Btn variant="secondary" size="sm" onClick={()=>{setForm({name:u.name,role:u.role,email:u.email,password:u.password});setEditId(u.id);setShowAdd(true);}}>Edit</Btn>
                  {u.role!=="leadership"&&<Btn variant="danger" size="sm" onClick={()=>setUsers(p=>p.filter(x=>x.id!==u.id))}>Remove</Btn>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );})}
    </div>
  );
}
// ── ADMIN ────────────────────────────────────────────────────
function AdminPanel({users,setUsers,models,setModels,platforms,setPlatforms,modelPlatforms,setModelPlatforms}){
  const [tab,setTab]=useState("users");const [editId,setEditId]=useState(null);const blank={name:"",role:"chatter",email:"",password:"charmed123"};const [form,setForm]=useState(blank);const [showAdd,setShowAdd]=useState(false);const [newPlat,setNewPlat]=useState("");const [newMPlat,setNewMPlat]=useState("");
  const saveUser=()=>{if(!form.name||!form.email)return;if(editId){setUsers(p=>p.map(u=>u.id===editId?{...u,...form}:u));setEditId(null);}else setUsers(p=>[...p,{...form,id:Date.now()}]);setForm(blank);setShowAdd(false);};
  const addPlat=(list,set,val,setVal)=>{const v=val.trim();if(!v||list.includes(v))return;set(p=>[...p,v]);setVal("");};
  return(
    <div>
      <SectionHeader icon="⚙️" title="Admin Panel"/>
      <Tabs tabs={[["users","Users"],["roles","Roles"],["platforms","Platforms"]]} active={tab} onChange={setTab}/>
      {showAdd&&(
        <Modal title={editId?"Edit User":"New User"} onClose={()=>{setShowAdd(false);setEditId(null);}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="Sarah"/>
            <Sel label="Role" value={form.role} onChange={v=>setForm(p=>({...p,role:v}))} options={ALL_ROLES}/>
            <Input label="Email" value={form.email} onChange={v=>setForm(p=>({...p,email:v}))} placeholder="sarah@charmed.com"/>
            <Input label="Password" value={form.password} onChange={v=>setForm(p=>({...p,password:v}))} placeholder="Password"/>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>{setShowAdd(false);setEditId(null);}}>Cancel</Btn>
            <Btn size="sm" onClick={saveUser}>{editId?"Save":"Add"}</Btn>
          </div>
        </Modal>
      )}
      {tab==="users"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{ALL_ROLES.map(r=><Badge key={r} label={`${roleLabel[r]}: ${users.filter(u=>u.role===r).length}`} color={roleColors[r]}/>)}</div>
            <Btn size="sm" onClick={()=>{setShowAdd(true);setEditId(null);setForm(blank);}}>+ New User</Btn>
          </div>
          {ALL_ROLES.map(role=>{const members=users.filter(u=>u.role===role);if(!members.length)return null;return(
            <div key={role} style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:700,color:roleColors[role],marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>{roleLabel[role]}s · {members.length}</div>
              {members.map(u=>(
                <Card key={u.id} style={{marginBottom:8,borderLeft:`3px solid ${roleColors[u.role]}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div><div style={{fontWeight:700}}>{u.name}</div><div style={{fontSize:12,color:C.muted}}>{u.email} · pw: {u.password}</div></div>
                    <div style={{display:"flex",gap:6}}>
                      <Btn variant="secondary" size="sm" onClick={()=>{setForm({name:u.name,role:u.role,email:u.email,password:u.password});setEditId(u.id);setShowAdd(true);}}>Edit</Btn>
                      <Btn variant="secondary" size="sm" color={C.yellow} onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,password:"charmed123"}:x))}>Reset PW</Btn>
                      {u.role!=="leadership"&&<Btn variant="danger" size="sm" onClick={()=>setUsers(p=>p.filter(x=>x.id!==u.id))}>Remove</Btn>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );})}
        </div>
      )}
      {tab==="roles"&&(
        <div>
          {[{role:"leadership",perms:["Full access","Admin panel","All reports","User management"]},{role:"ops-assistant",perms:["Models & team","Shift scheduling","To-dos","No financials"]},{role:"am",perms:["Own models","BOS/EOS","Fans & campaigns","TTK editor"]},{role:"chatlead",perms:["Sales logging","QA reviews","Handoffs","Quick ref"]},{role:"chatter",perms:["Sales logging","Handoffs","Quick ref","To-dos"]}].map(({role,perms})=>(
            <Card key={role} style={{marginBottom:10,borderLeft:`3px solid ${roleColors[role]}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontWeight:700}}>{roleLabel[role]}</span><Badge label={`${users.filter(u=>u.role===role).length} users`} color={roleColors[role]}/></div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{perms.map(p=><span key={p} style={{fontSize:12,background:roleColors[role]+"15",color:roleColors[role],padding:"3px 10px",borderRadius:99,fontWeight:600}}>{p}</span>)}</div>
            </Card>
          ))}
        </div>
      )}
      {tab==="platforms"&&(
        <div>
          {[["Promo Platforms","Used in the Promo Log",platforms,setPlatforms,DEFAULT_PLATFORMS,newPlat,setNewPlat],["Model Platforms","Used when adding models",modelPlatforms,setModelPlatforms,DEFAULT_MODEL_PLATFORMS,newMPlat,setNewMPlat]].map(([title,sub,list,set,defaults,nv,setNv])=>(
            <Card key={title} style={{marginBottom:16}}>
              <div style={{fontWeight:700,marginBottom:2}}>{title}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{sub}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {list.map(p=>(
                  <div key={p} style={{display:"flex",alignItems:"center",gap:5,background:C.bg,border:`1px solid ${C.border}`,borderRadius:99,padding:"4px 12px"}}>
                    <span style={{fontSize:13,fontWeight:600}}>{p}</span>
                    {defaults.includes(p)?<span style={{fontSize:10,color:C.muted}}>default</span>:<button onClick={()=>set(list.filter(x=>x!==p))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={nv} onChange={e=>setNv(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPlat(list,set,nv,setNv)} placeholder="Add new…" style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
                <Btn size="sm" onClick={()=>addPlat(list,set,nv,setNv)}>Add</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
// ── DAILY SUMMARY ────────────────────────────────────────────
function DailySummary({tasks,sales,handoffs,shifts,fans,qaLogs,models}){
  const totalRev=sales.reduce((a,s)=>a+Number(s.amount),0);
  const done=tasks.filter(t=>["bos","eos","content","notion","promos"].every(k=>t[k]===true)).length;
  const flagged=fans.filter(f=>f.flag);
  const gaps=SHIFTS.filter(sh=>!shifts.find(x=>x.shift===sh&&x.date===today()));
  const [copied,setCopied]=useState(false);
  const discord=`📊 DAILY SUMMARY — ${today()}\n\n💰 Revenue: ${fmtMoney(totalRev)}\n✅ Tasks Complete: ${done}/${tasks.length}\n🔄 Handoffs: ${handoffs.length}\n🎯 QA Reviews: ${qaLogs.length}\n⚠️ Flagged Fans: ${flagged.length}\n${gaps.length>0?`🚨 Uncovered Shifts: ${gaps.join(", ")}\n`:""}\n📋 Model Status:\n${models.filter(m=>!m.archived).map(m=>{const t=tasks.find(x=>x.model===m.name);const pct=t?Math.round(["bos","eos","content","notion","promos"].filter(k=>t[k]===true).length/5*100):0;return`  • ${m.name} — ${pct}% tasks done`;}).join("\n")}`;
  return(
    <div>
      <SectionHeader icon="📊" title="Daily Summary"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Revenue" value={fmtMoney(totalRev)} color={C.green}/>
        <StatCard label="Tasks Complete" value={`${done}/${tasks.length}`} color={done===tasks.length?C.green:C.yellow}/>
        <StatCard label="Handoffs Logged" value={handoffs.length} color={C.blue}/>
        <StatCard label="Flagged Fans" value={flagged.length} color={flagged.length>0?C.red:C.green}/>
      </div>
      {gaps.length>0&&<Card style={{marginBottom:16,background:C.redL,border:`1px solid ${C.red}25`}}><div style={{fontWeight:700,color:C.red,marginBottom:4}}>🚨 Uncovered Shifts</div><div style={{fontSize:13,color:C.red}}>{gaps.join(" · ")}</div></Card>}
      <Card style={{background:C.dark}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontWeight:700,color:C.white,fontSize:13}}>Discord Summary</span>
          <Btn variant="secondary" size="sm" color={copied?C.green:"#94a3b8"} style={{borderColor:copied?C.green:"#475569"}} onClick={()=>{navigator.clipboard?.writeText(discord);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{copied?"Copied ✓":"Copy"}</Btn>
        </div>
        <pre style={{margin:0,color:"#94a3b8",fontSize:12,whiteSpace:"pre-wrap",fontFamily:"monospace",lineHeight:1.8}}>{discord}</pre>
      </Card>
    </div>
  );
}
// ── CHATTER PERFORMANCE ──────────────────────────────────────
function ChatterPerformance({sales,qaLogs,users}){
  const chatters=users.filter(u=>u.role==="chatter"||u.role==="chatlead");
  const scoreCol=sc=>sc>=80?C.green:sc>=60?C.yellow:C.red;
  const stats=chatters.map(u=>{const us=sales.filter(s=>s.chatter===u.name);const qa=qaLogs.filter(q=>q.chatter===u.name);const avg=qa.length?Math.round(qa.reduce((a,q)=>a+q.score,0)/qa.length):null;return{name:u.name,role:u.role,rev:us.reduce((a,s)=>a+Number(s.amount),0),count:us.length,avg,violations:qa.filter(q=>q.hardNoViolation).length};}).sort((a,b)=>b.rev-a.rev);
  return(
    <div>
      <SectionHeader icon="🏆" title="Chatter Performance"/>
      {stats.map((c,i)=>(
        <Card key={c.name} style={{marginBottom:10,borderLeft:`3px solid ${i===0?"#f59e0b":i===1?"#94a3b8":C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{width:30,height:30,borderRadius:99,background:i===0?"#fef3c7":C.bg,color:i===0?C.yellow:C.muted,fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>#{i+1}</span>
              <div><div style={{fontWeight:700}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{roleLabel[c.role]} · {c.count} sales</div></div>
            </div>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:C.green}}>{fmtMoney(c.rev)}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>Revenue</div></div>
              <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:c.avg!==null?scoreCol(c.avg):C.muted}}>{c.avg!==null?`${c.avg}%`:"—"}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>QA Score</div></div>
              {c.violations>0&&<Badge label={`${c.violations} violation${c.violations>1?"s":""}`} color={C.red}/>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
// ── CUSTOMS TRACKER ──────────────────────────────────────────
const CUSTOM_STATUSES=["Pending Confirmation","In Progress","Sent to Fan","Paid"];
const statusColor={"Pending Confirmation":C.yellow,"In Progress":C.blue,"Sent to Fan":C.purple,"Paid":C.green};
function CustomsTracker({user,customs,setCustoms,models}){
  const allModels=models.filter(m=>!m.archived).map(m=>m.name);
  const [showAdd,setShowAdd]=useState(false);
  const [fm,setFm]=useState("All");
  const [fs,setFs]=useState("All");
  const blank={model:allModels[0]||"",price:"",fan:"",description:"",paid:false,status:"Pending Confirmation"};
  const [form,setForm]=useState(blank);
  const filtered=customs.filter(c=>(fm==="All"||c.model===fm)&&(fs==="All"||c.status===fs));
  const totalValue=filtered.reduce((a,c)=>a+Number(c.price||0),0);
  const paidValue=filtered.filter(c=>c.paid).reduce((a,c)=>a+Number(c.price||0),0);
  const unpaidCount=filtered.filter(c=>!c.paid).length;
  const submit=()=>{
    if(!form.fan||!form.description||!form.price)return;
    setCustoms(p=>[{...form,id:Date.now(),price:Number(form.price),loggedBy:user.name,date:today()},...p]);
    setForm(blank);setShowAdd(false);
  };
  const updateField=(id,field,val)=>setCustoms(p=>p.map(c=>c.id===id?{...c,[field]:val}:c));
  return(
    <div>
      <SectionHeader icon="🎨" title="Customs Tracker"
        action={<Btn size="sm" onClick={()=>setShowAdd(true)}>+ Log Custom</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Value" value={fmtMoney(totalValue)} color={C.purple}/>
        <StatCard label="Collected" value={fmtMoney(paidValue)} color={C.green}/>
        <StatCard label="Awaiting Payment" value={unpaidCount} color={unpaidCount>0?C.yellow:C.green}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{allModels.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={fs} onChange={e=>setFs(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{CUSTOM_STATUSES.map(st=><option key={st}>{st}</option>)}
        </select>
      </div>
      {showAdd&&(
        <Modal title="Log Custom Order" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={allModels}/>
            <Input label="Price ($)" value={form.price} onChange={v=>setForm(p=>({...p,price:v}))} placeholder="250" type="number"/>
            <Input label="Fan Username" value={form.fan} onChange={v=>setForm(p=>({...p,fan:v}))} placeholder="fanusername" style={{gridColumn:"1/-1"}}/>
          </div>
          <TA label="Custom Description" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="e.g. Personalised beach video, mention his name" rows={3}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={CUSTOM_STATUSES}/>
            <div style={{marginBottom:14}}>
              <label style={s.label}>Paid?</label>
              <div style={{display:"flex",gap:8,marginTop:2}}>
                {[["Yes",true],["No",false]].map(([l,v])=>(
                  <button key={l} onClick={()=>setForm(p=>({...p,paid:v}))}
                    style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${form.paid===v?C.purple:C.border}`,background:form.paid===v?C.purpleXL:C.white,color:form.paid===v?C.purple:C.muted,fontWeight:600,fontSize:13,cursor:"pointer"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={submit}>Log Custom</Btn>
          </div>
        </Modal>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(c=>(
          <Card key={c.id} style={{borderLeft:`3px solid ${statusColor[c.status]}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <Badge label={c.model} color={C.blue}/>
                <span style={{fontWeight:700,fontSize:15,color:C.green}}>{fmtMoney(c.price)}</span>
                <Badge label={c.fan} color={C.muted} bg="#f1f5f9"/>
                <Badge label={c.paid?"Paid ✓":"Unpaid"} color={c.paid?C.green:C.yellow}/>
              </div>
              <span style={{fontSize:11,color:C.muted}}>{c.loggedBy} · {c.date}</span>
            </div>
            <p style={{fontSize:13,color:C.text,margin:"0 0 12px",lineHeight:1.5}}>{c.description}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <select value={c.status} onChange={e=>updateField(c.id,"status",e.target.value)}
                style={{...s.input,width:"auto",marginBottom:0,fontSize:12,padding:"5px 10px",borderColor:statusColor[c.status],color:statusColor[c.status],fontWeight:700}}>
                {CUSTOM_STATUSES.map(st=><option key={st}>{st}</option>)}
              </select>
              <button onClick={()=>updateField(c.id,"paid",!c.paid)}
                style={{padding:"5px 14px",borderRadius:8,border:`1.5px solid ${c.paid?C.green:C.border}`,background:c.paid?C.greenL:C.white,color:c.paid?C.green:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {c.paid?"✓ Paid":"Mark Paid"}
              </button>
              <button onClick={()=>setCustoms(p=>p.filter(x=>x.id!==c.id))}
                style={{marginLeft:"auto",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>
                Remove
              </button>
            </div>
          </Card>
        ))}
        {!filtered.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No customs logged yet</div>}
      </div>
    </div>
  );
}
// ── DASHBOARDS ───────────────────────────────────────────────
function LeadershipDashboard({user,tasks,setTasks,fans,sales,campaigns,setCampaigns,handoffs,setHandoffs,content,setContent,promos,setPromos,todos,setTodos,models,setModels,users,setUsers,shifts,setShifts,slingApiKey,setSlingApiKey,boseos,setBoseos,platforms,setPlatforms,modelPlatforms,setModelPlatforms,ttks,setTtks,massMessages,setMassMessages,qaLogs,setQaLogs,customs,setCustoms}){
  const [tab,setTab]=useState("overview");
  const allModels=models.filter(m=>!m.archived).map(m=>m.name);
  const amStats=users.filter(u=>u.role==="am").map(am=>{const t=tasks.filter(x=>x.am===am.name);const keys=["bos","eos","content","notion","promos"];const total=t.length*keys.length,done=t.reduce((a,x)=>a+keys.filter(k=>x[k]===true).length,0),inc=t.reduce((a,x)=>a+keys.filter(k=>x[k]===false).length,0);return{am:am.name,pct:total?Math.round(done/total*100):0,inc,done,total};});
  const totalRev=sales.reduce((a,s)=>a+Number(s.amount),0);
  const flagged=fans.filter(f=>f.flag);
  const low=models.filter(m=>!m.archived&&campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length<2);
  const alerts=buildAlerts(tasks,shifts,models,campaigns,fans);
  const navTabs=[["overview","Overview"],["models","Models"],["team","Team"],["schedule","Schedule"],["sales","Sales"],["campaigns","Campaigns"],["content","Content"],["customs","Customs"],["mass","Mass Msgs"],["qa","QA"],["performance","Performance"],["handoffs","Handoffs"],["summary","Summary"],["todos","To-Dos"],["admin","⚙️ Admin"]];
  return(
    <div>
      <div style={{marginBottom:4}}><span style={{fontSize:22,fontWeight:800}}>Leadership</span></div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{today()} · {models.filter(m=>!m.archived).length} active accounts</div>
      <AlertsBar alerts={alerts}/>
      <Tabs tabs={navTabs} active={tab} onChange={setTab}/>
      {tab==="overview"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          <StatCard label="Today's Revenue" value={fmtMoney(totalRev)} color={C.green}/>
          <StatCard label="Live Campaigns" value={campaigns.filter(c=>c.status==="Live").length} color={C.purple}/>
          <StatCard label="Flagged Fans" value={flagged.length} color={flagged.length>0?C.red:C.green}/>
          <StatCard label="Need Campaigns" value={low.length} color={low.length>0?C.red:C.green}/>
        </div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>AM Accountability</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          {amStats.map(s=>(
            <Card key={s.am}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontWeight:700,fontSize:14}}>{s.am}</span>
                <span style={{fontSize:22,fontWeight:800,color:s.inc>0?C.red:s.pct===100?C.green:C.yellow}}>{s.pct}%</span>
              </div>
              <div style={{height:5,borderRadius:99,background:C.border,marginBottom:8}}><div style={{width:`${s.pct}%`,height:"100%",borderRadius:99,background:s.inc>0?C.red:s.pct===100?C.green:C.yellow,transition:"width 0.3s"}}/></div>
              <div style={{display:"flex",gap:6}}><Badge label={`${s.done}/${s.total} done`} color={C.green}/>{s.inc>0&&<Badge label={`⚠ ${s.inc} incomplete`} color={C.red}/>}</div>
            </Card>
          ))}
        </div>
        <Card style={{padding:0,overflow:"hidden",marginBottom:20}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:C.dark,color:"#94a3b8"}}>{["AM","Model","BOS","EOS","Content","Notion","Promos","Notes"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:["AM","Model","Notes"].includes(h)?"left":"center",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
              <tbody>{tasks.map((t,ri)=>{const inc=["bos","eos","content","notion","promos"].some(k=>t[k]===false),all=["bos","eos","content","notion","promos"].every(k=>t[k]===true);return(
                <tr key={t.id} style={{background:inc?C.redL:all?C.greenL:ri%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"8px 14px",fontWeight:600}}>{t.am}</td>
                  <td style={{padding:"8px 14px",color:C.muted}}>{t.model}</td>
                  {["bos","eos","content","notion","promos"].map(k=><td key={k} style={{padding:"8px 14px",textAlign:"center"}}><TaskCell val={t[k]} onChange={v=>setTasks(p=>p.map(r=>r.id===t.id?{...r,[k]:v}:r))}/></td>)}
                  <td style={{padding:"8px 14px"}}><input value={t.notes} onChange={e=>setTasks(p=>p.map(r=>r.id===t.id?{...r,notes:e.target.value}:r))} style={{...s.input,width:140,padding:"4px 8px",fontSize:12}}/></td>
                </tr>
              );})}</tbody>
            </table>
          </div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Card><div style={{fontWeight:700,marginBottom:12,color:C.red,fontSize:13}}>⚠ Flagged Fans</div>{!flagged.length?<div style={{color:C.muted,fontSize:13}}>None ✓</div>:flagged.map(f=><div key={f.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><div style={{fontWeight:600}}>{f.username} <Badge label={f.type} color={C.red}/></div><div style={{color:C.muted,fontSize:12}}>{f.model} · {f.notes}</div></div>)}</Card>
          <Card><div style={{fontWeight:700,marginBottom:12,color:C.yellow,fontSize:13}}>⚠ Low Campaigns</div>{!low.length?<div style={{color:C.muted,fontSize:13}}>All good ✓</div>:low.map(m=><div key={m.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><div style={{fontWeight:600}}>{m.name}</div><div style={{color:C.muted,fontSize:12}}>AM: {m.am}</div></div>)}</Card>
        </div>
      </div>}
      {tab==="models"&&<ModelManagement models={models} setModels={setModels} users={users} tasks={tasks} setTasks={setTasks} modelPlatforms={modelPlatforms}/>}
      {tab==="team"&&<TeamManagement users={users} setUsers={setUsers} models={models}/>}
      {tab==="schedule"&&<ShiftSchedule shifts={shifts} setShifts={setShifts} users={users} models={models} slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={()=>{}} isLeadership={true} isAM={false} myModels={allModels} users={users}/>}
      {tab==="campaigns"&&<CampaignCalendar campaigns={campaigns} setCampaigns={setCampaigns} isLeadership={true} isAM={false} myModels={allModels} models={models}/>}
      {tab==="content"&&<ContentLog user={user} content={content} setContent={()=>{}} promos={promos} setPromos={()=>{}} myModels={allModels} isLeadership={true} platforms={platforms}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="mass"&&<MassMessageTracker user={user} massMessages={massMessages} setMassMessages={setMassMessages} myModels={allModels} isLeadership={true} isAM={false}/>}
      {tab==="qa"&&<QAReview user={user} qaLogs={qaLogs} setQaLogs={setQaLogs} users={users} models={models}/>}
      {tab==="performance"&&<ChatterPerformance sales={sales} qaLogs={qaLogs} users={users}/>}
      {tab==="handoffs"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={true} isAM={false} models={models}/>}
      {tab==="summary"&&<DailySummary tasks={tasks} sales={sales} handoffs={handoffs} shifts={shifts} fans={fans} qaLogs={qaLogs} models={models}/>}
      {tab==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={allModels}/>}
      {tab==="admin"&&<AdminPanel users={users} setUsers={setUsers} models={models} setModels={setModels} platforms={platforms} setPlatforms={setPlatforms} modelPlatforms={modelPlatforms} setModelPlatforms={setModelPlatforms}/>}
    </div>
  );
}
function OpsAssistantDashboard({user,models,setModels,users,setUsers,shifts,setShifts,tasks,setTasks,todos,setTodos,slingApiKey,setSlingApiKey,modelPlatforms,customs,setCustoms}){
  const [tab,setTab]=useState("models");
  const allModels=models.filter(m=>!m.archived).map(m=>m.name);
  return(
    <div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Ops Dashboard</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{today()}</div>
      <Tabs tabs={[["models","Models"],["team","Team"],["schedule","Schedule"],["customs","Customs"],["todos","To-Dos"]]} active={tab} onChange={setTab}/>
      {tab==="models"&&<ModelManagement models={models} setModels={setModels} users={users} tasks={tasks} setTasks={setTasks} modelPlatforms={modelPlatforms}/>}
      {tab==="team"&&<TeamManagement users={users} setUsers={setUsers} models={models}/>}
      {tab==="schedule"&&<ShiftSchedule shifts={shifts} setShifts={setShifts} users={users} models={models} slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={allModels}/>}
    </div>
  );
}
function AMDashboard({user,tasks,setTasks,fans,setFans,sales,campaigns,setCampaigns,boseos,setBoseos,handoffs,setHandoffs,content,setContent,promos,setPromos,todos,setTodos,models,ttks,setTtks,massMessages,setMassMessages,platforms,qaLogs,setQaLogs,users,slingApiKey,setSlingApiKey,shifts,customs,setCustoms}){
  const [tab,setTab]=useState("overview");
  const myModels=models.filter(m=>m.am===user.name&&!m.archived).map(m=>m.name);
  const myTasks=tasks.filter(t=>t.am===user.name);
  const myFans=fans.filter(f=>myModels.includes(f.model));
  const [newFan,setNewFan]=useState({username:"",type:"Whale",spend:"",notes:"",flag:false,model:myModels[0]||""});
  const navTabs=[["overview","Overview"],["todos","To-Dos"],["ttk","TTK Editor"],["mass","Mass Msgs"],["content","Content"],["customs","Customs"],["fans","Fans"],["sales","Sales"],["campaigns","Campaigns"],["boseos","BOS/EOS"],["qa","QA"],["schedule","Sling"]];
  return(
    <div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Hey {user.name} 👋</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{today()}</div>
      <Tabs tabs={navTabs} active={tab} onChange={setTab}/>
      {tab==="overview"&&<div>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Today's Tasks</div>
        {myTasks.map(t=>{const keys=["bos","eos","content","notion","promos"],done=keys.filter(k=>t[k]===true).length,hasInc=keys.some(k=>t[k]===false);return(
          <Card key={t.id} style={{marginBottom:12,borderLeft:`3px solid ${hasInc?C.red:done===keys.length?C.green:C.purple}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:14}}>{t.model}</span>
              <Badge label={`${done}/${keys.length}`} color={done===keys.length?C.green:C.purple}/>
            </div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["bos","BOS"],["eos","EOS"],["content","Content"],["notion","Notion"],["promos","Promos"]].map(([k,l])=>(
                <div key={k} style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:4,textTransform:"uppercase",fontWeight:600,letterSpacing:"0.05em"}}>{l}</div>
                  <TaskCell val={t[k]} onChange={v=>setTasks(p=>p.map(r=>r.id===t.id?{...r,[k]:v}:r))}/>
                </div>
              ))}
            </div>
            <input value={t.notes} onChange={e=>setTasks(p=>p.map(r=>r.id===t.id?{...r,notes:e.target.value}:r))} placeholder="Notes…" style={{...s.input,marginTop:12}}/>
          </Card>
        );})}
        <div style={{marginTop:20,fontSize:14,fontWeight:700,marginBottom:12}}>Open To-Dos</div>
        {todos.filter(t=>t.owner===user.name&&!t.done).slice(0,3).map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.white,borderRadius:10,marginBottom:6,boxShadow:"0 1px 3px rgba(0,0,0,0.05)",borderLeft:`3px solid ${{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}`}}>
            <input type="checkbox" onChange={()=>setTodos(p=>p.map(x=>x.id===t.id?{...x,done:true}:x))} style={{cursor:"pointer"}}/>
            <div style={{flex:1,fontSize:13,fontWeight:600}}>{t.task}</div>
            {t.model&&<Badge label={t.model} color={C.blue}/>}
            <Badge label={t.priority} color={{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}/>
          </div>
        ))}
        {!todos.filter(t=>t.owner===user.name&&!t.done).length&&<div style={{color:C.muted,fontSize:13}}>All clear ✓</div>}
      </div>}
      {tab==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={myModels}/>}
      {tab==="ttk"&&<TTKEditor user={user} ttks={ttks} setTtks={setTtks} myModels={myModels}/>}
      {tab==="mass"&&<MassMessageTracker user={user} massMessages={massMessages} setMassMessages={setMassMessages} myModels={myModels} isLeadership={false} isAM={true}/>}
      {tab==="content"&&<ContentLog user={user} content={content} setContent={setContent} promos={promos} setPromos={setPromos} myModels={myModels} isLeadership={false} platforms={platforms}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="fans"&&<div>
        <SectionHeader icon="🌟" title="Fans" action={null}/>
        {myFans.map(f=>(
          <Card key={f.id} style={{marginBottom:10,borderLeft:`3px solid ${f.type==="Whale"?C.purple:f.type==="Problem Fan"?C.red:f.type==="VIP"?C.yellow:C.blue}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:700}}>{f.username}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{f.model} · {f.spend}</div></div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><Badge label={f.type} color={f.type==="Whale"?C.purple:f.type==="Problem Fan"?C.red:f.type==="VIP"?C.yellow:C.blue}/>{f.flag&&<Badge label="⚠" color={C.red}/>}</div>
            </div>
            {f.notes&&<p style={{fontSize:13,color:C.muted,margin:"6px 0 0"}}>{f.notes}</p>}
          </Card>
        ))}
        <Card style={{marginTop:12}}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:13}}>Add Fan</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Username" value={newFan.username} onChange={v=>setNewFan(p=>({...p,username:v}))} placeholder="fanusername"/>
            <Input label="Spend" value={newFan.spend} onChange={v=>setNewFan(p=>({...p,spend:v}))} placeholder="$500"/>
            <Sel label="Model" value={newFan.model} onChange={v=>setNewFan(p=>({...p,model:v}))} options={myModels}/>
            <Sel label="Type" value={newFan.type} onChange={v=>setNewFan(p=>({...p,type:v}))} options={["Whale","VIP","Watch List","Problem Fan"]}/>
            <Input label="Notes" value={newFan.notes} onChange={v=>setNewFan(p=>({...p,notes:v}))} placeholder="Key notes" style={{gridColumn:"1/-1"}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <input type="checkbox" checked={newFan.flag} onChange={e=>setNewFan(p=>({...p,flag:e.target.checked}))}/><label style={{fontSize:13,color:C.red,fontWeight:600}}>⚠ Flag this fan</label>
          </div>
          <Btn size="sm" onClick={()=>{if(!newFan.username)return;setFans(p=>[...p,{...newFan,id:Date.now()}]);setNewFan({username:"",type:"Whale",spend:"",notes:"",flag:false,model:myModels[0]||""});}}>Add Fan</Btn>
        </Card>
      </div>}
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={()=>{}} isLeadership={false} isAM={true} myModels={myModels} users={users}/>}
      {tab==="campaigns"&&<CampaignCalendar campaigns={campaigns} setCampaigns={setCampaigns} isLeadership={false} isAM={true} myModels={myModels} models={models}/>}
      {tab==="boseos"&&<BOSEOSView user={user} boseos={boseos} setBoseos={setBoseos} tasks={tasks} setTasks={setTasks} myModels={myModels}/>}
      {tab==="qa"&&<QAReview user={user} qaLogs={qaLogs} setQaLogs={setQaLogs} users={users} models={models}/>}
      {tab==="schedule"&&<ShiftSchedule shifts={shifts} setShifts={()=>{}} users={users} models={models} slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
    </div>
  );
}
function ChatterDashboard({user,sales,setSales,handoffs,setHandoffs,fans,todos,setTodos,shifts,models,qaLogs,users,slingApiKey,setSlingApiKey,customs,setCustoms}){
  const [tab,setTab]=useState("sales");
  const todayShift=shifts.find(sh=>sh.chatter===user.name&&sh.date===today());
  const myModels=todayShift?todayShift.models:models.filter(m=>!m.archived).map(m=>m.name);
  const mySales=sales.filter(s=>s.chatter===user.name);
  const todayRev=mySales.reduce((a,s)=>a+Number(s.amount),0);
  const myQA=qaLogs.filter(q=>q.chatter===user.name);
  const avgQA=myQA.length?Math.round(myQA.reduce((a,q)=>a+q.score,0)/myQA.length):null;
  const scoreCol=sc=>sc>=80?C.green:sc>=60?C.yellow:C.red;
  return(
    <div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Hey {user.name} 👋</div>
      {todayShift?<div style={{fontSize:13,color:C.green,marginBottom:4,fontWeight:600}}>✓ On shift: {todayShift.shift} · {myModels.join(", ")}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:4}}>No shift scheduled today</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Revenue Today" value={fmtMoney(todayRev)} color={C.pink}/>
        <StatCard label="Sales" value={mySales.length} color={C.purple}/>
        <StatCard label="QA Score" value={avgQA!==null?`${avgQA}%`:"—"} color={avgQA!==null?scoreCol(avgQA):C.muted}/>
        <StatCard label="Open To-Dos" value={todos.filter(t=>t.owner===user.name&&!t.done).length} color={C.blue}/>
      </div>
      <Tabs tabs={[["sales","Sales"],["customs","Customs"],["handoff","Handoff"],["ref","Quick Ref"],["todos","To-Dos"],["schedule","Sling"]]} active={tab} onChange={setTab}/>
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={setSales} isLeadership={false} isAM={false} myModels={myModels} users={users}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="handoff"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={false} isAM={false} models={models}/>}
      {tab==="ref"&&<div>
        <SectionHeader icon="📋" title="Quick Reference"/>
        {models.filter(m=>myModels.includes(m.name)).map(m=>{const ttk=INIT_TTKS.find(t=>t.model===m.name);const wh=fans.filter(f=>f.model===m.name&&f.type==="Whale");return(
          <Card key={m.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
              <Badge label={m.flirtLevel} color={C.purple}/>
            </div>
            {ttk&&<div style={{background:C.bg,borderRadius:8,padding:"10px 12px",fontSize:13}}>
              <div><b>Voice:</b> {ttk.voice}</div>
              <div style={{marginTop:4}}><b>Call fans:</b> {ttk.endearments}</div>
              <div style={{marginTop:4,color:C.red,fontWeight:600}}>🚫 Never: {ttk.hardNos}</div>
              <div style={{marginTop:4,color:C.muted}}>Offline: {ttk.offlineTimes}</div>
              {ttk.scripts?.length>0&&<div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scripts</div>
                {ttk.scripts.map(sc=><div key={sc.id} style={{marginBottom:6}}><div style={{fontSize:11,fontWeight:700,color:C.purple}}>{sc.trigger}</div><div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>"{sc.response}"</div></div>)}
              </div>}
            </div>}
            {wh.length>0&&<div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Whales</div>{wh.map(f=><div key={f.id} style={{fontSize:12,padding:"2px 0",color:C.purple,fontWeight:600}}>{f.username} — {f.notes}</div>)}</div>}
          </Card>
        );})}
        <Card style={{background:C.redL,border:`1px solid ${C.red}25`}}>
          <div style={{fontWeight:700,color:C.red,marginBottom:8}}>🚨 Escalation Protocol</div>
          <div style={{fontSize:13,lineHeight:1.9}}><b>Suicide/self-harm:</b> Use script → screenshot → #escalations → stop responding<br/><b>Illegal/minor:</b> Do not respond → screenshot → #escalations immediately<br/><b>Meetup request:</b> Deflect with script → redirect to content</div>
        </Card>
      </div>}
      {tab==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={myModels}/>}
      {tab==="schedule"&&<SlingWidget slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
    </div>
  );
}
function ChatLeadDashboard({user,sales,setSales,handoffs,setHandoffs,fans,todos,setTodos,shifts,models,qaLogs,setQaLogs,users,slingApiKey,setSlingApiKey,customs,setCustoms}){
  const [tab,setTab]=useState("sales");
  const todayShift=shifts.find(sh=>sh.chatter===user.name&&sh.date===today());
  const myModels=todayShift?todayShift.models:models.filter(m=>!m.archived).map(m=>m.name);
  const mySales=sales.filter(s=>s.chatter===user.name);
  const todayRev=mySales.reduce((a,s)=>a+Number(s.amount),0);
  return(
    <div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>Hey {user.name} 👋</div>
      {todayShift?<div style={{fontSize:13,color:C.green,marginBottom:4,fontWeight:600}}>✓ On shift: {todayShift.shift} · {myModels.join(", ")}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:4}}>No shift scheduled today</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Revenue Today" value={fmtMoney(todayRev)} color={C.green}/>
        <StatCard label="QA Reviews" value={qaLogs.filter(q=>q.reviewer===user.name).length} color={C.purple}/>
        <StatCard label="Open To-Dos" value={todos.filter(t=>t.owner===user.name&&!t.done).length} color={C.blue}/>
      </div>
      <Tabs tabs={[["sales","Sales"],["customs","Customs"],["qa","QA Reviews"],["handoff","Handoff"],["ref","Quick Ref"],["todos","To-Dos"],["schedule","Sling"]]} active={tab} onChange={setTab}/>
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={setSales} isLeadership={false} isAM={false} myModels={myModels} users={users}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="qa"&&<QAReview user={user} qaLogs={qaLogs} setQaLogs={setQaLogs} users={users} models={models}/>}
      {tab==="handoff"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={false} isAM={false} models={models}/>}
      {tab==="ref"&&<div>
        <SectionHeader icon="📋" title="Quick Reference"/>
        {models.filter(m=>myModels.includes(m.name)).map(m=>{const ttk=INIT_TTKS.find(t=>t.model===m.name);const wh=fans.filter(f=>f.model===m.name&&f.type==="Whale");return(
          <Card key={m.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontWeight:700,fontSize:14}}>{m.name}</span><Badge label={m.flirtLevel} color={C.purple}/></div>
            {ttk&&<div style={{background:C.bg,borderRadius:8,padding:"10px 12px",fontSize:13}}><div><b>Voice:</b> {ttk.voice}</div><div style={{marginTop:4,color:C.red,fontWeight:600}}>🚫 Never: {ttk.hardNos}</div></div>}
            {wh.length>0&&<div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Whales</div>{wh.map(f=><div key={f.id} style={{fontSize:12,color:C.purple,fontWeight:600}}>{f.username} — {f.notes}</div>)}</div>}
          </Card>
        );})}
        <Card style={{background:C.redL}}><div style={{fontWeight:700,color:C.red,marginBottom:8}}>🚨 Escalation Protocol</div><div style={{fontSize:13,lineHeight:1.9}}><b>Suicide/self-harm:</b> Script → screenshot → #escalations → stop<br/><b>Illegal/minor:</b> Don't respond → screenshot → #escalations<br/><b>Meetup:</b> Deflect → redirect</div></Card>
      </div>}
      {tab==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={myModels}/>}
      {tab==="schedule"&&<SlingWidget slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
    </div>
  );
}
function LoginView({onLogin,users}){
  const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [err,setErr]=useState("");
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:400,background:"rgba(30,27,75,0.8)",backdropFilter:"blur(20px)",borderRadius:20,padding:40,boxShadow:"0 25px 60px rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:32,fontWeight:900,color:C.white,letterSpacing:-1}}>✦ Charmed</div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:6}}>Operations Platform</div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{...s.label,color:"#94a3b8"}}>Email</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="you@charmed.com"
            style={{...s.input,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:C.white}} onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{...s.label,color:"#94a3b8"}}>Password</label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="••••••••"
            onKeyDown={e=>{if(e.key==="Enter"){const u=users.find(u=>u.email===email&&u.password===pw);if(u)onLogin(u);else setErr("Incorrect.");}}}
            style={{...s.input,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:C.white}} onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}/>
        </div>
        {err&&<div style={{color:"#f87171",fontSize:12,marginBottom:12}}>{err}</div>}
        <button onClick={()=>{const u=users.find(u=>u.email===email&&u.password===pw);if(u)onLogin(u);else setErr("Incorrect email or password.");}}
          style={{width:"100%",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:C.white,border:"none",borderRadius:10,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,boxShadow:"0 4px 15px rgba(124,58,237,0.4)"}}>Sign In</button>
        <div style={{marginTop:20,fontSize:11,color:"#475569",textAlign:"center",lineHeight:2}}>hannah@ · tate@ · jonathan@ · kayla@<br/>chatter1@ · ops@charmed.com<br/>Password: charmed123</div>
      </div>
    </div>
  );
}
// ── ROOT ─────────────────────────────────────────────────────
export default function App(){
  const [users,setUsers]=useState(INIT_USERS);
  const [user,setUser]=useState(null);
  const [models,setModels]=useState(INIT_MODELS);
  const [tasks,setTasks]=useState(initTasks());
  const [fans,setFans]=useState(INIT_FANS);
  const [sales,setSales]=useState(INIT_SALES);
  const [campaigns,setCampaigns]=useState(INIT_CAMPAIGNS);
  const [handoffs,setHandoffs]=useState([]);
  const [boseos,setBoseos]=useState([]);
  const [content,setContent]=useState(INIT_CONTENT);
  const [promos,setPromos]=useState(INIT_PROMOS);
  const [todos,setTodos]=useState(INIT_TODOS);
  const [shifts,setShifts]=useState(INIT_SHIFTS);
  const [slingApiKey,setSlingApiKey]=useState("");
  const [platforms,setPlatforms]=useState(DEFAULT_PLATFORMS);
  const [modelPlatforms,setModelPlatforms]=useState(DEFAULT_MODEL_PLATFORMS);
  const [ttks,setTtks]=useState(INIT_TTKS);
  const [massMessages,setMassMessages]=useState(INIT_MASS);
  const [qaLogs,setQaLogs]=useState(INIT_QA);
  const [customs,setCustoms]=useState(INIT_CUSTOMS);
  const [showSearch,setShowSearch]=useState(false);
  useEffect(()=>{
    const down=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(p=>!p);}if(e.key==="Escape")setShowSearch(false);};
    window.addEventListener("keydown",down);return()=>window.removeEventListener("keydown",down);
  },[]);
  if(!user)return <LoginView onLogin={setUser} users={users}/>;
  const shared={users,models,tasks,setTasks,fans,setFans,sales,setSales,campaigns,setCampaigns,handoffs,setHandoffs,boseos,setBoseos,content,setContent,promos,setPromos,todos,setTodos,shifts,setShifts,slingApiKey,setSlingApiKey,platforms,setPlatforms,modelPlatforms,setModelPlatforms,ttks,setTtks,massMessages,setMassMessages,qaLogs,setQaLogs,customs,setCustoms};
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:C.text}}>
      {showSearch&&<GlobalSearch models={models} users={users} fans={fans} sales={sales} onClose={()=>setShowSearch(false)}/>}
      <div style={{background:C.dark,padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:17,fontWeight:800,color:C.white,letterSpacing:-0.5}}>✦ Charmed</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowSearch(true)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 14px",color:"#94a3b8",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
            🔍 Search <kbd style={{fontSize:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"1px 5px"}}>⌘K</kbd>
          </button>
          <Badge label={roleLabel[user.role]} color={roleColors[user.role]}/>
          <span style={{fontSize:13,color:"#94a3b8"}}>{user.name}</span>
          <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"5px 12px",color:"#94a3b8",cursor:"pointer",fontSize:12,fontWeight:600}}>Sign out</button>
        </div>
      </div>
      <div style={{maxWidth:980,margin:"0 auto",padding:"28px 20px"}}>
        {user.role==="leadership"&&<LeadershipDashboard user={user} {...shared} setModels={setModels} setUsers={setUsers}/>}
        {user.role==="ops-assistant"&&<OpsAssistantDashboard user={user} {...shared} setModels={setModels} setUsers={setUsers}/>}
        {user.role==="am"&&<AMDashboard user={user} {...shared}/>}
        {user.role==="chatlead"&&<ChatLeadDashboard user={user} {...shared}/>}
        {user.role==="chatter"&&<ChatterDashboard user={user} {...shared}/>}
      </div>
    </div>
  );
}
