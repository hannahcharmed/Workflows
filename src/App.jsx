import { useState, useEffect, useMemo } from "react";
const C = {
  dark:"#07070e", mid:"#0f0f1a", slate:"#1a1730",
  purple:"#7c3aed", purpleL:"#b197fc", purpleXL:"#1e1235",
  green:"#10b981", greenL:"#0a2a14",
  red:"#ef4444", redL:"#2a0a0a",
  yellow:"#f59e0b", yellowL:"#2a1a00",
  blue:"#3b82f6", blueL:"#0c1a3a",
  pink:"#c026d3", pinkL:"#2a0a2a",
  orange:"#f97316",
  text:"#f5f0ff", muted:"#9d9abf", border:"rgba(167,139,250,0.28)", bg:"#07070e", white:"#ffffff",
  surface:"rgba(255,255,255,0.06)", surfaceHover:"rgba(255,255,255,0.09)",
};
const roleColors={leadership:C.purple,am:C.blue,chatlead:C.green,chatter:C.pink,"ops-assistant":C.orange,model:"#0ea5e9"};
const roleLabel={leadership:"Leadership",am:"Account Manager",chatlead:"Chat Lead",chatter:"Chatter","ops-assistant":"Ops Assistant",model:"Model"};
const CONTENT_TYPES=["PS","VID","PPV","CUS","LIVE","CLIP","BTS"];
const PRICE_TIERS=["$","$$","$$$"];
const DEFAULT_PLATFORMS=["Instagram","TikTok","Snapchat","X / Twitter","Reddit","Other"];
const DEFAULT_MODEL_PLATFORMS=["OnlyFans","Passes","Both"];
const SHIFTS=["11-7","7-3","3-11"];
const ALL_ROLES=["leadership","am","chatlead","chatter","ops-assistant","model"];
const TTK_SECTIONS=["identity","voice","interests","physical","personal","rules","scripts"];
const OUTREACH_GROUPS=["Subs","Whales","Online Fans","VIPs","Recent Spenders L7","Recent Spenders MTD","Followers"];
function today(){return new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function sendDiscord(webhookUrl,message){if(!webhookUrl||!webhookUrl.startsWith("https://discord.com/api/webhooks/"))return;fetch(webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:message,username:"Charmed Ops"})}).catch(()=>{});}
function fmtMoney(n){return"$"+Number(n).toLocaleString();}
function generateTag(t,th,ti,o){return`${t||"PS"}-${(th||"Untitled").replace(/\s+/g,"")}-${ti||"$"}-${o||1}`;}
// ── ANALYTICS HELPERS ─────────────────────────────────────────
// Contract: format a raw metric number to human-readable string
function fmtMetricVal(n){const num=Number(n||0);return num>=1000?`${(num/1000).toFixed(1)}k`:String(num);}
// Contract: compute engagement rate from raw counts
function calcEngRate(likes,comments,shares,saves,views){
  const eng=Number(likes||0)+Number(comments||0)+Number(shares||0)+Number(saves||0);
  const base=Number(views||0)||Number(likes||0)*5||1;
  return Math.round(eng/base*100*10)/10;
}
// Contract: compute pct change between two metric entries on a given field
// Returns {pct, up, diff} or null if no valid baseline
function calcPctChange(curr,prev,field){
  const c=Number(curr?.[field]||0);const p=Number(prev?.[field]||0);
  if(!p)return null;
  const pct=Math.round((c-p)/p*100);
  return{pct,up:pct>=0,diff:c-p};
}
// Contract: derive date boundary strings for WOW / MOM / YOY periods
function getPeriodDates(period){
  const now=new Date();
  const todayStr=now.toISOString().slice(0,10);
  const thisMonthStr=todayStr.slice(0,7);
  const lastMonthStr=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().slice(0,7);
  const lastYearMonthStr=new Date(now.getFullYear()-1,now.getMonth(),1).toISOString().slice(0,7);
  const thisWeekStart=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
  const lastWeekStart=new Date(Date.now()-14*864e5).toISOString().slice(0,10);
  return{thisMonthStr,lastMonthStr,lastYearMonthStr,thisWeekStart,lastWeekStart};
}
// Contract: returns latest metric entry keyed by "model|platform"
function getLatestMetricsByKey(metrics){
  const latest={};
  metrics.forEach(m=>{const k=`${m.model}|${m.platform}`;if(!latest[k]||m.date>latest[k].date)latest[k]=m;});
  return latest;
}
// Contract: returns most-recent previous-month entry per key, given the latest map
function getPrevMetricsByKey(metrics,latestMap){
  const prev={};
  metrics.filter(e=>{const lat=latestMap[`${e.model}|${e.platform}`];return lat&&e.date<lat.date&&e.date.slice(0,7)<lat.date.slice(0,7);})
    .forEach(m=>{const k=`${m.model}|${m.platform}`;if(!prev[k]||m.date>prev[k].date)prev[k]=m;});
  return prev;
}
// Contract: renders a ↑/↓ percentage-change badge; pct is a signed integer; returns null when pct is null/undefined
const ChgBadge=({pct})=>{
  if(pct===null||pct===undefined)return null;
  const up=pct>=0;
  return(<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,fontWeight:700,color:up?C.green:C.red,background:(up?C.green:C.red)+"18",padding:"2px 8px",borderRadius:99,marginLeft:6}}>{up?"↑":"↓"} {Math.abs(pct)}%</span>);
};
const INIT_USERS=[
  {id:1,name:"Hannah",role:"leadership",email:"hannah@charmed.com",password:"charmed123"},
  {id:2,name:"Tate",role:"am",email:"tate@charmed.com",password:"charmed123"},
  {id:3,name:"Jonathan",role:"am",email:"jonathan@charmed.com",password:"charmed123"},
  {id:4,name:"Kayla",role:"chatlead",email:"kayla@charmed.com",password:"charmed123"},
  {id:5,name:"Cell",role:"chatlead",email:"cell@charmed.com",password:"charmed123"},
  {id:6,name:"Chatter1",role:"chatter",email:"chatter1@charmed.com",password:"charmed123"},
  {id:7,name:"Chatter2",role:"chatter",email:"chatter2@charmed.com",password:"charmed123"},
  {id:8,name:"OpsUser",role:"ops-assistant",email:"ops@charmed.com",password:"charmed123"},
  {id:9,name:"Autumn",role:"model",email:"autumn@charmed.com",password:"charmed123"},
  {id:10,name:"Mia",role:"model",email:"mia@charmed.com",password:"charmed123"},
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
  {id:1,chatter:"Chatter1",model:"Autumn",type:"PPV",amount:120,fanUsername:"bigspender99",note:"Tier 2 beach set",date:new Date().toISOString().slice(0,10),shift:"11-7"},
  {id:2,chatter:"Chatter2",model:"Mia",type:"PPV",amount:200,fanUsername:"whale_miami",note:"Custom video upsell",date:new Date().toISOString().slice(0,10),shift:"7-3"},
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
  {id:1,scope:"model",model:"Autumn",owner:"Tate",task:"Schedule Valentine mass message",priority:"High",status:"In Progress",date:today(),dueDate:"",notes:""},
  {id:2,scope:"personal",model:null,owner:"Tate",task:"Review Mia chat QA",priority:"Medium",status:"Pending",date:today(),dueDate:"",notes:""},
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
const INIT_SOCIAL_METRICS=[
  // March 2026 (current)
  {id:1,model:"Autumn",platform:"TikTok",date:"2026-03-01",followers:45200,views:128000,likes:9200,comments:410,shares:1380,notes:"Spring campaign boosted views"},
  {id:2,model:"Autumn",platform:"Instagram",date:"2026-03-01",followers:12800,views:0,likes:1850,comments:124,shares:0,notes:""},
  {id:3,model:"Autumn",platform:"Snapchat",date:"2026-03-01",followers:8400,views:22000,likes:0,comments:0,shares:0,notes:"Story views up 12%"},
  {id:4,model:"Mia",platform:"TikTok",date:"2026-03-01",followers:31000,views:89000,likes:6100,comments:280,shares:940,notes:""},
  {id:5,model:"Jordan",platform:"Instagram",date:"2026-03-01",followers:9200,views:0,likes:1100,comments:78,shares:0,notes:""},
  // February 2026 (MOM baseline)
  {id:6,model:"Autumn",platform:"TikTok",date:"2026-02-01",followers:41800,views:98000,likes:7200,comments:310,shares:1050,notes:"Feb baseline"},
  {id:7,model:"Autumn",platform:"Instagram",date:"2026-02-01",followers:11500,views:0,likes:1520,comments:98,shares:0,notes:""},
  {id:8,model:"Autumn",platform:"Snapchat",date:"2026-02-01",followers:7800,views:18500,likes:0,comments:0,shares:0,notes:""},
  {id:9,model:"Mia",platform:"TikTok",date:"2026-02-01",followers:28200,views:72000,likes:5100,comments:220,shares:810,notes:""},
  {id:10,model:"Jordan",platform:"Instagram",date:"2026-02-01",followers:8700,views:0,likes:950,comments:65,shares:0,notes:""},
  // January 2026 (YOY reference)
  {id:11,model:"Autumn",platform:"TikTok",date:"2025-03-01",followers:28400,views:61000,likes:4100,comments:190,shares:620,notes:"YOY reference"},
  {id:12,model:"Mia",platform:"TikTok",date:"2025-03-01",followers:18900,views:44000,likes:3200,comments:140,shares:490,notes:""},
  {id:13,model:"Jordan",platform:"Instagram",date:"2025-03-01",followers:6100,views:0,likes:710,comments:42,shares:0,notes:""},
];
const INIT_GROWTH_CAMPAIGNS=[
  {id:1,model:"Autumn",platform:"TikTok",type:"Sound Promo",name:"Spring Vibe Sound",status:"Active",startDate:"2026-03-01",endDate:"2026-03-31",notes:"Trending audio collaboration"},
  {id:2,model:"Mia",platform:"Snapchat",type:"Trend Tracking",name:"March Spotlight",status:"Planned",startDate:"2026-03-15",endDate:"2026-03-22",notes:""},
  {id:3,model:"Jordan",platform:"Instagram",type:"Viral Content",name:"Before & After Reel",status:"Active",startDate:"2026-03-10",endDate:"2026-03-20",notes:""},
];
const INIT_BRAND_DEALS=[
  {id:1,model:"Autumn",brand:"FitTea Co",type:"Sponsored Post",deliverables:"1 TikTok + 2 IG Stories",deadline:"2026-03-31",payment:1500,paid:false,status:"In Progress",stripeId:"",notes:"Send product shots by 3/20"},
  {id:2,model:"Mia",brand:"GlowSkin",type:"Ambassador",deliverables:"Monthly IG post + Story",deadline:"2026-04-30",payment:3000,paid:true,status:"Active",stripeId:"pi_mock_001",notes:"Ongoing monthly deal"},
];
const INIT_SNAP_REVENUE=[
  {id:1,model:"Autumn",date:"2026-03-14",revenue:320,notes:""},
  {id:2,model:"Autumn",date:"2026-03-15",revenue:410,notes:"Story promo active"},
  {id:3,model:"Mia",date:"2026-03-14",revenue:190,notes:""},
  {id:4,model:"Mia",date:"2026-03-15",revenue:240,notes:""},
];
const INIT_CONTENT_METRICS=[
  {id:1,model:"Autumn",platform:"TikTok",type:"Video",date:"2026-03-15",caption:"Day in my life ☀️",views:89400,likes:7100,comments:340,shares:1200,saves:0,engRate:9.5},
  {id:2,model:"Autumn",platform:"TikTok",type:"Video",date:"2026-03-10",caption:"Spring vibes ✨",views:45200,likes:3200,comments:180,shares:560,saves:0,engRate:8.7},
  {id:3,model:"Autumn",platform:"TikTok",type:"Video",date:"2026-03-05",caption:"GRWM morning routine",views:31800,likes:2400,comments:98,shares:310,saves:0,engRate:8.5},
  {id:4,model:"Autumn",platform:"Instagram",type:"Reel",date:"2026-03-12",caption:"Glow up ✨",views:12000,likes:1800,comments:95,shares:0,saves:420,engRate:19.3},
  {id:5,model:"Autumn",platform:"Instagram",type:"Photo",date:"2026-03-08",caption:"Golden hour 🌅",views:0,likes:1420,comments:76,shares:0,saves:280,engRate:13.9},
  {id:6,model:"Autumn",platform:"Snapchat",type:"Story",date:"2026-03-14",caption:"BTS moment",views:8900,likes:0,comments:0,shares:0,saves:0,engRate:0},
  {id:7,model:"Mia",platform:"TikTok",type:"Video",date:"2026-03-16",caption:"GRWM night out 💋",views:67300,likes:5400,comments:290,shares:890,saves:0,engRate:9.7},
  {id:8,model:"Mia",platform:"TikTok",type:"Video",date:"2026-03-08",caption:"Fashion haul",views:32100,likes:2100,comments:120,shares:380,saves:0,engRate:8.1},
  {id:9,model:"Jordan",platform:"Instagram",type:"Photo",date:"2026-03-11",caption:"Monday mood 💕",views:0,likes:980,comments:55,shares:0,saves:130,engRate:12.7},
];
const INIT_MODEL_EVENTS=[
  {id:1,model:"Autumn",date:"2026-03-28",title:"Biscuit's Birthday",type:"birthday",notes:"Dog's birthday 🐶",color:"#ec4899"},
  {id:2,model:"Autumn",date:"2026-04-20",title:"Fitness Competition",type:"competition",notes:"NPC Regional qualifier",color:"#f59e0b"},
  {id:3,model:"Mia",date:"2026-04-05",title:"Miami Brand Event",type:"event",notes:"GlowSkin brand activation",color:"#0ea5e9"},
];
const INIT_MG=[
  {id:1,model:"Autumn",mgAmount:3000,period:"2026-03",deliverables:[
    {id:1,label:"1x TikTok Video",done:true,notes:"Posted 3/10",fileUrl:null},
    {id:2,label:"4x IG Stories",done:true,notes:"",fileUrl:null},
    {id:3,label:"1x IG Reel",done:false,notes:"",fileUrl:null},
    {id:4,label:"2x Snapchat Stories",done:false,notes:"",fileUrl:null},
  ]},
  {id:2,model:"Mia",mgAmount:5000,period:"2026-03",deliverables:[
    {id:1,label:"2x TikTok Videos",done:true,notes:"Both posted",fileUrl:null},
    {id:2,label:"4x IG Stories",done:true,notes:"",fileUrl:null},
    {id:3,label:"1x IG Reel",done:false,notes:"Scheduled for 3/28",fileUrl:null},
  ]},
];
// ── DESIGN SYSTEM ────────────────────────────────────────────
const s = {
  card: {background:"rgba(255,255,255,0.05)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:16,padding:22,backdropFilter:"blur(12px)"},
  input: {width:"100%",border:"1px solid rgba(167,139,250,0.25)",borderRadius:10,padding:"10px 13px",fontSize:14,outline:"none",boxSizing:"border-box",background:"rgba(255,255,255,0.07)",color:C.text,transition:"border-color 0.2s",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5},
  label: {fontSize:11,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em",display:"block"},
  section: {fontSize:15,fontWeight:700,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8},
};
const Badge=({label,color=C.purple,bg,dot})=>(
  <span style={{background:bg||color+"22",color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4,letterSpacing:"0.02em"}}>
    {dot&&<span style={{width:5,height:5,borderRadius:99,background:color,display:"inline-block"}}/>}{label}
  </span>
);
// ── BRAND MARK ────────────────────────────────────────────────
const StarMark=({size=20,color="white",style={}})=>(
  <svg width={size} height={Math.round(size*1.5)} viewBox="0 0 338 507" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0,...style}}>
    <path d="M338 253.5L210.878 231.619L264.451 157.845L190.902 211.498L169 0L147.098 211.498L73.5488 157.845L127.122 231.619L0 253.5L127.122 275.382L73.5488 349.155L147.098 295.502L169 507L190.902 295.502L264.451 349.155L210.878 275.382L338 253.5ZM328.705 253.5H189.922L205.91 240.629L328.705 253.5ZM187.421 222.778L260.091 162.214L183.771 238.698L187.421 222.778ZM9.3288 253.5H148.112L132.124 266.371L9.3288 253.5ZM150.579 284.222L77.909 344.786L154.229 268.302L150.579 284.222ZM138.343 235.04L77.909 162.214L154.229 238.698L138.343 235.04ZM157.136 219.154L169.034 14.057L169.27 57.7861V232.533L157.136 219.187V219.154ZM169.237 492.909L169 449.18V274.433L181.134 287.779L169.237 492.875V492.909ZM260.091 344.786L183.771 268.302L199.657 271.96L260.091 344.786Z" fill={color}/>
  </svg>
);
const IconBadge=({icon,color=C.purple,size=34})=>(
  <div style={{width:size,height:size,borderRadius:Math.round(size*0.28),background:`linear-gradient(135deg,${color}28,${color}12)`,border:`1px solid ${color}38`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.round(size*0.5),flexShrink:0,boxShadow:`0 2px 10px ${color}20`}}>{icon}</div>
);
const Card=({children,style={}})=>(<div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:16,padding:22,backdropFilter:"blur(12px)",...style}}>{children}</div>);
const Btn=({children,onClick,variant="primary",size="md",color,style={}})=>{
  const colors={primary:{bg:color||C.purple,text:C.white,border:color||C.purple},secondary:{bg:"rgba(167,139,250,0.1)",text:color||C.purpleL,border:color||"rgba(167,139,250,0.35)"},ghost:{bg:"transparent",text:C.muted,border:"transparent"},danger:{bg:C.red,text:C.white,border:C.red}};
  const sizes={sm:{padding:"5px 14px",fontSize:12,borderRadius:8},md:{padding:"9px 20px",fontSize:13,borderRadius:10},lg:{padding:"12px 26px",fontSize:14,borderRadius:12}};
  const v=colors[variant]||colors.primary;const z=sizes[size]||sizes.md;
  const isGradient=variant==="primary"&&!color;
  return(<button onClick={onClick} style={{
    background:isGradient?"linear-gradient(135deg,#7c3aed 0%,#c026d3 100%)":v.bg,
    color:v.text,
    border:isGradient?"1.5px solid rgba(167,139,250,0.3)":`1.5px solid ${v.border}`,
    fontWeight:600,cursor:"pointer",transition:"all 0.18s",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.01em",...z,...style}}
    onMouseEnter={e=>{e.currentTarget.style.opacity="0.85";e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="translateY(0)";}}>{children}</button>);
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
      style={{...s.input,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239d9abf' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:32}}>
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
          style={{padding:"5px 12px",borderRadius:99,border:`1.5px solid ${on?C.purple:"rgba(255,255,255,0.15)"}`,background:on?C.purpleXL:"rgba(255,255,255,0.06)",color:on?C.purpleL:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
          {on?"✓ ":""}{o}
        </button>
      );})}
    </div>
  </div>
);
const TaskCell=({val,onChange})=>{
  const states=[null,true,false];
  const cfg={null:{l:"–",bg:"rgba(255,255,255,0.08)",c:C.muted},true:{l:"✓",bg:C.greenL,c:C.green},false:{l:"✗",bg:C.redL,c:C.red}};
  const st=cfg[val];
  return(<button onClick={()=>{const i=states.indexOf(val);onChange(states[(i+1)%3]);}}
    style={{width:34,height:34,borderRadius:8,border:"none",background:st.bg,color:st.c,fontWeight:700,fontSize:14,cursor:"pointer",transition:"all 0.15s"}}>{st.l}</button>);
};
const SectionHeader=({icon,title,action})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22,paddingBottom:14,borderBottom:"1px solid rgba(167,139,250,0.12)"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      {icon&&<IconBadge icon={icon} color={C.purple} size={34}/>}
      <span style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Playfair Display',Georgia,serif",letterSpacing:"-0.01em"}}>{title}</span>
    </div>
    {action}
  </div>
);
function Tabs({tabs,active,onChange}){
  return(
    <div style={{display:"flex",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:4,gap:2,flexWrap:"wrap",marginBottom:24}}>
      {tabs.map(([k,l])=>{
        const isActive=active===k;
        return(
          <button key={k} onClick={()=>onChange(k)}
            style={{padding:"7px 16px",borderRadius:9,border:isActive?"1px solid rgba(167,139,250,0.35)":"1px solid transparent",background:isActive?"linear-gradient(135deg,rgba(124,58,237,0.45),rgba(192,38,211,0.35))":"transparent",color:isActive?C.white:C.muted,fontWeight:isActive?700:500,fontSize:13,cursor:"pointer",boxShadow:isActive?"0 2px 10px rgba(124,58,237,0.25)":"none",transition:"all 0.2s",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.01em"}}>
            {l}
          </button>
        );
      })}
    </div>
  );
}
const StatCard=({label,value,color=C.purple,sub,icon})=>(
  <Card style={{textAlign:"center",padding:"18px 14px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-8,right:-8,opacity:0.06}}><StarMark size={44} color={color}/></div>
    {icon&&<div style={{display:"flex",justifyContent:"center",marginBottom:8}}><IconBadge icon={icon} color={color} size={32}/></div>}
    <div style={{fontSize:26,fontWeight:800,color,lineHeight:1,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>{value}</div>
    <div style={{fontSize:10,color:C.muted,marginTop:7,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</div>
    {sub&&<div style={{fontSize:11,color,marginTop:4,fontWeight:600}}>{sub}</div>}
  </Card>
);
function Toggle({on,onToggle}){
  return(
    <button onClick={onToggle} style={{width:42,height:24,borderRadius:99,background:on?"linear-gradient(135deg,#7c3aed,#c026d3)":"rgba(255,255,255,0.12)",border:`1px solid ${on?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.15)"}`,cursor:"pointer",position:"relative",transition:"all 0.2s",padding:0,flexShrink:0}}>
      <div style={{width:17,height:17,borderRadius:99,background:C.white,position:"absolute",top:3,left:on?22:3,transition:"left 0.2s",boxShadow:on?"0 0 6px rgba(124,58,237,0.6)":"0 1px 3px rgba(0,0,0,0.4)"}}/>
    </button>
  );
}
const Modal=({title,onClose,children,width=480})=>(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
    <div style={{width,maxWidth:"100%",background:"rgba(15,10,30,0.96)",border:"1px solid rgba(124,58,237,0.35)",borderRadius:20,boxShadow:"0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(124,58,237,0.15)",maxHeight:"85vh",overflow:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:`1px solid rgba(124,58,237,0.2)`}}>
        <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',Georgia,serif",color:C.text}}>{title}</div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button>
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
        <div key={i} style={{padding:"9px 16px",background:"rgba(255,255,255,0.03)",borderTop:`1px solid rgba(124,58,237,0.15)`,display:"flex",gap:10,fontSize:13,alignItems:"center",color:C.text}}>
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{width:540,background:"rgba(15,10,30,0.97)",border:"1px solid rgba(124,58,237,0.35)",borderRadius:20,boxShadow:"0 32px 80px rgba(0,0,0,0.7)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid rgba(124,58,237,0.2)`}}>
          <span style={{color:C.muted}}>🔍</span>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search models, users, fans, sales…"
            style={{flex:1,border:"none",outline:"none",fontSize:14,background:"transparent",color:C.text}}/>
          <kbd style={{fontSize:11,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:5,padding:"2px 6px",color:C.muted}}>esc</kbd>
        </div>
        {q.length<2
          ?<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>Type to search models, users, fans & sales</div>
          :!results.length
            ?<div style={{padding:24,textAlign:"center",color:C.muted,fontSize:13}}>No results for "{q}"</div>
            :results.map((r,i)=>(
              <div key={i} style={{padding:"12px 18px",borderBottom:`1px solid rgba(124,58,237,0.15)`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Badge label={r.type} color={r.color}/>
                <div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{r.label}</div><div style={{fontSize:11,color:C.muted,marginTop:1}}>{r.sub}</div></div>
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
    <Card style={{marginBottom:20,background:slingApiKey?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",border:`1px solid ${slingApiKey?C.green:C.yellow}40`,padding:16}}>
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
  const [fm,setFm]=useState("All");
  const [fd,setFd]=useState("");
  const calcScore=f=>{let sc=100;if(f.upsellAttempt===false)sc-=20;if(f.toneMatch===false)sc-=20;if(f.hardNoViolation===true)sc-=40;if(f.escalationHandled===false)sc-=20;return Math.max(0,sc);};
  const scoreCol=sc=>sc>=80?C.green:sc>=60?C.yellow:C.red;
  const submit=()=>{setQaLogs(p=>[{...form,id:Date.now(),reviewer:user.name,date:today(),score:calcScore(form)},...p]);setForm(blank);setShowAdd(false);};
  const visible=qaLogs.filter(q=>(fc==="All"||q.chatter===fc)&&(fm==="All"||q.model===fm)&&(!fd||q.date.startsWith(fd)));
  const avg=visible.length?Math.round(visible.reduce((a,q)=>a+q.score,0)/visible.length):null;
  const BoolRow=({label,field})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <span style={{fontSize:13,color:C.text}}>{label}</span>
      <div style={{display:"flex",gap:6}}>
        {[["Yes",true],["No",false],["N/A",null]].map(([l,v])=>(
          <button key={l} onClick={()=>setForm(p=>({...p,[field]:v}))}
            style={{padding:"4px 12px",borderRadius:99,border:`1.5px solid ${form[field]===v?C.purple:C.border}`,background:form[field]===v?C.purpleXL:"rgba(255,255,255,0.06)",color:form[field]===v?C.purpleL:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
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
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={fc} onChange={e=>setFc(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option value="All">All Chatters</option>{chatters.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option value="All">All Models</option>{activeModels.map(m=><option key={m}>{m}</option>)}
        </select>
        <input type="month" value={fd} onChange={e=>setFd(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}} title="Filter by month"/>
        {fd&&<button onClick={()=>setFd("")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13}}>✕ Clear date</button>}
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
                <Badge label={`by ${q.reviewer}`} color={C.muted} bg="rgba(255,255,255,0.1)"/>
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
            style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${tab===k?C.purple:"rgba(167,139,250,0.2)"}`,background:tab===k?C.purpleXL:"rgba(255,255,255,0.06)",color:tab===k?C.purpleL:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
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
            <div key={sc.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:10,padding:14,marginBottom:10}}>
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
                <Badge label={m.model} color={C.blue}/><Badge label={m.target} color={C.muted} bg="rgba(255,255,255,0.1)"/>
                {m.revenue>0&&<Badge label={`+${fmtMoney(m.revenue)}`} color={C.green} dot/>}
              </div>
              <span style={{fontSize:11,color:C.muted}}>{m.sentBy} · {m.sentAt} · {m.date}</span>
            </div>
            <p style={{fontSize:13,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.12)",borderRadius:8,padding:"9px 12px",fontStyle:"italic",color:C.muted,margin:0}}>"{m.message}"</p>
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
            <Badge label={h.shift} color={C.slate} bg="rgba(255,255,255,0.1)"/>
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
              <tr key={s.id} style={{background:i%2===0?"rgba(255,255,255,0.04)":C.bg,borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"9px 14px",fontWeight:600}}>{s.chatter}</td>
                <td style={{padding:"9px 14px"}}>{s.model}</td>
                <td style={{padding:"9px 14px"}}><Badge label={s.type} color={s.type==="PPV"?C.purple:C.blue}/></td>
                <td style={{padding:"9px 14px",fontWeight:700,color:C.green}}>{fmtMoney(s.amount)}</td>
                <td style={{padding:"9px 14px",color:C.muted}}>{s.fanUsername}</td>
                <td style={{padding:"9px 14px",color:C.muted}}>{s.note}</td>
                <td style={{padding:"9px 14px"}}><Badge label={s.shift} color={C.muted} bg="rgba(255,255,255,0.1)"/></td>
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
          <Btn onClick={()=>{if(!form.amount||!form.fanUsername)return;setSales(p=>[...p,{...form,id:Date.now(),chatter:user.name,date:new Date().toISOString().slice(0,10),amount:Number(form.amount)}]);setForm(p=>({...p,amount:"",fanUsername:"",note:""}));}}>Log Sale</Btn>
        </Card>
      )}
    </div>
  );
}
// ── CAMPAIGNS ────────────────────────────────────────────────
function CampaignCalendar({campaigns,setCampaigns,isLeadership,isAM,myModels,models}){
  const [fm,setFm]=useState("All");const [fs,setFs]=useState("All");const [showAdd,setShowAdd]=useState(false);
  const [viewMode,setViewMode]=useState("list");
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const blank={model:myModels[0]||"",name:"",type:"Flash Sale",startDate:"",endDate:"",notes:""};const [form,setForm]=useState(blank);
  const sc={Planning:C.yellow,Scheduled:C.blue,Live:C.green,Complete:C.muted};
  const vm=isLeadership?models.filter(m=>!m.archived):models.filter(m=>myModels.includes(m.name)&&!m.archived);
  const filtered=campaigns.filter(c=>(fm==="All"||c.model===fm)&&(fs==="All"||c.status===fs));
  const low=vm.filter(m=>campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length<2);
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();
  const firstDayOfMonth=(y,m)=>new Date(y,m,1).getDay();
  const pad=n=>String(n).padStart(2,"0");
  const calDays=daysInMonth(calYear,calMonth);
  const calStart=firstDayOfMonth(calYear,calMonth);
  const calCells=[];
  for(let i=0;i<calStart;i++)calCells.push(null);
  for(let d=1;d<=calDays;d++)calCells.push(d);
  const getCampaignsForDay=(d)=>{
    const dateStr=`${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    return filtered.filter(c=>c.startDate&&c.endDate&&dateStr>=c.startDate&&dateStr<=c.endDate);
  };
  const prevMonth=()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);};
  const nextMonth=()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);};
  return(
    <div>
      <SectionHeader icon="📅" title="Campaign Planner" action={
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
            {["list","calendar"].map(v=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{padding:"5px 14px",background:viewMode===v?C.purple:"transparent",color:viewMode===v?C.white:C.muted,border:"none",cursor:"pointer",fontSize:12,fontWeight:600}}>
                {v==="list"?"☰ List":"📅 Calendar"}
              </button>
            ))}
          </div>
          {(isAM||isLeadership)&&<Btn size="sm" onClick={()=>setShowAdd(true)}>+ New Campaign</Btn>}
        </div>
      }/>
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
            <Input label="Start Date" value={form.startDate} onChange={v=>setForm(p=>({...p,startDate:v}))} placeholder="2024-03-01" type="date"/>
            <Input label="End Date" value={form.endDate} onChange={v=>setForm(p=>({...p,endDate:v}))} placeholder="2024-03-07" type="date"/>
          </div>
          <Input label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Details…"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.name)return;setCampaigns(p=>[...p,{...form,id:Date.now(),revenue:0,status:"Planning"}]);setShowAdd(false);setForm(blank);}}>Add Campaign</Btn>
          </div>
        </Modal>
      )}
      {viewMode==="list"&&vm.map(m=>{const mc=filtered.filter(c=>c.model===m.name);if(!mc.length&&fm!=="All"&&fm!==m.name)return null;return(
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
      {viewMode==="calendar"&&(
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700,color:C.text}}>‹</button>
            <span style={{fontWeight:700,fontSize:16,flex:1,textAlign:"center"}}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700,color:C.text}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,padding:"4px 0"}}>{d}</div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {calCells.map((d,i)=>{
              const dayStr=d?`${calYear}-${pad(calMonth+1)}-${pad(d)}`:"";
              const isToday=dayStr===today();
              const dayCampaigns=d?getCampaignsForDay(d):[];
              return(
                <div key={i} style={{minHeight:72,background:d?C.white:"transparent",borderRadius:8,padding:d?"4px 6px":0,border:isToday?`2px solid ${C.purple}`:`1px solid ${d?C.border:"transparent"}`,position:"relative"}}>
                  {d&&<div style={{fontSize:11,fontWeight:isToday?800:500,color:isToday?C.purple:C.text,marginBottom:2}}>{d}</div>}
                  {dayCampaigns.slice(0,3).map(c=>(
                    <div key={c.id} title={`${c.model}: ${c.name}`} style={{fontSize:10,background:sc[c.status],color:C.white,borderRadius:4,padding:"1px 4px",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {c.name}
                    </div>
                  ))}
                  {dayCampaigns.length>3&&<div style={{fontSize:9,color:C.muted}}>+{dayCampaigns.length-3} more</div>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
            {Object.entries(sc).map(([st,col])=>(
              <div key={st} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}>
                <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                {st}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ── CONTENT LOG ──────────────────────────────────────────────
function ContentLog({user,content,setContent,promos,setPromos,myModels,isLeadership,platforms,discordWebhook}){
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
            <Btn size="sm" onClick={()=>{if(!cForm.theme||!cForm.assetCount)return;const entry={...cForm,id:Date.now(),date:today(),loggedBy:user.name,assetCount:Number(cForm.assetCount),upsellOrder:Number(cForm.upsellOrder)};setContent(p=>[entry,...p]);sendDiscord(discordWebhook,`📦 **Content Logged**\nModel: **${entry.model}** · Tag: \`${entry.tag}\`\nType: ${entry.type} · ${entry.assetCount} assets · by ${entry.loggedBy}`);setCForm(blank);}}>Log Upload</Btn>
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:C.dark,color:"#94a3b8"}}>{["Model","Tag","Type","Theme","Tier","Assets","Date"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
              <tbody>{fc.map((c,i)=><tr key={c.id} style={{background:i%2===0?"rgba(255,255,255,0.04)":C.bg,borderBottom:`1px solid ${C.border}`}}>
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
        <Card style={{marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={pForm.model} onChange={v=>setPForm(p=>({...p,model:v}))} options={myModels}/>
            <Sel label="Platform" value={pForm.platform} onChange={v=>setPForm(p=>({...p,platform:v}))} options={platforms||DEFAULT_PLATFORMS}/>
            <Input label="Notes" value={pForm.notes} onChange={v=>setPForm(p=>({...p,notes:v}))} placeholder="Story + swipe up" style={{gridColumn:"1/-1"}}/>
          </div>
          <Btn size="sm" onClick={()=>{const entry={...pForm,id:Date.now(),date:today(),loggedBy:user.name};setPromos(p=>[entry,...p]);sendDiscord(discordWebhook,`📣 **Promo Logged**\nModel: **${entry.model}** · Platform: ${entry.platform}\nNotes: ${entry.notes||"—"} · by ${entry.loggedBy}`);setPForm(f=>({...f,notes:""}))}}>Log Promo</Btn>
        </Card>
        <Card style={{padding:0,overflow:"hidden"}}>
          {!fp.length?<div style={{padding:24,color:C.muted,fontSize:13,textAlign:"center"}}>No promos</div>:fp.map((p,i)=>(
            <div key={p.id} style={{padding:"12px 20px",background:i%2===0?"rgba(255,255,255,0.04)":C.bg,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
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
  const STATUS_LIST=["Pending","In Progress","Stuck","Complete"];
  const STATUS_COL={Pending:C.muted,["In Progress"]:C.blue,Stuck:C.red,Complete:C.green};
  const [form,setForm]=useState({scope:"personal",model:myModels[0]||"",task:"",priority:"Medium",dueDate:"",notes:""});
  const [filterScope,setFilterScope]=useState("All");
  const [filterStatus,setFilterStatus]=useState("All");
  const [sortBy,setSortBy]=useState("priority");
  const [viewMode,setViewMode]=useState("list");
  const [editTodo,setEditTodo]=useState(null);
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const myTodos=todos.filter(t=>t.owner===user.name);
  const pc={High:C.red,Medium:C.yellow,Low:C.green};
  const pOrder={High:0,Medium:1,Low:2};
  const sOrder={Pending:0,"In Progress":1,Stuck:2,Complete:3};
  const scopeOptions=["All","personal",...myModels];
  const filtered=myTodos.filter(t=>{
    const scopeOk=filterScope==="All"||(filterScope==="personal"&&t.scope==="personal")||(t.scope==="model"&&t.model===filterScope);
    const statusOk=filterStatus==="All"||t.status===filterStatus;
    return scopeOk&&statusOk;
  });
  const sortFn=(a,b)=>{
    if(sortBy==="priority")return pOrder[a.priority]-pOrder[b.priority];
    if(sortBy==="status")return sOrder[a.status||"Pending"]-sOrder[b.status||"Pending"];
    if(sortBy==="dueDate"){if(!a.dueDate&&!b.dueDate)return 0;if(!a.dueDate)return 1;if(!b.dueDate)return -1;return a.dueDate.localeCompare(b.dueDate);}
    return 0;
  };
  const active=filtered.filter(t=>(t.status||"Pending")!=="Complete").sort(sortFn);
  const completed=filtered.filter(t=>t.status==="Complete");
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const calDays=()=>{
    const first=new Date(calYear,calMonth,1);
    const last=new Date(calYear,calMonth+1,0);
    const startDow=first.getDay();
    const cells=[];
    for(let i=0;i<startDow;i++)cells.push(null);
    for(let d=1;d<=last.getDate();d++)cells.push(d);
    return cells;
  };
  const pad=n=>String(n).padStart(2,"0");
  const dsFor=d=>`${calYear}-${pad(calMonth+1)}-${pad(d)}`;
  const todosOnDay=d=>myTodos.filter(t=>(t.status||"Pending")!=="Complete"&&t.dueDate===dsFor(d));
  const todayIso=new Date().toISOString().slice(0,10);
  const updateTodo=(id,patch)=>setTodos(p=>p.map(x=>x.id===id?{...x,...patch}:x));
  return(
    <div>
      <SectionHeader icon="✅" title="To-Dos"/>
      {editTodo&&(
        <Modal title="Task Details" onClose={()=>setEditTodo(null)}>
          <Input label="Task" value={editTodo.task} onChange={v=>setEditTodo(p=>({...p,task:v}))} placeholder="Task description"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Status" value={editTodo.status||"Pending"} onChange={v=>setEditTodo(p=>({...p,status:v}))} options={STATUS_LIST}/>
            <Sel label="Priority" value={editTodo.priority} onChange={v=>setEditTodo(p=>({...p,priority:v}))} options={["High","Medium","Low"]}/>
            <Sel label="Scope" value={editTodo.scope} onChange={v=>setEditTodo(p=>({...p,scope:v}))} options={["personal","model"]}/>
            {editTodo.scope==="model"&&<Sel label="Model" value={editTodo.model||""} onChange={v=>setEditTodo(p=>({...p,model:v}))} options={myModels}/>}
            <Input label="Due Date" value={editTodo.dueDate||""} onChange={v=>setEditTodo(p=>({...p,dueDate:v}))} type="date"/>
          </div>
          <TA label="Notes" value={editTodo.notes||""} onChange={v=>setEditTodo(p=>({...p,notes:v}))} placeholder="Additional context…" rows={3}/>
          <div style={{display:"flex",gap:8,justifyContent:"space-between",marginTop:4}}>
            <Btn variant="secondary" size="sm" onClick={()=>{setTodos(p=>p.filter(x=>x.id!==editTodo.id));setEditTodo(null);}}>Delete</Btn>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="secondary" size="sm" onClick={()=>setEditTodo(null)}>Cancel</Btn>
              <Btn size="sm" onClick={()=>{updateTodo(editTodo.id,editTodo);setEditTodo(null);}}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}
      <Card style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Sel label="Scope" value={form.scope} onChange={v=>setForm(p=>({...p,scope:v}))} options={["personal","model"]}/>
          {form.scope==="model"&&<Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={myModels}/>}
          <Sel label="Priority" value={form.priority} onChange={v=>setForm(p=>({...p,priority:v}))} options={["High","Medium","Low"]}/>
          <Input label="Due Date" value={form.dueDate} onChange={v=>setForm(p=>({...p,dueDate:v}))} type="date"/>
        </div>
        <Input label="Task" value={form.task} onChange={v=>setForm(p=>({...p,task:v}))} placeholder="e.g. Schedule mass message"/>
        <Btn size="sm" onClick={()=>{if(!form.task)return;setTodos(p=>[...p,{...form,id:Date.now(),owner:user.name,status:"Pending",date:today(),notes:""}]);setForm(p=>({...p,task:"",dueDate:""}));}}>Add Task</Btn>
      </Card>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={filterScope} onChange={e=>setFilterScope(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          {scopeOptions.map(o=><option key={o}>{o}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{STATUS_LIST.map(st=><option key={st}>{st}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
          <option value="dueDate">Sort: Due Date</option>
        </select>
        <div style={{marginLeft:"auto",display:"flex",gap:4,background:C.dark,borderRadius:8,padding:3}}>
          {[["list","List"],["calendar","Calendar"]].map(([k,l])=>(
            <button key={k} onClick={()=>setViewMode(k)} style={{background:viewMode===k?"linear-gradient(135deg,#7c3aed,#c026d3)":"transparent",color:C.white,border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{l}</button>
          ))}
        </div>
      </div>
      {viewMode==="calendar"&&(
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:"none",color:C.white,cursor:"pointer",fontSize:18,padding:"0 6px"}}>‹</button>
            <span style={{fontWeight:700,fontSize:14}}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:"none",color:C.white,cursor:"pointer",fontSize:18,padding:"0 6px"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,padding:"2px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {calDays().map((d,i)=>{
              if(!d)return<div key={`e${i}`}/>;
              const ds=dsFor(d);
              const dayTodos=todosOnDay(d);
              const isToday=ds===todayIso;
              return(
                <div key={d} style={{minHeight:60,background:isToday?"rgba(124,58,237,0.15)":C.dark,borderRadius:6,padding:3,border:isToday?`1px solid ${C.purple}`:"1px solid rgba(124,58,237,0.08)"}}>
                  <div style={{fontSize:10,fontWeight:isToday?700:400,color:isToday?C.purple:C.muted,marginBottom:2,textAlign:"right"}}>{d}</div>
                  {dayTodos.map(t=>(
                    <div key={t.id} onClick={()=>setEditTodo({...t})}
                      title={`${t.task} — click to open`}
                      style={{background:STATUS_COL[t.status||"Pending"],color:C.white,borderRadius:3,padding:"1px 4px",fontSize:9,fontWeight:600,marginBottom:1,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {t.task}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,marginTop:10,fontSize:10,color:C.muted,flexWrap:"wrap"}}>
            {STATUS_LIST.filter(st=>st!=="Complete").map(st=>(
              <span key={st} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:STATUS_COL[st],display:"inline-block"}}></span>{st}</span>
            ))}
            <span style={{color:C.muted,marginLeft:4}}>· Click to open task</span>
          </div>
        </Card>
      )}
      {viewMode==="list"&&<>
      {active.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Active · {active.length}</div>
          {active.map(t=>{
            const st=t.status||"Pending";
            return(
              <div key={t.id} onClick={()=>setEditTodo({...t})} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:`1px solid rgba(124,58,237,0.15)`,borderRadius:10,marginBottom:6,borderLeft:`3px solid ${pc[t.priority]}`,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{t.task}</div>
                  <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:700,color:STATUS_COL[st],background:STATUS_COL[st]+"22",padding:"2px 7px",borderRadius:99,border:`1px solid ${STATUS_COL[st]}44`}}>{st}</span>
                    <Badge label={t.priority} color={pc[t.priority]}/>
                    {t.scope==="model"&&t.model&&<Badge label={t.model} color={C.blue}/>}
                    {t.dueDate&&<span style={{fontSize:11,color:t.dueDate<todayIso?C.red:C.muted}}>Due {t.dueDate}</span>}
                  </div>
                </div>
                <span style={{fontSize:10,color:C.muted,flexShrink:0}}>Edit →</span>
              </div>
            );
          })}
        </div>
      )}
      {completed.length>0&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Complete · {completed.length}</div>
          {completed.map(t=>(
            <div key={t.id} onClick={()=>setEditTodo({...t})} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,0.02)",borderRadius:10,marginBottom:6,opacity:0.55,cursor:"pointer"}}>
              <span style={{width:16,height:16,borderRadius:4,background:C.green,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:C.white,fontSize:10,fontWeight:800}}>✓</span></span>
              <span style={{flex:1,textDecoration:"line-through",fontSize:13,color:C.muted}}>{t.task}</span>
              <span style={{fontSize:10,color:C.muted}}>Edit →</span>
            </div>
          ))}
        </div>
      )}
      {!active.length&&!completed.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No to-dos yet</div>}
      </>}
    </div>
  );
}
// ── HOME DASHBOARD ───────────────────────────────────────────
function HomeDashboard({user,role,sales,todos,setTodos,campaigns,brandDeals,qaLogs,shifts,models,snapRevenue,socialMetrics,modelEvents,onAction}){
  const myModels=role==="am"?models.filter(m=>m.am===user.name&&!m.archived).map(m=>m.name):models.filter(m=>!m.archived).map(m=>m.name);
  const mySales=sales.filter(s=>role==="am"?myModels.includes(s.model):true);
  const todayRev=mySales.reduce((a,s)=>a+Number(s.amount),0);
  const myTodos=todos.filter(t=>t.owner===user.name&&(t.status||"Pending")!=="Complete");
  const overdue=myTodos.filter(t=>t.dueDate&&t.dueDate<new Date().toISOString().slice(0,10));
  const myBrandDeals=brandDeals.filter(d=>(role==="am"?myModels.includes(d.model):true)&&d.status!=="Complete");
  const activeCampaigns=campaigns.filter(c=>(role==="am"?myModels.includes(c.model):true)&&["Live","Scheduled"].includes(c.status));
  const avgQA=qaLogs.length?Math.round(qaLogs.reduce((a,q)=>a+q.score,0)/qaLogs.length):null;
  const violations=qaLogs.filter(q=>q.hardNoViolation).length;
  const scoreCol=sc=>sc>=80?C.green:sc>=60?C.yellow:C.red;
  const todaySnap=snapRevenue.filter(r=>r.date===new Date().toISOString().slice(0,10)).reduce((a,r)=>a+Number(r.revenue),0);
  const latestMetrics=getLatestMetricsByKey(socialMetrics);
  const totalFollowers=Object.values(latestMetrics).reduce((a,m)=>a+Number(m.followers||0),0);
  // Calendar state
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const [calFilter,setCalFilter]=useState("All");
  const [gcalId,setGcalId]=useState("");const [gcalSaved,setGcalSaved]=useState("");const [showGcal,setShowGcal]=useState(false);
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const pad=n=>String(n).padStart(2,"0");
  const daysInMo=(y,m)=>new Date(y,m+1,0).getDate();
  const firstDay=(y,m)=>new Date(y,m,1).getDay();
  const calDays=daysInMo(calYear,calMonth);const calStart=firstDay(calYear,calMonth);
  const calCells=[];for(let i=0;i<calStart;i++)calCells.push(null);for(let d=1;d<=calDays;d++)calCells.push(d);
  const getCalEvents=(d)=>{
    const ds=`${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    const evts=[];
    const filteredCamps=activeCampaigns.filter(c=>calFilter==="All"||c.model===calFilter);
    filteredCamps.filter(c=>c.startDate&&c.endDate&&ds>=c.startDate&&ds<=c.endDate).forEach(c=>evts.push({label:c.name,color:C.purple,sub:c.model}));
    const filteredTodos=myTodos.filter(t=>(calFilter==="All"||(t.model&&t.model===calFilter))&&t.dueDate===ds);
    filteredTodos.forEach(t=>evts.push({label:t.task,color:{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}));
    const filteredDeals=myBrandDeals.filter(d=>(calFilter==="All"||d.model===calFilter)&&d.deadline===ds);
    filteredDeals.forEach(d=>evts.push({label:`⏰ ${d.brand}`,color:C.orange}));
    if(modelEvents){const filteredEvts=(modelEvents||[]).filter(e=>(calFilter==="All"||e.model===calFilter)&&e.date===ds);filteredEvts.forEach(e=>evts.push({label:e.title,color:e.color||C.pink}));}
    return evts;
  };
  return(
    <div>
      <div style={{fontSize:24,fontWeight:800,marginBottom:2}}>Welcome back, {user.name} 👋</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Revenue Today" value={fmtMoney(todayRev)} color={C.green}/>
        <StatCard label="Open To-Dos" value={myTodos.length} color={overdue.length>0?C.red:C.blue} sub={overdue.length>0?`${overdue.length} overdue`:""}/>
        <StatCard label="Active Campaigns" value={activeCampaigns.length} color={C.purple}/>
        {(role==="leadership"||role==="am")&&<StatCard label="Brand Deals" value={myBrandDeals.length} color={C.orange}/>}
        {role==="leadership"&&<StatCard label="Avg QA Score" value={avgQA!==null?`${avgQA}%`:"—"} color={avgQA!==null?scoreCol(avgQA):C.muted} sub={violations>0?`${violations} violations`:""}/>}
        {(role==="leadership"||role==="am")&&<StatCard label="Snap Revenue" value={todaySnap>0?fmtMoney(todaySnap):"—"} color="#f59e0b" sub="today"/>}
        {role==="leadership"&&<StatCard label="Total Followers" value={totalFollowers>999?`${(totalFollowers/1000).toFixed(1)}k`:totalFollowers} color="#0ea5e9"/>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Open To-Dos</span>
            <Btn size="sm" variant="secondary" onClick={()=>onAction("todos")}>View all</Btn>
          </div>
          {myTodos.length===0&&<div style={{color:C.muted,fontSize:13}}>All clear ✓</div>}
          {myTodos.slice(0,4).map(t=>{const st=t.status||"Pending";const sc={Pending:C.muted,["In Progress"]:C.blue,Stuck:C.red,Complete:C.green}[st];return(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{t.task}</div>
                <div style={{display:"flex",gap:5,marginTop:3,alignItems:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,color:sc,background:sc+"22",padding:"1px 6px",borderRadius:99}}>{st}</span>
                  {t.dueDate&&<span style={{fontSize:11,color:t.dueDate<new Date().toISOString().slice(0,10)?C.red:C.muted}}>Due {t.dueDate}</span>}
                </div>
              </div>
              <Badge label={t.priority} color={{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}/>
            </div>
          );})}
        </Card>
        <Card>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Active Campaigns</span>
            <Btn size="sm" variant="secondary" onClick={()=>onAction("campaigns")}>View all</Btn>
          </div>
          {activeCampaigns.length===0&&<div style={{color:C.muted,fontSize:13}}>No active campaigns</div>}
          {activeCampaigns.slice(0,4).map(c=>(
            <div key={c.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.model} · {c.type}</div></div>
                <Badge label={c.status} color={c.status==="Live"?C.green:C.blue}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
      {(role==="leadership"||role==="am")&&myBrandDeals.length>0&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Brand Deals In Progress</span>
            <Btn size="sm" variant="secondary" onClick={()=>onAction("brand")}>View all</Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
            {myBrandDeals.slice(0,4).map(d=>(
              <div key={d.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px",borderLeft:`3px solid ${d.paid?C.green:C.orange}`}}>
                <div style={{fontWeight:700,fontSize:13}}>{d.brand}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{d.model} · {fmtMoney(d.payment)}</div>
                <div style={{fontSize:11,color:d.deadline&&d.deadline<new Date().toISOString().slice(0,10)?C.red:C.muted,marginTop:2}}>{d.deadline?`Due ${d.deadline}`:""}</div>
                <Badge label={d.status} color={d.status==="Active"?C.green:d.status==="In Progress"?C.blue:C.muted}/>
              </div>
            ))}
          </div>
        </Card>
      )}
      {(role==="leadership"||role==="am")&&(
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:700,fontSize:13}}>Calendar</span>
              <select value={calFilter} onChange={e=>setCalFilter(e.target.value)} style={{...s.input,width:"auto",marginBottom:0,fontSize:12,padding:"4px 10px"}}>
                <option>All</option>{myModels.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setShowGcal(!showGcal)} style={{background:gcalSaved?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.07)",border:`1px solid ${gcalSaved?C.green:"rgba(255,255,255,0.15)"}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600,color:gcalSaved?C.green:C.muted}}>
                {gcalSaved?"📅 GCal Connected":"🔗 Connect Google Calendar"}
              </button>
              <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontWeight:700}}>‹</button>
              <span style={{fontSize:12,fontWeight:700,minWidth:120,textAlign:"center"}}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontWeight:700}}>›</button>
            </div>
          </div>
          {showGcal&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.12)",borderRadius:10}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Enter your Google Calendar ID. Live sync available when backend is connected.</div>
              <div style={{display:"flex",gap:8}}>
                <input value={gcalId} onChange={e=>setGcalId(e.target.value)} placeholder="your-email@gmail.com or calendar ID" style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
                <Btn size="sm" onClick={()=>{setGcalSaved(gcalId);setShowGcal(false);}}>Save</Btn>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4}}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,padding:"2px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
            {calCells.map((d,i)=>{
              const isToday=d&&`${calYear}-${pad(calMonth+1)}-${pad(d)}`===new Date().toISOString().slice(0,10);
              const evts=d?getCalEvents(d):[];
              return(
                <div key={i} style={{minHeight:60,background:d?C.bg:"transparent",borderRadius:6,padding:d?"3px 4px":0,border:isToday?`2px solid ${C.purple}`:`1px solid ${d?"rgba(124,58,237,0.15)":"transparent"}`}}>
                  {d&&<div style={{fontSize:10,fontWeight:isToday?800:500,color:isToday?C.purple:C.text,marginBottom:1}}>{d}</div>}
                  {evts.slice(0,2).map((e,ei)=><div key={ei} title={e.label} style={{fontSize:9,background:e.color+"22",color:e.color,borderRadius:3,padding:"1px 3px",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:600}}>{e.label}</div>)}
                  {evts.length>2&&<div style={{fontSize:9,color:C.muted}}>+{evts.length-2}</div>}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
            {[["Campaigns",C.purple],["To-Do Due Dates",C.red],["Brand Deal Deadlines",C.orange],["Model Events","#ec4899"]].map(([l,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted}}><div style={{width:8,height:8,borderRadius:2,background:c}}/>{l}</div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Quick Actions</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn size="sm" onClick={()=>onAction("todos")}>+ New To-Do</Btn>
          <Btn size="sm" variant="secondary" onClick={()=>onAction("campaigns")}>+ Campaign</Btn>
          {(role==="leadership"||role==="am")&&<Btn size="sm" variant="secondary" onClick={()=>onAction("brand")}>+ Brand Deal</Btn>}
          {(role==="leadership"||role==="am")&&<Btn size="sm" variant="secondary" onClick={()=>onAction("social")}>📱 Log Metrics</Btn>}
          {(role==="leadership"||role==="am")&&<Btn size="sm" variant="secondary" onClick={()=>onAction("snap")}>👻 Log Snap Rev</Btn>}
          {role==="leadership"&&<Btn size="sm" variant="secondary" onClick={()=>onAction("qa")}>+ QA Review</Btn>}
        </div>
      </Card>
    </div>
  );
}
// ── SOCIAL METRICS ────────────────────────────────────────────
function SocialMetrics({user,socialMetrics,setSocialMetrics,models,isLeadership,myModels}){
  const PLATFORMS=["TikTok","Instagram","Snapchat","Streaming"];
  const PLAT_ICON={TikTok:"🎵",Instagram:"📸",Snapchat:"👻",Streaming:"🎥"};
  const PLAT_COL={TikTok:C.purple,Instagram:C.pink,Snapchat:"#f59e0b",Streaming:C.purple};
  const [platform,setPlatform]=useState("TikTok");
  const [fm,setFm]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const blank={model:vm[0]||"",platform,date:new Date().toISOString().slice(0,10),followers:"",views:"",likes:"",comments:"",shares:"",notes:""};
  const [form,setForm]=useState(blank);
  useEffect(()=>setForm(p=>({...p,platform})),[platform]);
  const entries=socialMetrics.filter(e=>(fm==="All"||e.model===fm)&&e.platform===platform&&(isLeadership||myModels.includes(e.model))).sort((a,b)=>b.date.localeCompare(a.date));
  const latestByModel={};
  entries.forEach(e=>{if(!latestByModel[e.model])latestByModel[e.model]=e;});
  const totalFollowers=Object.values(latestByModel).reduce((a,e)=>a+Number(e.followers||0),0);
  const totalViews=Object.values(latestByModel).reduce((a,e)=>a+Number(e.views||0),0);
  return(
    <div>
      <SectionHeader icon="📱" title="Social Platform Metrics" action={<Btn size="sm" onClick={()=>{setForm({...blank,platform});setShowAdd(true);}}>+ Log Metrics</Btn>}/>
      <div style={{display:"flex",gap:4,marginBottom:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:4}}>
        {PLATFORMS.map(p=>(
          <button key={p} onClick={()=>setPlatform(p)} style={{flex:1,padding:"7px 4px",borderRadius:9,border:platform===p?"1px solid rgba(167,139,250,0.35)":"1px solid transparent",background:platform===p?"linear-gradient(135deg,rgba(124,58,237,0.45),rgba(192,38,211,0.35))":"transparent",color:platform===p?C.white:C.muted,fontWeight:platform===p?700:500,fontSize:12,cursor:"pointer",boxShadow:platform===p?"0 2px 10px rgba(124,58,237,0.25)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
            {PLAT_ICON[p]} {p}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:16}}>
        <StatCard label="Total Followers" value={totalFollowers>999?`${(totalFollowers/1000).toFixed(1)}k`:totalFollowers||"—"} color={PLAT_COL[platform]}/>
        {platform!=="Instagram"&&<StatCard label="Total Views" value={totalViews>999?`${(totalViews/1000).toFixed(1)}k`:totalViews||"—"} color={PLAT_COL[platform]}/>}
        <StatCard label="Models Tracked" value={Object.keys(latestByModel).length} color={C.muted}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{vm.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
      {showAdd&&(
        <Modal title={`Log ${platform} Metrics`} onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={vm}/>
            <Input label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date"/>
            <Input label="Followers" value={form.followers} onChange={v=>setForm(p=>({...p,followers:v}))} placeholder="45000" type="number"/>
            {platform!=="Instagram"&&<Input label="Views" value={form.views} onChange={v=>setForm(p=>({...p,views:v}))} placeholder="120000" type="number"/>}
            <Input label="Likes" value={form.likes} onChange={v=>setForm(p=>({...p,likes:v}))} placeholder="8400" type="number"/>
            <Input label="Comments" value={form.comments} onChange={v=>setForm(p=>({...p,comments:v}))} placeholder="340" type="number"/>
            {platform!=="Instagram"&&<Input label="Shares" value={form.shares} onChange={v=>setForm(p=>({...p,shares:v}))} placeholder="1200" type="number"/>}
          </div>
          <Input label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Any context…"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.model)return;setSocialMetrics(p=>[{...form,id:Date.now()},...p]);setShowAdd(false);}}>Save</Btn>
          </div>
        </Modal>
      )}
      {entries.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No {platform} metrics logged yet</div>}
      {Object.keys(latestByModel).map(model=>{
        const latest=latestByModel[model];
        const prev=entries.filter(e=>e.model===model)[1];
        const followerDelta=prev?Number(latest.followers)-Number(prev.followers):null;
        return(
          <Card key={model} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{PLAT_ICON[platform]}</span>
                <span style={{fontWeight:700,fontSize:14}}>{model}</span>
                {followerDelta!==null&&<span style={{fontSize:11,fontWeight:700,color:followerDelta>=0?C.green:C.red}}>{followerDelta>=0?"+":""}{followerDelta>=1000?`${(followerDelta/1000).toFixed(1)}k`:followerDelta} followers</span>}
              </div>
              <span style={{fontSize:11,color:C.muted}}>{latest.date}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:8}}>
              {[["Followers",latest.followers],["Views",latest.views],["Likes",latest.likes],["Comments",latest.comments],["Shares",latest.shares]].filter(([,v])=>v!==undefined&&v!=="").map(([l,v])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:800,color:PLAT_COL[platform]}}>{Number(v)>999?`${(Number(v)/1000).toFixed(1)}k`:v}</div>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",fontWeight:600,letterSpacing:"0.04em"}}>{l}</div>
                </div>
              ))}
            </div>
            {latest.notes&&<p style={{fontSize:12,color:C.muted,margin:"8px 0 0"}}>{latest.notes}</p>}
          </Card>
        );
      })}
    </div>
  );
}
// ── GROWTH CAMPAIGNS ──────────────────────────────────────────
function GrowthCampaigns({user,growthCampaigns,setGrowthCampaigns,models,isLeadership,myModels}){
  const TYPES=["Sound Promo","Trend Tracking","Viral Content","Collab","Paid Promo","Other"];
  const PLATFORMS=["TikTok","Instagram","Snapchat","Streaming"];
  const PLAT_COL={TikTok:C.purple,Instagram:C.pink,Snapchat:"#f59e0b",Streaming:C.purple};
  const STATUS_COL={Active:C.green,Planned:C.blue,Paused:C.yellow,Complete:C.muted};
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const [fp,setFp]=useState("All");const [fs,setFs]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const blank={model:vm[0]||"",platform:"TikTok",type:"Sound Promo",name:"",status:"Planned",startDate:new Date().toISOString().slice(0,10),endDate:"",notes:""};
  const [form,setForm]=useState(blank);
  const visible=growthCampaigns.filter(g=>(fp==="All"||g.platform===fp)&&(fs==="All"||g.status===fs)&&(isLeadership||myModels.includes(g.model)));
  return(
    <div>
      <SectionHeader icon="🚀" title="Growth Campaigns" action={<Btn size="sm" onClick={()=>{setForm(blank);setShowAdd(true);}}>+ New Campaign</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {PLATFORMS.map(p=>{const count=visible.filter(g=>g.platform===p&&g.status==="Active").length;return(
          <Card key={p} style={{padding:12,textAlign:"center",borderTop:`3px solid ${PLAT_COL[p]}`}}>
            <div style={{fontSize:18,fontWeight:800,color:PLAT_COL[p]}}>{count}</div>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{p} Active</div>
          </Card>
        );})}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <select value={fp} onChange={e=>setFp(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{PLATFORMS.map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={fs} onChange={e=>setFs(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{["Active","Planned","Paused","Complete"].map(st=><option key={st}>{st}</option>)}
        </select>
      </div>
      {showAdd&&(
        <Modal title="New Growth Campaign" onClose={()=>setShowAdd(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={vm}/>
            <Sel label="Platform" value={form.platform} onChange={v=>setForm(p=>({...p,platform:v}))} options={PLATFORMS}/>
            <Sel label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={TYPES}/>
            <Sel label="Status" value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={["Active","Planned","Paused","Complete"]}/>
            <Input label="Start Date" value={form.startDate} onChange={v=>setForm(p=>({...p,startDate:v}))} type="date"/>
            <Input label="End Date" value={form.endDate} onChange={v=>setForm(p=>({...p,endDate:v}))} type="date"/>
          </div>
          <Input label="Campaign Name" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="e.g. Spring Sound Promo" style={{gridColumn:"1/-1"}}/>
          <Input label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Details, links, strategy…"/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.name)return;setGrowthCampaigns(p=>[...p,{...form,id:Date.now()}]);setShowAdd(false);}}>Add Campaign</Btn>
          </div>
        </Modal>
      )}
      {visible.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No growth campaigns yet</div>}
      {visible.map(g=>(
        <Card key={g.id} style={{marginBottom:10,borderLeft:`3px solid ${PLAT_COL[g.platform]}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{g.name}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{g.model} · {g.platform} · {g.type}</div>
              {g.startDate&&<div style={{fontSize:11,color:C.muted}}>{g.startDate}{g.endDate?` → ${g.endDate}`:""}</div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <Badge label={g.platform} color={PLAT_COL[g.platform]}/>
              <select value={g.status} onChange={e=>setGrowthCampaigns(p=>p.map(x=>x.id===g.id?{...x,status:e.target.value}:x))} style={{...s.input,width:"auto",marginBottom:0,fontSize:12,padding:"4px 10px"}}>{["Active","Planned","Paused","Complete"].map(st=><option key={st}>{st}</option>)}</select>
            </div>
          </div>
          {g.notes&&<p style={{fontSize:12,color:C.muted,margin:"8px 0 0"}}>{g.notes}</p>}
        </Card>
      ))}
    </div>
  );
}
// ── BRAND DEALS ───────────────────────────────────────────────
function BrandDeals({user,brandDeals,setBrandDeals,models,isLeadership,myModels}){
  const STATUS_COL={Active:C.green,"In Progress":C.blue,Negotiating:C.yellow,Complete:C.muted,Cancelled:C.red};
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const [fs,setFs]=useState("All");const [fm,setFm]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const blank={model:vm[0]||"",brand:"",type:"Sponsored Post",deliverables:"",deadline:"",payment:"",paid:false,status:"Negotiating",stripeId:"",notes:""};
  const [form,setForm]=useState(blank);
  const visible=brandDeals.filter(d=>(fm==="All"||d.model===fm)&&(fs==="All"||d.status===fs)&&(isLeadership||myModels.includes(d.model)));
  const totalPending=visible.filter(d=>!d.paid).reduce((a,d)=>a+Number(d.payment||0),0);
  const totalPaid=visible.filter(d=>d.paid).reduce((a,d)=>a+Number(d.payment||0),0);
  return(
    <div>
      <SectionHeader icon="🤝" title="Brand Deals & Partnerships" action={<Btn size="sm" onClick={()=>{setForm(blank);setShowAdd(true);}}>+ New Deal</Btn>}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Active Deals" value={visible.filter(d=>["Active","In Progress"].includes(d.status)).length} color={C.green}/>
        <StatCard label="Pending Payment" value={fmtMoney(totalPending)} color={C.orange}/>
        <StatCard label="Paid Out" value={fmtMoney(totalPaid)} color={C.purple}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{vm.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={fs} onChange={e=>setFs(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{Object.keys(STATUS_COL).map(st=><option key={st}>{st}</option>)}
        </select>
      </div>
      {showAdd&&(
        <Modal title="New Brand Deal" onClose={()=>setShowAdd(false)} width={520}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={vm}/>
            <Sel label="Type" value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={["Sponsored Post","Ambassador","Affiliate","Collaboration","Product Gift","Other"]}/>
            <Input label="Brand Name" value={form.brand} onChange={v=>setForm(p=>({...p,brand:v}))} placeholder="e.g. FitTea Co" style={{gridColumn:"1/-1"}}/>
            <Input label="Payment ($)" value={form.payment} onChange={v=>setForm(p=>({...p,payment:v}))} placeholder="1500" type="number"/>
            <Input label="Deadline" value={form.deadline} onChange={v=>setForm(p=>({...p,deadline:v}))} type="date"/>
            <Input label="Stripe Payment ID" value={form.stripeId} onChange={v=>setForm(p=>({...p,stripeId:v}))} placeholder="pi_… (optional)" style={{gridColumn:"1/-1"}}/>
          </div>
          <TA label="Deliverables" value={form.deliverables} onChange={v=>setForm(p=>({...p,deliverables:v}))} placeholder="e.g. 1 TikTok, 2 IG Stories, 1 IG Reel" rows={2}/>
          <TA label="Notes" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="Any deal terms, contacts, requirements…" rows={2}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>{if(!form.brand)return;setBrandDeals(p=>[...p,{...form,id:Date.now()}]);setShowAdd(false);}}>Save Deal</Btn>
          </div>
        </Modal>
      )}
      {visible.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No brand deals yet</div>}
      {visible.map(d=>(
        <Card key={d.id} style={{marginBottom:12,borderLeft:`3px solid ${STATUS_COL[d.status]||C.muted}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{d.brand}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{d.model} · {d.type}</div>
              {d.deliverables&&<div style={{fontSize:12,color:C.text,marginTop:4}}><b>Deliverables:</b> {d.deliverables}</div>}
              {d.deadline&&<div style={{fontSize:11,color:d.deadline<new Date().toISOString().slice(0,10)?C.red:C.muted,marginTop:2}}>Due {d.deadline}</div>}
              {d.stripeId&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>Stripe: {d.stripeId}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <span style={{fontSize:18,fontWeight:800,color:d.paid?C.green:C.orange}}>{fmtMoney(d.payment||0)}</span>
              <select value={d.status} onChange={e=>setBrandDeals(p=>p.map(x=>x.id===d.id?{...x,status:e.target.value}:x))} style={{...s.input,width:"auto",marginBottom:0,fontSize:12,padding:"4px 10px"}}>{Object.keys(STATUS_COL).map(st=><option key={st}>{st}</option>)}</select>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                <input type="checkbox" checked={d.paid} onChange={e=>setBrandDeals(p=>p.map(x=>x.id===d.id?{...x,paid:e.target.checked}:x))} style={{cursor:"pointer"}}/>
                <span style={{color:d.paid?C.green:C.muted,fontWeight:600}}>{d.paid?"Paid ✓":"Mark paid"}</span>
              </div>
            </div>
          </div>
          {d.notes&&<p style={{fontSize:12,color:C.muted,margin:"8px 0 0"}}>{d.notes}</p>}
        </Card>
      ))}
    </div>
  );
}
// ── SNAP REVENUE ──────────────────────────────────────────────
function SnapRevenue({user,snapRevenue,setSnapRevenue,models,isLeadership,myModels}){
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const [fm,setFm]=useState("All");
  const blank={model:vm[0]||"",date:new Date().toISOString().slice(0,10),revenue:"",notes:""};
  const [form,setForm]=useState(blank);
  const visible=snapRevenue.filter(r=>(fm==="All"||r.model===fm)&&(isLeadership||myModels.includes(r.model))).sort((a,b)=>b.date.localeCompare(a.date));
  const todayStr=new Date().toISOString().slice(0,10);
  const todayRev=visible.filter(r=>r.date===todayStr).reduce((a,r)=>a+Number(r.revenue||0),0);
  const weekRev=visible.filter(r=>r.date>=new Date(Date.now()-7*864e5).toISOString().slice(0,10)).reduce((a,r)=>a+Number(r.revenue||0),0);
  const avgDaily=visible.length?Math.round(visible.reduce((a,r)=>a+Number(r.revenue||0),0)/visible.length):0;
  return(
    <div>
      <SectionHeader icon="👻" title="Daily Snapchat Revenue"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Today" value={fmtMoney(todayRev)} color="#f59e0b"/>
        <StatCard label="Last 7 Days" value={fmtMoney(weekRev)} color={C.orange}/>
        <StatCard label="Avg Per Day" value={fmtMoney(avgDaily)} color={C.purple}/>
      </div>
      <Card style={{marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>Log Revenue</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
          <Sel label="Model" value={form.model} onChange={v=>setForm(p=>({...p,model:v}))} options={vm}/>
          <Input label="Date" value={form.date} onChange={v=>setForm(p=>({...p,date:v}))} type="date"/>
          <Input label="Revenue ($)" value={form.revenue} onChange={v=>setForm(p=>({...p,revenue:v}))} placeholder="0" type="number"/>
          <Btn size="sm" onClick={()=>{if(!form.revenue)return;setSnapRevenue(p=>[...p,{...form,id:Date.now()}]);setForm(p=>({...p,revenue:"",notes:""}));}}>Log</Btn>
        </div>
        <Input label="Notes (optional)" value={form.notes} onChange={v=>setForm(p=>({...p,notes:v}))} placeholder="e.g. Story promo active"/>
      </Card>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{vm.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
      {visible.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No Snapchat revenue logged yet</div>}
      {visible.map(r=>(
        <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,marginBottom:6,borderLeft:"3px solid #f59e0b"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontWeight:700,fontSize:13}}>{r.model}</span><Badge label="Snapchat" color="#f59e0b"/><span style={{fontSize:11,color:C.muted}}>{r.date}</span></div>
            {r.notes&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{r.notes}</div>}
          </div>
          <span style={{fontWeight:800,fontSize:16,color:C.green}}>{fmtMoney(r.revenue)}</span>
          <button onClick={()=>setSnapRevenue(p=>p.filter(x=>x.id!==r.id))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
        </div>
      ))}
    </div>
  );
}
// ── STRIPE INVOICES ───────────────────────────────────────────
function StripeInvoices({isLeadership,models,myModels}){
  const [apiKey,setApiKey]=useState("");
  const [savedKey,setSavedKey]=useState("");
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [fm,setFm]=useState("All");
  const [showKey,setShowKey]=useState(false);
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels||[];
  const SAMPLE_INVOICES=[
    {id:"in_001",customer_name:"Brand Deal — FitTea Co",amount_paid:150000,currency:"usd",status:"paid",created:Date.now()/1000-86400*5,hosted_invoice_url:"#",model:"Autumn"},
    {id:"in_002",customer_name:"Brand Deal — GlowSkin",amount_paid:300000,currency:"usd",status:"paid",created:Date.now()/1000-86400*12,hosted_invoice_url:"#",model:"Mia"},
    {id:"in_003",customer_name:"Monthly Retainer",amount_paid:50000,currency:"usd",status:"open",created:Date.now()/1000-86400*2,hosted_invoice_url:"#",model:"Jordan"},
  ];
  const displayInvoices=(savedKey?invoices:SAMPLE_INVOICES).filter(inv=>fm==="All"||(inv.model&&inv.model===fm));
  const fmtStripeAmt=(amt,cur)=>`${cur==="usd"?"$":""}${(amt/100).toLocaleString()}`;
  const fetchInvoices=async()=>{
    setLoading(true);setErr("");
    try{
      const res=await fetch("https://api.stripe.com/v1/invoices?limit=50",{headers:{Authorization:`Bearer ${apiKey}`}});
      if(!res.ok){const d=await res.json();throw new Error(d.error?.message||`HTTP ${res.status}`);}
      const data=await res.json();
      setInvoices(data.data||[]);setSavedKey(apiKey);
    }catch(e){
      setErr(e.message.includes("Failed to fetch")?"Browser security blocks direct Stripe calls — a backend proxy is needed for live data. Sample data shown below.":e.message);
      setSavedKey(apiKey);
    }finally{setLoading(false);}
  };
  const totalPaid=displayInvoices.filter(i=>i.status==="paid").reduce((a,i)=>a+i.amount_paid,0);
  const totalOpen=displayInvoices.filter(i=>i.status==="open").reduce((a,i)=>a+i.amount_paid,0);
  return(
    <div>
      <SectionHeader icon="💳" title="Stripe Invoices"/>
      <Card style={{marginBottom:16,background:savedKey?"rgba(16,185,129,0.08)":"rgba(245,158,11,0.08)",border:`1px solid ${savedKey?C.green:C.yellow}40`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:savedKey?"#dcfce7":"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💳</div>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:savedKey?C.green:C.yellow}}>{savedKey?"Stripe Connected":"Connect Stripe"}</div>
              <div style={{fontSize:11,color:C.muted}}>{savedKey?"Invoice data active":"Enter your Stripe Secret Key to view invoices"}</div>
            </div>
          </div>
          <Btn size="sm" variant="secondary" color={savedKey?C.green:C.yellow} onClick={()=>setShowKey(!showKey)}>{savedKey?"Manage Key":"Connect"}</Btn>
        </div>
        {showKey&&(
          <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8}}>⚠ For production use, route requests through a secure backend proxy. Never expose secret keys in a public app.</div>
            <div style={{display:"flex",gap:8}}>
              <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk_live_… or sk_test_…" style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
              <Btn size="sm" onClick={fetchInvoices} style={{whiteSpace:"nowrap"}}>{loading?"Loading…":"Fetch Invoices"}</Btn>
            </div>
            {err&&<div style={{fontSize:12,color:C.orange,marginTop:8,background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.25)",borderRadius:8,padding:"8px 12px"}}>{err}</div>}
          </div>
        )}
      </Card>
      {!savedKey&&<div style={{fontSize:12,color:C.muted,marginBottom:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:8,padding:"8px 12px"}}>📋 Showing sample data. Connect Stripe to see live invoices.</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <StatCard label="Paid" value={fmtStripeAmt(totalPaid,"usd")} color={C.green}/>
        <StatCard label="Outstanding" value={fmtStripeAmt(totalOpen,"usd")} color={totalOpen>0?C.orange:C.muted}/>
      </div>
      {vm.length>0&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        <select value={fm} onChange={e=>setFm(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
          <option>All</option>{vm.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>}
      {displayInvoices.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No invoices found</div>}
      {displayInvoices.map(inv=>(
        <Card key={inv.id} style={{marginBottom:10,borderLeft:`3px solid ${inv.status==="paid"?C.green:inv.status==="open"?C.orange:C.muted}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{inv.customer_name||inv.id}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{new Date(inv.created*1000).toLocaleDateString()}{inv.model&&` · ${inv.model}`}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontWeight:800,fontSize:15,color:inv.status==="paid"?C.green:C.orange}}>{fmtStripeAmt(inv.amount_paid,inv.currency)}</span>
              <Badge label={inv.status} color={inv.status==="paid"?C.green:inv.status==="open"?C.orange:C.muted}/>
              {inv.hosted_invoice_url&&inv.hosted_invoice_url!=="#"&&<a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.purple,fontWeight:600}}>View ↗</a>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
// ── PLATFORM CONNECTIONS ───────────────────────────────────────
function PlatformConnections({models,isLeadership,myModels}){
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels||[];
  const [connections,setConnections]=useState(()=>Object.fromEntries(vm.map(m=>[m,{tiktok:"",instagram:"",snapchat:""}])));
  const [selModel,setSelModel]=useState(vm[0]||"");
  const PLATFORMS=[
    {key:"tiktok",label:"TikTok",icon:"🎵",color:"#000000",placeholder:"TikTok API Token",note:"TikTok for Developers → Long-lived access token"},
    {key:"instagram",label:"Instagram",icon:"📸",color:C.pink,placeholder:"Instagram Graph API Token",note:"Meta for Developers → Graph API → User Access Token"},
    {key:"snapchat",label:"Snapchat",icon:"👻",color:"#f59e0b",placeholder:"Snapchat Marketing API Token",note:"Snap Business → API Access → OAuth Bearer Token"},
  ];
  const conn=connections[selModel]||{tiktok:"",instagram:"",snapchat:""};
  const setConn=(field,val)=>setConnections(p=>({...p,[selModel]:{...p[selModel],[field]:val}}));
  const connectedCount=Object.values(conn).filter(v=>v).length;
  return(
    <div>
      <SectionHeader icon="🔗" title="Platform API Connections"/>
      <Card style={{marginBottom:16,background:"rgba(59,130,246,0.08)",border:`1px solid rgba(59,130,246,0.25)`}}>
        <div style={{fontSize:13,color:C.blue,fontWeight:600,marginBottom:4}}>🔒 API-Ready — Connection UI</div>
        <div style={{fontSize:12,color:C.muted}}>Store API tokens per model here. When backend proxy support is added, these tokens will be used to auto-pull follower counts, view metrics, and revenue data into the Social Metrics tracker.</div>
      </Card>
      {vm.length>1&&(
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {vm.map(m=>{const c=connections[m]||{};const cnt=Object.values(c).filter(v=>v).length;return(
            <button key={m} onClick={()=>setSelModel(m)} style={{padding:"6px 14px",borderRadius:99,border:`1.5px solid ${selModel===m?C.purple:"rgba(255,255,255,0.15)"}`,background:selModel===m?C.purpleXL:"rgba(255,255,255,0.06)",color:selModel===m?C.purpleL:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              {m} {cnt>0&&<Badge label={`${cnt}/3`} color={cnt===3?C.green:C.blue}/>}
            </button>
          );})}
        </div>
      )}
      {selModel&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:14}}>{selModel} — Platform Connections</div>
            <Badge label={`${connectedCount}/3 connected`} color={connectedCount===3?C.green:connectedCount>0?C.blue:C.muted}/>
          </div>
          {PLATFORMS.map(p=>(
            <div key={p.key} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:16}}>{p.icon}</span>
                <span style={{fontWeight:700,color:p.color,fontSize:13}}>{p.label}</span>
                {conn[p.key]&&<Badge label="Connected ✓" color={C.green}/>}
              </div>
              <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{p.note}</div>
              <div style={{display:"flex",gap:8}}>
                <input type="password" value={conn[p.key]} onChange={e=>setConn(p.key,e.target.value)} placeholder={p.placeholder} style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=p.color} onBlur={e=>e.target.style.borderColor=C.border}/>
                {conn[p.key]&&<Btn size="sm" variant="danger" onClick={()=>setConn(p.key,"")}>Clear</Btn>}
              </div>
            </div>
          ))}
          <Btn size="sm" onClick={()=>alert("Tokens saved locally. Backend integration coming soon.")}>Save Connections</Btn>
        </Card>
      )}
      {!vm.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No models assigned</div>}
    </div>
  );
}
// ── MODEL PORTAL ──────────────────────────────────────────────
function ModelPortal({user,models,ttks,setTtks,campaigns,brandDeals,content,socialMetrics,growthCampaigns,modelEvents,setModelEvents,mg,setMg}){
  const [tab,setTab]=useState("home");
  const modelName=user.name;
  const hasMg=mg.some(m=>m.model===modelName);
  const model=models.find(m=>m.name===modelName);
  const ttk=ttks.find(t=>t.model===modelName);
  const [ttkForm,setTtkForm]=useState(ttk||{voice:"",endearments:"",hardNos:"",offlineTimes:""});
  useEffect(()=>{const t=ttks.find(x=>x.model===modelName);if(t)setTtkForm({...t});},[ttks,modelName]);
  const saveTtk=()=>setTtks(p=>p.map(x=>x.model===modelName?{...x,...ttkForm,lastUpdated:new Date().toISOString().slice(0,10),updatedBy:modelName}:x));
  const myCampaigns=campaigns.filter(c=>c.model===modelName);
  const myDeals=brandDeals.filter(d=>d.model===modelName);
  const myContent=content.filter(c=>c.model===modelName);
  const myGrowth=growthCampaigns.filter(g=>g.model===modelName);
  const myMetrics=socialMetrics.filter(m=>m.model===modelName);
  const activeCampaigns=myCampaigns.filter(c=>["Live","Scheduled"].includes(c.status));
  const openDeals=myDeals.filter(d=>d.status!=="Complete"&&d.status!=="Cancelled");
  const unpaidDeals=myDeals.filter(d=>!d.paid&&d.status!=="Cancelled");
  const now=new Date();
  const [calYear,setCalYear]=useState(now.getFullYear());
  const [calMonth,setCalMonth]=useState(now.getMonth());
  const [gcalId,setGcalId]=useState("");const [gcalSaved,setGcalSaved]=useState("");
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const pad=n=>String(n).padStart(2,"0");
  const daysInMonth=(y,m)=>new Date(y,m+1,0).getDate();
  const firstDay=(y,m)=>new Date(y,m,1).getDay();
  const calDays=daysInMonth(calYear,calMonth);const calStart=firstDay(calYear,calMonth);
  const calCells=[];for(let i=0;i<calStart;i++)calCells.push(null);for(let d=1;d<=calDays;d++)calCells.push(d);
  const myModelEvents=(modelEvents||[]).filter(e=>e.model===modelName);
  const [showEventForm,setShowEventForm]=useState(false);
  const [evtForm,setEvtForm]=useState({date:"",title:"",type:"event",notes:"",color:"#ec4899"});
  const EVENT_TYPES=[{k:"birthday",l:"Birthday",c:"#ec4899"},{k:"competition",l:"Competition",c:"#f59e0b"},{k:"event",l:"Event",c:"#0ea5e9"},{k:"reminder",l:"Reminder",c:"#a78bfa"}];
  const getEventsForDay=(d)=>{
    const ds=`${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    const evts=[];
    myCampaigns.filter(c=>c.startDate&&c.endDate&&ds>=c.startDate&&ds<=c.endDate).forEach(c=>evts.push({label:c.name,color:C.purple}));
    myDeals.filter(d=>d.deadline===ds).forEach(d=>evts.push({label:`${d.brand} deadline`,color:C.orange}));
    myModelEvents.filter(e=>e.date===ds).forEach(e=>evts.push({label:e.title,color:e.color||"#ec4899"}));
    return evts;
  };
  return(
    <div>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Hey {modelName}</span>
      </div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20,paddingLeft:2}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      <Tabs tabs={[["home","Home"],["calendar","Calendar"],...(hasMg?[["mg","Deliverables"]]:[]),["brand","Brand Deals"],["invoices","Invoices"],["ttk","My Profile"],["content","Content"],["growth","Growth"]]} active={tab} onChange={setTab}/>
      {tab==="home"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
            <StatCard label="Active Campaigns" value={activeCampaigns.length} color={C.purple} icon="📅"/>
            <StatCard label="Open Brand Deals" value={openDeals.length} color={C.orange} icon="🤝"/>
            <StatCard label="Unpaid Amount" value={fmtMoney(unpaidDeals.reduce((a,d)=>a+Number(d.payment||0),0))} color={unpaidDeals.length>0?C.orange:C.green} icon="💸"/>
            <StatCard label="Content Pieces" value={myContent.length} color={C.blue} icon="📸"/>
          </div>
          {openDeals.length>0&&(
            <Card style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🤝 Your Brand Deals</div>
              {openDeals.map(d=>(
                <div key={d.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{d.brand}</div><div style={{fontSize:11,color:C.muted}}>{d.deliverables}</div>{d.deadline&&<div style={{fontSize:11,color:d.deadline<new Date().toISOString().slice(0,10)?C.red:C.muted}}>Due {d.deadline}</div>}</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontWeight:700,color:d.paid?C.green:C.orange}}>{fmtMoney(d.payment||0)}</span><Badge label={d.paid?"Paid":"Pending"} color={d.paid?C.green:C.orange}/></div>
                  </div>
                </div>
              ))}
            </Card>
          )}
          {activeCampaigns.length>0&&(
            <Card>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📅 Active Campaigns</div>
              {activeCampaigns.map(c=>(
                <div key={c.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:600,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.type} · {c.startDate} → {c.endDate}</div></div>
                    <Badge label={c.status} color={c.status==="Live"?C.green:C.blue}/>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
      {tab==="calendar"&&(
        <div>
          <SectionHeader icon="📅" title="My Calendar"/>
          <Card style={{marginBottom:16,background:gcalSaved?"rgba(16,185,129,0.08)":"rgba(59,130,246,0.08)",border:`1px solid ${gcalSaved?C.green:C.blue}40`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>🗓️</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:gcalSaved?C.green:C.blue}}>{gcalSaved?"Google Calendar Connected":"Connect Google Calendar"}</div>
                  <div style={{fontSize:11,color:C.muted}}>{gcalSaved?"Calendar ID saved — API integration coming soon":"Paste your Calendar ID to link your schedule"}</div>
                </div>
              </div>
              {gcalSaved&&<Badge label="API-Ready" color={C.green}/>}
            </div>
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <input value={gcalId} onChange={e=>setGcalId(e.target.value)} placeholder="your-calendar@gmail.com or Calendar ID" style={{...s.input,flex:1}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
              <Btn size="sm" onClick={()=>setGcalSaved(gcalId)}>Save</Btn>
            </div>
            {gcalSaved&&<div style={{fontSize:11,color:C.muted,marginTop:8}}>Saved ID: {gcalSaved} · Live sync will be available when backend is connected.</div>}
          </Card>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700,color:C.text}}>‹</button>
            <span style={{fontWeight:700,fontSize:16,flex:1,textAlign:"center"}}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontWeight:700,color:C.text}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.muted,padding:"4px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {calCells.map((d,i)=>{
              const isToday=d&&`${calYear}-${pad(calMonth+1)}-${pad(d)}`===new Date().toISOString().slice(0,10);
              const evts=d?getEventsForDay(d):[];
              return(
                <div key={i} style={{minHeight:72,background:d?"rgba(255,255,255,0.04)":"transparent",borderRadius:8,padding:d?"4px 6px":0,border:isToday?`2px solid ${C.purple}`:`1px solid ${d?"rgba(124,58,237,0.15)":"transparent"}`}}>
                  {d&&<div style={{fontSize:11,fontWeight:isToday?800:500,color:isToday?C.purpleL:C.text,marginBottom:2}}>{d}</div>}
                  {evts.slice(0,3).map((e,ei)=><div key={ei} style={{fontSize:10,background:e.color+"18",color:e.color,borderRadius:4,padding:"1px 4px",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:600}}>{e.label}</div>)}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,marginTop:12,flexWrap:"wrap"}}>
            {[["Campaigns",C.purple],["Brand Deadlines",C.orange],["Personal Events","#ec4899"]].map(([l,c])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}><div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}</div>
            ))}
          </div>
          <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13}}>Personal Dates & Events</div>
              <Btn size="sm" onClick={()=>setShowEventForm(!showEventForm)}>+ Add Date</Btn>
            </div>
            {showEventForm&&(
              <Card style={{marginBottom:12,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.2)"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <Input label="Date" value={evtForm.date} onChange={v=>setEvtForm(p=>({...p,date:v}))} type="date"/>
                  <Input label="Title" value={evtForm.title} onChange={v=>setEvtForm(p=>({...p,title:v}))} placeholder="e.g. Birthday, Competition"/>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={s.label}>Type</label>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {EVENT_TYPES.map(t=>(
                      <button key={t.k} onClick={()=>setEvtForm(p=>({...p,type:t.k,color:t.c}))} style={{padding:"4px 12px",borderRadius:99,border:`1.5px solid ${evtForm.type===t.k?t.c:"rgba(255,255,255,0.15)"}`,background:evtForm.type===t.k?t.c+"22":"rgba(255,255,255,0.04)",color:evtForm.type===t.k?t.c:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.l}</button>
                    ))}
                  </div>
                </div>
                <Input label="Notes (optional)" value={evtForm.notes} onChange={v=>setEvtForm(p=>({...p,notes:v}))} placeholder="Any context…"/>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <Btn variant="secondary" size="sm" onClick={()=>setShowEventForm(false)}>Cancel</Btn>
                  <Btn size="sm" onClick={()=>{if(!evtForm.date||!evtForm.title)return;setModelEvents(p=>[...p,{...evtForm,id:Date.now(),model:modelName}]);setEvtForm({date:"",title:"",type:"event",notes:"",color:"#ec4899"});setShowEventForm(false);}}>Save</Btn>
                </div>
              </Card>
            )}
            {myModelEvents.length===0&&!showEventForm&&<div style={{color:C.muted,fontSize:13}}>No personal dates added yet.</div>}
            {myModelEvents.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{width:10,height:10,borderRadius:99,background:e.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{e.title}</div>
                  <div style={{fontSize:11,color:C.muted}}>{e.date}{e.notes&&` · ${e.notes}`}</div>
                </div>
                <Badge label={e.type} color={e.color}/>
                <button onClick={()=>setModelEvents(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="mg"&&<MGDeliverables user={user} mg={mg} setMg={setMg} models={models} isLeadership={false} isAM={false} myModels={[modelName]}/>}
      {tab==="brand"&&(
        <div>
          <SectionHeader icon="🤝" title="Your Brand Deals"/>
          {myDeals.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No brand deals yet</div>}
          {myDeals.map(d=>(
            <Card key={d.id} style={{marginBottom:10,borderLeft:`3px solid ${{Active:C.green,"In Progress":C.blue,Negotiating:C.yellow,Complete:C.muted,Cancelled:C.red}[d.status]||C.muted}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:700,fontSize:14}}>{d.brand}</div><div style={{fontSize:11,color:C.muted}}>{d.type}</div>{d.deliverables&&<div style={{fontSize:12,marginTop:4}}><b>Deliverables:</b> {d.deliverables}</div>}{d.deadline&&<div style={{fontSize:11,color:d.deadline<new Date().toISOString().slice(0,10)?C.red:C.muted,marginTop:2}}>Due {d.deadline}</div>}</div>
                <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:d.paid?C.green:C.orange}}>{fmtMoney(d.payment||0)}</div><Badge label={d.paid?"Paid ✓":"Pending"} color={d.paid?C.green:C.orange}/></div>
              </div>
              {d.notes&&<p style={{fontSize:12,color:C.muted,margin:"8px 0 0"}}>{d.notes}</p>}
            </Card>
          ))}
        </div>
      )}
      {tab==="content"&&(
        <div>
          <SectionHeader icon="📸" title="Your Content"/>
          {myContent.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No content logged yet</div>}
          {myContent.map(c=>(
            <Card key={c.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:600}}>{c.tag||c.theme}</div><div style={{fontSize:11,color:C.muted}}>{c.type} · {c.date} · {c.assetCount} assets</div></div>
                <Badge label={c.priceTier} color={C.purple}/>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab==="invoices"&&<StripeInvoices isLeadership={false} models={models} myModels={[modelName]}/>}
      {tab==="ttk"&&(
        <div>
          <SectionHeader icon="✏️" title="My Profile & Voice Guide"/>
          {!ttk&&<div style={{color:C.muted,fontSize:13,marginBottom:12}}>No profile set up yet. Ask your AM to create your TTK first.</div>}
          {ttk&&(
            <Card>
              <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Last updated {ttkForm.lastUpdated||"—"} · Changes will be reviewed by your AM.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Age" value={ttkForm.age||""} onChange={v=>setTtkForm(p=>({...p,age:v}))} placeholder="25"/>
                <Input label="Location" value={ttkForm.location||""} onChange={v=>setTtkForm(p=>({...p,location:v}))} placeholder="California"/>
                <Input label="Personality" value={ttkForm.personality||""} onChange={v=>setTtkForm(p=>({...p,personality:v}))} placeholder="Adventurous, playful…" style={{gridColumn:"1/-1"}}/>
                <Input label="Interests" value={ttkForm.interests||""} onChange={v=>setTtkForm(p=>({...p,interests:v}))} placeholder="Hiking, photography…" style={{gridColumn:"1/-1"}}/>
                <Input label="Fun Facts" value={ttkForm.personalFacts||""} onChange={v=>setTtkForm(p=>({...p,personalFacts:v}))} placeholder="Has a dog named Biscuit…" style={{gridColumn:"1/-1"}}/>
              </div>
              <div style={{marginTop:4,padding:"12px",background:C.redL,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:10,marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>🚫 Hard Nos (read-only — set by leadership)</div>
                <div style={{fontSize:13,color:C.red,fontWeight:600}}>{ttkForm.hardNos||"None set"}</div>
              </div>
              <div style={{padding:"12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:10,marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Voice Style (set by team)</div>
                <div style={{fontSize:13}}>{ttkForm.voice||"—"}</div>
              </div>
              <Btn size="sm" onClick={saveTtk}>Save Profile</Btn>
            </Card>
          )}
        </div>
      )}
      {tab==="growth"&&(
        <div>
          <SectionHeader icon="🚀" title="Growth Activity"/>
          {myGrowth.length===0&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No growth campaigns yet</div>}
          {myGrowth.map(g=>(
            <Card key={g.id} style={{marginBottom:10,borderLeft:`3px solid ${{TikTok:"#000",Instagram:C.pink,Snapchat:"#f59e0b",Streaming:C.purple}[g.platform]}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:600}}>{g.name}</div><div style={{fontSize:11,color:C.muted}}>{g.platform} · {g.type}</div>{g.startDate&&<div style={{fontSize:11,color:C.muted}}>{g.startDate}{g.endDate?` → ${g.endDate}`:""}</div>}</div>
                <Badge label={g.status} color={{Active:C.green,Planned:C.blue,Paused:C.yellow,Complete:C.muted}[g.status]}/>
              </div>
            </Card>
          ))}
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Platform Metrics</div>
            {myMetrics.slice(0,5).map(m=>(
              <div key={m.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontWeight:600,fontSize:13}}>{m.platform}</span><span style={{fontSize:11,color:C.muted,marginLeft:8}}>{m.date}</span></div>
                  <div style={{display:"flex",gap:12,fontSize:12}}>{m.followers&&<span><b>{Number(m.followers)>999?`${(Number(m.followers)/1000).toFixed(1)}k`:m.followers}</b> followers</span>}{m.views&&Number(m.views)>0&&<span><b>{Number(m.views)>999?`${(Number(m.views)/1000).toFixed(1)}k`:m.views}</b> views</span>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
                <Badge label={m.status} color={statusCol[m.status]}/><Badge label={m.platform} color={C.muted} bg="rgba(255,255,255,0.1)"/>
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
function AdminPanel({users,setUsers,models,setModels,platforms,setPlatforms,modelPlatforms,setModelPlatforms,discordWebhook,setDiscordWebhook}){
  const [tab,setTab]=useState("users");const [editId,setEditId]=useState(null);const blank={name:"",role:"chatter",email:"",password:"charmed123"};const [form,setForm]=useState(blank);const [showAdd,setShowAdd]=useState(false);const [newPlat,setNewPlat]=useState("");const [newMPlat,setNewMPlat]=useState("");
  const [webhookInput,setWebhookInput]=useState(discordWebhook||"");const [webhookSaved,setWebhookSaved]=useState(false);
  const saveUser=()=>{if(!form.name||!form.email)return;if(editId){setUsers(p=>p.map(u=>u.id===editId?{...u,...form}:u));setEditId(null);}else setUsers(p=>[...p,{...form,id:Date.now()}]);setForm(blank);setShowAdd(false);};
  const addPlat=(list,set,val,setVal)=>{const v=val.trim();if(!v||list.includes(v))return;set(p=>[...p,v]);setVal("");};
  return(
    <div>
      <SectionHeader icon="⚙️" title="Admin Panel"/>
      <Tabs tabs={[["users","Users"],["roles","Roles"],["platforms","Platforms"],["notifications","Notifications"]]} active={tab} onChange={setTab}/>
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
                  <div key={p} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:99,padding:"4px 12px"}}>
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
      {tab==="notifications"&&(
        <div>
          <Card style={{marginBottom:16,background:"rgba(88,28,220,0.08)",border:"1px solid rgba(124,58,237,0.25)"}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4,fontFamily:"'Playfair Display',Georgia,serif"}}>Discord Notifications</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Paste your Discord channel webhook URL below. Charmed Ops will automatically post a message whenever a new content upload or promo is logged by any user.</div>
            <label style={s.label}>Webhook URL</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <input value={webhookInput} onChange={e=>setWebhookInput(e.target.value)} placeholder="https://discord.com/api/webhooks/..." style={{...s.input,flex:1,fontFamily:"monospace",fontSize:12}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
              <Btn size="sm" onClick={()=>{setDiscordWebhook(webhookInput.trim());setWebhookSaved(true);setTimeout(()=>setWebhookSaved(false),2500);}}>{webhookSaved?"Saved ✓":"Save"}</Btn>
              {discordWebhook&&<Btn variant="secondary" size="sm" onClick={()=>{setDiscordWebhook("");setWebhookInput("");}}>Clear</Btn>}
            </div>
            {discordWebhook&&<div style={{fontSize:11,color:C.green,fontWeight:600,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:99,background:C.green,display:"inline-block"}}/>Active — notifications enabled</div>}
            {!discordWebhook&&<div style={{fontSize:11,color:C.muted}}>No webhook configured — notifications are off</div>}
          </Card>
          <Card style={{background:"rgba(255,255,255,0.03)"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>What gets notified</div>
            {[["Content Upload","When any user logs a new content upload (model, tag, type, asset count)"],["Promo Logged","When any user logs a new promo (model, platform, notes)"]].map(([t,d])=>(
              <div key={t} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{width:6,height:6,borderRadius:99,background:discordWebhook?C.green:C.muted,display:"inline-block",marginTop:5,flexShrink:0}}/>
                <div><div style={{fontWeight:600,fontSize:13}}>{t}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{d}</div></div>
              </div>
            ))}
            <div style={{marginTop:12,fontSize:11,color:C.muted}}>To get a webhook URL: Discord server → channel settings → Integrations → Webhooks → New Webhook → Copy URL.</div>
          </Card>
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
      <Card style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontWeight:700,color:C.purpleL,fontSize:13}}>✦ Discord Summary</span>
          <Btn variant="secondary" size="sm" color={copied?C.green:C.purpleL} style={{borderColor:copied?C.green:"rgba(167,139,250,0.4)"}} onClick={()=>{navigator.clipboard?.writeText(discord);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>{copied?"Copied ✓":"Copy"}</Btn>
        </div>
        <pre style={{margin:0,color:C.muted,fontSize:12,whiteSpace:"pre-wrap",fontFamily:"monospace",lineHeight:1.8}}>{discord}</pre>
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
              <span style={{width:30,height:30,borderRadius:99,background:i===0?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.06)",color:i===0?C.yellow:C.muted,fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>#{i+1}</span>
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
                    style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${form.paid===v?C.purple:C.border}`,background:form.paid===v?C.purpleXL:"rgba(255,255,255,0.06)",color:form.paid===v?C.purpleL:C.muted,fontWeight:600,fontSize:13,cursor:"pointer"}}>
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
                <Badge label={c.fan} color={C.muted} bg="rgba(255,255,255,0.1)"/>
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
                style={{padding:"5px 14px",borderRadius:8,border:`1.5px solid ${c.paid?C.green:"rgba(255,255,255,0.15)"}`,background:c.paid?C.greenL:"rgba(255,255,255,0.06)",color:c.paid?C.green:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
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
// ── SOCIAL ANALYTICS (ENHANCED) ──────────────────────────────
function SocialAnalytics({socialMetrics,setSocialMetrics,contentMetrics,setContentMetrics,models,isLeadership,myModels}){
  const PLATFORMS=["TikTok","Instagram","Snapchat"];
  const PLAT_ICON={TikTok:"TT",Instagram:"IG",Snapchat:"SC"};
  const PLAT_COL={TikTok:C.purple,Instagram:C.pink,Snapchat:"#f59e0b"};
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const [selModel,setSelModel]=useState(vm[0]||"");
  const [platform,setPlatform]=useState("TikTok");
  const [subTab,setSubTab]=useState("metrics");
  const [showAdd,setShowAdd]=useState(false);
  const [showLogMetric,setShowLogMetric]=useState(false);
  const pc=PLAT_COL[platform];
  const blankPost={model:selModel,platform,type:"Video",date:new Date().toISOString().slice(0,10),caption:"",views:"",likes:"",comments:"",shares:"",saves:""};
  const [postForm,setPostForm]=useState(blankPost);
  const blankMetric={model:selModel,platform,date:new Date().toISOString().slice(0,10),followers:"",views:"",likes:"",comments:"",shares:"",notes:""};
  const [metricForm,setMetricForm]=useState(blankMetric);
  // Per-model, per-platform entries
  const modelEntries=socialMetrics.filter(e=>e.model===selModel&&e.platform===platform).sort((a,b)=>b.date.localeCompare(a.date));
  const latest=modelEntries[0];
  const prevMonth=modelEntries.find(e=>e.date<(latest?.date||"")&&e.date.slice(0,7)<(latest?.date||"").slice(0,7));
  const followCh=latest&&prevMonth?calcPctChange(latest,prevMonth,"followers"):null;
  const viewCh=latest&&prevMonth?calcPctChange(latest,prevMonth,"views"):null;
  const likesCh=latest&&prevMonth?calcPctChange(latest,prevMonth,"likes"):null;
  const commentsCh=latest&&prevMonth?calcPctChange(latest,prevMonth,"comments"):null;
  // Content feed for this model + platform
  const modelContent=contentMetrics.filter(c=>c.model===selModel&&c.platform===platform).sort((a,b)=>b.date.localeCompare(a.date));
  const MetricTile=({label,value,ch})=>(
    <div style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${pc}28`,borderRadius:12,padding:"14px 16px"}}>
      <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{label}</div>
      <div style={{fontSize:26,fontWeight:800,color:pc,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>{value!=null?fmtMetricVal(value):"—"}</div>
      {ch&&<div style={{marginTop:4,display:"flex",alignItems:"center",fontSize:11}}><ChgBadge pct={ch.pct}/><span style={{color:C.muted,marginLeft:4,fontSize:10}}>vs last month</span></div>}
    </div>
  );
  return(
    <div>
      <SectionHeader icon="📱" title="Social Analytics"/>
      {/* Model selector */}
      <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:600}}>Account:</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {vm.map(m=>(
            <button key={m} onClick={()=>setSelModel(m)} style={{padding:"6px 14px",borderRadius:99,border:selModel===m?`1px solid ${C.purple}`:"1px solid rgba(255,255,255,0.12)",background:selModel===m?"rgba(124,58,237,0.25)":"rgba(255,255,255,0.05)",color:selModel===m?C.white:C.muted,fontSize:12,fontWeight:selModel===m?700:500,cursor:"pointer",transition:"all 0.15s"}}>{m}</button>
          ))}
        </div>
      </div>
      {/* Platform tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:4}}>
        {PLATFORMS.map(p=>(
          <button key={p} onClick={()=>{setPlatform(p);setSubTab("metrics");}} style={{flex:1,padding:"9px 4px",borderRadius:9,border:platform===p?"1px solid rgba(167,139,250,0.35)":"1px solid transparent",background:platform===p?"linear-gradient(135deg,rgba(124,58,237,0.45),rgba(192,38,211,0.35))":"transparent",color:platform===p?C.white:C.muted,fontWeight:platform===p?700:500,fontSize:13,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontWeight:800,fontSize:11,letterSpacing:"0.05em"}}>{PLAT_ICON[p]}</span>{p}
          </button>
        ))}
      </div>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:4,marginBottom:20}}>
        {[["metrics","Account Metrics"],["content","Content Feed"],["log","Log Metrics"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSubTab(k)} style={{flex:1,padding:"7px 4px",borderRadius:9,border:subTab===k?"1px solid rgba(167,139,250,0.35)":"1px solid transparent",background:subTab===k?"linear-gradient(135deg,rgba(124,58,237,0.45),rgba(192,38,211,0.35))":"transparent",color:subTab===k?C.white:C.muted,fontWeight:subTab===k?700:500,fontSize:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>{l}</button>
        ))}
      </div>
      {subTab==="metrics"&&(
        <div>
          {!latest&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"40px 0"}}>No {platform} metrics logged for {selModel} yet. Use "Log Metrics" to add data.</div>}
          {latest&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:12,color:C.muted}}>Latest data: <span style={{color:C.text,fontWeight:600}}>{latest.date}</span></div>
                {prevMonth&&<div style={{fontSize:12,color:C.muted}}>vs: <span style={{fontWeight:600}}>{prevMonth.date}</span></div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:24}}>
                <MetricTile label="Followers" value={Number(latest.followers||0)} ch={followCh}/>
                {platform!=="Instagram"&&<MetricTile label="Views" value={Number(latest.views||0)} ch={viewCh}/>}
                <MetricTile label="Likes" value={Number(latest.likes||0)} ch={likesCh}/>
                <MetricTile label="Comments" value={Number(latest.comments||0)} ch={commentsCh}/>
                {platform!=="Instagram"&&<MetricTile label="Shares" value={Number(latest.shares||0)}/>}
              </div>
              {modelEntries.length>1&&(
                <Card>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:12,fontFamily:"'Playfair Display',Georgia,serif"}}>History</div>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr style={{background:"rgba(124,58,237,0.15)",color:C.muted}}><th style={{padding:"8px 12px",textAlign:"left",fontWeight:700}}>Date</th><th style={{padding:"8px 12px",textAlign:"right"}}>Followers</th>{platform!=="Instagram"&&<th style={{padding:"8px 12px",textAlign:"right"}}>Views</th>}<th style={{padding:"8px 12px",textAlign:"right"}}>Likes</th><th style={{padding:"8px 12px",textAlign:"right"}}>Comments</th></tr></thead>
                      <tbody>{modelEntries.map((e,i)=>(
                        <tr key={e.id||i} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"rgba(255,255,255,0.03)":"transparent"}}>
                          <td style={{padding:"7px 12px",color:C.muted}}>{e.date}</td>
                          <td style={{padding:"7px 12px",textAlign:"right",fontWeight:600,color:pc}}>{Number(e.followers||0).toLocaleString()}</td>
                          {platform!=="Instagram"&&<td style={{padding:"7px 12px",textAlign:"right",color:C.text}}>{Number(e.views||0).toLocaleString()}</td>}
                          <td style={{padding:"7px 12px",textAlign:"right",color:C.text}}>{Number(e.likes||0).toLocaleString()}</td>
                          <td style={{padding:"7px 12px",textAlign:"right",color:C.muted}}>{Number(e.comments||0).toLocaleString()}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
      {subTab==="content"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <Btn size="sm" onClick={()=>{setPostForm({...blankPost,model:selModel,platform});setShowAdd(true);}}>+ Log Post</Btn>
          </div>
          {showAdd&&(
            <Modal title={`Log ${platform} Post — ${selModel}`} onClose={()=>setShowAdd(false)}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Sel label="Type" value={postForm.type} onChange={v=>setPostForm(p=>({...p,type:v}))} options={platform==="TikTok"?["Video","Live"]:platform==="Instagram"?["Reel","Photo","Story","Carousel"]:["Story","Spotlight"]}/>
                <Input label="Date" value={postForm.date} onChange={v=>setPostForm(p=>({...p,date:v}))} type="date"/>
                <div style={{gridColumn:"1/-1"}}><Input label="Caption / Title" value={postForm.caption} onChange={v=>setPostForm(p=>({...p,caption:v}))} placeholder="Caption preview…"/></div>
                {platform!=="Instagram"&&<Input label="Views" value={postForm.views} onChange={v=>setPostForm(p=>({...p,views:v}))} placeholder="45000" type="number"/>}
                <Input label="Likes" value={postForm.likes} onChange={v=>setPostForm(p=>({...p,likes:v}))} placeholder="3200" type="number"/>
                <Input label="Comments" value={postForm.comments} onChange={v=>setPostForm(p=>({...p,comments:v}))} placeholder="180" type="number"/>
                {platform!=="Instagram"?<Input label="Shares" value={postForm.shares} onChange={v=>setPostForm(p=>({...p,shares:v}))} placeholder="560" type="number"/>:<Input label="Saves" value={postForm.saves} onChange={v=>setPostForm(p=>({...p,saves:v}))} placeholder="420" type="number"/>}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
                <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
                <Btn size="sm" onClick={()=>{if(!postForm.caption)return;const er=calcEngRate(postForm.likes,postForm.comments,postForm.shares,postForm.saves,postForm.views);setContentMetrics(p=>[{...postForm,id:Date.now(),model:selModel,views:Number(postForm.views||0),likes:Number(postForm.likes||0),comments:Number(postForm.comments||0),shares:Number(postForm.shares||0),saves:Number(postForm.saves||0),engRate:er},...p]);setShowAdd(false);}}>Save Post</Btn>
              </div>
            </Modal>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {modelContent.map(c=>{
              const er=c.engRate||calcEngRate(c.likes,c.comments,c.shares,c.saves,c.views);
              const erCol=er>=10?C.green:er>=5?C.yellow:C.muted;
              return(
                <Card key={c.id} style={{borderLeft:`3px solid ${pc}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{c.caption}</div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <Badge label={c.type} color={pc}/>
                        <span style={{fontSize:11,color:C.muted}}>{c.date}</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,fontWeight:700,color:erCol,background:erCol+"18",padding:"3px 10px",borderRadius:99}}>{er}% eng</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(65px,1fr))",gap:8}}>
                    {platform!=="Instagram"&&<div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 4px"}}><div style={{fontSize:13,fontWeight:700,color:pc}}>{fmtMetricVal(c.views)}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Views</div></div>}
                    <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 4px"}}><div style={{fontSize:13,fontWeight:700,color:pc}}>{fmtMetricVal(c.likes)}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Likes</div></div>
                    <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 4px"}}><div style={{fontSize:13,fontWeight:700,color:pc}}>{fmtMetricVal(c.comments)}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Comments</div></div>
                    {platform!=="Instagram"?<div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 4px"}}><div style={{fontSize:13,fontWeight:700,color:pc}}>{fmtMetricVal(c.shares)}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Shares</div></div>:<div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 4px"}}><div style={{fontSize:13,fontWeight:700,color:pc}}>{fmtMetricVal(c.saves)}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:2}}>Saves</div></div>}
                  </div>
                </Card>
              );
            })}
            {!modelContent.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No {platform} content logged for {selModel} yet.</div>}
          </div>
        </div>
      )}
      {subTab==="log"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
            <Btn size="sm" onClick={()=>{setMetricForm({...blankMetric,model:selModel,platform});setShowLogMetric(true);}}>+ Log Metrics</Btn>
          </div>
          {showLogMetric&&(
            <Modal title={`Log ${platform} Metrics — ${selModel}`} onClose={()=>setShowLogMetric(false)}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Date" value={metricForm.date} onChange={v=>setMetricForm(p=>({...p,date:v}))} type="date"/>
                <Input label="Followers" value={metricForm.followers} onChange={v=>setMetricForm(p=>({...p,followers:v}))} placeholder="45000" type="number"/>
                {platform!=="Instagram"&&<Input label="Views" value={metricForm.views} onChange={v=>setMetricForm(p=>({...p,views:v}))} placeholder="120000" type="number"/>}
                <Input label="Likes" value={metricForm.likes} onChange={v=>setMetricForm(p=>({...p,likes:v}))} placeholder="8400" type="number"/>
                <Input label="Comments" value={metricForm.comments} onChange={v=>setMetricForm(p=>({...p,comments:v}))} placeholder="340" type="number"/>
                {platform!=="Instagram"&&<Input label="Shares" value={metricForm.shares} onChange={v=>setMetricForm(p=>({...p,shares:v}))} placeholder="1200" type="number"/>}
              </div>
              <Input label="Notes" value={metricForm.notes} onChange={v=>setMetricForm(p=>({...p,notes:v}))} placeholder="Any context…"/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Btn variant="secondary" size="sm" onClick={()=>setShowLogMetric(false)}>Cancel</Btn>
                <Btn size="sm" onClick={()=>{if(!metricForm.followers)return;setSocialMetrics(p=>[{...metricForm,id:Date.now(),model:selModel,platform},...p]);setShowLogMetric(false);}}>Save</Btn>
              </div>
            </Modal>
          )}
          <SocialMetrics user={{name:"log"}} socialMetrics={socialMetrics.filter(e=>e.model===selModel)} setSocialMetrics={()=>{}} models={models} isLeadership={isLeadership} myModels={[selModel]}/>
        </div>
      )}
    </div>
  );
}
// ── MG DELIVERABLES ───────────────────────────────────────────
function MGDeliverables({user,mg,setMg,models,isLeadership,isAM,myModels}){
  const vm=isLeadership?models.filter(m=>!m.archived).map(m=>m.name):myModels;
  const [selModel,setSelModel]=useState(vm[0]||"");
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [showAdd,setShowAdd]=useState(false);
  const [mgForm,setMgForm]=useState({model:vm[0]||"",mgAmount:"",period:new Date().toISOString().slice(0,7),deliverables:[]});
  const [newDel,setNewDel]=useState("");
  const myMg=isLeadership||isAM?mg:mg.filter(m=>m.model===user.name);
  const selMg=myMg.find(m=>(isLeadership||isAM?m.model===selModel:m.model===user.name)&&m.period===period);
  const pct=selMg?Math.round(selMg.deliverables.filter(d=>d.done).length/Math.max(selMg.deliverables.length,1)*100):0;
  const pctCol=pct===100?C.green:pct>=50?C.yellow:C.red;
  const addMg=()=>{if(!mgForm.model||!mgForm.mgAmount)return;setMg(p=>[...p,{...mgForm,id:Date.now(),mgAmount:Number(mgForm.mgAmount),deliverables:mgForm.deliverables.map((d,i)=>({id:i+1,label:d,done:false,notes:"",fileUrl:null}))}]);setShowAdd(false);setMgForm({model:vm[0]||"",mgAmount:"",period:new Date().toISOString().slice(0,7),deliverables:[]});setNewDel("");};
  const uploadFile=(mgId,delId,file)=>{if(!file)return;const reader=new FileReader();reader.onload=e=>setMg(p=>p.map(m=>m.id===mgId?{...m,deliverables:m.deliverables.map(d=>d.id===delId?{...d,fileUrl:e.target.result,done:true}:d)}:m));reader.readAsDataURL(file);};
  const toggleDel=(mgId,delId)=>setMg(p=>p.map(m=>m.id===mgId?{...m,deliverables:m.deliverables.map(d=>d.id===delId?{...d,done:!d.done}:d)}:m));
  const DeliverableRow=({d,mgId,canUpload})=>(
    <div key={d.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
        <div style={{width:22,height:22,borderRadius:6,background:d.done?C.green:"rgba(255,255,255,0.08)",border:`1.5px solid ${d.done?C.green:"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
          {d.done&&<span style={{color:C.white,fontSize:12,fontWeight:700}}>✓</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:d.done?C.muted:C.text,textDecoration:d.done?"line-through":"none"}}>{d.label}</div>
          {d.notes&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{d.notes}</div>}
          {d.fileUrl&&(
            <div style={{marginTop:8}}>
              <img src={d.fileUrl} alt="screenshot" style={{maxWidth:"100%",maxHeight:120,borderRadius:8,border:`1px solid ${C.border}`,display:"block",objectFit:"cover"}}/>
              <div style={{fontSize:10,color:C.green,marginTop:4,fontWeight:600}}>Screenshot uploaded</div>
            </div>
          )}
          {canUpload&&!d.fileUrl&&(
            <label style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,cursor:"pointer",fontSize:11,fontWeight:600,color:C.purple,background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:7,padding:"4px 10px"}}>
              Upload Screenshot
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadFile(mgId,d.id,e.target.files[0])}/>
            </label>
          )}
        </div>
        <Badge label={d.done?"Done":"Pending"} color={d.done?C.green:C.yellow}/>
      </div>
    </div>
  );
  return(
    <div>
      <SectionHeader icon="📋" title="MG Deliverables" action={(isLeadership||isAM)&&<Btn size="sm" onClick={()=>setShowAdd(true)}>+ New MG</Btn>}/>
      <Card style={{marginBottom:16,background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.25)"}}>
        <div style={{fontSize:12,color:C.muted}}>Track monthly paywall deliverables against a model's Minimum Guarantee (MG). Models upload screenshots as proof. AM & Leadership have full visibility.</div>
      </Card>
      {showAdd&&(
        <Modal title="Set Up MG Deliverables" onClose={()=>setShowAdd(false)} width={520}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Model" value={mgForm.model} onChange={v=>setMgForm(p=>({...p,model:v}))} options={vm}/>
            <Input label="MG Amount ($)" value={mgForm.mgAmount} onChange={v=>setMgForm(p=>({...p,mgAmount:v}))} placeholder="3000" type="number"/>
            <div style={{gridColumn:"1/-1",marginBottom:14}}>
              <label style={s.label}>Period (YYYY-MM)</label>
              <input type="month" value={mgForm.period} onChange={e=>setMgForm(p=>({...p,period:e.target.value}))} style={{...s.input}}/>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={s.label}>Deliverables</label>
            {mgForm.deliverables.map((d,i)=>(
              <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:13,flex:1,color:C.text}}>{d}</span>
                <button onClick={()=>setMgForm(p=>({...p,deliverables:p.deliverables.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16}}>×</button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <input value={newDel} onChange={e=>setNewDel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&newDel.trim()&&(setMgForm(p=>({...p,deliverables:[...p.deliverables,newDel.trim()]})),setNewDel(""))} placeholder="e.g. 2x TikTok Videos" style={{...s.input,flex:1,marginBottom:0}}/>
              <Btn size="sm" onClick={()=>{if(!newDel.trim())return;setMgForm(p=>({...p,deliverables:[...p.deliverables,newDel.trim()]}));setNewDel("");}}>Add</Btn>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Btn>
            <Btn size="sm" onClick={addMg}>Create MG</Btn>
          </div>
        </Modal>
      )}
      {(isLeadership||isAM)&&(
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <select value={selModel} onChange={e=>setSelModel(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}>
            {vm.map(m=><option key={m}>{m}</option>)}
          </select>
          <input type="month" value={period} onChange={e=>setPeriod(e.target.value)} style={{...s.input,width:"auto",marginBottom:0}}/>
        </div>
      )}
      {(isLeadership||isAM)&&!selMg&&(
        <div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"24px 0"}}>{myMg.length===0?"No MG deliverables set up yet. Click \"+ New MG\" to get started.":`No MG found for ${selModel} in ${period}`}</div>
      )}
      {(isLeadership||isAM)&&selMg&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',Georgia,serif"}}>{selMg.model} — {selMg.period}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>MG: <span style={{color:C.green,fontWeight:700}}>${Number(selMg.mgAmount).toLocaleString()}</span></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:80,height:6,borderRadius:99,background:"rgba(255,255,255,0.1)"}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:99,background:pctCol,transition:"width 0.3s"}}/>
              </div>
              <Badge label={`${pct}%`} color={pctCol}/>
            </div>
          </div>
          {selMg.deliverables.map(d=><DeliverableRow key={d.id} d={d} mgId={selMg.id} canUpload={false}/>)}
        </Card>
      )}
      {!isLeadership&&!isAM&&(
        <div>
          {myMg.map(m=>{
            const p=Math.round(m.deliverables.filter(d=>d.done).length/Math.max(m.deliverables.length,1)*100);
            const pc=p===100?C.green:p>=50?C.yellow:C.red;
            return(
              <Card key={m.id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{m.period} MG</div>
                    <div style={{fontSize:12,color:C.muted}}>Guarantee: <span style={{color:C.green,fontWeight:700}}>${Number(m.mgAmount).toLocaleString()}</span></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:80,height:6,borderRadius:99,background:"rgba(255,255,255,0.1)"}}>
                      <div style={{width:`${p}%`,height:"100%",borderRadius:99,background:pc,transition:"width 0.3s"}}/>
                    </div>
                    <Badge label={`${p}%`} color={pc}/>
                  </div>
                </div>
                {m.deliverables.map(d=><DeliverableRow key={d.id} d={d} mgId={m.id} canUpload={true}/>)}
              </Card>
            );
          })}
          {!myMg.length&&<div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"32px 0"}}>No MG deliverables set up for you yet. Your AM or Leadership team will configure these.</div>}
        </div>
      )}
    </div>
  );
}
// ── ANALYTICS OVERVIEW ────────────────────────────────────────
function AnalyticsOverview({sales,socialMetrics,qaLogs,tasks,models,campaigns,snapRevenue,brandDeals}){
  const [period,setPeriod]=useState("MOM");
  const {thisMonthStr,lastMonthStr,lastYearMonthStr,thisWeekStart,lastWeekStart}=getPeriodDates(period);
  const thisSales=period==="WOW"?sales.filter(s=>s.date>=thisWeekStart):sales.filter(s=>s.date&&s.date.slice(0,7)===thisMonthStr);
  const prevSales=period==="WOW"?sales.filter(s=>s.date>=lastWeekStart&&s.date<thisWeekStart):period==="MOM"?sales.filter(s=>s.date&&s.date.slice(0,7)===lastMonthStr):sales.filter(s=>s.date&&s.date.slice(0,7)===lastYearMonthStr);
  const thisRev=thisSales.reduce((a,s)=>a+Number(s.amount),0);
  const prevRev=prevSales.reduce((a,s)=>a+Number(s.amount),0);
  const revChg=prevRev?Math.round((thisRev-prevRev)/prevRev*100):null;
  const thisSnap=snapRevenue.filter(r=>period==="WOW"?r.date>=thisWeekStart:r.date&&r.date.slice(0,7)===thisMonthStr).reduce((a,r)=>a+Number(r.revenue||0),0);
  const prevSnap=snapRevenue.filter(r=>period==="WOW"?r.date>=lastWeekStart&&r.date<thisWeekStart:r.date&&r.date.slice(0,7)===lastMonthStr).reduce((a,r)=>a+Number(r.revenue||0),0);
  const snapChg=prevSnap?Math.round((thisSnap-prevSnap)/prevSnap*100):null;
  const avgQA=qaLogs.length?Math.round(qaLogs.reduce((a,q)=>a+q.score,0)/qaLogs.length):null;
  const violations=qaLogs.filter(q=>q.hardNoViolation).length;
  const activeModels=models.filter(m=>!m.archived);
  const taskDone=tasks.reduce((a,t)=>a+["bos","eos","content","notion","promos"].filter(k=>t[k]===true).length,0);
  const taskTotal=tasks.length*5;
  const taskPct=taskTotal?Math.round(taskDone/taskTotal*100):0;
  const activeCamps=campaigns.filter(c=>["Live","Scheduled"].includes(c.status));
  const totalBrandVal=brandDeals.reduce((a,d)=>a+Number(d.payment||0),0);
  const paidBrandVal=brandDeals.filter(d=>d.paid).reduce((a,d)=>a+Number(d.payment||0),0);
  const PLAT_COL={TikTok:C.purple,Instagram:C.pink,Snapchat:"#f59e0b"};
  const latestMetrics=getLatestMetricsByKey(socialMetrics);
  const prevMetrics=getPrevMetricsByKey(socialMetrics,latestMetrics);
  const platSummary=["TikTok","Instagram","Snapchat"].map(plat=>{const ents=Object.entries(latestMetrics).filter(([k])=>k.includes(`|${plat}`)).map(([,v])=>v);const pEnts=Object.entries(prevMetrics).filter(([k])=>k.includes(`|${plat}`)).map(([,v])=>v);const totF=ents.reduce((a,e)=>a+Number(e.followers||0),0);const prevF=pEnts.reduce((a,e)=>a+Number(e.followers||0),0);const chg=prevF?Math.round((totF-prevF)/prevF*100):null;return{plat,totF,chg,count:ents.length};});
  return(
    <div>
      <SectionHeader icon="📊" title="Analytics Overview"/>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:4,marginBottom:24}}>
        {[["WOW","Week over Week"],["MOM","Month over Month"],["YOY","Year over Year"]].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} style={{flex:1,padding:"8px 4px",borderRadius:9,border:period===k?"1px solid rgba(167,139,250,0.35)":"1px solid transparent",background:period===k?"linear-gradient(135deg,rgba(124,58,237,0.45),rgba(192,38,211,0.35))":"transparent",color:period===k?C.white:C.muted,fontWeight:period===k?700:500,fontSize:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
            {k} <span style={{fontSize:10,opacity:0.7,display:"block"}}>{l}</span>
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>
        <Card style={{padding:"18px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-8,right:-8,opacity:0.05}}><StarMark size={44} color={C.green}/></div>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Revenue <span style={{color:C.muted,fontWeight:400}}>({period})</span></div>
          <div style={{fontSize:26,fontWeight:800,color:C.green,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>{fmtMoney(thisRev)}</div>
          <ChgBadge pct={revChg}/>
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>prev: {fmtMoney(prevRev)}</div>
        </Card>
        <Card style={{padding:"18px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-8,right:-8,opacity:0.05}}><StarMark size={44} color="#f59e0b"/></div>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Snap Revenue <span style={{color:C.muted,fontWeight:400}}>({period})</span></div>
          <div style={{fontSize:26,fontWeight:800,color:"#f59e0b",fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.02em"}}>{fmtMoney(thisSnap)}</div>
          <ChgBadge pct={snapChg}/>
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>prev: {fmtMoney(prevSnap)}</div>
        </Card>
        <Card style={{padding:"18px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-8,right:-8,opacity:0.05}}><StarMark size={44} color={C.purple}/></div>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Task Completion</div>
          <div style={{fontSize:26,fontWeight:800,color:taskPct>=80?C.green:taskPct>=50?C.yellow:C.red,fontFamily:"'DM Sans',sans-serif"}}>{taskPct}%</div>
          <div style={{fontSize:11,color:C.muted,marginTop:6}}>{taskDone}/{taskTotal} items done</div>
        </Card>
        <Card style={{padding:"18px 16px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-8,right:-8,opacity:0.05}}><StarMark size={44} color={avgQA!==null?(avgQA>=80?C.green:avgQA>=60?C.yellow:C.red):C.muted}/></div>
          <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Avg QA Score</div>
          <div style={{fontSize:26,fontWeight:800,color:avgQA!==null?(avgQA>=80?C.green:avgQA>=60?C.yellow:C.red):C.muted,fontFamily:"'DM Sans',sans-serif"}}>{avgQA!==null?`${avgQA}%`:"—"}</div>
          {violations>0&&<Badge label={`${violations} violations`} color={C.red}/>}
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:"'Playfair Display',Georgia,serif"}}>Social Follower Growth</div>
          {platSummary.map(p=>(
            <div key={p.plat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:8,height:8,borderRadius:99,background:PLAT_COL[p.plat]}}/>
                <span style={{fontSize:13,fontWeight:600}}>{p.plat}</span>
                <span style={{fontSize:11,color:C.muted}}>({p.count} accounts)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontWeight:700,fontSize:13,color:PLAT_COL[p.plat]}}>{p.totF>999?`${(p.totF/1000).toFixed(1)}k`:p.totF}</span>
                <ChgBadge pct={p.chg}/>
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:"'Playfair Display',Georgia,serif"}}>Model Overview</div>
          {activeModels.map(m=>{const ms=tasks.find(t=>t.model===m.name);const done=ms?["bos","eos","content","notion","promos"].filter(k=>ms[k]===true).length:0;const p=Math.round(done/5*100);const actCamp=campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length;return(
            <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{m.name}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>AM: {m.am} · {actCamp} campaign{actCamp!==1?"s":""}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:50,height:4,borderRadius:99,background:"rgba(255,255,255,0.08)"}}>
                  <div style={{width:`${p}%`,height:"100%",borderRadius:99,background:p>=80?C.green:p>=40?C.yellow:C.red}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:p>=80?C.green:p>=40?C.yellow:C.red,minWidth:28}}>{p}%</span>
              </div>
            </div>
          );})}
        </Card>
      </div>
      <Card>
        <div style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:"'Playfair Display',Georgia,serif"}}>Brand Deals</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 8px"}}><div style={{fontSize:20,fontWeight:800,color:C.green}}>{fmtMoney(paidBrandVal)}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>Paid Out</div></div>
          <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 8px"}}><div style={{fontSize:20,fontWeight:800,color:C.orange}}>{fmtMoney(totalBrandVal-paidBrandVal)}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>Outstanding</div></div>
          <div style={{textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 8px"}}><div style={{fontSize:20,fontWeight:800,color:C.blue}}>{activeCamps.length}</div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginTop:4}}>Active Campaigns</div></div>
        </div>
      </Card>
    </div>
  );
}
// ── AI SCHEDULER ─────────────────────────────────────────────
function AISchedulerPanel({models,ttks,content,campaigns,massMessages,myModels}){
  const modelList=myModels||models.filter(m=>!m.archived).map(m=>m.name);
  const [selectedModel,setSelectedModel]=useState(modelList[0]||"");
  const [weekStart,setWeekStart]=useState(new Date().toISOString().slice(0,10));
  const [contentNotes,setContentNotes]=useState("");
  const [perfNotes,setPerfNotes]=useState("");
  const [screenshots,setScreenshots]=useState([]);
  const [apiKey,setApiKey]=useState(()=>localStorage.getItem("charmed_claude_api_key")||"");
  const [showSettings,setShowSettings]=useState(false);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [outputTab,setOutputTab]=useState("wall");

  const saveApiKey=(key)=>{setApiKey(key);localStorage.setItem("charmed_claude_api_key",key);};

  const handleScreenshots=(e)=>{
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=(ev)=>setScreenshots(prev=>[...prev,{name:file.name,dataUrl:ev.target.result}]);
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const removeScreenshot=(i)=>setScreenshots(prev=>prev.filter((_,idx)=>idx!==i));

  const ttk=ttks.find(t=>t.model===selectedModel);
  const modelObj=models.find(m=>m.name===selectedModel);
  const recentContent=content.filter(c=>c.model===selectedModel).slice(0,5);
  const recentMass=massMessages.filter(m=>m.model===selectedModel).slice(0,5);
  const activeCampaigns=campaigns.filter(c=>c.model===selectedModel&&["Live","Scheduled"].includes(c.status));

  const buildPrompt=()=>{
    const ttkInfo=ttk?`Voice/Tone: ${ttk.voice}\nPersonality: ${ttk.personality}\nInterests: ${ttk.interests}\nFlirt Level: ${ttk.flirtLevel}\nHard No's: ${ttk.hardNos}\nEndearments: ${ttk.endearments}\nAge: ${ttk.age}, Location: ${ttk.location}\nOffline Times: ${ttk.offlineTimes}`:"No TTK data available.";
    const contentHistory=recentContent.map(c=>`${c.date}: ${c.type} — "${c.theme}" (${c.priceTier})`).join("\n")||"None logged";
    const massHistory=recentMass.map(m=>`${m.date}: "${m.message}" → Target: ${m.target} | Revenue: $${m.revenue}`).join("\n")||"None logged";
    const campInfo=activeCampaigns.map(c=>`${c.name} (${c.type}) — ends ${c.endDate}`).join("\n")||"None active";
    return `You are an expert Passes paywall content strategist for ${selectedModel}, a creator managed by Charmed Collective agency.

Your primary goal is to MAXIMISE REVENUE for the week of ${weekStart}.

## Model Profile
Platform: ${modelObj?.platform||"Passes"}
Flirt Level: ${modelObj?.flirtLevel||ttk?.flirtLevel||"N/A"}
Status: ${modelObj?.status||"Active"}

## Tone & Voice (TTK)
${ttkInfo}

## Recent Content History
${contentHistory}

## Recent Mass Message History (with revenue)
${massHistory}

## Active Campaigns
${campInfo}

## Content Calendar Notes (from AM)
${contentNotes||"None provided"}

## Past Performance Notes
${perfNotes||"None provided"}

${screenshots.length>0?`## Analytics Screenshots\n${screenshots.length} screenshot(s) attached. Analyse the wall post and mass message metrics shown — use data on views, revenue, engagement, and send times to inform your recommendations.`:""}

---

Generate a revenue-optimised WEEKLY SCHEDULE for the week starting ${weekStart} on Passes.

Respond ONLY with valid JSON matching this exact structure (no markdown fences):
{
  "summary": "2-3 sentence strategic overview for this week",
  "revenueStrategy": "paragraph explaining the revenue-maximising approach",
  "wallPosts": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "time": "3:00 PM EST",
      "contentType": "PS|VID|PPV|CLIP|BTS|LIVE",
      "theme": "short theme name",
      "priceTier": "$|$$|$$$",
      "caption": "suggested caption hook using ${selectedModel}'s voice, 1-2 sentences",
      "visibility": "Free|Paid Only",
      "notes": "brief strategic note"
    }
  ],
  "massMessages": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "time": "optimal send time EST",
      "segment": "All Subscribers|Whales|Recent Spenders|VIPs|Followers|Online Fans",
      "ppvPrice": "$XX",
      "message": "message copy in ${selectedModel}'s voice",
      "contentTag": "what content this promotes or teases",
      "expectedRevenue": "low|medium|high",
      "notes": "segmentation rationale"
    }
  ]
}

Provide 5-7 wall posts and 3-5 mass messages. Space them strategically across the week. Prioritise revenue.`;
  };

  const generate=async()=>{
    if(!apiKey){setError("Add your Claude API key in Settings first.");setShowSettings(true);return;}
    if(!selectedModel){setError("Select a model first.");return;}
    setLoading(true);setError("");setResult(null);
    try{
      const msgContent=[{type:"text",text:buildPrompt()}];
      screenshots.forEach(sc=>{
        const[header,data]=sc.dataUrl.split(",");
        const mediaType=header.match(/:(.*?);/)?.[1]||"image/jpeg";
        msgContent.push({type:"image",source:{type:"base64",media_type:mediaType,data}});
      });
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-opus-4-6",max_tokens:4096,messages:[{role:"user",content:msgContent}]})
      });
      if(!res.ok){const err=await res.json();throw new Error(err.error?.message||`API error ${res.status}`);}
      const respData=await res.json();
      const text=respData.content[0].text;
      const jsonMatch=text.match(/\{[\s\S]*\}/);
      if(jsonMatch){setResult(JSON.parse(jsonMatch[0]));}
      else{setError("Could not parse AI response. Try again.");}
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  const dayColor={Monday:C.purple,Tuesday:C.blue,Wednesday:C.green,Thursday:C.orange,Friday:C.pink,Saturday:C.yellow,Sunday:C.red};
  const revColor={low:C.muted,medium:C.yellow,high:C.green};
  const ctColor={PS:C.purple,VID:C.blue,PPV:C.green,CLIP:C.orange,BTS:C.pink,LIVE:C.red};

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.01em"}}>AI Scheduler</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>Revenue-optimised weekly schedule for Passes wall posts & mass messages</div>
        </div>
        <Btn variant="secondary" size="sm" onClick={()=>setShowSettings(p=>!p)}>{showSettings?"Close Settings":"⚙ Settings"}</Btn>
      </div>

      {showSettings&&(
        <Card style={{marginBottom:16,borderColor:"rgba(167,139,250,0.4)"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>API Key Settings</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Your key is stored locally in your browser only — never sent to any server except Anthropic directly.</div>
          <Input label="Claude API Key" value={apiKey} onChange={saveApiKey} placeholder="sk-ant-api03-..." type="password"/>
          <div style={{fontSize:11,color:apiKey?C.green:C.red,marginTop:-8}}>{apiKey?"✓ Key saved locally":"No key configured"}</div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <Sel label="Model" value={selectedModel} onChange={setSelectedModel} options={modelList}/>
          <Input label="Week Starting" value={weekStart} onChange={setWeekStart} type="date"/>
          {ttk&&(
            <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:10,padding:"10px 12px",marginTop:2}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>TTK Auto-loaded</div>
              <div style={{fontSize:12,color:C.purpleL,lineHeight:1.9}}>
                <div><b>Voice:</b> {ttk.voice}</div>
                <div><b>Flirt level:</b> {ttk.flirtLevel} &nbsp;|&nbsp; <b>Endearments:</b> {ttk.endearments}</div>
                <div><b>Hard No's:</b> {ttk.hardNos}</div>
                <div><b>Offline:</b> {ttk.offlineTimes}</div>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <div style={s.label}>Analytics Screenshots (optional)</div>
          <div style={{border:"2px dashed rgba(167,139,250,0.3)",borderRadius:10,padding:"18px",textAlign:"center",cursor:"pointer",marginBottom:10}}
            onClick={()=>document.getElementById("ai-ss-input").click()}>
            <input id="ai-ss-input" type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleScreenshots}/>
            <div style={{fontSize:24,marginBottom:6}}>📸</div>
            <div style={{fontSize:12,color:C.muted}}>Upload wall post & mass message analytics screenshots</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>PNG, JPG · Multiple OK · AI will analyse metrics</div>
          </div>
          {screenshots.map((sc,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:6,fontSize:12}}>
              <span style={{color:C.purpleL}}>📷 {sc.name}</span>
              <button onClick={()=>removeScreenshot(i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
            </div>
          ))}
          {screenshots.length>0&&<div style={{fontSize:11,color:C.green,marginTop:4}}>✓ {screenshots.length} screenshot{screenshots.length>1?"s":""} ready to send</div>}
        </Card>
      </div>

      <Card style={{marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <TA label="Content Calendar Notes" value={contentNotes} onChange={setContentNotes} rows={4} placeholder="e.g. beach shoot assets ready, holiday theme this week, model has event Thursday..."/>
          <TA label="Past Performance Notes" value={perfNotes} onChange={setPerfNotes} rows={4} placeholder="e.g. last week's PPV 3x avg revenue, Tuesday 7pm sends highest open rate, whales respond to personalised intros..."/>
        </div>
      </Card>

      {error&&<div style={{background:C.redL,border:`1px solid ${C.red}44`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.red,marginBottom:16}}>{error}</div>}

      <div style={{textAlign:"center",marginBottom:24}}>
        <Btn onClick={generate} size="lg" style={{minWidth:240}} color={loading?C.muted:undefined}>
          {loading?"Generating…":"✨ Generate Weekly Schedule"}
        </Btn>
        {loading&&<div style={{fontSize:12,color:C.muted,marginTop:10}}>Analysing context{screenshots.length>0?" + "+screenshots.length+" screenshot"+(screenshots.length>1?"s":""):""}… This may take 20–40 seconds.</div>}
      </div>

      {result&&(
        <div>
          <Card style={{marginBottom:12,borderColor:"rgba(124,58,237,0.45)",background:"rgba(124,58,237,0.06)"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.purpleL,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Strategic Overview</div>
            <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>{result.summary}</div>
          </Card>
          {result.revenueStrategy&&(
            <Card style={{marginBottom:16,borderColor:"rgba(16,185,129,0.35)",background:"rgba(16,185,129,0.05)"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Revenue Strategy</div>
              <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>{result.revenueStrategy}</div>
            </Card>
          )}

          <Tabs tabs={[["wall",`Wall Posts (${(result.wallPosts||[]).length})`],["mass",`Mass Messages (${(result.massMessages||[]).length})`]]} active={outputTab} onChange={setOutputTab}/>

          {outputTab==="wall"&&(
            <div style={{marginTop:4}}>
              {(result.wallPosts||[]).map((post,i)=>(
                <Card key={i} style={{marginBottom:12,borderLeft:`3px solid ${dayColor[post.day]||C.purple}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontWeight:800,fontSize:15,color:dayColor[post.day]||C.text}}>{post.day}</span>
                      <span style={{fontSize:12,color:C.muted}}>{post.date}</span>
                      <Badge label={post.time} color={C.blue}/>
                      <Badge label={post.contentType} color={ctColor[post.contentType]||C.purple}/>
                      <Badge label={post.priceTier} color={C.green}/>
                      <Badge label={post.visibility} color={post.visibility==="Free"?C.muted:C.orange}/>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:C.purpleL}}>{post.theme}</span>
                  </div>
                  <div style={{fontSize:13,color:C.text,fontStyle:"italic",lineHeight:1.65,padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:post.notes?8:0}}>
                    "{post.caption}"
                  </div>
                  {post.notes&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{post.notes}</div>}
                </Card>
              ))}
            </div>
          )}

          {outputTab==="mass"&&(
            <div style={{marginTop:4}}>
              {(result.massMessages||[]).map((msg,i)=>(
                <Card key={i} style={{marginBottom:12,borderLeft:`3px solid ${dayColor[msg.day]||C.green}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontWeight:800,fontSize:15,color:dayColor[msg.day]||C.text}}>{msg.day}</span>
                      <span style={{fontSize:12,color:C.muted}}>{msg.date}</span>
                      <Badge label={msg.time} color={C.blue}/>
                      <Badge label={msg.segment} color={C.purple}/>
                      <Badge label={`PPV ${msg.ppvPrice}`} color={C.green}/>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:11,color:C.muted}}>Expected:</span>
                      <Badge label={msg.expectedRevenue} color={revColor[msg.expectedRevenue]||C.muted}/>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:C.text,lineHeight:1.65,padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:8}}>
                    "{msg.message}"
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    {msg.contentTag&&<Badge label={`Content: ${msg.contentTag}`} color={C.blue}/>}
                    {msg.notes&&<span style={{fontSize:11,color:C.muted}}>{msg.notes}</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ── DASHBOARDS ───────────────────────────────────────────────
function LeadershipDashboard({user,tasks,setTasks,fans,sales,campaigns,setCampaigns,handoffs,setHandoffs,content,setContent,promos,setPromos,todos,setTodos,models,setModels,users,setUsers,shifts,setShifts,slingApiKey,setSlingApiKey,boseos,setBoseos,platforms,setPlatforms,modelPlatforms,setModelPlatforms,ttks,setTtks,massMessages,setMassMessages,qaLogs,setQaLogs,customs,setCustoms,socialMetrics,setSocialMetrics,growthCampaigns,setGrowthCampaigns,brandDeals,setBrandDeals,snapRevenue,setSnapRevenue,contentMetrics,setContentMetrics,modelEvents,setModelEvents,mg,setMg,discordWebhook,setDiscordWebhook}){
  const [section,setSection]=useState("home");
  const [tab,setTab]=useState("overview");
  const allModels=models.filter(m=>!m.archived).map(m=>m.name);
  const amStats=users.filter(u=>u.role==="am").map(am=>{const t=tasks.filter(x=>x.am===am.name);const keys=["bos","eos","content","notion","promos"];const total=t.length*keys.length,done=t.reduce((a,x)=>a+keys.filter(k=>x[k]===true).length,0),inc=t.reduce((a,x)=>a+keys.filter(k=>x[k]===false).length,0);return{am:am.name,pct:total?Math.round(done/total*100):0,inc,done,total};});
  const totalRev=sales.reduce((a,s)=>a+Number(s.amount),0);
  const flagged=fans.filter(f=>f.flag);
  const low=models.filter(m=>!m.archived&&campaigns.filter(c=>c.model===m.name&&["Live","Scheduled"].includes(c.status)).length<2);
  const alerts=buildAlerts(tasks,shifts,models,campaigns,fans);
  const navTabs=[["overview","Overview"],["models","Models"],["team","Team"],["schedule","Schedule"],["sales","Sales"],["campaigns","Campaigns"],["content","Content"],["customs","Customs"],["mass","Mass Msgs"],["qa","QA"],["performance","Performance"],["handoffs","Handoffs"],["summary","Summary"],["mg","MG Deliverables"]];
  const handleQuickAction=(action)=>{
    if(action==="todos"){setSection("todos");}
    else if(action==="campaigns"||action==="qa"){setSection("paywall");setTab(action);}
    else if(action==="social"||action==="snap"){setSection("social");}
    else if(action==="brand"){setSection("brand");}
  };
  const SECTIONS=[["home","Home"],["todos","To-Dos"],["paywall","Paywall"],["social","Social"],["brand","Brand"],["analytics","Analytics"],["ai","AI Scheduler"],["admin","Admin"]];
  return(
    <div>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Leadership</span>
      </div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20,paddingLeft:2}}>{today()} · {models.filter(m=>!m.archived).length} active accounts</div>
      <AlertsBar alerts={alerts}/>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:4,marginBottom:24}}>
        {SECTIONS.map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{flex:1,padding:"9px 4px",borderRadius:11,border:section===k?"1px solid rgba(167,139,250,0.4)":"1px solid transparent",background:section===k?"linear-gradient(135deg,rgba(124,58,237,0.6),rgba(192,38,211,0.45))":"transparent",color:section===k?C.white:C.muted,fontWeight:section===k?700:500,fontSize:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.01em",boxShadow:section===k?"0 2px 10px rgba(124,58,237,0.3)":"none"}}>
            {l}
          </button>
        ))}
      </div>
      {section==="home"&&<HomeDashboard user={user} role="leadership" sales={sales} todos={todos} setTodos={setTodos} campaigns={campaigns} brandDeals={brandDeals} qaLogs={qaLogs} shifts={shifts} models={models} snapRevenue={snapRevenue} socialMetrics={socialMetrics} modelEvents={modelEvents} onAction={handleQuickAction}/>}
      {section==="paywall"&&<div>
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
                <thead><tr style={{background:"rgba(124,58,237,0.2)",color:"#c4b5fd"}}>{["AM","Model","BOS","EOS","Content","Notion","Promos","Notes"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:["AM","Model","Notes"].includes(h)?"left":"center",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</th>)}</tr></thead>
                <tbody>{tasks.map((t,ri)=>{const inc=["bos","eos","content","notion","promos"].some(k=>t[k]===false),all=["bos","eos","content","notion","promos"].every(k=>t[k]===true);return(
                  <tr key={t.id} style={{background:inc?C.redL:all?C.greenL:ri%2===0?"rgba(255,255,255,0.03)":"transparent",borderBottom:`1px solid rgba(124,58,237,0.12)`}}>
                    <td style={{padding:"8px 14px",fontWeight:600,color:C.text}}>{t.am}</td>
                    <td style={{padding:"8px 14px",color:C.muted}}>{t.model}</td>
                    {["bos","eos","content","notion","promos"].map(k=><td key={k} style={{padding:"8px 14px",textAlign:"center"}}><TaskCell val={t[k]} onChange={v=>setTasks(p=>p.map(r=>r.id===t.id?{...r,[k]:v}:r))}/></td>)}
                    <td style={{padding:"8px 14px"}}><input value={t.notes} onChange={e=>setTasks(p=>p.map(r=>r.id===t.id?{...r,notes:e.target.value}:r))} style={{...s.input,width:140,padding:"4px 8px",fontSize:12,color:C.text}}/></td>
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
        {tab==="content"&&<ContentLog user={user} content={content} setContent={setContent} promos={promos} setPromos={setPromos} myModels={allModels} isLeadership={true} platforms={platforms} discordWebhook={discordWebhook}/>}
        {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
        {tab==="mass"&&<MassMessageTracker user={user} massMessages={massMessages} setMassMessages={setMassMessages} myModels={allModels} isLeadership={true} isAM={false}/>}
        {tab==="qa"&&<QAReview user={user} qaLogs={qaLogs} setQaLogs={setQaLogs} users={users} models={models}/>}
        {tab==="performance"&&<ChatterPerformance sales={sales} qaLogs={qaLogs} users={users}/>}
        {tab==="handoffs"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={true} isAM={false} models={models}/>}
        {tab==="summary"&&<DailySummary tasks={tasks} sales={sales} handoffs={handoffs} shifts={shifts} fans={fans} qaLogs={qaLogs} models={models}/>}
        {tab==="mg"&&<MGDeliverables user={user} mg={mg} setMg={setMg} models={models} isLeadership={true} isAM={false} myModels={allModels}/>}
      </div>}
      {section==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={allModels}/>}
      {section==="social"&&<div>
        <Tabs tabs={[["analytics","Analytics"],["metrics","Log Metrics"],["growth","Growth"],["snap","Snapchat Rev"],["connect","API Connections"]]} active={["analytics","metrics","growth","snap","connect"].includes(tab)?tab:"analytics"} onChange={setTab}/>
        {(tab==="analytics"||(!["analytics","metrics","growth","snap","connect"].includes(tab)))&&<SocialAnalytics socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics} contentMetrics={contentMetrics} setContentMetrics={setContentMetrics} models={models} isLeadership={true} myModels={allModels}/>}
        {tab==="metrics"&&<SocialMetrics user={user} socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics} models={models} isLeadership={true} myModels={allModels}/>}
        {tab==="growth"&&<GrowthCampaigns user={user} growthCampaigns={growthCampaigns} setGrowthCampaigns={setGrowthCampaigns} models={models} isLeadership={true} myModels={allModels}/>}
        {tab==="snap"&&<SnapRevenue user={user} snapRevenue={snapRevenue} setSnapRevenue={setSnapRevenue} models={models} isLeadership={true} myModels={allModels}/>}
        {tab==="connect"&&<PlatformConnections models={models} isLeadership={true}/>}
      </div>}
      {section==="brand"&&<div>
        <Tabs tabs={[["deals","Brand Deals"],["invoices","💳 Stripe Invoices"]]} active={["deals","invoices"].includes(tab)?tab:"deals"} onChange={setTab}/>
        {(tab==="deals"||!["deals","invoices"].includes(tab))&&<BrandDeals user={user} brandDeals={brandDeals} setBrandDeals={setBrandDeals} models={models} isLeadership={true} myModels={allModels}/>}
        {tab==="invoices"&&<StripeInvoices isLeadership={true} models={models}/>}
      </div>}
      {section==="analytics"&&<AnalyticsOverview sales={sales} socialMetrics={socialMetrics} qaLogs={qaLogs} tasks={tasks} models={models} campaigns={campaigns} snapRevenue={snapRevenue} brandDeals={brandDeals}/>}
      {section==="ai"&&<AISchedulerPanel models={models} ttks={ttks} content={content} campaigns={campaigns} massMessages={massMessages} myModels={allModels}/>}
      {section==="admin"&&<AdminPanel users={users} setUsers={setUsers} models={models} setModels={setModels} platforms={platforms} setPlatforms={setPlatforms} modelPlatforms={modelPlatforms} setModelPlatforms={setModelPlatforms} discordWebhook={discordWebhook} setDiscordWebhook={setDiscordWebhook}/>}
    </div>
  );
}
function OpsAssistantDashboard({user,models,setModels,users,setUsers,shifts,setShifts,tasks,setTasks,todos,setTodos,slingApiKey,setSlingApiKey,modelPlatforms,customs,setCustoms,sales,campaigns,brandDeals,setBrandDeals,socialMetrics,setSocialMetrics,growthCampaigns,setGrowthCampaigns,snapRevenue,setSnapRevenue,qaLogs}){
  const [section,setSection]=useState("home");
  const [tab,setTab]=useState("models");
  const allModels=models.filter(m=>!m.archived).map(m=>m.name);
  const SECTIONS=[["home","🏠 Home"],["paywall","🔐 Paywall"],["social","📱 Social"],["brand","🤝 Brand"]];
  const handleQuickAction=(action)=>{
    if(["models","team","schedule","customs"].includes(action)){setSection("paywall");setTab(action);}
    else if(action==="todos"){setSection("todos");}
    else if(action==="social"||action==="snap"){setSection("social");}
    else if(action==="brand"){setSection("brand");}
  };
  return(
    <div>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Ops Dashboard</span>
      </div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20,paddingLeft:2}}>{today()}</div>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:4,marginBottom:24}}>
        {SECTIONS.map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{flex:1,padding:"9px 4px",borderRadius:11,border:section===k?"1px solid rgba(167,139,250,0.4)":"1px solid transparent",background:section===k?"linear-gradient(135deg,rgba(124,58,237,0.6),rgba(192,38,211,0.45))":"transparent",color:section===k?C.white:C.muted,fontWeight:section===k?700:500,fontSize:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.01em",boxShadow:section===k?"0 2px 10px rgba(124,58,237,0.3)":"none"}}>
            {l}
          </button>
        ))}
      </div>
      {section==="home"&&<HomeDashboard user={user} role="ops-assistant" sales={sales||[]} todos={todos} setTodos={setTodos} campaigns={campaigns||[]} brandDeals={brandDeals||[]} qaLogs={qaLogs||[]} shifts={shifts} models={models} snapRevenue={snapRevenue||[]} socialMetrics={socialMetrics||[]} onAction={handleQuickAction}/>}
      {section==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={allModels}/>}
      {section==="paywall"&&<div>
        <Tabs tabs={[["models","Models"],["team","Team"],["schedule","Schedule"],["customs","Customs"]]} active={tab} onChange={setTab}/>
        {tab==="models"&&<ModelManagement models={models} setModels={setModels} users={users} tasks={tasks} setTasks={setTasks} modelPlatforms={modelPlatforms}/>}
        {tab==="team"&&<TeamManagement users={users} setUsers={setUsers} models={models}/>}
        {tab==="schedule"&&<ShiftSchedule shifts={shifts} setShifts={setShifts} users={users} models={models} slingApiKey={slingApiKey} setSlingApiKey={setSlingApiKey}/>}
        {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      </div>}
      {section==="social"&&<div>
        <Tabs tabs={[["metrics","Platform Metrics"],["growth","Growth Campaigns"],["snap","Snapchat Revenue"],["connect","🔗 API Connections"]]} active={["metrics","growth","snap","connect"].includes(tab)?tab:"metrics"} onChange={setTab}/>
        {(tab==="metrics"||(!["metrics","growth","snap","connect"].includes(tab)))&&<SocialMetrics user={user} socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics} models={models} isLeadership={false} myModels={allModels}/>}
        {tab==="growth"&&<GrowthCampaigns user={user} growthCampaigns={growthCampaigns} setGrowthCampaigns={setGrowthCampaigns} models={models} isLeadership={false} myModels={allModels}/>}
        {tab==="snap"&&<SnapRevenue user={user} snapRevenue={snapRevenue} setSnapRevenue={setSnapRevenue} models={models} isLeadership={false} myModels={allModels}/>}
        {tab==="connect"&&<PlatformConnections models={models} isLeadership={false}/>}
      </div>}
      {section==="brand"&&<BrandDeals user={user} brandDeals={brandDeals} setBrandDeals={setBrandDeals} models={models} isLeadership={false} myModels={allModels}/>}
      {section==="analytics"&&<AnalyticsOverview sales={sales} socialMetrics={socialMetrics} qaLogs={qaLogs} tasks={tasks} models={models} campaigns={campaigns} snapRevenue={snapRevenue} brandDeals={brandDeals}/>}
      {section==="admin"&&<AdminPanel users={users} setUsers={setUsers} models={models} setModels={setModels} platforms={platforms} setPlatforms={setPlatforms} modelPlatforms={modelPlatforms} setModelPlatforms={setModelPlatforms} discordWebhook={discordWebhook} setDiscordWebhook={setDiscordWebhook}/>}
    </div>
  );
}
function AMDashboard({user,tasks,setTasks,fans,setFans,sales,campaigns,setCampaigns,boseos,setBoseos,handoffs,setHandoffs,content,setContent,promos,setPromos,todos,setTodos,models,ttks,setTtks,massMessages,setMassMessages,platforms,qaLogs,setQaLogs,users,slingApiKey,setSlingApiKey,shifts,customs,setCustoms,socialMetrics,setSocialMetrics,growthCampaigns,setGrowthCampaigns,brandDeals,setBrandDeals,snapRevenue,setSnapRevenue,contentMetrics,setContentMetrics,modelEvents,setModelEvents,mg,setMg,discordWebhook}){
  const [section,setSection]=useState("home");
  const [tab,setTab]=useState("overview");
  const myModels=models.filter(m=>m.am===user.name&&!m.archived).map(m=>m.name);
  const myTasks=tasks.filter(t=>t.am===user.name);
  const myFans=fans.filter(f=>myModels.includes(f.model));
  const [newFan,setNewFan]=useState({username:"",type:"Whale",spend:"",notes:"",flag:false,model:myModels[0]||""});
  const navTabs=[["overview","Overview"],["ttk","TTK Editor"],["mass","Mass Msgs"],["content","Content"],["customs","Customs"],["fans","Fans"],["sales","Sales"],["campaigns","Campaigns"],["boseos","BOS/EOS"],["qa","QA"],["mg","MG Deliverables"],["schedule","Sling"]];
  const SECTIONS=[["home","Home"],["todos","To-Dos"],["paywall","Paywall"],["social","Social"],["brand","Brand"],["ai","AI Scheduler"]];
  const handleQuickAction=(action)=>{
    if(["overview","campaigns","qa"].includes(action)){setSection("paywall");setTab(action);}
    else if(action==="todos"){setSection("todos");}
    else if(action==="social"||action==="snap"){setSection("social");}
    else if(action==="brand"){setSection("brand");}
  };
  return(
    <div>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Hey {user.name}</span>
      </div>
      <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{today()}</div>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:4,marginBottom:24}}>
        {SECTIONS.map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{flex:1,padding:"9px 4px",borderRadius:11,border:section===k?"1px solid rgba(167,139,250,0.4)":"1px solid transparent",background:section===k?"linear-gradient(135deg,rgba(124,58,237,0.6),rgba(192,38,211,0.45))":"transparent",color:section===k?C.white:C.muted,fontWeight:section===k?700:500,fontSize:12,cursor:"pointer",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.01em",boxShadow:section===k?"0 2px 10px rgba(124,58,237,0.3)":"none"}}>
            {l}
          </button>
        ))}
      </div>
      {section==="home"&&<HomeDashboard user={user} role="am" sales={sales} todos={todos} setTodos={setTodos} campaigns={campaigns} brandDeals={brandDeals} qaLogs={qaLogs} shifts={shifts} models={models} snapRevenue={snapRevenue} socialMetrics={socialMetrics} modelEvents={modelEvents} onAction={handleQuickAction}/>}
      {section==="paywall"&&<div>
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
          {todos.filter(t=>t.owner===user.name&&(t.status||"Pending")!=="Complete").slice(0,3).map(t=>{const st=t.status||"Pending";const sc={Pending:C.muted,["In Progress"]:C.blue,Stuck:C.red,Complete:C.green}[st];return(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:`1px solid rgba(124,58,237,0.15)`,borderRadius:10,marginBottom:6,borderLeft:`3px solid ${{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}`}}>
              <span style={{fontSize:10,fontWeight:700,color:sc,background:sc+"22",padding:"2px 7px",borderRadius:99,flexShrink:0}}>{st}</span>
              <div style={{flex:1,fontSize:13,fontWeight:600}}>{t.task}</div>
              {t.model&&<Badge label={t.model} color={C.blue}/>}
              <Badge label={t.priority} color={{High:C.red,Medium:C.yellow,Low:C.green}[t.priority]}/>
            </div>
          );})}
          {!todos.filter(t=>t.owner===user.name&&(t.status||"Pending")!=="Complete").length&&<div style={{color:C.muted,fontSize:13}}>All clear ✓</div>}
        </div>}
        {tab==="ttk"&&<TTKEditor user={user} ttks={ttks} setTtks={setTtks} myModels={myModels}/>}
        {tab==="mass"&&<MassMessageTracker user={user} massMessages={massMessages} setMassMessages={setMassMessages} myModels={myModels} isLeadership={false} isAM={true}/>}
        {tab==="content"&&<ContentLog user={user} content={content} setContent={setContent} promos={promos} setPromos={setPromos} myModels={myModels} isLeadership={false} platforms={platforms} discordWebhook={discordWebhook}/>}
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
        {tab==="mg"&&<MGDeliverables user={user} mg={mg} setMg={setMg} models={models} isLeadership={false} isAM={true} myModels={myModels}/>}
      </div>}
      {section==="todos"&&<TodoPanel user={user} todos={todos} setTodos={setTodos} myModels={myModels}/>}
      {section==="social"&&<div>
        <Tabs tabs={[["analytics","Analytics"],["metrics","Log Metrics"],["growth","Growth"],["snap","Snapchat Rev"],["connect","API Connections"]]} active={["analytics","metrics","growth","snap","connect"].includes(tab)?tab:"analytics"} onChange={setTab}/>
        {(tab==="analytics"||(!["analytics","metrics","growth","snap","connect"].includes(tab)))&&<SocialAnalytics socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics} contentMetrics={contentMetrics} setContentMetrics={setContentMetrics} models={models} isLeadership={false} myModels={myModels}/>}
        {tab==="metrics"&&<SocialMetrics user={user} socialMetrics={socialMetrics} setSocialMetrics={setSocialMetrics} models={models} isLeadership={false} myModels={myModels}/>}
        {tab==="growth"&&<GrowthCampaigns user={user} growthCampaigns={growthCampaigns} setGrowthCampaigns={setGrowthCampaigns} models={models} isLeadership={false} myModels={myModels}/>}
        {tab==="snap"&&<SnapRevenue user={user} snapRevenue={snapRevenue} setSnapRevenue={setSnapRevenue} models={models} isLeadership={false} myModels={myModels}/>}
        {tab==="connect"&&<PlatformConnections models={models} isLeadership={false} myModels={myModels}/>}
      </div>}
      {section==="brand"&&<div>
        <Tabs tabs={[["deals","Brand Deals"],["invoices","💳 Stripe Invoices"]]} active={["deals","invoices"].includes(tab)?tab:"deals"} onChange={setTab}/>
        {(tab==="deals"||!["deals","invoices"].includes(tab))&&<BrandDeals user={user} brandDeals={brandDeals} setBrandDeals={setBrandDeals} models={models} isLeadership={false} myModels={myModels}/>}
        {tab==="invoices"&&<StripeInvoices isLeadership={false} models={models} myModels={myModels}/>}
      </div>}
      {section==="ai"&&<AISchedulerPanel models={models} ttks={ttks} content={content} campaigns={campaigns} massMessages={massMessages} myModels={myModels}/>}
    </div>
  );
}
function ChatterDashboard({user,sales,setSales,handoffs,setHandoffs,fans,todos,setTodos,shifts,models,qaLogs,users,slingApiKey,setSlingApiKey,customs,setCustoms,ttks}){
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
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Hey {user.name}</span>
      </div>
      {todayShift?<div style={{fontSize:13,color:C.green,marginBottom:4,fontWeight:600}}>✓ On shift: {todayShift.shift} · {myModels.join(", ")}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:4}}>No shift scheduled today</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Revenue Today" value={fmtMoney(todayRev)} color={C.pink}/>
        <StatCard label="Sales" value={mySales.length} color={C.purple}/>
        <StatCard label="QA Score" value={avgQA!==null?`${avgQA}%`:"—"} color={avgQA!==null?scoreCol(avgQA):C.muted}/>
        <StatCard label="Open To-Dos" value={todos.filter(t=>t.owner===user.name&&(t.status||"Pending")!=="Complete").length} color={C.blue}/>
      </div>
      <Tabs tabs={[["sales","Sales"],["customs","Customs"],["handoff","Handoff"],["ref","Quick Ref"],["todos","To-Dos"],["schedule","Sling"]]} active={tab} onChange={setTab}/>
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={setSales} isLeadership={false} isAM={false} myModels={myModels} users={users}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="handoff"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={false} isAM={false} models={models}/>}
      {tab==="ref"&&<div>
        <SectionHeader icon="📋" title="Quick Reference"/>
        {models.filter(m=>myModels.includes(m.name)).map(m=>{const ttkData=(ttks||[]).find(t=>t.model===m.name);const wh=fans.filter(f=>f.model===m.name&&f.type==="Whale");return(
          <Card key={m.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
              <Badge label={m.flirtLevel} color={C.purple}/>
            </div>
            {ttkData&&<div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(124,58,237,0.15)",borderRadius:8,padding:"10px 12px",fontSize:13}}>
              <div><b>Voice:</b> {ttkData.voice}</div>
              <div style={{marginTop:4}}><b>Call fans:</b> {ttkData.endearments}</div>
              <div style={{marginTop:4,color:C.red,fontWeight:600}}>🚫 Never: {ttkData.hardNos}</div>
              <div style={{marginTop:4,color:C.muted}}>Offline: {ttkData.offlineTimes}</div>
              {ttkData.scripts?.length>0&&<div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scripts</div>
                {ttkData.scripts.map(sc=><div key={sc.id} style={{marginBottom:6}}><div style={{fontSize:11,fontWeight:700,color:C.purple}}>{sc.trigger}</div><div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>"{sc.response}"</div></div>)}
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
function ChatLeadDashboard({user,sales,setSales,handoffs,setHandoffs,fans,todos,setTodos,shifts,models,qaLogs,setQaLogs,users,slingApiKey,setSlingApiKey,customs,setCustoms,ttks,setTtks}){
  const [tab,setTab]=useState("sales");
  const [refEdit,setRefEdit]=useState(null); // model name being edited
  const [refForm,setRefForm]=useState({});
  const [newScript,setNewScript]=useState({trigger:"",response:""});
  const todayShift=shifts.find(sh=>sh.chatter===user.name&&sh.date===today());
  const myModels=todayShift?todayShift.models:models.filter(m=>!m.archived).map(m=>m.name);
  const mySales=sales.filter(s=>s.chatter===user.name);
  const todayRev=mySales.reduce((a,s)=>a+Number(s.amount),0);
  const startEdit=(ttkData)=>{setRefEdit(ttkData.model);setRefForm({voice:ttkData.voice||"",endearments:ttkData.endearments||"",offlineTimes:ttkData.offlineTimes||"",scripts:[...(ttkData.scripts||[])]});setNewScript({trigger:"",response:""});};
  const saveRef=()=>{setTtks(p=>p.map(x=>x.model===refEdit?{...x,...refForm,lastUpdated:new Date().toISOString().slice(0,10),updatedBy:user.name}:x));setRefEdit(null);};
  const addScript=()=>{if(!newScript.trigger||!newScript.response)return;setRefForm(p=>({...p,scripts:[...p.scripts,{id:Date.now(),...newScript}]}));setNewScript({trigger:"",response:""});};
  const removeScript=(id)=>setRefForm(p=>({...p,scripts:p.scripts.filter(sc=>sc.id!==id)}));
  return(
    <div>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:12}}>
        <StarMark size={22} color="white" style={{opacity:0.85,filter:"drop-shadow(0 0 8px rgba(167,139,250,0.7))"}}/>
        <span style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',Georgia,serif",background:"linear-gradient(135deg,#b197fc,#c026d3)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>Hey {user.name}</span>
      </div>
      {todayShift?<div style={{fontSize:13,color:C.green,marginBottom:4,fontWeight:600}}>✓ On shift: {todayShift.shift} · {myModels.join(", ")}</div>:<div style={{fontSize:13,color:C.muted,marginBottom:4}}>No shift scheduled today</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Revenue Today" value={fmtMoney(todayRev)} color={C.green}/>
        <StatCard label="QA Reviews" value={qaLogs.filter(q=>q.reviewer===user.name).length} color={C.purple}/>
        <StatCard label="Open To-Dos" value={todos.filter(t=>t.owner===user.name&&(t.status||"Pending")!=="Complete").length} color={C.blue}/>
      </div>
      <Tabs tabs={[["sales","Sales"],["customs","Customs"],["qa","QA Reviews"],["handoff","Handoff"],["ref","Quick Ref"],["todos","To-Dos"],["schedule","Sling"]]} active={tab} onChange={setTab}/>
      {tab==="sales"&&<SalesTracker user={user} sales={sales} setSales={setSales} isLeadership={false} isAM={false} myModels={myModels} users={users}/>}
      {tab==="customs"&&<CustomsTracker user={user} customs={customs} setCustoms={setCustoms} models={models}/>}
      {tab==="qa"&&<QAReview user={user} qaLogs={qaLogs} setQaLogs={setQaLogs} users={users} models={models}/>}
      {tab==="handoff"&&<ShiftHandoff user={user} handoffs={handoffs} setHandoffs={setHandoffs} isLeadership={false} isAM={false} models={models}/>}
      {tab==="ref"&&<div>
        <SectionHeader icon="📋" title="Quick Reference"/>
        {models.filter(m=>myModels.includes(m.name)).map(m=>{const ttkData=(ttks||[]).find(t=>t.model===m.name);const wh=fans.filter(f=>f.model===m.name&&f.type==="Whale");const isEditing=refEdit===m.name;return(
          <Card key={m.id} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontWeight:700,fontSize:14}}>{m.name}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Badge label={m.flirtLevel} color={C.purple}/>
                {!isEditing&&<button onClick={()=>ttkData&&startEdit(ttkData)} style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",color:C.white,border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>✏️ Edit</button>}
                {isEditing&&<><button onClick={saveRef} style={{background:C.green,color:C.white,border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Save</button><button onClick={()=>setRefEdit(null)} style={{background:C.dark,color:C.muted,border:"none",borderRadius:6,padding:"3px 10px",fontSize:11,cursor:"pointer"}}>Cancel</button></>}
              </div>
            </div>
            {ttkData&&!isEditing&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.12)",borderRadius:8,padding:"10px 12px",fontSize:13}}>
              <div><b>Voice:</b> {ttkData.voice}</div>
              <div style={{marginTop:4}}><b>Call fans:</b> {ttkData.endearments}</div>
              <div style={{marginTop:4,color:C.red,fontWeight:600}}>🚫 Never: {ttkData.hardNos}</div>
              <div style={{marginTop:4,color:C.muted}}>Offline: {ttkData.offlineTimes}</div>
              {ttkData.scripts?.length>0&&<div style={{marginTop:8,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scripts</div>
                {ttkData.scripts.map(sc=><div key={sc.id} style={{marginBottom:6}}><div style={{fontSize:11,fontWeight:700,color:C.purple}}>{sc.trigger}</div><div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>"{sc.response}"</div></div>)}
              </div>}
            </div>}
            {isEditing&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(124,58,237,0.12)",borderRadius:8,padding:"10px 12px",fontSize:13,display:"flex",flexDirection:"column",gap:8}}>
              <div><label style={{...s.label,fontSize:11}}>Voice / Persona</label><textarea value={refForm.voice} onChange={e=>setRefForm(p=>({...p,voice:e.target.value}))} rows={2} style={{...s.input,resize:"vertical",fontSize:12}}/></div>
              <div><label style={{...s.label,fontSize:11}}>Call fans (endearments)</label><input value={refForm.endearments} onChange={e=>setRefForm(p=>({...p,endearments:e.target.value}))} style={{...s.input,fontSize:12}}/></div>
              <div><label style={{...s.label,fontSize:11}}>Offline times</label><input value={refForm.offlineTimes} onChange={e=>setRefForm(p=>({...p,offlineTimes:e.target.value}))} style={{...s.input,fontSize:12}}/></div>
              <div style={{color:C.red,fontSize:11,fontWeight:600}}>🚫 Hard Nos: {ttkData?.hardNos} <span style={{color:C.muted,fontWeight:400}}>(managed by AM)</span></div>
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scripts</div>
                {refForm.scripts.map(sc=>(
                  <div key={sc.id} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:6,background:C.dark,borderRadius:6,padding:"6px 8px"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.purple}}>{sc.trigger}</div>
                      <div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>"{sc.response}"</div>
                    </div>
                    <button onClick={()=>removeScript(sc.id)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>
                  </div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginTop:4}}>
                  <input value={newScript.trigger} onChange={e=>setNewScript(p=>({...p,trigger:e.target.value}))} placeholder="Trigger / topic" style={{...s.input,fontSize:11,marginBottom:0}}/>
                  <input value={newScript.response} onChange={e=>setNewScript(p=>({...p,response:e.target.value}))} placeholder="Response script" style={{...s.input,fontSize:11,marginBottom:0}}/>
                  <button onClick={addScript} style={{background:"linear-gradient(135deg,#7c3aed,#c026d3)",color:C.white,border:"none",borderRadius:8,padding:"0 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Add</button>
                </div>
              </div>
            </div>}
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
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 28% 65%,rgba(109,40,217,0.55) 0%,transparent 55%),radial-gradient(ellipse at 78% 18%,rgba(192,38,211,0.32) 0%,transparent 48%),linear-gradient(160deg,#07070e 0%,#0d0a1a 60%,#07070e 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif",padding:20}}>
      <div style={{width:420,maxWidth:"100%",background:"rgba(7,7,18,0.88)",backdropFilter:"blur(32px)",borderRadius:28,padding:"44px 48px",boxShadow:"0 40px 100px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.07)",border:"1px solid rgba(167,139,250,0.28)"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <img src="/logo.png" alt="Charmed Collective" style={{width:200,height:"auto",display:"block",margin:"0 auto 8px"}}/>
          <div style={{fontSize:10,color:C.muted,marginTop:12,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700}}>Operations Platform</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{...s.label}}>Email</label>
          <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="you@charmed.com"
            style={{...s.input,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor="rgba(167,139,250,0.25)"}/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{...s.label}}>Password</label>
          <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="••••••••"
            onKeyDown={e=>{if(e.key==="Enter"){const u=users.find(u=>u.email===email&&u.password===pw);if(u)onLogin(u);else setErr("Incorrect.");}}}
            style={{...s.input,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.25)"}} onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor="rgba(167,139,250,0.25)"}/>
        </div>
        {err&&<div style={{color:"#f87171",fontSize:13,marginBottom:12,fontWeight:500}}>{err}</div>}
        <button onClick={()=>{const u=users.find(u=>u.email===email&&u.password===pw);if(u)onLogin(u);else setErr("Incorrect email or password.");}}
          style={{width:"100%",background:"linear-gradient(135deg,#7c3aed 0%,#c026d3 100%)",color:C.white,border:"1px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"14px 0",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4,boxShadow:"0 4px 28px rgba(124,58,237,0.45)",letterSpacing:"0.04em",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.opacity="0.9";e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 8px 36px rgba(124,58,237,0.55)";}}
          onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 28px rgba(124,58,237,0.45)";}}>
          Sign In
        </button>
        <div style={{marginTop:24,fontSize:11,color:C.muted,textAlign:"center",lineHeight:2.4}}>hannah@ · tate@ · jonathan@ · kayla@<br/>chatter1@ · ops@ · autumn@ · mia@charmed.com · pw: charmed123</div>
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
  const [socialMetrics,setSocialMetrics]=useState(INIT_SOCIAL_METRICS);
  const [growthCampaigns,setGrowthCampaigns]=useState(INIT_GROWTH_CAMPAIGNS);
  const [brandDeals,setBrandDeals]=useState(INIT_BRAND_DEALS);
  const [snapRevenue,setSnapRevenue]=useState(INIT_SNAP_REVENUE);
  const [contentMetrics,setContentMetrics]=useState(INIT_CONTENT_METRICS);
  const [modelEvents,setModelEvents]=useState(INIT_MODEL_EVENTS);
  const [mg,setMg]=useState(INIT_MG);
  const [discordWebhook,setDiscordWebhook]=useState("");
  const [showSearch,setShowSearch]=useState(false);
  useEffect(()=>{
    const down=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowSearch(p=>!p);}if(e.key==="Escape")setShowSearch(false);};
    window.addEventListener("keydown",down);return()=>window.removeEventListener("keydown",down);
  },[]);
  if(!user)return <LoginView onLogin={setUser} users={users}/>;
  const shared={users,models,tasks,setTasks,fans,setFans,sales,setSales,campaigns,setCampaigns,handoffs,setHandoffs,boseos,setBoseos,content,setContent,promos,setPromos,todos,setTodos,shifts,setShifts,slingApiKey,setSlingApiKey,platforms,setPlatforms,modelPlatforms,setModelPlatforms,ttks,setTtks,massMessages,setMassMessages,qaLogs,setQaLogs,customs,setCustoms,socialMetrics,setSocialMetrics,growthCampaigns,setGrowthCampaigns,brandDeals,setBrandDeals,snapRevenue,setSnapRevenue,contentMetrics,setContentMetrics,modelEvents,setModelEvents,mg,setMg,discordWebhook,setDiscordWebhook};
  return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 20% 90%,rgba(124,58,237,0.18) 0%,transparent 50%),radial-gradient(ellipse at 80% 5%,rgba(192,38,211,0.12) 0%,transparent 45%),#07070e",fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:C.text}}>
      {showSearch&&<GlobalSearch models={models} users={users} fans={fans} sales={sales} onClose={()=>setShowSearch(false)}/>}
      <div style={{background:"rgba(7,7,14,0.94)",backdropFilter:"blur(24px)",padding:"0 24px",height:66,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,borderBottom:"1px solid rgba(167,139,250,0.22)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <StarMark size={18} color="white" style={{opacity:0.9,filter:"drop-shadow(0 0 6px rgba(167,139,250,0.7))"}}/>
          <img src="/logo.png" alt="Charmed Collective" style={{height:34,width:"auto"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowSearch(true)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:8,padding:"6px 14px",color:C.muted,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:6,fontFamily:"'DM Sans',sans-serif"}}>
            🔍 <span>Search</span> <kbd style={{fontSize:10,background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:4,padding:"1px 5px",color:C.muted}}>⌘K</kbd>
          </button>
          <Badge label={roleLabel[user.role]} color={roleColors[user.role]}/>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:"rgba(255,255,255,0.05)",borderRadius:8,border:"1px solid rgba(167,139,250,0.15)"}}>
            <div style={{width:7,height:7,borderRadius:99,background:"linear-gradient(135deg,#7c3aed,#c026d3)"}}/>
            <span style={{fontSize:13,color:C.text,fontWeight:500}}>{user.name}</span>
          </div>
          <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:8,padding:"6px 14px",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Sign out</button>
        </div>
      </div>
      <div style={{maxWidth:980,margin:"0 auto",padding:"28px 20px"}}>
        {user.role==="leadership"&&<LeadershipDashboard user={user} {...shared} setModels={setModels} setUsers={setUsers}/>}
        {user.role==="ops-assistant"&&<OpsAssistantDashboard user={user} {...shared} setModels={setModels} setUsers={setUsers}/>}
        {user.role==="am"&&<AMDashboard user={user} {...shared}/>}
        {user.role==="chatlead"&&<ChatLeadDashboard user={user} {...shared}/>}
        {user.role==="chatter"&&<ChatterDashboard user={user} {...shared}/>}
        {user.role==="model"&&<ModelPortal user={user} models={models} ttks={ttks} setTtks={setTtks} campaigns={campaigns} brandDeals={brandDeals} content={content} socialMetrics={socialMetrics} growthCampaigns={growthCampaigns} modelEvents={modelEvents} setModelEvents={setModelEvents} mg={mg} setMg={setMg}/>}
      </div>
    </div>
  );
}
