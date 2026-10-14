import React, { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';

const RED = '#E31837', DARK = '#810001', GREY = '#E1DFDC';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const SAMPLE = [
  { id: 1, day: 0, name: 'Biology', start: '09:00', end: '10:00' },
  { id: 2, day: 0, name: 'Statistics', start: '12:00', end: '13:00' },
  { id: 3, day: 1, name: 'Economics', start: '10:00', end: '11:30' },
  { id: 4, day: 1, name: 'Seminar', start: '14:00', end: '15:00' },
  { id: 5, day: 2, name: 'Chemistry', start: '09:00', end: '10:30' },
  { id: 6, day: 2, name: 'Lab', start: '11:00', end: '13:00' },
];
const toMinutes = time => Number(time.slice(0,2))*60 + Number(time.slice(3));
const clock = value => String(Math.floor(value/60)).padStart(2,'0') + ':' + String(value%60).padStart(2,'0');
const load = () => { try { const value = JSON.parse(localStorage.getItem('smart-gap-classes')); return Array.isArray(value) ? value : SAMPLE; } catch { return SAMPLE; } };
export function findGymSlots(classes, workout, travel, buffer) {
  const needed = workout + 2*travel + buffer;
  const slots = [];
  for (let day = 0; day < 5; day++) {
    const events = classes.filter(item => Number(item.day) === day).sort((a,b) => toMinutes(a.start)-toMinutes(b.start));
    let latestEnd = events.length ? toMinutes(events[0].end) : 0;
    for (let i = 1; i < events.length; i++) {
      const nextStart = toMinutes(events[i].start);
      if (nextStart - latestEnd >= needed) {
        slots.push({ day, start: latestEnd, end: nextStart, duration: nextStart-latestEnd,
          gymStart: latestEnd+travel, gymEnd: latestEnd+travel+workout,
          returnBy: latestEnd+2*travel+workout });
      }
      latestEnd = Math.max(latestEnd, toMinutes(events[i].end));
    }
  }
  return slots;
}
export default function SmartGapFinder() {
  const [classes,setClasses] = useState(load);
  const [workout,setWorkout] = useState(45);
  const [travel,setTravel] = useState(10);
  const [buffer,setBuffer] = useState(5);
  const [editing,setEditing] = useState(null);
  const [form,setForm] = useState({name:'',day:0,start:'10:00',end:'11:00'});
  const [error,setError] = useState('');
  const [chosen,setChosen] = useState('');
  const slots = useMemo(() => findGymSlots(classes,workout,travel,buffer),[classes,workout,travel,buffer]);
  const persist = next => { setClasses(next); localStorage.setItem('smart-gap-classes',JSON.stringify(next)); setChosen(''); };
  const edit = item => { setEditing(item?.id ?? 'new'); setForm(item ? {...item} : {name:'',day:0,start:'10:00',end:'11:00'}); setError(''); };
  const save = () => {
    if (!form.name.trim() || toMinutes(form.end) <= toMinutes(form.start)) { setError('Enter a class name and valid times.'); return; }
    if (classes.some(e => e.id !== editing && Number(e.day) === Number(form.day) && toMinutes(form.start) < toMinutes(e.end) && toMinutes(e.start) < toMinutes(form.end))) {
      setError('This overlaps another commitment.'); return;
    }
    const item = {...form, name:form.name.trim(),day:Number(form.day),id:editing === 'new' ? Date.now() : editing};
    persist(editing === 'new' ? [...classes,item] : classes.map(e => e.id === editing ? item : e));
    setEditing(null);
  };
  const inputSx = { '& .MuiInputBase-root': { background:'#fff', color:'#171717' }, '& .MuiInputLabel-root': { color:'#555' } };
  return <Box sx={{maxWidth:950,mx:'auto',p:{xs:2,md:4},color:'#171717'}}>
    <Box sx={{background:RED,color:'#fff',borderRadius:3,p:3,mb:3}}>
      <Typography variant="overline">YORK-INSPIRED CAMPUS EXPERIENCE</Typography>
      <Typography variant="h4" fontWeight={800}>Smart Gap Finder</Typography>
      <Typography>Your classes. Your schedule. Your gym time.</Typography>
    </Box>
    <Card sx={{mb:3,background:'#F7F5F4',color:'#171717'}}><CardContent>
      <Typography variant="h6" fontWeight={700} gutterBottom>Your preferences</Typography>
      <Stack direction={{xs:'column',sm:'row'}} spacing={2}>
        {[[workout,setWorkout,'Workout (minutes)',[30,45,60,90]],[travel,setTravel,'Travel each way',[5,10,15,20,30]],[buffer,setBuffer,'Extra buffer',[0,5,10,15]]].map(([value,set,label,choices]) =>
          <TextField key={label} select fullWidth label={label} value={value} onChange={e=>{set(Number(e.target.value));setChosen('');}} sx={inputSx}>{choices.map(v=><MenuItem key={v} value={v}>{v} min</MenuItem>)}</TextField>)}
      </Stack>
      <Typography sx={{mt:2}} variant="body2">Required free time: <b>{workout+2*travel+buffer} minutes</b>, including travel both ways and buffer.</Typography>
    </CardContent></Card>
    <Card sx={{mb:3,background:'#fff',color:'#171717'}}><CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mb:2}}>
        <Typography variant="h6" fontWeight={700}>Class timetable</Typography>
        <Button onClick={()=>edit(null)} sx={{color:RED}}>+ Add class</Button>
      </Stack>
      {classes.slice().sort((a,b)=>a.day-b.day||toMinutes(a.start)-toMinutes(b.start)).map(e=>
        <Stack key={e.id} direction="row" alignItems="center" justifyContent="space-between" sx={{py:1,borderBottom:'1px solid '+GREY,gap:1}}>
          <Typography variant="body2">{DAYS[e.day]} · {e.start}–{e.end} · {e.name}</Typography>
          <Stack direction="row"><Button size="small" sx={{color:DARK}} onClick={()=>edit(e)}>Edit</Button><Button size="small" sx={{color:DARK}} onClick={()=>persist(classes.filter(x=>x.id!==e.id))}>Delete</Button></Stack>
        </Stack>)}
      {editing !== null && <Stack spacing={2} sx={{mt:2}}>
        <TextField label="Class or commitment" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} sx={inputSx}/>
        <TextField select label="Day" value={form.day} onChange={e=>setForm({...form,day:Number(e.target.value)})} sx={inputSx}>{DAYS.map((d,i)=><MenuItem key={d} value={i}>{d}</MenuItem>)}</TextField>
        <Stack direction="row" spacing={2}><TextField fullWidth type="time" label="Start" InputLabelProps={{shrink:true}} value={form.start} onChange={e=>setForm({...form,start:e.target.value})} sx={inputSx}/><TextField fullWidth type="time" label="End" InputLabelProps={{shrink:true}} value={form.end} onChange={e=>setForm({...form,end:e.target.value})} sx={inputSx}/></Stack>
        {error && <Typography color="error">{error}</Typography>}
        <Stack direction="row" spacing={1}><Button variant="contained" onClick={save} sx={{background:RED}}>Save</Button><Button onClick={()=>setEditing(null)}>Cancel</Button></Stack>
      </Stack>}
    </CardContent></Card>
    <Typography variant="h6" fontWeight={700} sx={{mb:2,color:'text.primary'}}>Suggested gym times ({slots.length})</Typography>
    {!slots.length && <Typography color="text.secondary">No gym times fit between your classes. Try a shorter workout or less travel time.</Typography>}
    <Stack spacing={2}>{slots.map(s=>{const key=s.day+'-'+s.start;return <Card key={key} sx={{background:'#fff',color:'#171717',border:'1px solid '+GREY}}><CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography fontWeight={700}>{DAYS[s.day]} · {clock(s.start)}–{clock(s.end)}</Typography>
        <Chip size="small" label={s.duration+' min gap'} sx={{background:'#F7F5F4'}}/>
      </Stack>
      <Typography variant="body2" sx={{my:1,color:'#555'}}>Gym {clock(s.gymStart)}–{clock(s.gymEnd)} · Return by {clock(s.returnBy)} · {s.end-s.returnBy} min spare</Typography>
      <Button variant="contained" onClick={()=>setChosen(key)} sx={{background:chosen===key?DARK:RED}}>{chosen===key?'✓ Selected':'Choose this gym time'}</Button>
    </CardContent></Card>})}</Stack>
    <Typography variant="caption" sx={{display:'block',mt:3,color:'text.secondary'}}>Schedule is saved on this device. Manual timetable entry only; no university calendar sync. York-inspired colours; not an official York University service.</Typography>
  </Box>;
}
