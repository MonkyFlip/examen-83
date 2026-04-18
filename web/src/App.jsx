import { useState, useEffect, useCallback } from 'react';

const API = 'http://18.191.166.111/api'; //http://18.191.166.111:5000/api

/* ── Global styles ─────────────────────────────────────────────────────────── */
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #f8fafc;
    --surface:  #ffffff;
    --card:     #ffffff;
    --border:   #e2e8f0;
    --border2:  #cbd5e1;
    --accent:   #2563eb;
    --accent-h: #1d4ed8;
    --accent-s: #eff6ff;
    --danger:   #dc2626;
    --danger-s: #fef2f2;
    --warn:     #d97706;
    --warn-s:   #fffbeb;
    --success:  #16a34a;
    --success-s:#f0fdf4;
    --text:     #0f172a;
    --text-2:   #475569;
    --text-3:   #94a3b8;
    --font:     'Plus Jakarta Sans', sans-serif;
    --radius:   10px;
    --shadow:   0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
    --shadow-lg:0 10px 25px rgba(0,0,0,.1), 0 4px 10px rgba(0,0,0,.05);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
  }

  input, select, button { font-family: var(--font); }

  input, select {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 9px 13px;
    font-size: .875rem;
    color: var(--text);
    background: var(--surface);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }

  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,.1);
  }

  input::placeholder { color: var(--text-3); }

  label {
    display: block;
    font-size: .78rem;
    font-weight: 600;
    color: var(--text-2);
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* Animations */
  @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes slide   { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:none; } }
  @keyframes spin    { to { transform: rotate(360deg); } }
`;

/* ── Shared components ─────────────────────────────────────────────────────── */
const Spinner = ({ size = 16 }) => (
  <span style={{
    display: 'inline-block',
    width: size, height: size,
    border: `2px solid rgba(255,255,255,.3)`,
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin .6s linear infinite',
  }}/>
);

const SpinnerDark = ({ size = 16 }) => (
  <span style={{
    display: 'inline-block',
    width: size, height: size,
    border: `2px solid var(--border)`,
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin .6s linear infinite',
  }}/>
);

function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, style = {} }) {
  const pad = size === 'sm' ? '6px 12px' : '9px 18px';
  const fs  = size === 'sm' ? '.8rem' : '.875rem';

  const variants = {
    primary: { background: 'var(--accent)',   color: '#fff',            border: '1px solid var(--accent)' },
    ghost:   { background: 'transparent',      color: 'var(--text)',     border: '1px solid var(--border)' },
    danger:  { background: 'var(--danger-s)',  color: 'var(--danger)',   border: '1px solid #fca5a5' },
    warn:    { background: 'var(--warn-s)',     color: 'var(--warn)',     border: '1px solid #fcd34d' },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: pad, fontSize: fs, fontWeight: 500,
        borderRadius: 'var(--radius)', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .15s', whiteSpace: 'nowrap',
        opacity: disabled ? .6 : 1,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Avatar({ name, ap }) {
  const initials = `${name?.[0] || ''}${ap?.[0] || ''}`.toUpperCase();
  const colors = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626'];
  const color  = colors[(initials.charCodeAt(0) + initials.charCodeAt(1)) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'grid', placeItems: 'center',
      fontSize: '.75rem', fontWeight: 700,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── API helper ────────────────────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [token,    setToken]    = useState(() => localStorage.getItem('jwt') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('usr') || '');
  const [toasts,   setToasts]   = useState([]);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const login = (tok, user) => {
    localStorage.setItem('jwt', tok);
    localStorage.setItem('usr', user);
    setToken(tok);
    setUsername(user);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('usr');
    setToken('');
    setUsername('');
  };

  return (
    <>
      <style>{css}</style>

      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--accent)', display: 'grid', placeItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '.95rem', letterSpacing: '-.01em' }}>
            Gestion de Alumnos
          </span>
        </div>

        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>
              {username}
            </span>
            <Btn variant="ghost" size="sm" onClick={logout}>Cerrar sesion</Btn>
          </div>
        )}
      </header>

      {/* Main */}
      {token
        ? <Dashboard token={token} addToast={addToast} />
        : <LoginPage onLogin={login} addToast={addToast} />
      }

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderLeft: `4px solid ${t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--danger)' : 'var(--accent)'}`,
            borderRadius: 'var(--radius)', padding: '12px 16px',
            fontSize: '.85rem', maxWidth: 300, boxShadow: 'var(--shadow-lg)',
            animation: 'slide .3s ease',
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin, addToast }) {
  const [form,    setForm]    = useState({ username: 'admin', password: 'admin123' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    if (!form.username || !form.password) { setError('Completa todos los campos.'); return; }
    setLoading(true); setError('');
    try {
      const data = await req('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      onLogin(data.data.access_token, data.data.usuario.username);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 400,
        boxShadow: 'var(--shadow-lg)', animation: 'fadeIn .4s ease',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 4 }}>Iniciar sesion</h2>
        <p style={{ color: 'var(--text-2)', fontSize: '.875rem', marginBottom: 28 }}>
          Ingresa tus credenciales para continuar
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Usuario">
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="admin"
            />
          </Field>
          <Field label="Contrasena">
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </Field>

          {error && (
            <div style={{
              background: 'var(--danger-s)', border: '1px solid #fca5a5',
              borderRadius: 8, padding: '10px 14px',
              fontSize: '.82rem', color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <Btn onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {loading ? <Spinner /> : 'Entrar'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
function Dashboard({ token, addToast }) {
  const [alumnos,  setAlumnos]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);  // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState({ inicio: '', fin: '' });
  const [filtered, setFiltered] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await req('/alumnos/', token);
      setAlumnos(data.data || []);
      setFiltered(null);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => { load(); }, [load]);

  const source = filtered ?? alumnos;
  const visible = source.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.nombre_completo || `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno}`).toLowerCase().includes(q) ||
      a.matricula.toLowerCase().includes(q) ||
      a.correo.toLowerCase().includes(q)
    );
  });

  const applyFilter = async () => {
    if (!filter.inicio || !filter.fin) { addToast('Selecciona ambas fechas', 'error'); return; }
    try {
      const data = await req(`/alumnos/rango-fecha?fecha_inicio=${filter.inicio}&fecha_fin=${filter.fin}`, token);
      setFiltered(data.data || []);
      addToast(`${(data.data || []).length} resultado(s) encontrados`, 'success');
    } catch (e) { addToast(e.message, 'error'); }
  };

  const clearFilter = () => {
    setFilter({ inicio: '', fin: '' });
    setFiltered(null);
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total de alumnos', value: alumnos.length },
          { label: 'Resultados de busqueda', value: filtered !== null ? filtered.length : '—' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 22px', boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '18px 22px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <Field label="Fecha inicio">
            <input type="date" value={filter.inicio}
              onChange={e => setFilter(f => ({ ...f, inicio: e.target.value }))}/>
          </Field>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <Field label="Fecha fin">
            <input type="date" value={filter.fin}
              onChange={e => setFilter(f => ({ ...f, fin: e.target.value }))}/>
          </Field>
        </div>
        <Btn onClick={applyFilter}>Filtrar</Btn>
        {filtered !== null && <Btn variant="ghost" onClick={clearFilter}>Limpiar</Btn>}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, matricula o correo..."
          style={{ maxWidth: 300 }}
        />
        <div style={{ flex: 1 }}/>
        <Btn onClick={() => { setSelected(null); setModal('create'); }}>
          + Nuevo alumno
        </Btn>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
              {['Alumno','Matricula','Correo','Fecha de alta','Acciones'].map((h, i) => (
                <th key={i} style={{
                  padding: '12px 18px', textAlign: i === 4 ? 'right' : 'left',
                  fontSize: '.73rem', fontWeight: 600, color: 'var(--text-2)',
                  textTransform: 'uppercase', letterSpacing: '.06em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                <SpinnerDark size={24}/>
              </td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: '.875rem' }}>
                No se encontraron alumnos
              </td></tr>
            ) : visible.map((a, i) => {
              const full = a.nombre_completo || `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno}`;
              const date = a.fecha_alta?.split(' ')[0] || '—';
              return (
                <tr key={a.id} style={{
                  borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.nombre} ap={a.apellido_paterno}/>
                      <span style={{ fontWeight: 500 }}>{full}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{
                      background: 'var(--accent-s)', color: 'var(--accent)',
                      border: '1px solid #bfdbfe', borderRadius: 20,
                      padding: '3px 10px', fontSize: '.76rem', fontWeight: 600,
                    }}>
                      {a.matricula}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', color: 'var(--text-2)', fontSize: '.83rem' }}>{a.correo}</td>
                  <td style={{ padding: '13px 18px', color: 'var(--text-3)', fontSize: '.83rem' }}>{date}</td>
                  <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Btn variant="warn" size="sm" onClick={() => { setSelected(a); setModal('edit'); }}>
                        Editar
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => { setSelected(a); setModal('delete'); }}>
                        Eliminar
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <AlumnoModal
          token={token}
          alumno={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); addToast(modal === 'edit' ? 'Alumno actualizado' : 'Alumno creado', 'success'); }}
          onError={msg => addToast(msg, 'error')}
        />
      )}

      {modal === 'delete' && (
        <DeleteModal
          token={token}
          alumno={selected}
          onClose={() => setModal(null)}
          onDeleted={() => { setModal(null); load(); addToast('Alumno eliminado', 'success'); }}
          onError={msg => addToast(msg, 'error')}
        />
      )}
    </main>
  );
}

/* ── Alumno Modal (create / edit) ─────────────────────────────────────────── */
function AlumnoModal({ token, alumno, onClose, onSaved, onError }) {
  const editing = !!alumno;
  const [form, setForm] = useState({
    nombre:           alumno?.nombre           || '',
    apellido_paterno: alumno?.apellido_paterno || '',
    apellido_materno: alumno?.apellido_materno || '',
    matricula:        alumno?.matricula        || '',
    correo:           alumno?.correo           || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const required = ['nombre','apellido_paterno','apellido_materno','matricula','correo'];
    for (const f of required) {
      if (!form[f].trim()) { setError(`El campo "${f.replace('_',' ')}" es obligatorio.`); return; }
    }
    setLoading(true); setError('');
    try {
      if (editing) {
        await req(`/alumnos/${alumno.id}`, token, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await req('/alumnos/', token, { method: 'POST', body: JSON.stringify(form) });
      }
      onSaved();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>{editing ? 'Editar alumno' : 'Nuevo alumno'}</h3>
        <p style={{ color: 'var(--text-2)', fontSize: '.84rem', marginTop: 4 }}>
          {editing ? `Matricula: ${alumno.matricula}` : 'Completa los datos del alumno'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Nombre *"><input value={form.nombre} onChange={set('nombre')} placeholder="Juan"/></Field>
        <Field label="Apellido paterno *"><input value={form.apellido_paterno} onChange={set('apellido_paterno')} placeholder="Garcia"/></Field>
        <Field label="Apellido materno *"><input value={form.apellido_materno} onChange={set('apellido_materno')} placeholder="Lopez"/></Field>
        <Field label="Matricula *">
          <input value={form.matricula} onChange={set('matricula')} placeholder="A12345" disabled={editing}
            style={editing ? { background: '#f1f5f9', color: 'var(--text-3)' } : {}}/>
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Correo *"><input type="email" value={form.correo} onChange={set('correo')} placeholder="juan@escuela.mx"/></Field>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-s)', border: '1px solid #fca5a5',
          borderRadius: 8, padding: '10px 14px', fontSize: '.82rem',
          color: 'var(--danger)', marginTop: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={submit} disabled={loading}>
          {loading ? <Spinner/> : editing ? 'Actualizar' : 'Guardar'}
        </Btn>
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
      await req(`/alumnos/${alumno.id}`, token, { method: 'DELETE' });
      onDeleted();
    } catch (e) {
      onError(e.message);
      setLoading(false);
    }
  };

  return (
    <Overlay onClose={onClose} maxWidth={420}>
      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Eliminar alumno</h3>
      <p style={{ color: 'var(--text-2)', fontSize: '.875rem', lineHeight: 1.6 }}>
        Estas a punto de eliminar a <strong>{full}</strong> (matricula: {alumno.matricula}).
        Esta accion no se puede deshacer.
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="danger" onClick={confirm} disabled={loading}
          style={{ background: 'var(--danger)', color: '#fff', border: '1px solid var(--danger)' }}>
          {loading ? <Spinner/> : 'Eliminar'}
        </Btn>
      </div>
    </Overlay>
  );
}

/* ── Overlay wrapper ──────────────────────────────────────────────────────── */
function Overlay({ children, onClose, maxWidth = 560 }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 32, width: '100%', maxWidth,
        boxShadow: 'var(--shadow-lg)', animation: 'fadeIn .25s ease',
      }}>
        {children}
      </div>
    </div>
  );
}
