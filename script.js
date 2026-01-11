const form = document.getElementById('bookingForm');
const list = document.getElementById('list');
const clearBtn = document.getElementById('clearBtn');
const modal = document.getElementById('modal');
const mText = document.getElementById('mText');
const mTitle = document.getElementById('mTitle');
const modalClose = document.getElementById('modalClose');
const downloadIcs = document.getElementById('downloadIcs');
const exportAll = document.getElementById('exportAll');
const clearAll = document.getElementById('clearAll');

function loadAppointments(){
  try{ return JSON.parse(localStorage.getItem('dadau_appts')||'[]') }catch(e){ return [] }
}
function saveAppointments(arr){ localStorage.setItem('dadau_appts', JSON.stringify(arr)) }

function render(){
  const appts = loadAppointments().sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));
  list.innerHTML = appts.length? appts.map((a,i)=>`
    <div class="appt" data-i="${i}">
      <div>
        <div style="font-weight:600">${escapeHtml(a.name)} — <span class="muted">${escapeHtml(a.service)}</span></div>
        <div class="muted">${formatDate(a.date)} ${a.time} • ${escapeHtml(a.phone)}</div>
      </div>
      <div class="flex">
        <button data-i="${i}" class="btn secondary" onclick="editAppt(${i})">Editar</button>
        <button data-i="${i}" class="btn secondary" onclick="deleteAppt(${i})">Cancelar</button>
      </div>
    </div>
  `).join('') : '<div class="muted">Nenhum agendamento encontrado.</div>';
}

function formatDate(d){ if(!d) return ''; const dt=new Date(d); return dt.toLocaleDateString('pt-BR'); }
function escapeHtml(text){ if(!text) return ''; return text.replace(/[&<>\"']/g, t=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[t]||t)); }

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const now = new Date();
  const chosen = new Date(data.date + 'T' + (data.time||'00:00'));
  if(chosen.toString() === 'Invalid Date'){ alert('Data ou hora inválida'); return }
  if(chosen < now){ if(!confirm('A data/hora escolhida está no passado. Deseja continuar?')) return }

  const appts = loadAppointments();
  appts.push(data);
  saveAppointments(appts);
  render();
  showModal(data);
  form.reset();
});

clearBtn.addEventListener('click', ()=> form.reset());

function showModal(data){
  mTitle.textContent = 'Agendamento salvo';
  mText.innerHTML = `
    ${escapeHtml(data.name)} — ${formatDate(data.date)} ${data.time} <br>
    Serviço: ${escapeHtml(data.service)} <br>
    Telefone: ${escapeHtml(data.phone)}
  `;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  downloadIcs.onclick = ()=>{
    const blob = new Blob([generateICS(data)], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `agendamento-${data.name.replace(/\s+/g,'_')}.ics`; a.click(); URL.revokeObjectURL(url);
  }
}
modalClose.addEventListener('click', ()=>{ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true') });

function generateICS(a){
  const uid = 'dadau-' + Date.now();
  const dtstart = (a.date.replace(/-/g,'') + 'T' + a.time.replace(':','') + '00');
  const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const summary = `Agendamento - ${a.service}`;
  const desc = `Cliente: ${a.name}\\nTel: ${a.phone}\\nObs: ${a.notes || ''}`;
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Barbearia do Dadau//PT
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
SUMMARY:${summary}
DESCRIPTION:${desc}
END:VEVENT
END:VCALENDAR`;
}

function editAppt(i){
  const appts = loadAppointments();
  const a = appts[i];
  if(!a) return;
  form.name.value = a.name; form.phone.value = a.phone; form.service.value = a.service; form.date.value = a.date; form.time.value = a.time; form.barber.value = a.barber || ''; form.notes.value = a.notes || '';
  appts.splice(i,1); saveAppointments(appts); render();
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteAppt(i){ if(!confirm('Cancelar este agendamento?')) return; const appts = loadAppointments(); appts.splice(i,1); saveAppointments(appts); render(); }

exportAll.addEventListener('click', ()=>{
  const appts = loadAppointments();
  if(appts.length===0){ alert('Não há agendamentos para exportar'); return }
  const events = appts.map(a=>generateICS(a).replace(/^.*VCALENDAR\n/,'').replace('\nEND:VCALENDAR','')).join('\n');
  const blob = new Blob([`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Barbearia do Dadau//PT
${events}
END:VCALENDAR`], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'agendamentos-dadau.ics'; a.click(); URL.revokeObjectURL(url);
});

clearAll.addEventListener('click', ()=>{ if(confirm('Apagar todos os agendamentos?')){ localStorage.removeItem('dadau_appts'); render(); } });

render();
