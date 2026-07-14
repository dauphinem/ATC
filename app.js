const DAYS=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
const DAY_CODES={L:"Lundi",M:"Mardi",ME:"Mercredi",J:"Jeudi",V:"Vendredi",S:"Samedi",D:"Dimanche"};
const SHIFT={
  "M":["07:30","15:30"], "S":["13:00","20:30"], "J":["09:00","17:00"],
  "12":["00:00","23:59"]
};
let db=JSON.parse(localStorage.getItem("atc_v10modular")||'{"me":"Dauphine","nurses":[],"interns":[{"id":"intern-matthieu","name":"Matthieu"},{"id":"intern-nada","name":"Nada"}],"patients":[],"constraints":[],"workshops":[],"dates":[],"importedAt":null,"weekOptions":{"bibliography":false,"clinicalCase":false},"baseWorkshopsLoaded":false,"selectedDay":null,"agendaDraft":[]}');
if(!db || typeof db!=="object") db={};
db.me="Dauphine";
if(!Array.isArray(db.nurses)) db.nurses=[];
if(!Array.isArray(db.interns)) db.interns=[];
if(!Array.isArray(db.patients)) db.patients=[];
if(!Array.isArray(db.constraints)) db.constraints=[];
if(!Array.isArray(db.workshops)) db.workshops=[];
if(!Array.isArray(db.dates)) db.dates=[];
if(!Array.isArray(db.agendaDraft)) db.agendaDraft=[];
if(!db.weekOptions || typeof db.weekOptions!=="object") db.weekOptions={bibliography:false,clinicalCase:false};
if(typeof (db.weekOptions?.bibliography||false)!=="boolean") (db.weekOptions?.bibliography||false)=false;
if(typeof (db.weekOptions?.clinicalCase||false)!=="boolean") (db.weekOptions?.clinicalCase||false)=false;
if(typeof db.baseWorkshopsLoaded!=="boolean") db.baseWorkshopsLoaded=false;
if(!("selectedDay" in db)) db.selectedDay=null;
if(!db.interns.some(i=>i.name==="Matthieu")) db.interns.push({id:"intern-matthieu",name:"Matthieu"});
if(!db.interns.some(i=>i.name==="Nada")) db.interns.push({id:"intern-nada",name:"Nada"});
function save(){localStorage.setItem("atc_v10modular",JSON.stringify(db));render()}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toMin(t){const [h,m]=t.split(":").map(Number);return h*60+m}
function toTime(m){return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")}
function overlap(a,b,c,d){return a<d && b>c}
function daySlots(separation){
  const ranges=[["10:00","12:00"],["13:30","16:00"]];
  if(separation) ranges.push(["16:30","18:00"]);
  const out=[];
  for(const [a,b] of ranges) for(let t=toMin(a);t+30<=toMin(b);t+=30) out.push([toTime(t),toTime(t+30)]);
  return out;
}
function activateTab(name){
 document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
 document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
 document.getElementById(name)?.classList.remove("hidden");
}
function tabSetup(){
 document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>activateTab(btn.dataset.tab));
}
tabSetup();


function defaultDay(){
 const d=new Date().getDay();
 return ({1:"Lundi",2:"Mardi",3:"Mercredi",4:"Jeudi",5:"Vendredi"})[d]||"Lundi";
}
function setDailyDay(day){db.selectedDay=day;save()}
function renderDaily(){
 const day=db.selectedDay||defaultDay();
 dailyDate.textContent=day;
 dailyDays.innerHTML=DAYS.map(d=>`<button class="tab ${d===day?"active":""}" onclick="setDailyDay('${d}')">${d.slice(0,3)}</button>`).join("");
 const list=[...db.workshops].filter(w=>w.day===day).sort((a,b)=>a.start.localeCompare(b.start));
 dailyActivities.innerHTML=list.length?list.map(w=>`
   <div class="daily-card">
     <div class="daily-head">
       <div><div class="daily-title">${esc(w.title)}</div><div class="daily-meta">${w.start}–${w.end}${w.leader?` · ${esc(w.leader)}`:""}</div></div>
       <span class="badge">${w.capacity?`${w.patientIds.length}/${w.capacity}`:`${w.patientIds.length} patient(s)`}</span>
     </div>
     <div class="patient-grid">
       ${db.patients.filter(p=>!w.special || (w.special==="separation"&&p.separation) || (w.special==="tca-non-separation"&&p.tca&&!p.separation)).map(p=>`<label class="patient-check ${w.patientIds.includes(p.id)?"checked":""}">
         <input type="checkbox" ${w.patientIds.includes(p.id)?"checked":""}
           onchange="toggleWorkshopPatient('${w.id}','${p.id}',this.checked)">
         <span>${esc(p.code)}</span>
       </label>`).join("") || "<span class='muted'>Aucun patient enregistré.</span>"}
     </div>
   </div>`).join(""):"<div class='muted'>Aucune activité prévue ce jour.</div>";
}


function unfoldICS(text){
 return text.replace(/\r?\n[ \t]/g,"");
}
function parseICSDate(value){
 const raw=String(value||"").trim();
 const m=raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?/);
 if(!m) return null;
 const y=Number(m[1]),mo=Number(m[2])-1,d=Number(m[3]);
 const h=Number(m[4]||0),mi=Number(m[5]||0),s=Number(m[6]||0);
 return new Date(y,mo,d,h,mi,s);
}
function dayNameFromDate(date){
 return ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"][date.getDay()];
}
function inferAgendaKind(title){
 const t=normalizeHeader(title);
 if(t.includes("sortie")||t.includes("sepa")||t.includes("psychod")||t.includes("psycho")||t.includes("entretien")||t.includes("famil")) return "patient";
 if(t.includes("atelier")||t.includes("mouvement")||t.includes("ech")||t.includes("groupe")||t.includes("yoga")||t.includes("theatre")||t.includes("2d")) return "activity";
 return "ignore";
}
function inferPatientId(title){
 const t=normalizeHeader(title);
 const found=db.patients.find(p=>t.includes(normalizeHeader(p.code)));
 return found?.id||"";
}

function startOfCurrentWeek(){
 const now=new Date();
 const day=now.getDay(); // 0 dimanche, 1 lundi...
 const diff=(day===0?-6:1-day);
 const start=new Date(now);
 start.setHours(0,0,0,0);
 start.setDate(now.getDate()+diff);
 return start;
}
function endOfCurrentWeek(){
 const end=startOfCurrentWeek();
 end.setDate(end.getDate()+7);
 return end;
}
function isInCurrentWeek(date){
 const start=startOfCurrentWeek();
 const end=endOfCurrentWeek();
 return date>=start && date<end;
}
function formatWeekRange(){
 const start=startOfCurrentWeek();
 const end=endOfCurrentWeek();
 end.setDate(end.getDate()-1);
 return `${start.toLocaleDateString("fr-FR")} au ${end.toLocaleDateString("fr-FR")}`;
}

async function importICS(){
 const file=icsFile.files[0];
 if(!file){alert("Choisis un fichier .ics.");return}
 try{
   const text=unfoldICS(await file.text());
   const blocks=text.split("BEGIN:VEVENT").slice(1).map(x=>x.split("END:VEVENT")[0]);
   const events=[];
   let outsideWeek=0;
   for(const block of blocks){
     const lines=block.split(/\r?\n/);
     const get=(name)=>{
       const line=lines.find(l=>l.startsWith(name+":")||l.startsWith(name+";"));
       return line?line.slice(line.indexOf(":")+1).replace(/\\n/g," ").replace(/\\,/g,",").trim():"";
     };
     const title=get("SUMMARY")||"Sans titre";
     const start=parseICSDate(get("DTSTART"));
     const end=parseICSDate(get("DTEND"));
     if(!start||!end) continue;
     if(!isInCurrentWeek(start)){outsideWeek++;continue}
     const kind=inferAgendaKind(title);
     events.push({
       id:crypto.randomUUID(),title,
       date:start.toISOString(),endDate:end.toISOString(),
       day:dayNameFromDate(start),
       start:toTime(start.getHours()*60+start.getMinutes()),
       end:toTime(end.getHours()*60+end.getMinutes()),
       kind,patientId:inferPatientId(title),applied:false
     });
   }
   db.agendaDraft=events;
   save();
   icsStatus.innerHTML=`<strong>${events.length} événement(s) détecté(s) pour la semaine en cours</strong><br>${formatWeekRange()}<br>${outsideWeek} événement(s) hors semaine ignoré(s).<br>Vérifie l’interprétation ci-dessous.`;
 }catch(err){
   icsStatus.innerHTML=`<strong>Lecture impossible</strong><br>${esc(err.message||err)}`;
 }
}
function clearAgendaDraft(){db.agendaDraft=[];save()}
function updateAgendaEvent(id,field,value){
 const ev=db.agendaDraft.find(e=>e.id===id);
 if(ev){ev[field]=value;save()}
}
function applyAgendaEvent(id){
 const ev=db.agendaDraft.find(e=>e.id===id);
 if(!ev||ev.applied||ev.kind==="ignore") return;
 if(ev.kind==="patient"){
   if(!ev.patientId){alert("Choisis un patient.");return}
   db.constraints.push({
     id:crypto.randomUUID(),personId:ev.patientId,day:ev.day,
     start:ev.start,end:ev.end,reason:ev.title,kind:"patient"
   });
 }else if(ev.kind==="activity"){
   const duplicate=db.workshops.some(w=>w.day===ev.day&&w.start===ev.start&&w.end===ev.end&&normalizeHeader(w.title)===normalizeHeader(ev.title));
   if(!duplicate){
     db.workshops.push({
       id:crypto.randomUUID(),title:ev.title,day:ev.day,start:ev.start,end:ev.end,
       leader:"",capacity:null,patientIds:[]
     });
   }
 }
 ev.applied=true;
 save();
}
function applyAllAgendaEvents(){
 const ready=db.agendaDraft.filter(ev=>!ev.applied && ev.kind!=="ignore" && (ev.kind!=="patient"||ev.patientId));
 ready.forEach(ev=>{
   if(ev.kind==="patient"){
     db.constraints.push({
       id:crypto.randomUUID(),personId:ev.patientId,day:ev.day,
       start:ev.start,end:ev.end,reason:ev.title,kind:"patient"
     });
   }else if(ev.kind==="activity"){
     const duplicate=db.workshops.some(w=>w.day===ev.day&&w.start===ev.start&&w.end===ev.end&&normalizeHeader(w.title)===normalizeHeader(ev.title));
     if(!duplicate) db.workshops.push({id:crypto.randomUUID(),title:ev.title,day:ev.day,start:ev.start,end:ev.end,leader:"",capacity:null,patientIds:[]});
   }
   ev.applied=true;
 });
 save();
}


function importWorkshopsFromDashboard(){
 const source=document.getElementById("workshopExcelFileDashboard");
 if(!source.files[0]){alert("Choisis un fichier Excel.");return}
 const target=document.getElementById("workshopExcelFile");
 const dt=new DataTransfer();
 dt.items.add(source.files[0]);
 target.files=dt.files;
 importWorkshopsExcel().then(()=>{
   dashboardWorkshopStatus.innerHTML=workshopImportStatus.innerHTML;
 });
}

async function importExcel(){
  const f=document.getElementById("excelFile").files[0];
  if(!f){alert("Choisis un fichier Excel.");return}
  if(typeof XLSX==="undefined"){alert("Le module Excel n’a pas chargé. Vérifie la connexion Internet pour ce premier lancement.");return}
  const buf=await f.arrayBuffer();
  const wb=XLSX.read(buf,{type:"array"});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:false});
  const dayRow=rows.findIndex(r=>r.some(v=>["L","M","ME","J","V"].includes(String(v).trim().toUpperCase())));
  if(dayRow<0){alert("Je n’ai pas reconnu la ligne des jours.");return}
  const dateRow=dayRow+1;
  const dateColumns=[];
  for(let c=1;c<(rows[dayRow]||[]).length;c++){
    const code=String(rows[dayRow][c]??"").trim().toUpperCase();
    const day=DAY_CODES[code];
    if(day && DAYS.includes(day)) dateColumns.push({col:c,day,date:String(rows[dateRow]?.[c]??"")});
  }
  const nurses=[];
  for(let r=dateRow+1;r<rows.length;r++){
    const original=String(rows[r]?.[0]??"").trim();
    if(!original) continue;
    const schedule={};
    for(const dc of dateColumns){
      const code=String(rows[r]?.[dc.col]??"").trim().toUpperCase();
      if(!schedule[dc.day]) schedule[dc.day]=[];
      const hours=SHIFT[code];
      if(hours) schedule[dc.day].push({start:hours[0],end:hours[1],code});
    }
    nurses.push({id:crypto.randomUUID(),original,alias:original,schedule});
  }
  db.nurses=nurses;
  db.dates=dateColumns;
  db.importedAt=new Date().toISOString();
  save();
  importStatus.innerHTML=`<strong>${nurses.length} IDE détectés</strong><br>${dateColumns.length} journées de semaine reconnues dans ${esc(f.name)}.`;
}

function saveMe(){db.me=(meName.value.trim()||"Moi");save()}
function addIntern(){const n=internName.value.trim();if(!n)return;db.interns.push({id:crypto.randomUUID(),name:n});internName.value="";save()}
function renameNurse(id,val){const n=db.nurses.find(x=>x.id===id);if(n){n.alias=val.trim()||n.original;save()}}
function removeIntern(id){db.interns=db.interns.filter(x=>x.id!==id);save()}

let selectedPatientId=null;
let editingPatientId=null;

function openPatientDetail(id){
 selectedPatientId=id;
 patientListCard.classList.add("hidden");
 patientDetailCard.classList.remove("hidden");
 renderPatientDetail();
}
function closePatientDetail(){
 selectedPatientId=null;
 patientDetailCard.classList.add("hidden");
 patientListCard.classList.remove("hidden");
}
function startPatientEdit(id){
 const p=patientById(id); if(!p)return;
 editingPatientId=id;
 patientFormTitle.textContent=`Modifier ${p.code}`;
 patientSaveButton.textContent="Enregistrer les modifications";
 patientCancelButton.classList.remove("hidden");
 pCode.value=p.code;
 pNurse.value=p.nurseId||"";
 pNurse2.value=p.nurseId2||"";
 pIntern.value=p.internId||"";
 pIntern2.value=p.internId2||"";
 pSep.checked=!!p.separation;
 pTca.checked=!!p.tca;
 activateTab("patients");
 window.scrollTo({top:0,behavior:"smooth"});
}
function cancelPatientEdit(){
 editingPatientId=null;
 patientFormTitle.textContent="Ajouter un patient";
 patientSaveButton.textContent="Ajouter";
 patientCancelButton.classList.add("hidden");
 pCode.value="";
 pSep.checked=false;
 pTca.checked=false;
 if(pNurse2) pNurse2.value="";
 if(pIntern2) pIntern2.value="";
}
function savePatientForm(){
 const code=pCode.value.trim();
 const nurseId=pNurse.value, nurseId2=pNurse2.value||null;
 const internId=pIntern.value, internId2=pIntern2.value||null;
 if(!code||!nurseId||!internId){alert("Renseigne au moins l’indicatif, un IDE et un interne.");return}
 if(editingPatientId){
   const p=patientById(editingPatientId); if(!p)return;
   Object.assign(p,{code,nurseId,nurseId2,internId,internId2,separation:pSep.checked,tca:pTca.checked});
 }else{
   db.patients.push({id:crypto.randomUUID(),code,nurseId,nurseId2,internId,internId2,separation:pSep.checked,tca:pTca.checked});
 }
 cancelPatientEdit();
 save();
}
function patientScheduleItems(p,day){
 const items=[];
 db.workshops.filter(w=>w.day===day&&w.patientIds.includes(p.id)).forEach(w=>items.push({id:w.id,source:"workshop",start:w.start,end:w.end,label:`Atelier : ${w.title}`}));
 db.constraints.filter(c=>c.personId===p.id&&c.day===day).forEach(c=>items.push({id:c.id,source:"constraint",start:c.start,end:c.end,label:c.reason}));
 return items.sort((a,b)=>a.start.localeCompare(b.start));
}
function editPatientScheduleItem(source,id){
 if(source==="workshop"){editWorkshop(id);return}
 const c=db.constraints.find(x=>x.id===id); if(!c)return;
 const day=prompt("Jour",c.day); if(day===null)return;
 const start=prompt("Début",c.start); if(start===null)return;
 const end=prompt("Fin",c.end); if(end===null)return;
 const reason=prompt("Motif",c.reason); if(reason===null)return;
 Object.assign(c,{day:day.trim()||c.day,start:start.trim()||c.start,end:end.trim()||c.end,reason:reason.trim()||c.reason});
 save();
}
function renderPatientDetail(){
 const p=patientById(selectedPatientId); if(!p)return;
 const nurses=[nurseById(p.nurseId),nurseById(p.nurseId2)].filter(Boolean).map(n=>n.alias).join(" / ")||"?";
 const interns=[internById(p.internId),internById(p.internId2)].filter(Boolean).map(i=>i.name).join(" / ")||"?";
 const days=DAYS.map(day=>{
   const items=patientScheduleItems(p,day);
   return `<div class="planning-day"><h3>${day}</h3>
     ${items.length?items.map(x=>`<div class="planning-item"><strong>${x.start}–${x.end}</strong> · ${esc(x.label)} <button class="secondary" style="padding:4px 8px;margin-left:6px" onclick="editPatientScheduleItem('${x.source}','${x.id}')">Modifier</button></div>`).join(""):"<div class='muted'>Aucune activité ou contrainte.</div>"}
   </div>`;
 }).join("");
 patientDetail.innerHTML=`<h2>${esc(p.code)}</h2>
   <div class="muted">IDE ${esc(nurses)} · Internes ${esc(interns)}</div>
   <div style="margin-top:8px">${p.separation?'<span class="badge">Séparation</span>':""}${p.tca?'<span class="badge">TCA</span>':""}</div>
   <div class="actions"><button onclick="startPatientEdit('${p.id}')">Modifier</button><button class="danger" onclick="removePatient('${p.id}');closePatientDetail()">Supprimer</button></div>
   <hr><h2>Planning par patient</h2>${days}`;
}

function removePatient(id){db.patients=db.patients.filter(x=>x.id!==id);db.constraints=db.constraints.filter(x=>x.personId!==id);save()}
let constraintFilter="all";
function addRangeConstraint(personId,day,start,end,reason,kind){
 if(!personId||!day||!start||!end||start>=end){alert("Vérifie les champs.");return}
 db.constraints.push({id:crypto.randomUUID(),personId,day,start,end,reason,kind});
 save()
}
function addPatientConstraint(){
 addRangeConstraint(pcPatient.value,pcDay.value,pcStart.value,pcEnd.value,pcReason.value,"patient");
}
function addAdultConstraint(){
 addRangeConstraint(acPerson.value,acDay.value,acStart.value,acEnd.value,acReason.value,"adult");
}
function filterConstraints(kind){constraintFilter=kind;render()}


function normalizeHeader(value){
 return String(value??"").trim().toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/\s+/g," ");
}
function normalizeDay(value){
 const raw=normalizeHeader(value);
 const map={
   "lundi":"Lundi","lun":"Lundi","l":"Lundi",
   "mardi":"Mardi","mar":"Mardi","m":"Mardi",
   "mercredi":"Mercredi","mer":"Mercredi","me":"Mercredi",
   "jeudi":"Jeudi","jeu":"Jeudi","j":"Jeudi",
   "vendredi":"Vendredi","ven":"Vendredi","v":"Vendredi"
 };
 return map[raw]||null;
}
function normalizeTime(value){
 if(value===null||value===undefined||value==="") return "";
 if(typeof value==="number"){
   const total=Math.round(value*24*60);
   return String(Math.floor(total/60)%24).padStart(2,"0")+":"+String(total%60).padStart(2,"0");
 }
 const s=String(value).trim().toLowerCase()
   .replace("h",":").replace(/\s+/g,"");
 const m=s.match(/^(\d{1,2})(?::?(\d{2}))?$/);
 if(!m) return "";
 return String(Number(m[1])).padStart(2,"0")+":"+String(Number(m[2]||0)).padStart(2,"0");
}
async function importWorkshopsExcel(){
 const file=workshopExcelFile.files[0];
 if(!file){alert("Choisis un fichier Excel.");return}
 if(typeof XLSX==="undefined"){
   alert("Le module Excel n’a pas chargé. Ouvre ATC avec une connexion Internet puis réessaie.");
   return;
 }
 try{
   const buffer=await file.arrayBuffer();
   const workbook=XLSX.read(buffer,{type:"array",cellDates:false});
   const worksheet=workbook.Sheets[workbook.SheetNames[0]];
   const rows=XLSX.utils.sheet_to_json(worksheet,{header:1,defval:"",raw:true});
   if(!rows.length) throw new Error("Le tableau est vide.");

   const headers=rows[0].map(normalizeHeader);
   const findCol=(names)=>headers.findIndex(h=>names.includes(h));
   const colDay=findCol(["jour"]);
   const colStart=findCol(["debut","heure debut","début"]);
   const colEnd=findCol(["fin","heure fin"]);
   const colTitle=findCol(["atelier","nom atelier","mediation","médiation"]);
   const colLeader=findCol(["intervenant","animateur","therapeute","thérapeute"]);
   const colCapacity=findCol(["places","capacite","capacité","nombre de places"]);

   if([colDay,colStart,colEnd,colTitle].some(i=>i<0)){
     throw new Error("Colonnes obligatoires non reconnues : Jour, Début, Fin, Atelier.");
   }

   const imported=[];
   const skipped=[];
   for(let r=1;r<rows.length;r++){
     const row=rows[r];
     const day=normalizeDay(row[colDay]);
     const start=normalizeTime(row[colStart]);
     const end=normalizeTime(row[colEnd]);
     const title=String(row[colTitle]??"").trim();
     const leader=colLeader>=0?String(row[colLeader]??"").trim():"";
     const capacityRaw=colCapacity>=0?row[colCapacity]:"";
     const capacity=capacityRaw!=="" && !isNaN(Number(capacityRaw)) ? Number(capacityRaw) : null;
     if(!day||!start||!end||!title||start>=end){
       if(row.some(v=>String(v).trim()!=="")) skipped.push(r+1);
       continue;
     }
     const duplicate=db.workshops.some(w=>
       w.day===day && w.start===start && w.end===end &&
       w.title.trim().toLowerCase()===title.toLowerCase()
     );
     if(!duplicate){
       imported.push({
         id:crypto.randomUUID(),title,day,start,end,leader,capacity,patientIds:[]
       });
     }
   }

   db.workshops.push(...imported);
   save();
   workshopImportStatus.innerHTML=
     `<strong>${imported.length} atelier(s) importé(s)</strong>`+
     (skipped.length?`<br>${skipped.length} ligne(s) ignorée(s) car incomplètes ou illisibles.`:"")+
     `<br><span class="muted">Les noms de patients du fichier n’ont pas été importés.</span>`;
 }catch(err){
   workshopImportStatus.innerHTML=`<strong>Import impossible</strong><br>${esc(err.message||err)}`;
 }
}


const BASE_WORKSHOPS=[
 {day:"Lundi",start:"10:15",end:"11:30",title:"Atelier 2D",leader:"Sibyl",category:"art-therapie",special:null},
 {day:"Mardi",start:"10:15",end:"11:30",title:"Atelier 2D ou 3D",leader:"Sibyl ou Barbara",category:"art-therapie",special:null},
 {day:"Mardi",start:"14:30",end:"15:30",title:"Photo numérique",leader:"Veronica",category:"art-therapie",special:null},
 {day:"Mardi",start:"17:00",end:"18:00",title:"Atelier ouvert",leader:"Sibyl",category:"art-therapie",special:"separation"},
 {day:"Mercredi",start:"10:15",end:"11:30",title:"Atelier Modelage",leader:"Barbara",category:"art-therapie",special:null},
 {day:"Mercredi",start:"14:15",end:"15:30",title:"Atelier 2D",leader:"Sibyl",category:"art-therapie",special:null},
 {day:"Jeudi",start:"10:15",end:"11:30",title:"Atelier Mosaïque",leader:"Barbara",category:"art-therapie",special:null},
 {day:"Jeudi",start:"13:00",end:"14:00",title:"Espace international",leader:"",category:"autre",special:null},
 {day:"Jeudi",start:"14:00",end:"16:00",title:"Atelier socio-esthétique",leader:"Hanna",category:"corporel",special:null},
 {day:"Vendredi",start:"10:15",end:"11:30",title:"Atelier sensoriel",leader:"Barbara",category:"art-therapie",special:null},
 {day:"Vendredi",start:"10:15",end:"11:30",title:"Groupe Moi-je",leader:"Charlotte",category:"autre",special:"tca-non-separation"},
 {day:"Vendredi",start:"14:00",end:"15:30",title:"Light Painting",leader:"",category:"art-therapie",special:null},
 {day:"Vendredi",start:"17:00",end:"18:00",title:"Atelier Mosaïque",leader:"Barbara",category:"art-therapie",special:"separation"}
];

function ensureBaseWorkshops(){
 if(db.baseWorkshopsLoaded) return;
 BASE_WORKSHOPS.forEach(w=>{
   db.workshops.push({
     id:crypto.randomUUID(),title:w.title,day:w.day,start:w.start,end:w.end,
     leader:w.leader,capacity:null,patientIds:[],category:w.category,special:w.special,base:true
   });
 });
 db.baseWorkshopsLoaded=true;
 localStorage.setItem("atc_v10modular",JSON.stringify(db));
}
function toggleWeekOption(key,checked){if(!db.weekOptions)db.weekOptions={bibliography:false,clinicalCase:false};db.weekOptions[key]=checked;save()}

function addWorkshop(){
 const title=wTitle.value.trim(),day=wDay.value,start=wStart.value,end=wEnd.value;
 const leader=wLeader.value.trim(),capacity=Number(wCapacity.value)||null,category=wCategory.value||"";
 if(!title||!day||!start||!end||start>=end){alert("Vérifie le nom, le jour et les horaires.");return}
 db.workshops.push({
   id:crypto.randomUUID(),title,day,start,end,leader,capacity,patientIds:[],category,special:null,base:false
 });
 wTitle.value="";wLeader.value="";wCapacity.value="";
 save()
}
function editWorkshop(id){
 const w=db.workshops.find(x=>x.id===id); if(!w)return;
 const title=prompt("Nom de l’atelier",w.title); if(title===null)return;
 const day=prompt("Jour (Lundi, Mardi…)",w.day); if(day===null)return;
 const start=prompt("Heure de début",w.start); if(start===null)return;
 const end=prompt("Heure de fin",w.end); if(end===null)return;
 const leader=prompt("Intervenant",w.leader||""); if(leader===null)return;
 const category=prompt("Catégorie : art-therapie / corporel / autre",w.category||""); if(category===null)return;
 Object.assign(w,{title:title.trim()||w.title,day:day.trim()||w.day,start:start.trim()||w.start,end:end.trim()||w.end,leader:leader.trim(),category:category.trim()});
 save();
}
function removeWorkshop(id){
 if(confirm("Supprimer cet atelier ?")){
   db.workshops=db.workshops.filter(w=>w.id!==id);save()
 }
}
function toggleWorkshopPatient(workshopId,patientId,checked){
 const w=db.workshops.find(x=>x.id===workshopId);if(!w)return;
 if(checked && !w.patientIds.includes(patientId)) w.patientIds.push(patientId);
 if(!checked) w.patientIds=w.patientIds.filter(id=>id!==patientId);
 save()
}
function workshopConflictsForPatient(patientId,day,start,end){
 return db.workshops.filter(w =>
   w.day===day &&
   w.patientIds.includes(patientId) &&
   overlap(start,end,w.start,w.end)
 );
}

function removeConstraint(id){db.constraints=db.constraints.filter(x=>x.id!==id);save()}
function adultOptions(){
 const arr=[{id:"me",name:db.me,type:"Moi"}];
 db.interns.forEach(x=>arr.push({id:x.id,name:x.name,type:"Interne"}));
 return arr;
}
function patientOptions(){
 return db.patients.map(x=>({id:x.id,name:x.code,type:"Patient"}));
}
function peopleOptions(){
 return [...adultOptions(),...patientOptions()];
}
function nurseById(id){return db.nurses.find(x=>x.id===id)}
function internById(id){return db.interns.find(x=>x.id===id)}
function patientById(id){return db.patients.find(x=>x.id===id)}
function constraintsFor(personId,day,start,end){
 return db.constraints.filter(c=>c.personId===personId&&c.day===day&&overlap(start,end,c.start,c.end))
}
function nursePresent(nurse,day,start,end){
 const shifts=nurse?.schedule?.[day]||[];
 return shifts.some(s=>toMin(start)>=toMin(s.start)&&toMin(end)<=toMin(s.end));
}
function evaluate(p,day,start,end){
 const nurse=nurseById(p.nurseId), nurse2=nurseById(p.nurseId2);
 const intern=internById(p.internId), intern2=internById(p.internId2);
 const reasons=[];
 if(!(nursePresent(nurse,day,start,end)||nursePresent(nurse2,day,start,end))) reasons.push("Aucun IDE référent présent");
 if((db.weekOptions?.bibliography||false) && day==="Lundi" && overlap(start,end,"11:00","12:00")) reasons.push(`${db.me} : Bibliographie`);
 if((db.weekOptions?.clinicalCase||false) && day==="Jeudi" && overlap(start,end,"11:00","12:00")) reasons.push(`${db.me} : Cas clinique`);
 const entities=[["me",db.me], [p.id,p.code]];
 for(const [id,name] of entities){
   if(!id) continue;
   const cs=constraintsFor(id,day,start,end);
   cs.forEach(c=>reasons.push(`${name} : ${c.reason}`));
 }
 const possibleInterns=[intern,intern2].filter(Boolean);
 if(!possibleInterns.some(i=>constraintsFor(i.id,day,start,end).length===0)) reasons.push("Aucun interne référent disponible");
 const workshops=workshopConflictsForPatient(p.id,day,start,end);
 workshops.forEach(w=>reasons.push(`${p.code} : atelier ${w.title}`));
 return {ok:reasons.length===0,reasons,nurse,intern};
}
function findForPatient(){
 const p=patientById(sPatient.value); if(!p){patientResults.textContent="Ajoute un patient.";return}
 const days=sDay.value?[sDay.value]:DAYS;
 let html="";
 for(const day of days){
   const available=[];
   for(const [start,end] of daySlots(p.separation)){
     const e=evaluate(p,day,start,end);
     if(e.ok) available.push(`${start}`);
   }
   if(available.length) html+=`<div class="slot"><strong>${day}</strong><br>${available.map(x=>`<span class="badge">${x}</span>`).join("")}</div>`;
 }
 patientResults.innerHTML=html||`<div class="conflict">Aucun créneau compatible.</div>`;
}
function findPatientsForSlot(){
 const day=fDay.value,start=fTime.value,end=toTime(toMin(start)+30);
 const possible=[],impossible=[];
 for(const p of db.patients){
   const allowed=daySlots(p.separation).some(x=>x[0]===start);
   if(!allowed){impossible.push({p,reasons:["Créneau non autorisé"]});continue}
   const e=evaluate(p,day,start,end);
   (e.ok?possible:impossible).push({p,reasons:e.reasons});
 }
 slotResults.innerHTML=(possible.length?`<h3>Compatibles</h3>${possible.map(x=>`<div class="slot"><strong>${esc(x.p.code)}</strong></div>`).join("")}`:"<div class='conflict'>Aucun patient compatible.</div>")
 +(impossible.length?`<h3>Non compatibles</h3>${impossible.map(x=>`<div class="conflict"><strong>${esc(x.p.code)}</strong><br><span class="muted">${esc(x.reasons.join(" · "))}</span></div>`).join("")}`:"");
}
function exportData(){
 const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ATC-sauvegarde.json";a.click();URL.revokeObjectURL(a.href)
}
function importBackup(e){
 const f=e.target.files[0];if(!f)return;
 const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save()}catch{alert("Sauvegarde invalide.")}};r.readAsText(f)
}
function resetAll(){if(confirm("Effacer toutes les données locales ?")){localStorage.removeItem("atc_v10modular");location.reload()}}
function render(){
 meName.value=db.me||"Moi";
 if(typeof workshopImportStatus!=="undefined" && db.workshops.length){
   workshopImportStatus.innerHTML=`<strong>${db.workshops.length} atelier(s) enregistré(s)</strong><br><span class="muted">Tu peux importer un nouveau tableau ou ajouter un atelier ponctuel.</span>`;
 }
 importStatus.innerHTML=db.importedAt?`<strong>${db.nurses.length} IDE importés</strong><br>Dernier import : ${new Date(db.importedAt).toLocaleString("fr-FR")}`:"Aucun fichier importé.";
 nurseList.innerHTML=db.nurses.length?db.nurses.map(n=>`<div class="person"><label>${esc(n.original)}</label><input value="${esc(n.alias)}" onchange="renameNurse('${n.id}',this.value)"></div>`).join(""):"Aucun IDE importé.";
 internList.innerHTML=db.interns.length?db.interns.map(i=>`<div class="person"><strong>${esc(i.name)}</strong> <button class="secondary" onclick="removeIntern('${i.id}')">Supprimer</button></div>`).join(""):"Aucun interne.";
 pNurse.innerHTML=db.nurses.map(n=>`<option value="${n.id}">${esc(n.alias)}</option>`).join("");
 pNurse2.innerHTML='<option value="">Aucun second IDE</option>'+db.nurses.map(n=>`<option value="${n.id}">${esc(n.alias)}</option>`).join("");
 pIntern.innerHTML=db.interns.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");
 pIntern2.innerHTML='<option value="">Aucun second interne</option>'+db.interns.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");
 patientList.innerHTML=db.patients.length?db.patients.map(p=>{
   const nurses=[nurseById(p.nurseId),nurseById(p.nurseId2)].filter(Boolean).map(n=>n.alias).join(" / ")||"?";
   const interns=[internById(p.internId),internById(p.internId2)].filter(Boolean).map(i=>i.name).join(" / ")||"?";
   return `<div class="person"><strong>${esc(p.code)}</strong> ${p.separation?'<span class="badge">Séparation</span>':''} ${p.tca?'<span class="badge">TCA</span>':''}
   <br><span class="muted">IDE ${esc(nurses)} · Internes ${esc(interns)}</span>
   <div class="actions">
     <button class="secondary" onclick="openPatientDetail('${p.id}')">Voir le planning</button>
     <button class="secondary" onclick="startPatientEdit('${p.id}')">Modifier</button>
     <button class="danger" onclick="removePatient('${p.id}')">Supprimer</button>
   </div></div>`
 }).join(""):"Aucun patient.";
 const adults=adultOptions();
 const patients=patientOptions();
 const ppl=[...adults,...patients];
 if(typeof acPerson!=="undefined") acPerson.innerHTML=adults.map(x=>`<option value="${x.id}">${esc(x.name)} — ${x.type}</option>`).join("");
 if(typeof pcPatient!=="undefined") pcPatient.innerHTML=patients.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 if(typeof acDay!=="undefined") acDay.innerHTML=DAYS.map(d=>`<option>${d}</option>`).join("");
 if(typeof pcDay!=="undefined") pcDay.innerHTML=DAYS.map(d=>`<option>${d}</option>`).join("");
 wDay.innerHTML=DAYS.map(d=>`<option>${d}</option>`).join("");
 sDay.innerHTML='<option value="">Toute la semaine</option>'+DAYS.map(d=>`<option>${d}</option>`).join("");
 fDay.innerHTML=DAYS.map(d=>`<option>${d}</option>`).join("");
 sPatient.innerHTML=db.patients.map(p=>`<option value="${p.id}">${esc(p.code)}</option>`).join("");
 const visibleConstraints=db.constraints.filter(c=>{
   const inferredKind=c.kind || (db.patients.some(p=>p.id===c.personId)?"patient":"adult");
   return constraintFilter==="all" || inferredKind===constraintFilter;
 });
 if(typeof constraintList!=="undefined") constraintList.innerHTML=visibleConstraints.length?visibleConstraints.map(c=>{
   const name=ppl.find(x=>x.id===c.personId)?.name||"?";
   const inferredKind=c.kind || (db.patients.some(p=>p.id===c.personId)?"patient":"adult");
   const kindLabel=inferredKind==="patient"?"Patient":"Adulte";
   return `<div class="person"><strong>${esc(name)}</strong> <span class="badge">${kindLabel}</span><br>${esc(c.day)} ${c.start}–${c.end} <span class="badge">${esc(c.reason)}</span> <button class="secondary" onclick="removeConstraint('${c.id}')">Supprimer</button></div>`
 }).join(""):"Aucune contrainte dans ce filtre.";

 const sortedWorkshops=[...db.workshops].sort((a,b)=>{
   const da=DAYS.indexOf(a.day),dbi=DAYS.indexOf(b.day);
   return da-dbi || a.start.localeCompare(b.start);
 });
 workshopList.innerHTML=sortedWorkshops.length?sortedWorkshops.map(w=>{
   const enrolled=db.patients.filter(p=>w.patientIds.includes(p.id));
   const capacityText=w.capacity?`${enrolled.length}/${w.capacity} places`:`${enrolled.length} patient(s)`;
   const patientChecks=db.patients.length?db.patients.map(p=>`
     <label class="switchline" style="margin:6px 0">
       <input type="checkbox" ${w.patientIds.includes(p.id)?"checked":""}
         onchange="toggleWorkshopPatient('${w.id}','${p.id}',this.checked)">
       <span>${esc(p.code)}</span>
     </label>`).join(""):"<span class='muted'>Ajoute d’abord des patients.</span>";
   return `<div class="person">
     <strong>${esc(w.title)}</strong> <span class="badge">${esc(w.day)} ${w.start}–${w.end}</span>
     ${w.leader?`<span class="badge">${esc(w.leader)}</span>`:""}
     ${w.category?`<span class="badge">${esc(w.category)}</span>`:""}
     ${w.special?`<span class="badge">${esc(w.special)}</span>`:""}
     <br><span class="muted">${capacityText}</span>
     <details style="margin-top:8px">
       <summary>Inscrire les patients</summary>
       <div style="padding-top:6px">${patientChecks}</div>
     </details>
     <div class="actions"><button class="secondary" onclick="editWorkshop('${w.id}')">Modifier</button><button class="secondary" onclick="removeWorkshop('${w.id}')">Supprimer l’atelier</button></div>
   </div>`;
 }).join(""):"Aucun atelier créé.";
 const agendaPatients='<option value="">Choisir un patient</option>'+db.patients.map(p=>`<option value="${p.id}">${esc(p.code)}</option>`).join("");
 agendaReview.innerHTML=db.agendaDraft.length?db.agendaDraft.map(ev=>`
   <div class="agenda-event ${ev.applied?"agenda-applied":""}">
     <strong>${esc(ev.title)}</strong>
     <div class="muted">${esc(ev.day)} ${ev.start}–${ev.end}</div>
     <div class="agenda-grid">
       <div>
         <label>Interprétation</label>
         <select onchange="updateAgendaEvent('${ev.id}','kind',this.value)" ${ev.applied?"disabled":""}>
           <option value="activity" ${ev.kind==="activity"?"selected":""}>Atelier / groupe</option>
           <option value="patient" ${ev.kind==="patient"?"selected":""}>Rendez-vous patient</option>
           <option value="ignore" ${ev.kind==="ignore"?"selected":""}>Ignorer</option>
         </select>
       </div>
       <div>
         <label>Patient si nécessaire</label>
         <select onchange="updateAgendaEvent('${ev.id}','patientId',this.value)" ${ev.applied?"disabled":""}>
           ${agendaPatients.replace(`value="${ev.patientId}"`,`value="${ev.patientId}" selected`)}
         </select>
       </div>
     </div>
     <div class="actions">
       <button class="secondary" onclick="applyAgendaEvent('${ev.id}')" ${ev.applied?"disabled":""}>${ev.applied?"Ajouté":"Valider"}</button>
     </div>
   </div>`).join(""):"<div class='muted'>Aucun événement à vérifier.</div>";

 if(typeof weekBibliography!=="undefined"){
   weekBibliography.checked=!!(db.weekOptions?.bibliography||false);
   weekClinicalCase.checked=!!(db.weekOptions?.clinicalCase||false);
 }
 if(typeof activityBalance!=="undefined"){
   const noArt=db.patients.filter(p=>!db.workshops.some(w=>w.patientIds.includes(p.id)&&w.category==="art-therapie")).map(p=>p.code);
   const noBody=db.patients.filter(p=>!db.workshops.some(w=>w.patientIds.includes(p.id)&&w.category==="corporel")).map(p=>p.code);
   activityBalance.innerHTML=`
     <div class="person"><strong>0 art-thérapie</strong><br>${noArt.length?noArt.map(x=>`<span class="badge">${esc(x)}</span>`).join(""):"<span class='muted'>Aucun</span>"}</div>
     <div class="person"><strong>0 corporel</strong><br>${noBody.length?noBody.map(x=>`<span class="badge">${esc(x)}</span>`).join(""):"<span class='muted'>Aucun</span>"}</div>`;
 }
 if(typeof dashboardSummary!=="undefined"){
   dashboardSummary.innerHTML=`
     <div class="person"><strong>${db.nurses.length?"✓":"○"} Planning IDE</strong> · ${db.nurses.length} soignant(s)</div>
     <div class="person"><strong>${db.workshops.length?"✓":"○"} Ateliers</strong> · ${db.workshops.length} atelier(s)</div>
     <div class="person"><strong>${db.agendaDraft.length?"✓":"○"} Google Agenda</strong> · ${db.agendaDraft.length} événement(s) analysé(s)</div>
     <div class="person"><strong>${db.patients.length} patient(s)</strong></div>`;
   if(db.workshops.length) dashboardWorkshopStatus.innerHTML=`<strong>${db.workshops.length} atelier(s) enregistré(s)</strong>`;
 }

 if(selectedPatientId)renderPatientDetail();
 renderDaily();
}
ensureBaseWorkshops();
render();
if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
