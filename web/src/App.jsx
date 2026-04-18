import { useState, useEffect, useCallback } from 'react';

const API = 'https://18.191.166.111/api';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0d1117;
    --panel:     #161b22;
    --card:      #1c2128;
    --border:    #30363d;
    --accent:    #3fb950;
    --accent-d:  #2ea043;
    --accent-s:  rgba(63,185,80,.1);
    --red:       #f85149;
    --red-s:     rgba(248,81,73,.1);
    --yellow:    #d29922;
    --yellow-s:  rgba(210,153,34,.1);
    --blue:      #58a6ff;
    --text:      #e6edf3;
    --text-2:    #8b949e;
    --text-3:    #484f58;
    --font:      'Outfit', sans-serif;
    --mono:      'JetBrains Mono', monospace;
    --r:         8px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
    display: flex;
  }

  input, select, button, textarea { font-family: var(--font); }

  input, select {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 9px 12px;
    font-size: .875rem;
    color: var(--text);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(63,185,80,.15);
  }
  input::placeholder { color: var(--text-3); }

  label {
    display: block;
    font-size: .75rem;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 5px;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  @keyframes up   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes in   { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 14px;
  }

  .student-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    transition: border-color .15s, transform .15s;
    animation: up .3s ease both;
    cursor: default;
  }
  .student-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }

  .tag {
    display: inline-block;
    font-family: var(--mono);
    font-size: .72rem;
    padding: 2px 8px;
    border-radius: 20px;
    background: var(--accent-s);
    color: var(--accent);
    border: 1px solid rgba(63,185,80,.25);
  }
`;

/* ── Utilities ────────────────────────────────────────────────────────────── */
async function req(path, token, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}

function Pill({ children, color = 'green' }) {
  const map = {
    green:  { bg: 'var(--accent-s)',  text: 'var(--accent)', border: 'rgba(63,185,80,.25)' },
    red:    { bg: 'var(--red-s)',     text: 'var(--red)',    border: 'rgba(248,81,73,.25)' },
    yellow: { bg: 'var(--yellow-s)',  text: 'var(--yellow)', border: 'rgba(210,153,34,.25)' },
    blue:   { bg: 'rgba(88,166,255,.1)', text: 'var(--blue)', border: 'rgba(88,166,255,.25)' },
  };
  const c = map[color];
  return (
    <span style={{
      display: 'inline-block', fontSize: '.72rem', fontWeight: 600,
      padding: '2px 9px', borderRadius: 20,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontFamily: 'var(--mono)',
    }}>{children}</span>
  );
}

function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, full, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    fontWeight: 500, borderRadius: 'var(--r)', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', whiteSpace: 'nowrap', opacity: disabled ? .5 : 1,
    width: full ? '100%' : undefined,
    padding: size === 'sm' ? '6px 12px' : '9px 16px',
    fontSize: size === 'sm' ? '.78rem' : '.875rem',
  };
  const variants = {
    primary: { background: 'var(--accent)',    color: '#0d1117', border: '1px solid var(--accent)' },
    ghost:   { background: 'transparent',       color: 'var(--text-2)', border: '1px solid var(--border)' },
    danger:  { background: 'var(--red-s)',      color: 'var(--red)',    border: '1px solid rgba(248,81,73,.3)' },
    warn:    { background: 'var(--yellow-s)',   color: 'var(--yellow)', border: '1px solid rgba(210,153,34,.3)' },
    solid_red:{ background: 'var(--red)',       color: '#fff',          border: '1px solid var(--red)' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Spinner({ dark } = {}) {
  return (
    <span style={{
      display: 'inline-block', width: 15, height: 15,
      border: `2px solid ${dark ? 'var(--border)' : 'rgba(255,255,255,.2)'}`,
      borderTopColor: dark ? 'var(--accent)' : '#0d1117',
      borderRadius: '50%', animation: 'spin .5s linear infinite',
    }}/>
  );
}

function Field({ label, children }) {
  return <div><label>{label}</label>{children}</div>;
}

function Avatar({ name = '', ap = '' }) {
  const letters = `${name[0] || ''}${ap[0] || ''}`.toUpperCase();
  const hue = (letters.charCodeAt(0) * 13 + letters.charCodeAt(1) * 7) % 360;
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: `hsl(${hue},55%,35%)`,
      border: `2px solid hsl(${hue},55%,45%)`,
      display: 'grid', placeItems: 'center',
      fontWeight: 700, fontSize: '.8rem', color: '#fff',
    }}>{letters}</div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [token,    setToken]    = useState(() => localStorage.getItem('jwt') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('usr') || '');
  const [toasts,   setToasts]   = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  const login = (tok, user) => {
    localStorage.setItem('jwt', tok);
    localStorage.setItem('usr', user);
    setToken(tok); setUsername(user);
  };

  const logout = () => {
    localStorage.removeItem('jwt'); localStorage.removeItem('usr');
    setToken(''); setUsername('');
  };

  return (
    <>
      <style>{css}</style>

      {token
        ? <Layout username={username} onLogout={logout} token={token} addToast={addToast}/>
        : <LoginPage onLogin={login}/>
      }

      {/* Toasts */}
      <div style={{ position:'fixed', bottom:20, right:20, zIndex:300, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${t.type === 'error' ? 'var(--red)' : t.type === 'warn' ? 'var(--yellow)' : 'var(--accent)'}`,
            borderRadius: 'var(--r)', padding: '11px 16px',
            fontSize: '.83rem', maxWidth: 280, boxShadow: '0 8px 24px rgba(0,0,0,.4)',
            animation: 'up .25s ease', color: 'var(--text)',
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Sidebar layout ───────────────────────────────────────────────────────── */
function Layout({ username, onLogout, token, addToast }) {
  const [view, setView] = useState('alumnos');

  const navItems = [
    { id: 'alumnos', label: 'Alumnos', icon: <IconUsers/> },
    { id: 'nuevo',   label: 'Nuevo alumno', icon: <IconPlus/> },
    { id: 'buscar',  label: 'Buscar por fecha', icon: <IconCalendar/> },
  ];

  return (
    <div style={{ display:'flex', width:'100%', minHeight:'100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--panel)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              background:'var(--accent-s)', border:'1px solid rgba(63,185,80,.3)',
              display:'grid', placeItems:'center',
            }}>
              <IconUsers color="var(--accent)" size={16}/>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'.88rem', lineHeight:1 }}>Alumnos</div>
              <div style={{ fontSize:'.68rem', color:'var(--text-3)', marginTop:2 }}>Panel escolar</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:'var(--r)', marginBottom:2,
                background: view === item.id ? 'var(--accent-s)' : 'transparent',
                border: view === item.id ? '1px solid rgba(63,185,80,.2)' : '1px solid transparent',
                color: view === item.id ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: view === item.id ? 600 : 400,
                fontSize:'.875rem', cursor:'pointer', transition:'all .15s',
              }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:'.75rem', color:'var(--text-3)', marginBottom:8 }}>Sesion activa</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{
              width:28, height:28, borderRadius:6, background:'var(--accent-s)',
              border:'1px solid rgba(63,185,80,.3)', display:'grid', placeItems:'center',
              fontSize:'.7rem', fontWeight:700, color:'var(--accent)',
            }}>
              {username[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize:'.83rem', fontWeight:500 }}>{username}</span>
          </div>
          <Btn variant="ghost" size="sm" full onClick={onLogout}>Cerrar sesion</Btn>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex:1, overflow:'auto', padding:'28px 32px' }}>
        {view === 'alumnos' && <AlumnosView token={token} addToast={addToast} setView={setView}/>}
        {view === 'nuevo'   && <NuevoView   token={token} addToast={addToast} onDone={() => setView('alumnos')}/>}
        {view === 'buscar'  && <BuscarView  token={token} addToast={addToast}/>}
      </main>
    </div>
  );
}

/* ── Alumnos view (card grid) ─────────────────────────────────────────────── */
function AlumnosView({ token, addToast, setView }) {
  const [alumnos,  setAlumnos]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await req('/alumnos/', token);
      setAlumnos(d.data || []);
    } catch (e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const q = search.toLowerCase();
  const visible = alumnos.filter(a =>
    (a.nombre_completo || `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno}`).toLowerCase().includes(q) ||
    a.matricula.toLowerCase().includes(q) ||
    a.correo.toLowerCase().includes(q)
  );

  return (
    <>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, lineHeight:1 }}>Lista de alumnos</h1>
          <p style={{ fontSize:'.83rem', color:'var(--text-2)', marginTop:5 }}>
            {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} registrado{alumnos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Btn onClick={() => setView('nuevo')}>+ Nuevo alumno</Btn>
      </div>

      {/* Search */}
      <div style={{ marginBottom:20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, matricula o correo..."
          style={{ maxWidth:380 }}/>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:'grid', placeItems:'center', height:200 }}>
          <Spinner dark/>
        </div>
      ) : visible.length === 0 ? (
        <div style={{
          background:'var(--card)', border:'1px solid var(--border)',
          borderRadius:12, padding:'60px 20px', textAlign:'center', color:'var(--text-3)',
        }}>
          <div style={{ fontSize:'2rem', marginBottom:10, opacity:.3 }}>—</div>
          <div style={{ fontSize:'.9rem' }}>No se encontraron alumnos</div>
        </div>
      ) : (
        <div className="card-grid">
          {visible.map((a, i) => {
            const full = a.nombre_completo || `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno}`;
            const date = a.fecha_alta?.split(' ')[0] || '—';
            return (
              <div key={a.id} className="student-card" style={{ animationDelay: `${i * 40}ms` }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                  <Avatar name={a.nombre} ap={a.apellido_paterno}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.9rem', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {full}
                    </div>
                    <Pill>{a.matricula}</Pill>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
                  <div style={{ fontSize:'.78rem', color:'var(--text-2)', display:'flex', gap:8 }}>
                    <span style={{ color:'var(--text-3)', fontFamily:'var(--mono)', fontSize:'.72rem' }}>correo</span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.correo}</span>
                  </div>
                  <div style={{ fontSize:'.78rem', color:'var(--text-2)', display:'flex', gap:8 }}>
                    <span style={{ color:'var(--text-3)', fontFamily:'var(--mono)', fontSize:'.72rem' }}>alta&nbsp;&nbsp;&nbsp;</span>
                    <span>{date}</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:8, borderTop:'1px solid var(--border)', paddingTop:14 }}>
                  <Btn variant="warn" size="sm" onClick={() => setEditing(a)} style={{ flex:1, justifyContent:'center' }}>
                    Editar
                  </Btn>
                  <Btn variant="danger" size="sm" onClick={() => setDeleting(a)} style={{ flex:1, justifyContent:'center' }}>
                    Eliminar
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing  && <EditModal  token={token} alumno={editing}  onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null);  load(); addToast('Alumno actualizado'); }}
        onError={m => addToast(m, 'error')}/>}
      {deleting && <DeleteModal token={token} alumno={deleting} onClose={() => setDeleting(null)}
        onDeleted={() => { setDeleting(null); load(); addToast('Alumno eliminado'); }}
        onError={m => addToast(m, 'error')}/>}
    </>
  );
}

/* ── Nuevo alumno view ────────────────────────────────────────────────────── */
function NuevoView({ token, addToast, onDone }) {
  const empty = { nombre:'', apellido_paterno:'', apellido_materno:'', matricula:'', correo:'' };
  const [form,    setForm]    = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    const required = ['nombre','apellido_paterno','apellido_materno','matricula','correo'];
    for (const f of required) {
      if (!form[f].trim()) { setError(`El campo "${f.replace(/_/g,' ')}" es obligatorio.`); return; }
    }
    setLoading(true); setError('');
    try {
      await req('/alumnos/', token, { method:'POST', body: JSON.stringify(form) });
      setDone(true);
      addToast('Alumno creado exitosamente');
      setTimeout(() => { setDone(false); setForm(empty); }, 2000);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:700 }}>Nuevo alumno</h1>
        <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:5 }}>Registra los datos del nuevo alumno</p>
      </div>

      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:12, padding:28, animation:'up .3s ease',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <Field label="Nombre *"><input value={form.nombre} onChange={set('nombre')} placeholder="Juan"/></Field>
          <Field label="Apellido paterno *"><input value={form.apellido_paterno} onChange={set('apellido_paterno')} placeholder="Garcia"/></Field>
          <Field label="Apellido materno *"><input value={form.apellido_materno} onChange={set('apellido_materno')} placeholder="Lopez"/></Field>
          <Field label="Matricula *">
            <input value={form.matricula} onChange={set('matricula')} placeholder="A12345"
              style={{ fontFamily:'var(--mono)' }}/>
          </Field>
          <div style={{ gridColumn:'1/-1' }}>
            <Field label="Correo electronico *">
              <input type="email" value={form.correo} onChange={set('correo')} placeholder="juan@escuela.mx"/>
            </Field>
          </div>
        </div>

        {error && (
          <div style={{
            background:'var(--red-s)', border:'1px solid rgba(248,81,73,.3)',
            borderRadius:8, padding:'10px 14px', fontSize:'.82rem',
            color:'var(--red)', marginBottom:16,
          }}>{error}</div>
        )}

        {done && (
          <div style={{
            background:'var(--accent-s)', border:'1px solid rgba(63,185,80,.3)',
            borderRadius:8, padding:'10px 14px', fontSize:'.82rem',
            color:'var(--accent)', marginBottom:16,
          }}>Alumno registrado correctamente.</div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={onDone}>Ver todos</Btn>
          <Btn onClick={submit} disabled={loading}>
            {loading ? <Spinner/> : 'Registrar alumno'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Buscar por fecha view ────────────────────────────────────────────────── */
function BuscarView({ token, addToast }) {
  const [filter,   setFilter]   = useState({ inicio:'', fin:'' });
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  const buscar = async () => {
    if (!filter.inicio || !filter.fin) { addToast('Selecciona ambas fechas', 'warn'); return; }
    setLoading(true);
    try {
      const d = await req(`/alumnos/rango-fecha?fecha_inicio=${filter.inicio}&fecha_fin=${filter.fin}`, token);
      setResults(d.data || []);
      addToast(`${(d.data||[]).length} resultado(s)`);
    } catch (e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:700 }}>Buscar por fecha de alta</h1>
        <p style={{ color:'var(--text-2)', fontSize:'.83rem', marginTop:5 }}>Filtra alumnos por rango de fecha de registro</p>
      </div>

      <div style={{
        background:'var(--card)', border:'1px solid var(--border)',
        borderRadius:12, padding:24, marginBottom:24,
        display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap',
      }}>
        <div style={{ flex:1, minWidth:160 }}>
          <Field label="Fecha inicio">
            <input type="date" value={filter.inicio}
              onChange={e => setFilter(f => ({ ...f, inicio: e.target.value }))}/>
          </Field>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <Field label="Fecha fin">
            <input type="date" value={filter.fin}
              onChange={e => setFilter(f => ({ ...f, fin: e.target.value }))}/>
          </Field>
        </div>
        <Btn onClick={buscar} disabled={loading}>
          {loading ? <Spinner/> : 'Buscar'}
        </Btn>
        {results !== null && (
          <Btn variant="ghost" onClick={() => { setResults(null); setFilter({ inicio:'', fin:'' }); }}>
            Limpiar
          </Btn>
        )}
      </div>

      {results !== null && (
        results.length === 0 ? (
          <div style={{
            background:'var(--card)', border:'1px solid var(--border)',
            borderRadius:12, padding:'40px 20px', textAlign:'center', color:'var(--text-3)', fontSize:'.875rem',
          }}>
            No hay alumnos registrados en ese rango de fechas
          </div>
        ) : (
          <>
            <div style={{ marginBottom:14 }}>
              <Pill color="blue">{results.length} resultado{results.length !== 1 ? 's' : ''}</Pill>
            </div>
            <div className="card-grid">
              {results.map((a, i) => {
                const full = a.nombre_completo || `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno}`;
                return (
                  <div key={a.id} className="student-card" style={{ animationDelay:`${i*40}ms` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <Avatar name={a.nombre} ap={a.apellido_paterno}/>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'.88rem' }}>{full}</div>
                        <Pill>{a.matricula}</Pill>
                      </div>
                    </div>
                    <div style={{ fontSize:'.78rem', color:'var(--text-2)' }}>
                      <span style={{ color:'var(--text-3)', fontFamily:'var(--mono)', fontSize:'.72rem' }}>alta </span>
                      {a.fecha_alta?.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </div>
  );
}

/* ── Edit Modal ───────────────────────────────────────────────────────────── */
function EditModal({ token, alumno, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    nombre:           alumno.nombre,
    apellido_paterno: alumno.apellido_paterno,
    apellido_materno: alumno.apellido_materno,
    correo:           alumno.correo,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await req(`/alumnos/${alumno.id}`, token, { method:'PUT', body: JSON.stringify(form) });
      onSaved();
    } catch (e) { setError(e.message); setLoading(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <h3 style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:4 }}>Editar alumno</h3>
      <p style={{ color:'var(--text-2)', fontSize:'.82rem', marginBottom:22, fontFamily:'var(--mono)' }}>
        {alumno.matricula}
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <Field label="Nombre"><input value={form.nombre} onChange={set('nombre')}/></Field>
        <Field label="Apellido paterno"><input value={form.apellido_paterno} onChange={set('apellido_paterno')}/></Field>
        <Field label="Apellido materno"><input value={form.apellido_materno} onChange={set('apellido_materno')}/></Field>
        <Field label="Correo"><input value={form.correo} onChange={set('correo')}/></Field>
      </div>
      {error && <div style={{ color:'var(--red)', fontSize:'.82rem', marginBottom:14 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit} disabled={loading}>{loading ? <Spinner/> : 'Guardar cambios'}</Btn>
      </div>
    </Overlay>
  );
}

/* ── Delete Modal ─────────────────────────────────────────────────────────── */
function DeleteModal({ token, alumno, onClose, onDeleted, onError }) {
  const [loading, setLoading] = useState(false);
  const full = `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}`;

  const confirm = async () => {
    setLoading(true);
    try {
      await req(`/alumnos/${alumno.id}`, token, { method:'DELETE' });
      onDeleted();
    } catch (e) { onError(e.message); setLoading(false); }
  };

  return (
    <Overlay onClose={onClose} maxWidth={400}>
      <h3 style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:10 }}>Eliminar alumno</h3>
      <p style={{ color:'var(--text-2)', fontSize:'.875rem', lineHeight:1.7, marginBottom:22 }}>
        Estas a punto de eliminar a <strong style={{ color:'var(--text)' }}>{full}</strong>.
        Esta accion no se puede deshacer.
      </p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="solid_red" onClick={confirm} disabled={loading}>
          {loading ? <Spinner/> : 'Confirmar eliminacion'}
        </Btn>
      </div>
    </Overlay>
  );
}

/* ── Overlay ──────────────────────────────────────────────────────────────── */
function Overlay({ children, onClose, maxWidth = 520 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(1,4,9,.7)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{
        background:'var(--panel)', border:'1px solid var(--border)',
        borderRadius:14, padding:28, width:'100%', maxWidth,
        boxShadow:'0 24px 60px rgba(0,0,0,.5)', animation:'up .25s ease',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Login ────────────────────────────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [form,    setForm]    = useState({ username:'admin', password:'admin123' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!form.username || !form.password) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      const d = await req('/auth/login', null, {
        method:'POST', body: JSON.stringify({ username: form.username, password: form.password }),
      });
      onLogin(d.data.access_token, d.data.usuario.username);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      width:'100%', minHeight:'100vh',
      display:'grid', placeItems:'center',
      background:'var(--bg)',
      backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(63,185,80,.05) 0%, transparent 60%)',
    }}>
      <div style={{ width:'100%', maxWidth:380, padding:20 }}>
        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:48, height:48, borderRadius:12, margin:'0 auto 14px',
            background:'var(--accent-s)', border:'1px solid rgba(63,185,80,.3)',
            display:'grid', placeItems:'center',
          }}>
            <IconUsers color="var(--accent)" size={22}/>
          </div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:700, marginBottom:4 }}>Sistema Escolar</h1>
          <p style={{ color:'var(--text-2)', fontSize:'.83rem' }}>Ingresa tus credenciales</p>
        </div>

        <div style={{
          background:'var(--panel)', border:'1px solid var(--border)',
          borderRadius:14, padding:'28px 24px', animation:'up .4s ease',
        }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="Usuario">
              <input value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="admin" style={{ fontFamily:'var(--mono)' }}/>
            </Field>
            <Field label="Contrasena">
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && submit()}/>
            </Field>

            {error && (
              <div style={{
                background:'var(--red-s)', border:'1px solid rgba(248,81,73,.3)',
                borderRadius:8, padding:'9px 13px', fontSize:'.81rem', color:'var(--red)',
              }}>{error}</div>
            )}

            <Btn onClick={submit} disabled={loading} full style={{ padding:'11px', justifyContent:'center' }}>
              {loading ? <Spinner/> : 'Ingresar'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ────────────────────────────────────────────────────────────────── */
function IconUsers({ color = 'currentColor', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconPlus({ color = 'currentColor', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconCalendar({ color = 'currentColor', size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}