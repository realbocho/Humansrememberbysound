*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #F4EFE4;
  --cream-light: #FAF7F1;
  --warm-black: #1C1814;
  --warm-gray: #8A8278;
  --warm-gray-light: #C2BBB0;
  --accent: #C8A97A;
  --accent-dark: #9E7345;
  --red: #C94B3A;
  --green: #2E6B4A;
  --navy: #1E3A5F;
  --border: rgba(139,130,120,0.18);
  --shadow: rgba(28,24,20,0.12);
}

html { height: 100%; }

body {
  font-family: 'DM Mono', monospace;
  background: var(--cream);
  color: var(--warm-black);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Grain overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9990;
  opacity: 0.4;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--warm-gray-light); border-radius: 2px; }

/* Utility */
.hidden { display: none !important; }
input[type="file"] { display: none; }

/* ── BUTTONS ── */
.btn-primary {
  background: var(--warm-black);
  color: var(--cream-light);
  border: none;
  padding: 12px 28px;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s, transform 0.1s;
  font-weight: 500;
}
.btn-primary:hover { background: var(--accent-dark); }
.btn-primary:active { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-ghost {
  background: none;
  border: 1px solid var(--border);
  color: var(--warm-gray);
  padding: 10px 20px;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}
.btn-ghost:hover { border-color: var(--warm-black); color: var(--warm-black); }

/* ── INPUT ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--warm-gray);
}
.field input {
  background: var(--cream-light);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 12px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--warm-black);
  outline: none;
  transition: border-color 0.2s;
  letter-spacing: 0.06em;
  width: 100%;
}
.field input:focus { border-color: var(--accent); }
.field input::placeholder { color: var(--warm-gray-light); }

/* ── TOAST ── */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--warm-black);
  color: var(--cream);
  padding: 12px 24px;
  border-radius: 3px;
  font-size: 11px;
  letter-spacing: 0.1em;
  opacity: 0;
  transition: all 0.3s;
  z-index: 9999;
  white-space: nowrap;
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.error { background: var(--red); border-color: transparent; }
