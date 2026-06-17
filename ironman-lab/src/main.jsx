import React, {useEffect,useMemo,useState} from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Activity, Bike, CalendarDays, Droplets, Flame, Gauge, Plus, Save, Timer, Waves, Dumbbell, TestTube2, Trash2, ClipboardList, HeartPulse, Scale, ThermometerSun, CheckCircle2, FlaskConical } from 'lucide-react';
import './styles.css';

const RACE_DATE = new Date('2026-09-19T07:00:00');
const TYPES = { Swim:{icon:Waves,unit:'yd'}, Bike:{icon:Bike,unit:'mi'}, Run:{icon:Activity,unit:'mi'}, Strength:{icon:Dumbbell,unit:'min'}, Rest:{icon:Timer,unit:''} };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function daysUntilRace(){ return Math.max(0, Math.ceil((RACE_DATE - new Date())/86400000)); }
function weekStart(d=new Date()){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function toISO(d){ return new Date(d).toISOString().slice(0,10); }
function num(v){ return Number(v)||0; }
function avg(arr){ const clean=arr.map(num).filter(v=>v>0); return clean.length ? (clean.reduce((a,b)=>a+b,0)/clean.length).toFixed(1) : '—'; }
function calcRates(payload){
  const hrs = num(payload.duration)/60;
  const carbs_per_hr = hrs ? Math.round(num(payload.carbs)/hrs) : 0;
  const sodium_per_hr = hrs ? Math.round(num(payload.sodium)/hrs) : 0;
  const fluid_per_hr = hrs ? Math.round(num(payload.fluid)/hrs) : 0;
  const sweat_rate_oz_hr = hrs && payload.pre_weight && payload.post_weight ? Math.round(((num(payload.pre_weight)-num(payload.post_weight))*16 + num(payload.fluid))/hrs) : null;
  return {...payload, carbs_per_hr, sodium_per_hr, fluid_per_hr, sweat_rate_oz_hr};
}

function App(){
  const [workouts,setWorkouts]=useState([]);
  const [planned,setPlanned]=useState([]);
  const [readiness,setReadiness]=useState([]);
  const [view,setView]=useState('dashboard');
  const [loading,setLoading]=useState(true);
  const blankWorkout={date:toISO(new Date()), type:'Bike', title:'', duration:'', distance:'', avg_hr:'', temp:'', humidity:'', rpe:'', gut:'', heat:'', energy:'', cramps:false, carbs:'', sodium:'', fluid:'', pre_weight:'', post_weight:'', notes:'', planned_id:null};
  const [form,setForm]=useState(blankWorkout);
  const [planForm,setPlanForm]=useState({date:toISO(new Date()), type:'Bike', title:'', planned_duration:'', planned_distance:'', intensity:'Z2', workout_details:'', fueling_target:'', notes:''});
  const [readyForm,setReadyForm]=useState({date:toISO(new Date()), weight:'', resting_hr:'', sleep_hours:'', hrv:'', energy:'', soreness:'', mood:'', notes:''});
  const [experiment,setExperiment]=useState({title:'', hypothesis:'', protocol:'', result:''});
  const [experiments,setExperiments]=useState(JSON.parse(localStorage.getItem('ironman_experiments')||'[]'));

  useEffect(()=>{ load(); },[]);
  async function load(){
    setLoading(true);
    if(!supabase){ setLoading(false); return; }
    const [w,p,r] = await Promise.all([
      supabase.from('workouts').select('*').order('date',{ascending:false}),
      supabase.from('planned_workouts').select('*').order('date',{ascending:true}),
      supabase.from('daily_readiness').select('*').order('date',{ascending:false})
    ]);
    if(w.error) console.error(w.error); else setWorkouts(w.data||[]);
    if(p.error) console.error(p.error); else setPlanned(p.data||[]);
    if(r.error) console.error(r.error); else setReadiness(r.data||[]);
    setLoading(false);
  }
  async function saveWorkout(e){
    e.preventDefault();
    const payload=calcRates({...form, duration:num(form.duration), distance:num(form.distance), avg_hr:num(form.avg_hr), temp:num(form.temp), humidity:num(form.humidity), rpe:num(form.rpe), gut:num(form.gut), heat:num(form.heat), energy:num(form.energy), carbs:num(form.carbs), sodium:num(form.sodium), fluid:num(form.fluid), pre_weight:form.pre_weight?num(form.pre_weight):null, post_weight:form.post_weight?num(form.post_weight):null});
    if(supabase){
      const {error}=await supabase.from('workouts').insert(payload);
      if(error) alert(error.message); else {
        if(payload.planned_id) await supabase.from('planned_workouts').update({completed:true}).eq('id',payload.planned_id);
        setForm(blankWorkout); load(); setView('dashboard');
      }
    }
  }
  async function savePlan(e){
    e.preventDefault();
    const payload={...planForm, planned_duration:num(planForm.planned_duration), planned_distance:num(planForm.planned_distance)};
    const {error}=await supabase.from('planned_workouts').insert(payload);
    if(error) alert(error.message); else { setPlanForm({date:toISO(new Date()), type:'Bike', title:'', planned_duration:'', planned_distance:'', intensity:'Z2', workout_details:'', fueling_target:'', notes:''}); load(); setView('calendar'); }
  }
  async function saveReadiness(e){
    e.preventDefault();
    const payload={...readyForm, weight:num(readyForm.weight), resting_hr:num(readyForm.resting_hr), sleep_hours:num(readyForm.sleep_hours), hrv:num(readyForm.hrv), energy:num(readyForm.energy), soreness:num(readyForm.soreness), mood:num(readyForm.mood)};
    const {error}=await supabase.from('daily_readiness').upsert(payload,{onConflict:'date'});
    if(error) alert(error.message); else {load(); setView('dashboard');}
  }
  async function deleteWorkout(id){ if(!confirm('Delete this workout?')) return; await supabase.from('workouts').delete().eq('id',id); load(); }
  async function deletePlan(id){ if(!confirm('Delete this planned workout?')) return; await supabase.from('planned_workouts').delete().eq('id',id); load(); }
  function startLogFromPlan(p){ setForm({...blankWorkout, date:p.date, type:p.type, title:p.title, duration:p.planned_duration||'', distance:p.planned_distance||'', notes:`Planned: ${p.workout_details||''}\nFuel target: ${p.fueling_target||''}\n${p.notes||''}`, planned_id:p.id}); setView('log'); }
  function saveExperiment(e){ e.preventDefault(); const next=[{...experiment,id:crypto.randomUUID(),date:toISO(new Date())},...experiments]; setExperiments(next); localStorage.setItem('ironman_experiments',JSON.stringify(next)); setExperiment({title:'',hypothesis:'',protocol:'',result:''}); }

  const stats=useMemo(()=>{
    const ws=weekStart(); const week=workouts.filter(w=>new Date(w.date)>=ws); const pweek=planned.filter(w=>new Date(w.date)>=ws && new Date(w.date)<new Date(ws.getTime()+7*86400000));
    return {week,pweek, swim:week.filter(w=>w.type==='Swim').reduce((a,w)=>a+num(w.distance),0), bike:week.filter(w=>w.type==='Bike').reduce((a,w)=>a+num(w.distance),0), run:week.filter(w=>w.type==='Run').reduce((a,w)=>a+num(w.distance),0), hours:week.reduce((a,w)=>a+num(w.duration),0)/60, heat:week.filter(w=>num(w.temp)>=80).length, plannedHours:pweek.reduce((a,w)=>a+num(w.planned_duration),0)/60, avgGut:avg(week.map(w=>w.gut)), avgHeat:avg(week.map(w=>w.heat)), avgSodium:avg(week.map(w=>w.sodium_per_hr)), avgFluid:avg(week.map(w=>w.fluid_per_hr)), avgSweat:avg(week.map(w=>w.sweat_rate_oz_hr))};
  },[workouts,planned]);
  const latestReadiness = readiness[0];
  return <div className="app">
    <header><div><h1>Ironman Lab</h1><p>Maryland Mission Control</p></div><div className="race"><strong>{daysUntilRace()}</strong><span>days to IM Maryland</span></div></header>
    <nav>{[['dashboard','dashboard'],['calendar','calendar'],['plan','add plan'],['log','log actual'],['readiness','readiness'],['experiments','experiments']].map(([v,label])=><button key={v} onClick={()=>setView(v)} className={view===v?'active':''}>{label}</button>)}</nav>
    {loading? <p>Loading...</p> : view==='dashboard'? <Dashboard stats={stats} workouts={workouts} planned={planned} readiness={latestReadiness} deleteWorkout={deleteWorkout} startLogFromPlan={startLogFromPlan}/> : view==='calendar'? <Calendar workouts={workouts} planned={planned} deletePlan={deletePlan} startLogFromPlan={startLogFromPlan}/> : view==='plan'? <Plan form={planForm} setForm={setPlanForm} savePlan={savePlan}/> : view==='log'? <Log form={form} setForm={setForm} saveWorkout={saveWorkout}/> : view==='readiness'? <Readiness form={readyForm} setForm={setReadyForm} saveReadiness={saveReadiness} readiness={readiness}/> : <Experiments experiment={experiment} setExperiment={setExperiment} saveExperiment={saveExperiment} experiments={experiments}/>} 
  </div>
}
function Card({icon:Icon,title,value,sub}){ return <div className="card"><Icon size={22}/><p>{title}</p><h2>{value}</h2><span>{sub}</span></div> }
function Dashboard({stats,workouts,planned,readiness,deleteWorkout,startLogFromPlan}){ const today=toISO(new Date()); const todayPlans=planned.filter(w=>w.date===today); const todayLogs=workouts.filter(w=>w.date===today); return <main><section className="grid"><Card icon={Waves} title="Swim" value={`${Math.round(stats.swim)} yd`} sub="completed this week"/><Card icon={Bike} title="Bike" value={`${stats.bike.toFixed(1)} mi`} sub="completed this week"/><Card icon={Activity} title="Run" value={`${stats.run.toFixed(1)} mi`} sub="completed this week"/><Card icon={Timer} title="Hours" value={stats.hours.toFixed(1)} sub={`${stats.plannedHours.toFixed(1)} planned`}/><Card icon={Flame} title="Heat Sessions" value={stats.heat} sub="80°F+"/><Card icon={Droplets} title="Avg Gut" value={stats.avgGut} sub="1 bad / 10 great"/><Card icon={Gauge} title="Sodium/hr" value={stats.avgSodium} sub="weekly average"/><Card icon={Droplets} title="Fluid/hr" value={stats.avgFluid} sub="weekly average oz"/><Card icon={ThermometerSun} title="Sweat Rate" value={stats.avgSweat} sub="oz/hr when weighed"/></section>
    <section className="panel"><h2><HeartPulse/> Morning Readiness</h2>{readiness?<div className="readinessStrip"><span>Weight <b>{readiness.weight||'—'}</b></span><span>Rest HR <b>{readiness.resting_hr||'—'}</b></span><span>Sleep <b>{readiness.sleep_hours||'—'}h</b></span><span>Energy <b>{readiness.energy||'—'}/10</b></span><span>Soreness <b>{readiness.soreness||'—'}/10</b></span></div>:<p className="muted">No morning check-in yet.</p>}</section>
    <section className="panel"><h2><ClipboardList/> Today&apos;s Plan</h2>{todayPlans.length? todayPlans.map(p=><PlannedWorkout key={p.id} p={p} start={startLogFromPlan}/>):<p className="muted">No planned workout today. Add one in Add Plan.</p>}</section>
    <section className="panel"><h2><CheckCircle2/> Today&apos;s Completed Work</h2>{todayLogs.length?todayLogs.map(w=><Workout key={w.id} w={w} del={deleteWorkout}/>):<p className="muted">Nothing logged yet.</p>}</section><section className="panel"><h2>Recent Lab Notes</h2>{workouts.slice(0,5).map(w=><Workout key={w.id} w={w} del={deleteWorkout}/>)}</section></main> }
function Workout({w,del}){ const Icon=TYPES[w.type]?.icon||Activity; return <div className="workout"><div className="workoutTop"><span className="pill"><Icon size={15}/>{w.type}</span><strong>{w.title||'Untitled'}</strong><small>{w.date}</small><button onClick={()=>del(w.id)}><Trash2 size={15}/></button></div><div className="metrics"><span>{w.distance} {TYPES[w.type]?.unit}</span><span>{w.duration} min</span><span>HR {w.avg_hr||'—'}</span><span>{w.temp||'—'}°F</span><span>RPE {w.rpe||'—'}</span><span>Gut {w.gut||'—'}</span><span>Heat {w.heat||'—'}</span><span>{w.cramps?'Cramps':'No cramps'}</span></div><div className="metrics lab"><span>{w.carbs_per_hr||0}g carbs/hr</span><span>{w.sodium_per_hr||0}mg sodium/hr</span><span>{w.fluid_per_hr||0}oz fluid/hr</span>{w.sweat_rate_oz_hr&&<span>{w.sweat_rate_oz_hr}oz sweat/hr</span>}</div>{w.notes&&<p className="notes">{w.notes}</p>}</div> }
function PlannedWorkout({p,start,del}){ const Icon=TYPES[p.type]?.icon||Activity; return <div className={`planned ${p.completed?'done':''}`}><div className="workoutTop"><span className="pill"><Icon size={15}/>{p.type}</span><strong>{p.title||'Planned Workout'}</strong><small>{p.date}</small>{del&&<button onClick={()=>del(p.id)}><Trash2 size={15}/></button>}</div><div className="metrics"><span>{p.planned_duration||'—'} min</span><span>{p.planned_distance||'—'} {TYPES[p.type]?.unit}</span><span>{p.intensity||'Intensity —'}</span><span>{p.completed?'Completed':'Planned'}</span></div>{p.workout_details&&<p className="notes"><b>Workout:</b> {p.workout_details}</p>}{p.fueling_target&&<p className="notes"><b>Fuel:</b> {p.fueling_target}</p>}{!p.completed&&<button className="miniBtn" onClick={()=>start(p)}>Log this workout</button>}</div> }
function Plan({form,setForm,savePlan}){ return <main><section className="panel"><h2><CalendarDays/> Add Planned Workout</h2><form onSubmit={savePlan} className="form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.keys(TYPES).map(t=><option key={t}>{t}</option>)}</select></label><label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Long bike + brick"/></label><label>Planned duration min<input value={form.planned_duration} onChange={e=>setForm({...form,planned_duration:e.target.value})}/></label><label>Planned distance<input value={form.planned_distance} onChange={e=>setForm({...form,planned_distance:e.target.value})}/></label><label>Intensity / Zone<input value={form.intensity} onChange={e=>setForm({...form,intensity:e.target.value})} placeholder="Z2, intervals, recovery"/></label><label className="wide">Workout details<textarea value={form.workout_details} onChange={e=>setForm({...form,workout_details:e.target.value})} placeholder="Example: 20 min easy, 4x10 min Z3, 10 min cooldown"/></label><label className="wide">Fueling target<textarea value={form.fueling_target} onChange={e=>setForm({...form,fueling_target:e.target.value})} placeholder="Example: 80g carbs/hr, 1000mg sodium/hr, 28oz fluid/hr"/></label><label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><button className="save"><Save size={18}/> Save Planned Workout</button></form></section></main> }
function Log({form,setForm,saveWorkout}){ const fields=[['title','Workout title'],['duration','Duration min'],['distance','Distance'],['avg_hr','Avg HR'],['temp','Temp °F'],['humidity','Humidity %'],['rpe','RPE 1-10'],['gut','Gut 1-10'],['heat','Heat 1-10'],['energy','Energy 1-10'],['carbs','Total carbs g'],['sodium','Total sodium mg'],['fluid','Total fluid oz'],['pre_weight','Pre weight'],['post_weight','Post weight']]; return <main><section className="panel"><h2><Plus/> Log Actual Workout</h2><form onSubmit={saveWorkout} className="form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.keys(TYPES).map(t=><option key={t}>{t}</option>)}</select></label>{fields.map(([k,p])=><label key={k}>{p}<input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label className="check"><input type="checkbox" checked={form.cramps} onChange={e=>setForm({...form,cramps:e.target.checked})}/> Cramps?</label><label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Fueling, heat, cramps, gut, mental notes..."/></label><button className="save"><Save size={18}/> Save Workout</button></form></section></main> }
function Calendar({workouts,planned,deletePlan,startLogFromPlan}){ const start=weekStart(); const days=Array.from({length:7},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;}); return <main><section className="panel"><h2><CalendarDays/> This Week</h2><div className="week">{days.map(d=><div className="day" key={toISO(d)}><h3>{d.toLocaleDateString(undefined,{weekday:'short'})}<span>{toISO(d)}</span></h3>{planned.filter(w=>w.date===toISO(d)).map(p=><div className={`mini plannedMini ${p.completed?'done':''}`} key={p.id}><b>Plan:</b> {p.type} — {p.title}<button onClick={()=>startLogFromPlan(p)}>log</button><button onClick={()=>deletePlan(p.id)}>×</button></div>)}{workouts.filter(w=>w.date===toISO(d)).map(w=><div className={`mini ${w.type}`} key={w.id}><b>Done:</b> {w.type}: {w.title||`${w.distance} ${TYPES[w.type]?.unit}`}</div>)}</div>)}</div></section></main> }
function Readiness({form,setForm,saveReadiness,readiness}){ const fields=[['weight','Weight'],['resting_hr','Resting HR'],['sleep_hours','Sleep hours'],['hrv','HRV'],['energy','Energy 1-10'],['soreness','Soreness 1-10'],['mood','Mood 1-10']]; return <main><section className="panel"><h2><Scale/> Morning Readiness</h2><form onSubmit={saveReadiness} className="form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>{fields.map(([k,p])=><label key={k}>{p}<input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><button className="save"><Save size={18}/> Save Readiness</button></form></section><section className="panel"><h2>Recent Check-ins</h2>{readiness.slice(0,10).map(r=><div className="readinessStrip" key={r.id}><span>{r.date}</span><span>Weight <b>{r.weight||'—'}</b></span><span>RHR <b>{r.resting_hr||'—'}</b></span><span>Sleep <b>{r.sleep_hours||'—'}h</b></span><span>Energy <b>{r.energy||'—'}</b></span></div>)}</section></main> }
function Experiments({experiment,setExperiment,saveExperiment,experiments}){ return <main><section className="panel"><h2><FlaskConical/> Experiments</h2><form onSubmit={saveExperiment} className="form exp"><label>Experiment<input value={experiment.title} onChange={e=>setExperiment({...experiment,title:e.target.value})} placeholder="1200mg sodium/hr hot ride"/></label><label>Hypothesis<textarea value={experiment.hypothesis} onChange={e=>setExperiment({...experiment,hypothesis:e.target.value})}/></label><label>Protocol<textarea value={experiment.protocol} onChange={e=>setExperiment({...experiment,protocol:e.target.value})}/></label><label>Result<textarea value={experiment.result} onChange={e=>setExperiment({...experiment,result:e.target.value})}/></label><button className="save"><Save size={18}/> Save Experiment</button></form></section><section className="panel">{experiments.map(x=><div className="experiment" key={x.id}><h3>{x.title}</h3><small>{x.date}</small><p><b>Hypothesis:</b> {x.hypothesis}</p><p><b>Protocol:</b> {x.protocol}</p><p><b>Result:</b> {x.result}</p></div>)}</section></main> }

createRoot(document.getElementById('root')).render(<App/>);
