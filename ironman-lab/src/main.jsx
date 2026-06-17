import React, {useEffect,useMemo,useState} from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Activity, Bike, CalendarDays, Droplets, Flame, Gauge, Plus, Save, Timer, Waves, Dumbbell, TrendingUp, TestTube2, Trash2 } from 'lucide-react';
import './styles.css';

const RACE_DATE = new Date('2026-09-19T07:00:00');
const TYPES = { Swim:{icon:Waves,unit:'yd'}, Bike:{icon:Bike,unit:'mi'}, Run:{icon:Activity,unit:'mi'}, Strength:{icon:Dumbbell,unit:'min'}, Rest:{icon:Timer,unit:''} };
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const demoWorkouts = [
  {id:'demo1', date:new Date().toISOString().slice(0,10), type:'Bike', title:'Recovery spin + cadence', duration:45, distance:14, avg_hr:128, temp:78, rpe:3, gut:9, heat:3, energy:7, cramps:false, carbs:40, sodium:700, fluid:24, notes:'Easy aerobic reset. Keep it smooth.'},
  {id:'demo2', date:new Date(Date.now()-86400000).toISOString().slice(0,10), type:'Run', title:'Short brick run', duration:20, distance:2.2, avg_hr:136, temp:82, rpe:4, gut:8, heat:4, energy:7, cramps:false, carbs:0, sodium:0, fluid:8, notes:'Cadence focus. No ego.'},
];

function daysUntilRace(){ return Math.max(0, Math.ceil((RACE_DATE - new Date())/86400000)); }
function weekStart(d=new Date()){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function toISO(d){ return new Date(d).toISOString().slice(0,10); }
function num(v){ return Number(v)||0; }

function App(){
  const [workouts,setWorkouts]=useState([]); const [view,setView]=useState('dashboard'); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({date:toISO(new Date()), type:'Bike', title:'', duration:'', distance:'', avg_hr:'', temp:'', rpe:'', gut:'', heat:'', energy:'', cramps:false, carbs:'', sodium:'', fluid:'', notes:''});
  const [experiment,setExperiment]=useState({title:'', hypothesis:'', protocol:'', result:''});
  const [experiments,setExperiments]=useState(JSON.parse(localStorage.getItem('ironman_experiments')||'[]'));

  useEffect(()=>{ load(); },[]);
  async function load(){
    if(!supabase){ setWorkouts(JSON.parse(localStorage.getItem('ironman_workouts')||'null') || demoWorkouts); setLoading(false); return; }
    const {data,error}=await supabase.from('workouts').select('*').order('date',{ascending:false});
    if(error){ console.error(error); setWorkouts([]); } else setWorkouts(data||[]); setLoading(false);
  }
  async function saveWorkout(e){
    e.preventDefault();
    const payload={...form, duration:num(form.duration), distance:num(form.distance), avg_hr:num(form.avg_hr), temp:num(form.temp), rpe:num(form.rpe), gut:num(form.gut), heat:num(form.heat), energy:num(form.energy), carbs:num(form.carbs), sodium:num(form.sodium), fluid:num(form.fluid)};
    if(supabase){ const {error}=await supabase.from('workouts').insert(payload); if(error) alert(error.message); else {setForm({...form,title:'',duration:'',distance:'',avg_hr:'',temp:'',rpe:'',gut:'',heat:'',energy:'',cramps:false,carbs:'',sodium:'',fluid:'',notes:''}); load();}}
    else { const next=[{...payload,id:crypto.randomUUID()},...workouts]; setWorkouts(next); localStorage.setItem('ironman_workouts',JSON.stringify(next)); }
  }
  async function deleteWorkout(id){ if(!confirm('Delete this workout?')) return; if(supabase){ await supabase.from('workouts').delete().eq('id',id); load(); } else { const next=workouts.filter(w=>w.id!==id); setWorkouts(next); localStorage.setItem('ironman_workouts',JSON.stringify(next)); }}
  function saveExperiment(e){ e.preventDefault(); const next=[{...experiment,id:crypto.randomUUID(),date:toISO(new Date())},...experiments]; setExperiments(next); localStorage.setItem('ironman_experiments',JSON.stringify(next)); setExperiment({title:'',hypothesis:'',protocol:'',result:''}); }

  const stats=useMemo(()=>{
    const ws=weekStart(); const week=workouts.filter(w=>new Date(w.date)>=ws);
    return {week, swim:week.filter(w=>w.type==='Swim').reduce((a,w)=>a+num(w.distance),0), bike:week.filter(w=>w.type==='Bike').reduce((a,w)=>a+num(w.distance),0), run:week.filter(w=>w.type==='Run').reduce((a,w)=>a+num(w.distance),0), hours:week.reduce((a,w)=>a+num(w.duration),0)/60, heat:week.filter(w=>num(w.temp)>=80).length, avgGut:avg(week.map(w=>w.gut).filter(Boolean)), avgHeat:avg(week.map(w=>w.heat).filter(Boolean))};
  },[workouts]);
  function avg(arr){ return arr.length ? (arr.reduce((a,b)=>a+num(b),0)/arr.length).toFixed(1) : '—'; }

  return <div className="app">
    <header><div><h1>Ironman Lab</h1><p>Maryland Mission Control</p></div><div className="race"><strong>{daysUntilRace()}</strong><span>days to IM Maryland</span></div></header>
    <nav>{['dashboard','log','calendar','experiments'].map(v=><button key={v} onClick={()=>setView(v)} className={view===v?'active':''}>{v}</button>)}</nav>
    {loading? <p>Loading...</p> : view==='dashboard'? <Dashboard stats={stats} workouts={workouts} deleteWorkout={deleteWorkout}/> : view==='log'? <Log form={form} setForm={setForm} saveWorkout={saveWorkout}/> : view==='calendar'? <Calendar workouts={workouts}/> : <Experiments experiment={experiment} setExperiment={setExperiment} saveExperiment={saveExperiment} experiments={experiments}/>} 
  </div>
}
function Card({icon:Icon,title,value,sub}){ return <div className="card"><Icon size={22}/><p>{title}</p><h2>{value}</h2><span>{sub}</span></div> }
function Dashboard({stats,workouts,deleteWorkout}){ const today=toISO(new Date()); return <main><section className="grid"><Card icon={Waves} title="Swim" value={`${Math.round(stats.swim)} yd`} sub="this week"/><Card icon={Bike} title="Bike" value={`${stats.bike.toFixed(1)} mi`} sub="this week"/><Card icon={Activity} title="Run" value={`${stats.run.toFixed(1)} mi`} sub="this week"/><Card icon={Timer} title="Hours" value={stats.hours.toFixed(1)} sub="this week"/><Card icon={Flame} title="Heat Sessions" value={stats.heat} sub="80°F+"/><Card icon={Droplets} title="Avg Gut" value={stats.avgGut} sub="1 bad / 10 great"/></section><section className="panel"><h2>Today</h2>{workouts.filter(w=>w.date===today).length? workouts.filter(w=>w.date===today).map(w=><Workout key={w.id} w={w} del={deleteWorkout}/>):<p className="muted">No workout logged yet. Add one in Log.</p>}</section><section className="panel"><h2>Recent Lab Notes</h2>{workouts.slice(0,6).map(w=><Workout key={w.id} w={w} del={deleteWorkout}/>)}</section></main> }
function Workout({w,del}){ const Icon=TYPES[w.type]?.icon||Activity; const carbsHr=w.duration? Math.round(num(w.carbs)/(num(w.duration)/60)):0; const sodiumHr=w.duration? Math.round(num(w.sodium)/(num(w.duration)/60)):0; const fluidHr=w.duration? Math.round(num(w.fluid)/(num(w.duration)/60)):0; return <div className="workout"><div className="workoutTop"><span className="pill"><Icon size={15}/>{w.type}</span><strong>{w.title||'Untitled'}</strong><small>{w.date}</small><button onClick={()=>del(w.id)}><Trash2 size={15}/></button></div><div className="metrics"><span>{w.distance} {TYPES[w.type]?.unit}</span><span>{w.duration} min</span><span>HR {w.avg_hr||'—'}</span><span>{w.temp||'—'}°F</span><span>RPE {w.rpe||'—'}</span><span>Gut {w.gut||'—'}</span><span>Heat {w.heat||'—'}</span><span>{w.cramps?'Cramps':'No cramps'}</span></div><div className="metrics lab"><span>{carbsHr}g carbs/hr</span><span>{sodiumHr}mg sodium/hr</span><span>{fluidHr}oz fluid/hr</span></div>{w.notes&&<p className="notes">{w.notes}</p>}</div> }
function Log({form,setForm,saveWorkout}){ const fields=[['title','Workout title'],['duration','Duration min'],['distance','Distance'],['avg_hr','Avg HR'],['temp','Temp °F'],['rpe','RPE 1-10'],['gut','Gut 1-10'],['heat','Heat 1-10'],['energy','Energy 1-10'],['carbs','Total carbs g'],['sodium','Total sodium mg'],['fluid','Total fluid oz']]; return <main><section className="panel"><h2><Plus/> Add Workout</h2><form onSubmit={saveWorkout} className="form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.keys(TYPES).map(t=><option key={t}>{t}</option>)}</select></label>{fields.map(([k,p])=><label key={k}>{p}<input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label className="check"><input type="checkbox" checked={form.cramps} onChange={e=>setForm({...form,cramps:e.target.checked})}/> Cramps?</label><label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Fueling, heat, cramps, gut, mental notes..."/></label><button className="save"><Save size={18}/> Save Workout</button></form></section></main> }
function Calendar({workouts}){ const start=weekStart(); const days=Array.from({length:7},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;}); return <main><section className="panel"><h2><CalendarDays/> This Week</h2><div className="week">{days.map(d=><div className="day" key={toISO(d)}><h3>{d.toLocaleDateString(undefined,{weekday:'short'})}<span>{toISO(d)}</span></h3>{workouts.filter(w=>w.date===toISO(d)).map(w=><div className={`mini ${w.type}`}>{w.type}: {w.title||`${w.distance} ${TYPES[w.type]?.unit}`}</div>)}</div>)}</div></section></main> }
function Experiments({experiment,setExperiment,saveExperiment,experiments}){ return <main><section className="panel"><h2><TestTube2/> Experiments</h2><form onSubmit={saveExperiment} className="form exp"><label>Experiment<input value={experiment.title} onChange={e=>setExperiment({...experiment,title:e.target.value})} placeholder="1200mg sodium/hr hot ride"/></label><label>Hypothesis<textarea value={experiment.hypothesis} onChange={e=>setExperiment({...experiment,hypothesis:e.target.value})}/></label><label>Protocol<textarea value={experiment.protocol} onChange={e=>setExperiment({...experiment,protocol:e.target.value})}/></label><label>Result<textarea value={experiment.result} onChange={e=>setExperiment({...experiment,result:e.target.value})}/></label><button className="save"><Save size={18}/> Save Experiment</button></form></section><section className="panel">{experiments.map(x=><div className="experiment" key={x.id}><h3>{x.title}</h3><small>{x.date}</small><p><b>Hypothesis:</b> {x.hypothesis}</p><p><b>Protocol:</b> {x.protocol}</p><p><b>Result:</b> {x.result}</p></div>)}</section></main> }

createRoot(document.getElementById('root')).render(<App/>);
