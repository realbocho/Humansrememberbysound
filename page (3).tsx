.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 28px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--cream);
  z-index: 100;
  backdrop-filter: blur(8px);
}

.brand { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--warm-gray); }
.wordmark {
  font-family: 'Instrument Serif', serif;
  font-size: 22px;
  font-style: italic;
  color: var(--warm-black);
  line-height: 1;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 16px;
}

.userEmail {
  font-size: 10px;
  color: var(--warm-gray);
  letter-spacing: 0.08em;
}

.logoutBtn {
  background: none;
  border: none;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--warm-gray);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 0;
}

.main {
  flex: 1;
  padding: 48px;
}

.sectionLabel {
  font-size: 9px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--warm-gray);
  margin-bottom: 36px;
}

.roomGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 32px;
}

.roomCard {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roomCard:hover { transform: translateY(-8px); }
.roomCard:hover .roomDisc { box-shadow: 0 20px 48px rgba(0,0,0,0.3); }

.roomDisc {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--color) 80%, #000) 0%, color-mix(in srgb, var(--color) 40%, #000) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  transition: box-shadow 0.3s;
}

.roomDiscGrooves {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at 50% 50%,
    transparent 0px, transparent 5px,
    rgba(255,255,255,0.04) 5px, rgba(255,255,255,0.04) 6px
  );
}

.roomDiscLabel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  z-index: 2;
}

.roomDiscName {
  font-family: 'DM Mono', monospace;
  font-size: 6px;
  color: rgba(255,255,255,0.9);
  text-align: center;
  padding: 0 6px;
  line-height: 1.4;
  letter-spacing: 0.06em;
  max-width: 66px;
  overflow: hidden;
}

.roomDiscCode {
  font-size: 7px;
  font-weight: 500;
  color: var(--accent);
  letter-spacing: 0.15em;
  font-family: 'DM Mono', monospace;
}

.roomDiscSpindle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3A3530;
  z-index: 3;
}

.roomInfo { padding: 0 4px; }
.roomName { font-size: 13px; font-weight: 500; color: var(--warm-black); letter-spacing: 0.04em; }
.roomCode { font-size: 10px; color: var(--warm-gray); letter-spacing: 0.12em; margin-top: 3px; }
.roomDate { font-size: 10px; color: var(--warm-gray-light); letter-spacing: 0.06em; margin-top: 1px; }

/* Empty */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: 8px;
}
.emptyIcon { font-size: 48px; margin-bottom: 12px; opacity: 0.3; }
.emptyTitle {
  font-family: 'Instrument Serif', serif;
  font-size: 22px;
  font-style: italic;
  color: var(--warm-gray);
}
.emptySub { font-size: 11px; color: var(--warm-gray-light); letter-spacing: 0.1em; margin-top: 4px; }

/* Modal */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(28,24,20,0.6);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modalBox {
  background: var(--cream-light);
  border-radius: 4px;
  padding: 40px;
  width: 380px;
  position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,0.2);
}

.modalTitle {
  font-family: 'Instrument Serif', serif;
  font-size: 20px;
  font-style: italic;
  color: var(--warm-black);
  margin-bottom: 28px;
}

.modalFields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modalClose {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 14px;
  color: var(--warm-gray);
  cursor: pointer;
  padding: 4px;
}

@media (max-width: 640px) {
  .header { padding: 20px 20px; }
  .headerRight { gap: 8px; }
  .userEmail { display: none; }
  .main { padding: 28px 20px; }
  .roomGrid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
  .roomDisc { width: 140px; height: 140px; }
}
