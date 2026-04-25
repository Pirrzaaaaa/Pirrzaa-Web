// ==========================================================================
// 1. CORE SYSTEM & PRELOADER
// ==========================================================================
window.addEventListener('load', () => {
    setTimeout(() => {
        const pl = document.getElementById('preloader');
        if(pl) { pl.style.opacity = '0'; setTimeout(() => pl.style.display = 'none', 500); }
    }, 600);
});

const cursor = document.getElementById('cursor');
const isFinePointer = matchMedia('(pointer: fine)').matches;

if(isFinePointer && cursor) {
    document.addEventListener('mousemove', e => {
        requestAnimationFrame(() => {
            cursor.style.setProperty('--cx', e.clientX + 'px');
            cursor.style.setProperty('--cy', e.clientY + 'px');
        });
    });
    document.querySelectorAll('a, button, input, textarea, .card, .profile-img, .bento-item, .gallery-item, .faq-q, .magnetic').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });
}

const startTime = Date.now();
setInterval(() => {
    const timeEl = document.getElementById('live-time');
    if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const pingEl = document.getElementById('ping-val');
    if(pingEl) pingEl.innerText = Math.floor(Math.random() * 10 + 15) + 'ms';

    const diff = Math.floor((Date.now() - startTime)/1000);
    const h = String(Math.floor(diff/3600)).padStart(2,'0'), m = String(Math.floor((diff%3600)/60)).padStart(2,'0'), s = String(diff%60).padStart(2,'0');
    const upEl = document.getElementById('uptime-val');
    if(upEl) upEl.innerText = `${h}:${m}:${s}`;
}, 1000);

// ==========================================================================
// 2. DOMAIN EXPANSION & TERMINAL LOGIC
// ==========================================================================
const tIn = document.getElementById('t-input'), tBody = document.getElementById('t-body');
const glitchOverlay = document.getElementById('glitch-overlay');
const hTitle = document.getElementById('hero-title'), hSub = document.getElementById('hero-subtitle');
const pStatus = document.getElementById('p-status');

if(tIn && tBody) {
    tIn.addEventListener('keydown', e => {
        if(e.key === 'Enter') {
            const val = tIn.value.trim();
            const cmd = val.toLowerCase();
            if(!val) return;
            
            const line = document.createElement('div'); 
            line.innerHTML = `<span style="color:var(--terminal-green);">></span> ${val}`; 
            tBody.appendChild(line);
            
            const reply = document.createElement('div');
            reply.style.color = "var(--accent-color)"; reply.style.marginBottom = "10px";
            
            switch(cmd) {
                case 'help': reply.innerText = "Cmds: about, skills, anime, clear, sudo ryoiki"; break;
                case 'about': reply.innerText = "Pirrzaaa. SMK TKJ. Node.js WA Bot Developer."; break;
                case 'skills': reply.innerText = "HTML, CSS, JS, Node.js, Firebase, Canva."; break;
                case 'anime': reply.innerText = "Fav: HxH, JJK. NO ROMANCE ALLOWED!"; break;
                case 'clear': tBody.innerHTML = ''; reply.innerText = "Terminal cleared."; break;
                
                case 'ryoiki':
                    reply.style.color = "#ff0033";
                    reply.innerText = "Membuka Domain: Muryoshojo...";
                    triggerDomainExpansion();
                    break;
                    
                default: reply.innerText = `Command '${val}' not found. Type 'help'.`;
            }
            tBody.appendChild(reply); tIn.value = ''; tBody.scrollTop = tBody.scrollHeight;
        }
    });
}

function triggerDomainExpansion() {
    glitchOverlay.classList.add('active');
    document.body.classList.add('domain-expansion');
    if(pStatus) { pStatus.innerText = "DOMAIN_ACTIVE"; pStatus.style.color = "#ff0033"; }
    if(hTitle) hTitle.innerText = "Ryoiki Tenkai.";
    if(hSub) hSub.innerHTML = "Selamat Datang di <span style='color:#ff0033'>Kehampaan Komunal.</span>";

    setTimeout(() => { glitchOverlay.classList.remove('active'); }, 600);
    
    setTimeout(() => {
        document.body.classList.remove('domain-expansion');
        if(pStatus) { pStatus.innerText = "ACTIVE"; pStatus.style.color = "var(--terminal-green)"; }
        if(hTitle) hTitle.innerText = "Halo, Saya Pirrzaaa.";
        if(hSub) hSub.innerHTML = "Karya <span id='dynamic-text'>Logika.</span><span class='typing-cursor'></span>";
    }, 15000);
}

// ==========================================================================
// 3. UI CHAT BOT PLAYGROUND LOGIC
// ==========================================================================
const chatInput = document.getElementById('chat-input');
const chatBody = document.getElementById('chat-body');
const chatSendBtn = document.getElementById('chat-send-btn');

const botResponses = {
    '/menu': '📜 **Daftar Perintah:**\n\n1. **/owner** - Info Pembuat\n2. **/skills** - Tech Stack\n3. **/hobi** - Dunia Pirrzaaa\n4. **/ping** - Cek Respon\n5. **/clear** - Bersihkan Chat',
    '/owner': '👤 **Owner Info:**\n\nNama: Pirrzaaa\nStatus: Siswa SMK TKJ & Developer Otodidak.\nHobi ngoding bot & push rank.',
    '/skills': '🛠️ **Tech Stack:**\n\n- Node.js (Utama buat Bot)\n- HTML/CSS/JS (Web dasar)\n- Firebase (Database)\n- Canva (UI Design)',
    '/hobi': '🎮 **Dunia Pirrzaaa:**\n\n- Game: MLBB, Minecraft\n- Anime: Hunter x Hunter, JJK (Action Only!)\n- Coding: Ngoprek API & Automasi',
    '/ping': '🏓 PONG! Respon bot stabil. (Simulasi JS Local)',
    'halo': 'Hai juga! 👋 Ketik **/menu** buat lihat yang bisa saya lakukan.',
    'p': 'Hadir! Biasakan salam ya bro. Ketik **/menu**.',
    'default': 'Maaf, saya belum paham perintah itu. 😅\nKetik **/menu** untuk bantuan.'
};

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function addMessage(text, sender) {
    const time = getCurrentTime();
    const msgRow = document.createElement('div');
    msgRow.className = `msg-row ${sender}-row`;
    
    const formattedText = text.replace(/\n/g, '<br>');
    const finalHtml = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    msgRow.innerHTML = `
        <div class="msg-bubble">
            ${finalHtml}
            <span class="msg-time">${time}</span>
        </div>
    `;
    
    chatBody.appendChild(msgRow);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function handleChatSend() {
    const msg = chatInput.value.trim();
    if(!msg) return;

    addMessage(msg, 'user');
    chatInput.value = '';

    setTimeout(() => {
        const cmd = msg.toLowerCase();
        let response = botResponses[cmd] || botResponses['default'];
        
        if(cmd === '/clear') {
            chatBody.innerHTML = '';
            response = 'Chat dibersihkan! ✨ Ketik **/menu** lagi.';
        }

        addMessage(response, 'bot');
    }, 800);
}

if(chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keydown', e => { if(e.key === 'Enter') handleChatSend(); });
}

// ==========================================================================
// 4. UI COMPONENTS (MUSIC, MATRIX, THEME, SCROLL)
// ==========================================================================

const matrixGrid = document.getElementById('matrix-grid');
if(matrixGrid) {
    for(let i=0; i<75; i++) {
        const box = document.createElement('div');
        const rand = Math.random();
        let level = 0;
        if(rand > 0.85) level = 4;
        else if(rand > 0.7) level = 3;
        else if(rand > 0.5) level = 2;
        else if(rand > 0.3) level = 1;
        box.className = `matrix-box lvl-${level}`;
        matrixGrid.appendChild(box);
    }
}

const aud = document.getElementById('bg-audio'), pBtn = document.getElementById('play-btn'), pIcon = document.getElementById('play-icon'), eq = document.getElementById('equalizer');
let isP = false; if(aud) aud.volume = 0.2; 
if(pBtn) {
    pBtn.addEventListener('click', () => {
        if(isP) { aud.pause(); pIcon.classList.replace('ph-pause-circle','ph-play-circle'); eq.classList.remove('playing'); }
        else { aud.play().catch(() => {}); pIcon.classList.replace('ph-play-circle','ph-pause-circle'); eq.classList.add('playing'); }
        isP = !isP;
        pBtn.setAttribute('aria-pressed', String(isP));
    });
}

let ticking = false;
const nav = document.getElementById('navbar'), btt = document.getElementById('backToTop'), prog = document.getElementById('progress-bar');
const statsCard = document.getElementById('stats-card');
let statsDone = false;

window.addEventListener('scroll', () => {
    if(!ticking) {
        requestAnimationFrame(() => {
            const y = window.scrollY;
            if(nav) nav.classList.toggle('nav-hidden', y > 80);
            if(btt) btt.classList.toggle('visible', y > 500);
            if(prog) prog.style.width = (y / (document.documentElement.scrollHeight - window.innerHeight)) * 100 + "%";
            
            if(statsCard && !statsDone) {
                const rect = statsCard.getBoundingClientRect();
                if(rect.top < window.innerHeight * 0.85) {
                    document.querySelectorAll('.stat-fill').forEach(bar => { bar.style.width = bar.getAttribute('data-width'); });
                    statsDone = true;
                }
            }
            ticking = false;
        });
        ticking = true;
    }
});
if(btt) btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const tToggle = document.getElementById('theme-toggle');
if(tToggle) {
    tToggle.addEventListener('click', () => {
        if(document.body.classList.contains('domain-expansion')) return;
        const html = document.documentElement, icon = document.getElementById('theme-icon');
        if(html.getAttribute('data-theme') === 'dark') { html.setAttribute('data-theme', 'light'); icon.classList.replace('ph-sun', 'ph-moon'); }
        else { html.setAttribute('data-theme', 'dark'); icon.classList.replace('ph-moon', 'ph-sun'); }
    });
}

const words = ["Logika.", "Kreatif.", "Otodidak.", "Gamer."];
let wI = 0, cJ = 0, isDel = false;
const dynamicText = document.getElementById("dynamic-text");
function type() {
    if(document.body.classList.contains('domain-expansion')) return;
    if(dynamicText) {
        dynamicText.innerText = words[wI].substring(0, cJ);
        if (!isDel && cJ <= words[wI].length) { cJ++; setTimeout(type, 150); }
        else if (isDel && cJ >= 0) { cJ--; setTimeout(type, 80); }
        else if (cJ == words[wI].length + 1) { isDel = true; setTimeout(type, 2000); }
        else if (cJ == -1) { isDel = false; wI = (wI + 1) % words.length; setTimeout(type, 500); }
    }
}
setTimeout(type, 1500);

if(isFinePointer) {
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            requestAnimationFrame(() => {
                const pos = btn.getBoundingClientRect();
                const x = e.clientX - pos.left - pos.width / 2;
                const y = e.clientY - pos.top - pos.height / 2;
                btn.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0) scale(1.02)`;
            });
        });
        btn.addEventListener('mouseleave', () => btn.style.transform = `translate3d(0px, 0px, 0) scale(1)`);
    });

    document.querySelectorAll('.card, .bento-item').forEach(el => {
        el.addEventListener('mousemove', e => {
            requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                el.style.setProperty('--x', (e.clientX - rect.left) + 'px');
                el.style.setProperty('--y', (e.clientY - rect.top) + 'px');
            });
        });
    });
}

document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.parentElement;
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== parent) {
                item.classList.remove('active');
                const q = item.querySelector('.faq-q');
                if (q) q.setAttribute('aria-expanded', 'false');
            }
        });
        const isOpen = parent.classList.toggle('active');
        btn.setAttribute('aria-expanded', String(isOpen));
    });
});

const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            entry.target.classList.add('appear');
            observer.unobserve(entry.target); 
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
document.querySelectorAll('.fade-element').forEach(el => obs.observe(el));

// ==========================================================================
// 5. MODAL (project / gallery)
// ==========================================================================
const modal = document.getElementById('project-modal');
const modalTitleEl = document.getElementById('modal-title');
const modalImgEl = document.getElementById('modal-img');
const modalDescEl = document.getElementById('modal-desc');
const modalCloseBtn = document.getElementById('modal-close-btn');
let lastFocusedEl = null;

function openModal(t, i, d) {
    if(!modal) return;
    lastFocusedEl = document.activeElement;
    if(modalTitleEl) modalTitleEl.innerText = t;
    if(modalImgEl) { modalImgEl.src = i; modalImgEl.alt = t; }
    if(modalDescEl) modalDescEl.innerText = d;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if(modalCloseBtn) modalCloseBtn.focus();
}
function closeModal() {
    if(!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

if(modal) modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal();
});

// Wire up triggers from data-* attributes (replaces inline onclick handlers)
document.querySelectorAll('[data-modal-title]').forEach(el => {
    el.addEventListener('click', () => {
        openModal(
            el.getAttribute('data-modal-title') || '',
            el.getAttribute('data-modal-img') || '',
            el.getAttribute('data-modal-desc') || ''
        );
    });
});

// Expose globally biar tetap kompatibel kalau ada handler inline lama
window.openModal = openModal;
window.closeModal = closeModal;

