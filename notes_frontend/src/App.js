import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Minimal Notes app with:
 * - Sign In screen inspired by provided Figma styling tokens
 * - Responsive layout: header + content
 * - Notes CRUD (create, edit, delete)
 * - Search with debounced filter
 * - LocalStorage persistence
 * 
 * Colors theme:
 *   primary: #1976d2, secondary: #424242, accent: #ffca28
 * Style: modern, minimalistic.
 */

// Utils
const STORAGE_KEYS = {
  notes: 'notes_app_notes',
  theme: 'notes_app_theme',
  session: 'notes_app_session'
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);
  return [state, setState];
}

function useDebouncedValue(value, delay = 250) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

// Components

// PUBLIC_INTERFACE
function App() {
  /** Session (very lightweight faux auth) */
  const [session, setSession] = useLocalStorage(STORAGE_KEYS.session, null);

  /** Theme */
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /** Notes state */
  const [notes, setNotes] = useLocalStorage(STORAGE_KEYS.notes, []);
  const [query, setQuery] = useState('');
  const debQuery = useDebouncedValue(query, 200);

  /** UI state */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const filteredNotes = useMemo(() => {
    if (!debQuery.trim()) return notes;
    const q = debQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, debQuery]);

  function handleCreate() {
    setEditingNote({ id: null, title: '', content: '' });
    setEditorOpen(true);
  }

  function handleEdit(note) {
    setEditingNote(note);
    setEditorOpen(true);
  }

  function handleDelete(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  function handleSave(noteDraft) {
    if (!noteDraft.title.trim() && !noteDraft.content.trim()) {
      setEditorOpen(false);
      setEditingNote(null);
      return;
    }
    if (noteDraft.id) {
      setNotes(prev => prev.map(n => (n.id === noteDraft.id ? { ...n, ...noteDraft } : n)));
    } else {
      setNotes(prev => [{ ...noteDraft, id: uid(), createdAt: Date.now() }, ...prev]);
    }
    setEditorOpen(false);
    setEditingNote(null);
  }

  function handleSignOut() {
    setSession(null);
  }

  if (!session) {
    return (
      <div className="app-root">
        <SignIn
          onSubmit={(payload) => {
            // lightweight validation
            if (!payload.email || !payload.password) return;
            setSession({ email: payload.email, signedInAt: Date.now() });
          }}
          theme={theme}
          onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
        />
      </div>
    );
  }

  return (
    <div className="app-root">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
        onSignOut={handleSignOut}
      />
      <MainLayout>
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          onCreate={handleCreate}
        />
        <NotesGrid
          notes={filteredNotes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </MainLayout>
      {editorOpen && (
        <NoteEditor
          initialNote={editingNote}
          onCancel={() => {
            setEditorOpen(false);
            setEditingNote(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function Header({ theme, onToggleTheme, onSignOut }) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" />
        <span className="brand-name">Notely</span>
      </div>
      <div className="header-actions">
        <button className="btn ghost" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="btn danger" onClick={onSignOut} aria-label="Sign out">Sign Out</button>
      </div>
    </header>
  );
}

function MainLayout({ children }) {
  return (
    <div className="main">
      {children}
    </div>
  );
}

function Toolbar({ query, onQueryChange, onCreate }) {
  return (
    <div className="toolbar">
      <div className="search">
        <span aria-hidden="true">🔎</span>
        <input
          className="input"
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search notes"
        />
      </div>
      <button className="btn primary" onClick={onCreate} aria-label="Create note">
        + New Note
      </button>
    </div>
  );
}

function NotesGrid({ notes, onEdit, onDelete }) {
  if (!notes.length) {
    return (
      <div className="empty-state">
        <p>No notes found.</p>
        <p className="hint">Create your first note or adjust your search.</p>
      </div>
    );
  }
  return (
    <div className="grid">
      {notes.map(note => (
        <NoteCard key={note.id} note={note} onEdit={() => onEdit(note)} onDelete={() => onDelete(note.id)} />
      ))}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }) {
  return (
    <article className="card" role="article">
      <div className="card-head">
        <h3 className="card-title">{note.title || 'Untitled'}</h3>
        <div className="card-actions">
          <button className="icon-btn" onClick={onEdit} aria-label="Edit note">✏️</button>
          <button className="icon-btn" onClick={onDelete} aria-label="Delete note">🗑️</button>
        </div>
      </div>
      <p className="card-content">{note.content}</p>
    </article>
  );
}

function NoteEditor({ initialNote, onCancel, onSave }) {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');

  function submit(e) {
    e.preventDefault();
    onSave({ id: initialNote?.id || null, title: title.trim(), content: content.trim() });
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Note editor">
      <div className="modal">
        <form onSubmit={submit} className="editor-form">
          <h2 className="modal-title">{initialNote?.id ? 'Edit Note' : 'New Note'}</h2>
          <label className="form-label" htmlFor="note-title">Title</label>
          <input
            id="note-title"
            className="input"
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="form-label" htmlFor="note-content">Content</label>
          <textarea
            id="note-content"
            className="input textarea"
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Sign In component styled based on Figma tokens from assets/common.css and sign-in-11-235.css
 * The layout is adapted to React with accessible labels.
 */
function SignIn({ onSubmit, theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invalid, setInvalid] = useState(false);

  function submit() {
    const payload = { email: email.trim(), password };
    if (!payload.email || !payload.password) {
      setInvalid(true);
      setTimeout(() => setInvalid(false), 400);
      return;
    }
    onSubmit(payload);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      submit();
    }
  }

  return (
    <main className="sign-in-root" role="main">
      <div className="signin-card">
        <div className="signin-header">
          <div className="statusbar" aria-hidden="true">
            <div />
            <div className="statusbar-time">19:27</div>
            <div className="signin-tools">
              <button className="btn ghost" onClick={onToggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          <section className="title-group" aria-labelledby="greeting" aria-describedby="subtitle">
            <h1 id="greeting" className="typo-60 title-hello">Hello,</h1>
            <p id="subtitle" className="typo-61 title-welcome">Welcome Back!</p>
          </section>
        </div>

        <section className="input-field" data-field="email">
          <label className="input-label" htmlFor="email-input">Email</label>
          <div className="input-surface">
            <input
              id="email-input"
              name="email"
              type="email"
              placeholder="Enter Email"
              className="input-placeholder-field"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </section>

        <section className="input-field" data-field="password">
          <label className="input-label" htmlFor="password-input">Enter Password</label>
          <div className="input-surface">
            <input
              id="password-input"
              name="password"
              type="password"
              placeholder="Enter Password"
              className="input-placeholder-field"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </section>

        <p className="forgot-password typo-62">
          <a href="#" className="forgot-link" aria-label="Forgot Password?">Forgot Password?</a>
        </p>

        <button
          className={`btn-primary big-button ${invalid ? 'shake' : ''}`}
          id="primary-signin"
          type="button"
          aria-label="Sign In"
          onClick={submit}
        >
          <span className="typo-58">Sign In</span>
          <span className="arrow-right" aria-hidden="true"></span>
        </button>

        <div className="divider or-with" role="separator" aria-label="Or Sign in With">
          <span className="divider-line"></span>
          <span className="divider-label">Or Sign in With</span>
          <span className="divider-line"></span>
        </div>

        <div className="social-row" role="group" aria-label="Social sign in options">
          <button
            className="social-btn social-google"
            type="button"
            aria-label="Continue with Google"
            title="Continue with Google"
            onClick={() => alert('Social sign-in not implemented')}
          >
            <span className="google-icon"></span>
          </button>
          <button
            className="social-btn social-facebook"
            type="button"
            aria-label="Continue with Facebook"
            title="Continue with Facebook"
            onClick={() => alert('Social sign-in not implemented')}
          >
            <span className="facebook-icon"></span>
          </button>
        </div>

        <p className="signup-text typo-63">
          Don’t have an account? <a href="#" className="signup-link" aria-label="Sign up">Sign up</a>
        </p>

        <div className="home-indicator" aria-hidden="true">
          <div className="home-indicator-line"></div>
        </div>
      </div>
    </main>
  );
}

export default App;
