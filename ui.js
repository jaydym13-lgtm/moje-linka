// =========================================================================
// 🎨 UI KNIHOVNA
// =========================================================================

// --- PWA INSTALACE ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    let installBtn = document.getElementById('btnInstallPwa');
    if(installBtn) installBtn.style.display = 'flex';
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') document.getElementById('btnInstallPwa').style.display = 'none';
            deferredPrompt = null;
        });
    }
}

// --- UŽIVATELSKÉ NASTAVENÍ ---
let autoCenterEnabled = localStorage.getItem('autoCenter') !== 'false'; 
let darkModeEnabled = localStorage.getItem('darkMode') === 'true';

function toggleAutoCenter() {
    autoCenterEnabled = !autoCenterEnabled;
    localStorage.setItem('autoCenter', autoCenterEnabled ? 'true' : 'false');
    let btn = document.getElementById('autoCenterStatus');
    if (btn) { btn.innerText = autoCenterEnabled ? 'ZAPNUTO' : 'VYPNUTO'; btn.style.background = autoCenterEnabled ? '#2563eb' : '#64748b'; }
    showToast(autoCenterEnabled ? "Centrování ZAPNUTO" : "Centrování VYPNUTO");
}

function toggleDarkMode() {
    darkModeEnabled = !darkModeEnabled;
    localStorage.setItem('darkMode', darkModeEnabled ? 'true' : 'false');
    applyDarkMode();
    showToast(darkModeEnabled ? "Tmavý režim ZAPNUTO" : "Tmavý režim VYPNUTO");
}

function applyDarkMode() {
    let btn = document.getElementById('darkModeStatus');
    if (btn) { btn.innerText = darkModeEnabled ? 'ZAPNUTO' : 'VYPNUTO'; btn.style.background = darkModeEnabled ? '#2563eb' : '#64748b'; }
    if (darkModeEnabled) document.body.classList.add('dark-mode'); else document.body.classList.remove('dark-mode');
}

document.addEventListener("DOMContentLoaded", () => {
    let btn = document.getElementById('autoCenterStatus');
    if (btn) { btn.innerText = autoCenterEnabled ? 'ZAPNUTO' : 'VYPNUTO'; btn.style.background = autoCenterEnabled ? '#2563eb' : '#64748b'; }
    applyDarkMode();

    const togglePassword = document.getElementById('togglePassword'); const password = document.getElementById('password');
    if(togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type); this.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
});

// --- GLOBÁLNÍ ROZBALENÍ ↕️ ---
window.isGlobalExpanding = false;
function toggleGlobalExpand(forceExpand = null) {
    let isCompare = false;
    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        isCompare = Alpine.store('appState').compareMode !== 'ne';
    }
    let containerId = isCompare ? 'compareContainer' : 'dynamicProductsContainer';
    let container = document.getElementById(containerId);
    let group = container ? container.querySelector('.product-group') : null;
    if (!group) return;
    
    let details = group.querySelectorAll('details.machine'); 
    let isExpanded = forceExpand !== null ? !forceExpand : group.classList.contains('is-fully-expanded');
    window.isGlobalExpanding = true;

    if (isExpanded) {
        details.forEach(d => d.removeAttribute('open')); group.classList.remove('is-fully-expanded');
        group.querySelectorAll('.baleni-inner-content').forEach(tab => { tab.style.display = ''; });
        group.querySelectorAll('.tab-bar').forEach(bar => { bar.style.display = ''; });
        if(typeof scrollToTop === 'function') scrollToTop();
    } else {
        details.forEach(d => { if(!d.classList.contains('no-change')) d.setAttribute('open', ''); }); group.classList.add('is-fully-expanded');
        group.querySelectorAll('.baleni-inner-content').forEach(tab => { tab.style.display = 'block'; });
        group.querySelectorAll('.tab-bar').forEach(bar => { bar.style.display = 'none'; });
    }
    requestAnimationFrame(() => { window.isGlobalExpanding = false; });
}

// --- WAKE LOCK (ŽÁROVKA) ---
let wakeLock = null; let wakeLockTimeout = null; let wakeLockWarningTimeout = null;
async function toggleWakeLock(silent = false) {
  const btns = document.querySelectorAll('.light-btn');
  if (wakeLock !== null) {
    wakeLock.release().then(() => { wakeLock = null; }); 
    clearTimeout(wakeLockTimeout);
    clearTimeout(wakeLockWarningTimeout);
    btns.forEach(btn => btn.classList.remove('wakelock-active')); 
    if (!silent) showToast("Automatické zhasínání displeje obnoveno.");
  } else {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      btns.forEach(btn => btn.classList.add('wakelock-active')); 
      if (!silent) showToast("Displej NEZHASNE (20 minut)"); 

      // VAROVÁNÍ PŘESNĚ 6 VTEŘIN PŘED KONCEM
      wakeLockWarningTimeout = setTimeout(() => {
        if (wakeLock !== null && !silent) showToast("⚠️ Pozor, žárovka za 6 vteřin zhasne!");
      }, (20 * 60 * 1000) - 6000);

      wakeLockTimeout = setTimeout(() => {
        if (wakeLock !== null) { wakeLock.release(); wakeLock = null; btns.forEach(btn => btn.classList.remove('wakelock-active')); }
      }, 20 * 60 * 1000);

      wakeLock.addEventListener('release', () => { wakeLock = null; btns.forEach(btn => btn.classList.remove('wakelock-active')); });
    } catch (err) { if (!silent) showToast("Tvůj prohlížeč funkci nepodporuje."); }
  }
}

document.addEventListener('visibilitychange', async () => { if (wakeLock !== null && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen'); });

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.data-screen').forEach(screen => { 
        if (screen.style.display !== 'none') {
            screen.scrollTo({ top: 0, behavior: 'smooth' });
        } 
    });
}

// --- SJEDNOCENÉ CENTROVÁNÍ ---
function scrollToTargetExact(targetElement) {
    if (!autoCenterEnabled || window.isGlobalExpanding || !targetElement) return; 
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            let scrollContainer = targetElement.closest('.data-screen') || targetElement.closest('.app-container');
            
            if (scrollContainer) {
                let offset = 75; 
                let currentScroll = scrollContainer.scrollTop; 
                let elementTop = targetElement.getBoundingClientRect().top; 
                let containerTop = scrollContainer.getBoundingClientRect().top; 
                
                let targetPos = currentScroll + (elementTop - containerTop) - offset;
                
                scrollContainer.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });
            } else {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function handleToggle(el) {
    if (!autoCenterEnabled || window.isGlobalExpanding) return;
    if (el.classList.contains('no-change')) return; 
    
    const container = el.closest('.product-group') || el.closest('.wizard-modal') || el.closest('#wizVyrobaScope') || el.closest('#wizBaleniScope');
    if (container && container.classList.contains('is-fully-expanded')) return;

    if (el.open) {
        if (container) { container.querySelectorAll('details.machine').forEach(d => { if (d !== el && d.hasAttribute('open')) d.removeAttribute('open'); }); }
        scrollToTargetExact(el);
    } else {
        const singleContainer = el.closest('.product-group') || el.closest('.wizard-modal');
        if (singleContainer && !singleContainer.querySelector('details.machine[open]')) scrollToTop();
    }
}

// =========================================================================
// 📸 MAGIE PRO FOTKY
// =========================================================================
window.closeAllPhotos = function() {
    document.querySelectorAll('.foto-preview-wrapper').forEach(el => {
        el.style.display = 'none';
    });
};

function toggleFoto(id) {
    if (typeof Alpine !== 'undefined' && Alpine.store('appState').isEditMode) return; 
    let e = document.getElementById(id); if (!e) return;
    
    let isOpening = e.style.display === "none" || e.style.display === "";
    window.closeAllPhotos();

    if (isOpening) { 
        e.style.display = "block"; 
        let img = e.querySelector('img'); 
        
        if (autoCenterEnabled) scrollToTargetExact(e);

        if (img) { 
            let timeoutId = setTimeout(() => {
                if (!img.classList.contains('loaded')) {
                    img.alt = "⛔ Obrázek není offline k dispozici (Zkontroluj připojení)";
                    img.src = ""; 
                    img.style.padding = "20px";
                    img.style.objectFit = "contain";
                    img.classList.add('loaded');
                }
            }, 5000); 

            if (img.complete && img.naturalHeight !== 0) { 
                clearTimeout(timeoutId);
                img.classList.add('loaded'); 
            } else { 
                img.onload = () => { 
                    clearTimeout(timeoutId);
                    img.classList.add('loaded'); 
                };
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    img.alt = "⛔ Obrázek není offline k dispozici";
                    img.src = "";
                    img.style.padding = "20px";
                    img.style.objectFit = "contain";
                    img.classList.add('loaded');
                };
            } 
        }
    } else { 
        e.style.display = "none"; 
        let parentMachine = e.closest('details.machine');
        if (parentMachine && autoCenterEnabled) scrollToTargetExact(parentMachine); 
        else if (autoCenterEnabled) scrollToTop();
    }
}

document.addEventListener('click', (e) => {
    let isNav = e.target.closest('.nav-btn, .side-menu button, summary, .tab-btn, .db-variant-btn, .katalog-item-btn');
    let isFotoBtn = e.target.closest('.foto-hodnota-btn, .close-photo-btn');
    
    if (isNav && !isFotoBtn) {
        window.closeAllPhotos();
    }
});

// --- UI PRVKY A MODÁLY ---
function showToast(type) {
  let msg = type;
  if(window.LINKA_DICT && type === window.LINKA_DICT.AUTOR.LV) msg = "Nastavení dle listu výrobků";
  else if(window.LINKA_DICT && type === window.LINKA_DICT.AUTOR.MAKYAN) msg = "Ověřeno ve výrobě Makyánem";
  
  let t = document.getElementById('toastMsg');
  if(t) { 
      document.getElementById('toastText').innerHTML = msg; 
      t.classList.add("show"); 
      window.keepNextToast = true; // Zapínáme štít pro přežití nejbližšího překliku obrazovky
      setTimeout(closeToast, 6000); 
  }
}
function closeToast() { let t = document.getElementById('toastMsg'); if(t) t.classList.remove("show"); }
function toggleMenu() { document.getElementById('appBody').classList.toggle('menu-open'); }
function closeMenu() { document.getElementById('appBody').classList.remove('menu-open'); }

function showCustomModal({ title, message = "", inputValue = "", type = "prompt", options = [] }) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customModal');
    if (!overlay) { if (type === 'confirm') resolve(confirm(title + '\n' + message)); else resolve(prompt(title + '\n' + message, inputValue)); return; }

    const titleEl = document.getElementById('modalTitle'); 
    const messageEl = document.getElementById('modalMessage');
    const inputEl = document.getElementById('modalInput'); 
    const selectEl = document.getElementById('modalSelect'); 
    const btnCancel = document.getElementById('modalBtnCancel'); 
    const btnConfirm = document.getElementById('modalBtnConfirm');

    titleEl.innerText = title;
    
    inputEl.style.display = "none";
    selectEl.style.display = "none";

    if (type === "prompt" || type === "select") {
      if (message !== "") { messageEl.style.display = "block"; messageEl.innerHTML = message; } else { messageEl.style.display = "none"; }
      
      if (type === "select") {
          selectEl.innerHTML = '';
          options.forEach(opt => {
              let o = document.createElement('option');
              o.value = opt; o.text = opt;
              selectEl.appendChild(o);
          });
          selectEl.value = inputValue;
          selectEl.style.display = "block";
      } else {
          inputEl.style.display = "block"; 
          inputEl.value = inputValue; 
      }
      
      btnConfirm.innerText = "ULOŽIT"; 
      btnConfirm.style.background = "#15803d";
    } else if (type === "confirm") {
      messageEl.style.display = "block"; messageEl.innerHTML = message; 
      btnConfirm.innerText = "ANO, POTVRDIT"; btnConfirm.style.background = "#b91c1c";
    }

    overlay.style.display = "flex";
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        if (type === "prompt") inputEl.focus();
        if (type === "select") selectEl.focus();
    });

    const close = (val) => {
        overlay.classList.remove('show');
        const onEnd = () => {
            overlay.style.display = "none";
            overlay.removeEventListener('transitionend', onEnd);
            resolve(val);
        };
        overlay.addEventListener('transitionend', onEnd);
        btnConfirm.onclick = null;
        btnCancel.onclick = null;
    };
    btnCancel.onclick = () => close(null); 
    
    btnConfirm.onclick = () => {
        if (type === "prompt") close(inputEl.value);
        else if (type === "select") close(selectEl.value);
        else close(true);
    };
    inputEl.onkeyup = (e) => { if (e.key === 'Enter') btnConfirm.click(); };
  });
}

function toggleZoom(btn, containerId) { 
    let container = document.getElementById(containerId); 
    if (!container) return;
    
    container.classList.toggle('large-text'); 
    btn.innerHTML = container.classList.contains('large-text') ? "🔍 ZMENŠIT" : "🔍 ZVĚTŠIT"; 
    
    // 🏛️ PROFI REAKTIVITA: Přepočítáme písma a šířky mřížky podle nového stavu zoomu
    if (typeof window.aplikovatAutoShrink === 'function') {
        window.aplikovatAutoShrink();
    }
}

// --- ČISTÁ LOGIKA PRO EULU (BEZ ČASOVAČŮ) ---
window.ukazEulaModal = function(force = true) {
    let hasAgreed = localStorage.getItem('eulaEnterprise3') === 'true';
    if (!hasAgreed || force) {
        let overlay = document.getElementById('eulaModalOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            let box = overlay.querySelector('.eula-box');
            if (box) box.scrollTop = 0; 
            requestAnimationFrame(() => { overlay.classList.add('show'); });
            
            if (!hasAgreed && wakeLock === null) toggleWakeLock(true);
        }
    }
};

window.souhlasimSeVsim = function() {
    let wasAgreed = localStorage.getItem('eulaEnterprise3') === 'true';
    localStorage.setItem('eulaEnterprise3', 'true');
    let overlay = document.getElementById('eulaModalOverlay');
    
    if (wakeLock !== null) {
        toggleWakeLock(true);
    }

    if (overlay) {
        overlay.classList.remove('show');
        const onEnd = () => {
            overlay.style.display = 'none';
            overlay.removeEventListener('transitionend', onEnd);
            if (!wasAgreed && typeof showToast === 'function') {
                showToast("Vítej! Nastav si aplikaci podle sebe.");
            }
        };
        overlay.addEventListener('transitionend', onEnd);
    }
};

// =========================================================================
// 🧠 CHYTRÁ KŘIŽOVATKA PRO MASTER DATA
// =========================================================================

window.resolveMasterTarget = function(editIdFull) {
    if (!editIdFull) return null;
    const parts = editIdFull.split('_');
    if (parts.length < 2) return null;

    let isKat = parts[0] === 'kat';
    let editId = isKat ? parts[1] : parts[0];
    let codeOrProg = isKat ? parts.slice(2).join('_') : parts.slice(1).join('_');
    let dbStore = (typeof Alpine !== 'undefined') ? Alpine.store('trezor') : null;
    if (!dbStore || !dbStore.databaze_master) return null;

    // 1. DIKTATURA BALENÍ (Miropack programy jdou do baleni)
    if (isKat || editId.startsWith('miro') || editId === 'novoElko') {
        if (editId === 'miroProg') return null; // miroProg u pizzy necháme jít do Výroby
        let targetProgKey = isKat ? codeOrProg : null;
        if (!isKat && dbStore.databaze_master.vyroba) {
            for (let b in dbStore.databaze_master.vyroba) {
                let m = dbStore.databaze_master.vyroba[b];
                if (m.varianty) {
                    let v = m.varianty.find(x => x.kod === codeOrProg);
                    if (v) {
                        let pNum = (v.spec && v.spec.miroProg) || (m.spolecne && m.spolecne.miroProg);
                        if (pNum) targetProgKey = "PROGRAM" + pNum.toString().trim();
                        break;
                    }
                }
            }
        }
        if (targetProgKey && dbStore.databaze_master.baleni && dbStore.databaze_master.baleni[targetProgKey]) {
            return { type: 'baleni', path: `baleni.${targetProgKey}.${editId}`, editId: editId, msgObj: `GLOBÁLNÍ BALÍCÍ PROGRAM: ${targetProgKey}`, progKey: targetProgKey };
        }
        return null;
    }

    // 2. DIKTATURA VÝROBY (Matka vs Dítě) - Zápis rovnou do Master Dat
    let targetCode = codeOrProg;
    let isInherited = false;
    
    // Zkusíme využít chytrou cache z obrazovky pro vyhledání Matky
    let elEngine = document.getElementById('resultsScreen');
    if (elEngine && elEngine._x_dataStack && elEngine._x_dataStack[0].currentProduct) {
        let cp = elEngine._x_dataStack[0].currentProduct;
        if (cp.code === codeOrProg) {
            let sab = (typeof nactiSablonu === 'function') ? nactiSablonu() : window.DEFAULT_SABLONA;
            let sekce = null;
            for (let s in sab) { if (Array.isArray(sab[s]) && sab[s].find(x => x.id === editId)) { sekce = s; break; } }
            if (!sekce) {
                if (editId.startsWith('pecOd') || editId.startsWith('pecZ') || editId === 'pecRezim' || editId === 'pecDig') sekce = 'pec';
                else if (editId === 'balRezim') sekce = 'baleni';
            }
            if (sekce) {
                let syncKey = sekce;
                if (sekce === 'pecPrujezd') syncKey = 'pec';
                if (sekce.startsWith('baleni')) syncKey = 'baleni';
                let srcKey = syncKey + '_source';
                let pC = { ...cp.main.spolecne, ...cp.variant.spec };
                
                // Zjistíme, jestli to má Matku a NENÍ to výjimka
                if (pC[srcKey] && (!cp.exceptions || !cp.exceptions.includes(editId))) {
                    targetCode = pC[srcKey]; 
                    isInherited = true;
                }
            }
        }
    }

    // Najít přesnou cestu ve Firestore
    let tBase = null; let vIdx = -1; let isSpec = false;
    
    // Pokud je targetCode složený (obsahuje podtržítko), rozdělíme ho na Base rodinu a Variant kód poloproduktu
    let searchBase = null;
    let searchVar = targetCode;
    if (targetCode && targetCode.includes('_')) {
        let cParts = targetCode.split('_');
        searchBase = cParts[0];
        searchVar = cParts[1];
    }

    for (let b in dbStore.databaze_master.vyroba) {
        if (searchBase && b !== searchBase) continue; // Pokud známe přesný šuplík Base rodiny, ignorujeme ostatní
        let m = dbStore.databaze_master.vyroba[b];
        if (m.varianty) {
            vIdx = m.varianty.findIndex(x => x.kod === searchVar);
            if (vIdx !== -1) { tBase = b; break; }
        }
    }
    if (!tBase) return null;

    let main = dbStore.databaze_master.vyroba[tBase];
    if (main.varianty[vIdx] && main.varianty[vIdx].spec && main.varianty[vIdx].spec[editId] !== undefined) isSpec = true;
    else if (main.spolecne && main.spolecne[editId] === undefined) { isSpec = true; } // Pokud to není ve spolecne, je to spec

    let path = isSpec ? `vyroba.${tBase}.varianty.${vIdx}.spec.${editId}` : `vyroba.${tBase}.spolecne.${editId}`;

    return { 
        type: 'vyroba', 
        path: path, 
        editId: editId, 
        msgObj: isInherited ? `ADOPTIVNÍ MATKA (${targetCode}). Změna se propíše globálně!` : `Základní data (${targetCode})`,
        isInherited: isInherited,
        basePath: `vyroba.${tBase}.spolecne`, // Pro vlastní poznámky
        // 🚀 PROFI METADATA: Pro bezpečný celoplošný zápis polí bez destrukce na Mapu
        tBase: tBase,
        vIdx: vIdx,
        isSpec: isSpec
    };
};

// =========================================================================
// 🖍️ OMALOVÁNKY A PŘÍMÝ ZÁPIS DO MASTER DAT (BALÍČEK 3)
// =========================================================================

window.editValue = async function(element) {
  if (typeof Alpine !== 'undefined') {
      let state = Alpine.store('appState');
      if (!state.isEditMode) return;
      if (!state.isEditor && !state.isAdmin) { showToast("Nemáš práva k úpravám!"); return; }
  }
  if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
      if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro uložení potřebuješ signál!"); return;
  }
  const editIdFull = element.getAttribute("data-edit-id"); if (!editIdFull) return;
  
  let plainText = element.innerText.replace('✏️', '').replace('🔓', '').trim();
  let cleanValue = plainText.replace(/Ø/g, '').replace(/cm/g, '').replace(/°C/g, '').replace(/%/g, '').replace(/minut/g, '').replace(/ks/g, '').replace(/Potenciometr na/g, '').trim();

  let target = window.resolveMasterTarget(editIdFull);
  if (!target) { showToast("Chyba: Cíl nenalezen v Master Datech!"); return; }

  let autorInfo = `<span style="font-size:12px; color:#b91c1c; font-weight:bold;">⚠️ POZOR! Upravuješ rovnou Master Data pro: <br><b style="color:#2563eb;">${target.msgObj}</b></span>`;
  let modTitle = target.isInherited ? "Globální úprava Matky" : "Úprava Master Dat";

  const editId = target.editId;
  let baseId = editIdFull.split('_')[0];
  let currentVal = element.innerText.replace('✏️', '').replace('🔓', '').trim();
  if (currentVal.startsWith('Zadat: ')) currentVal = "";

  let sab = (typeof nactiSablonu === 'function') ? nactiSablonu() : window.DEFAULT_SABLONA;
  let targetStroj = null;
  for (let sekce in sab) {
      if (Array.isArray(sab[sekce])) {
          let found = sab[sekce].find(s => s.id === baseId);
          if (found) { targetStroj = found; break; }
      }
  }

  if (!targetStroj && typeof window.linkaEngine === 'function' && Alpine.store('appState').activeCode) {
      let allCustoms = [];
      ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].forEach(s => {
          allCustoms = allCustoms.concat(window.linkaEngine().getCustomItems(Alpine.store('appState').activeCode, s));
      });
      let foundCustom = allCustoms.find(c => c.id === baseId);
      if (foundCustom) targetStroj = { label: foundCustom.nazev, type: 'text' }; 
  }

  let modalType = "prompt";
  let modalOptions = [];
  
  if (targetStroj) modTitle = `Upravit: ${targetStroj.label}`;

  if (baseId.startsWith('pecOd')) {
        modalType = "select";
        modTitle = "Odtah " + baseId.replace('pecOd', '');
        modalOptions = ["Vypnuto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Dodáme"];
    } else if (targetStroj) {
        if (targetStroj.type === 'select') {
            modalType = "select";
            if (targetStroj.optionsStr) modalOptions = targetStroj.optionsStr.split(';').map(s => s.trim()).filter(Boolean);
            else if (targetStroj.options && Array.isArray(targetStroj.options)) modalOptions = [...targetStroj.options];
            else modalOptions = ["Vypnuto", "Zapnuto"];
            if (!modalOptions.includes("Dodáme")) modalOptions.push("Dodáme");
        } else if (targetStroj.type === 'number') { 
            modalType = "prompt"; 
            // 👑 PROFI ČIŠTĚNÍ: Pokud šablona potvrdí číslo, regulární výraz vymaže úplně všechno kromě číslic, tečky, čárky a mínusu!
            cleanValue = plainText.replace(/[^\d.,-]/g, '').trim();
        }
    }

  let newVal = null;
  if (modalType === 'select') {
      let selectedVal = currentVal === "Dodáme" ? "Dodáme" : currentVal;
      if (editId === 'holSyr' || editId === 'holSal') {
          let match = modalOptions.find(opt => opt.toLowerCase().includes(currentVal.toLowerCase()));
          if (match) selectedVal = match;
      }
      newVal = await showCustomModal({ title: modTitle, message: autorInfo, inputValue: selectedVal, type: "select", options: modalOptions });
  } else {
      newVal = await showCustomModal({ title: modTitle, message: autorInfo, inputValue: cleanValue, type: "prompt" });
  }

  if (newVal !== null) {
    let dbStore = Alpine.store('trezor');
    
    if (newVal.trim() === "") {
             let confirmDel = await showCustomModal({ title: "Smazat hodnotu?", message: "Opravdu chceš vrátit výchozí hodnotu v Master Datech?", type: "confirm" });
             if (!confirmDel) return; 
             
             // 🚀 SECURE FIELD UPDATE: Pokud saháme do variant, přepíšeme lokální pole a pošleme ho Firebase jako celek!
             let firebasePromise;
             if (target.type === 'vyroba' && target.isSpec) {
                 let vyrobaObj = dbStore.databaze_master.vyroba[target.tBase];
                 let cleanVarianty = JSON.parse(JSON.stringify(vyrobaObj.varianty || []));
                 if (cleanVarianty[target.vIdx] && cleanVarianty[target.vIdx].spec) {
                     delete cleanVarianty[target.vIdx].spec[target.editId];
                 }
                 firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [`vyroba.${target.tBase}.varianty`]: cleanVarianty });
             } else {
                 firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [target.path]: firebase.firestore.FieldValue.delete() });
             }

             firebasePromise.then(() => { 
                [Alpine.store('trezor'), typeof Trezor !== 'undefined' ? Trezor : null].forEach(st => {
                    if (st && st.databaze_master) {
                        let p = target.path.split('.'), o = st.databaze_master;
                        for (let i = 0; i < p.length - 1; i++) { if(!o[p[i]]) o[p[i]] = {}; o = o[p[i]]; }
                        delete o[p[p.length - 1]];
                    }
                });
                let cacheKey = 'CP_' + Alpine.store('appState').lastBaseCode + '_' + Alpine.store('appState').activeCode;
                if (window._linkaCache && window._linkaCache[cacheKey] && window._linkaCache[cacheKey].p) { delete window._linkaCache[cacheKey].p[editId]; }
                element.innerHTML = "Zadat... " + (Alpine.store('appState').isEditor ? '<span class="edit-icon">✏️</span>' : '');
                if(typeof showToast === 'function') showToast("Smazáno z Master Dat!"); 
            }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
        } else {
             // 🚀 SECURE FIELD UPDATE: Pokud saháme do variant, přepíšeme lokální pole a pošleme ho Firebase jako celek!
             let firebasePromise;
             if (target.type === 'vyroba' && target.isSpec) {
                 let vyrobaObj = dbStore.databaze_master.vyroba[target.tBase];
                 let cleanVarianty = JSON.parse(JSON.stringify(vyrobaObj.varianty || []));
                 if (cleanVarianty[target.vIdx]) {
                     if (!cleanVarianty[target.vIdx].spec) cleanVarianty[target.vIdx].spec = {};
                     cleanVarianty[target.vIdx].spec[target.editId] = newVal.trim();
                 }
                 firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [`vyroba.${target.tBase}.varianty`]: cleanVarianty });
             } else {
                 firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [target.path]: newVal.trim() });
             }

             firebasePromise.then(() => { 
                 [Alpine.store('trezor'), typeof Trezor !== 'undefined' ? Trezor : null].forEach(st => {
                     if (st && st.databaze_master) {
                         let p = target.path.split('.'), o = st.databaze_master;
                         for (let i = 0; i < p.length - 1; i++) { if(!o[p[i]]) o[p[i]] = {}; o = o[p[i]]; }
                         o[p[p.length - 1]] = newVal.trim();
                     }
                 });
                 let cacheKey = 'CP_' + Alpine.store('appState').lastBaseCode + '_' + Alpine.store('appState').activeCode;
                 if (window._linkaCache && window._linkaCache[cacheKey] && window._linkaCache[cacheKey].p) {
                     window._linkaCache[cacheKey].p[editId] = newVal.trim();
                     if (editId === 'holSyr' && window.getHolacInfo) { let inf = window.getHolacInfo(newVal.trim()); if (inf) window._linkaCache[cacheKey].p['diskSyr'] = inf.label; }
                     if (editId === 'holSal' && window.getHolacInfo) { let inf = window.getHolacInfo(newVal.trim()); if (inf) window._linkaCache[cacheKey].p['diskSal'] = inf.label; }
                 }
                 let jednotka = targetStroj && targetStroj.unit ? " " + targetStroj.unit : "";
                 if (editId.startsWith('pecZ')) { jednotka = target.path.includes('t') ? " °C" : " %"; }
                 if (editId.startsWith('pecOd')) { element.innerHTML = "Potenciometr na " + newVal.trim(); } 
                 else { element.innerHTML = newVal.trim() + jednotka + (Alpine.store('appState').isEditor ? '<span class="edit-icon">✏️</span>' : ''); }
                 if(typeof showToast === 'function') showToast(`Zapsáno přímo do Master Dat!`); 
             }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
        }
  }
}

async function rychleZmenitStav(stav, editIds) {
    if (typeof Alpine !== 'undefined') {
        let state = Alpine.store('appState');
        if (!state.isEditMode) return;
        if (!state.isEditor && !state.isAdmin) { showToast("Nemáš práva k úpravám!"); return; }
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM!"); return;
    }

    let masterUpdates = {};
    let updateList = [];

    let dbStore = Alpine.store('trezor');
    let ovlivneneVarianty = {}; // Sběrný batoh pro tBase -> celá upravená pole variant

    for (let editIdFull of editIds) {
        if (!editIdFull) continue;
        let target = window.resolveMasterTarget(editIdFull);
        if (target) {
            if (target.type === 'vyroba' && target.isSpec) {
                let vyrobaObj = dbStore.databaze_master.vyroba[target.tBase];
                if (vyrobaObj && vyrobaObj.varianty) {
                    if (!ovlivneneVarianty[target.tBase]) {
                        ovlivneneVarianty[target.tBase] = JSON.parse(JSON.stringify(vyrobaObj.varianty));
                    }
                    let vars = ovlivneneVarianty[target.tBase];
                    if (vars[target.vIdx]) {
                        if (!vars[target.vIdx].spec) vars[target.vIdx].spec = {};
                        vars[target.vIdx].spec[target.editId] = stav;
                    }
                }
            } else {
                masterUpdates[target.path] = stav;
            }
            updateList.push({ target, editIdFull });
        }
    }

    // Propojíme posbírané varianty do jednoho velkého Firebase zápisu
    Object.keys(ovlivneneVarianty).forEach(tBase => {
        masterUpdates[`vyroba.${tBase}.varianty`] = ovlivneneVarianty[tBase];
    });

    if (Object.keys(masterUpdates).length > 0) {
        db.collection('linka_data').doc('databaze_master').update(masterUpdates).then(() => {
            [Alpine.store('trezor'), typeof Trezor !== 'undefined' ? Trezor : null].forEach(st => {
                if (st && st.databaze_master) {
                    updateList.forEach(item => {
                        let p = item.target.path.split('.'), o = st.databaze_master;
                        for (let i = 0; i < p.length - 1; i++) { if(!o[p[i]]) o[p[i]] = {}; o = o[p[i]]; }
                        o[p[p.length - 1]] = stav;
                    });
                }
            });
            let cacheKey = 'CP_' + Alpine.store('appState').lastBaseCode + '_' + Alpine.store('appState').activeCode;
            updateList.forEach(item => {
                if (window._linkaCache && window._linkaCache[cacheKey] && window._linkaCache[cacheKey].p) { window._linkaCache[cacheKey].p[item.target.editId] = stav; }
                let el = document.querySelector(`[data-edit-id="${item.editIdFull}"]`);
                if (el) {
                    let jn = ""; if (item.target.editId.startsWith('pecZ')) { jn = item.target.path.includes('t') ? " °C" : " %"; }
                    el.innerHTML = stav + jn + (Alpine.store('appState').isEditor ? '<span class="edit-icon">✏️</span>' : '');
                }
            });
            showToast(stav + " v Master Datech!");
        }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
    }
}

async function rychleVypnout(...editIds) { rychleZmenitStav(window.LINKA_DICT ? window.LINKA_DICT.STAV.VYPNUTO : "Vypnuto", editIds); }
async function rychleZapnout(...editIds) { rychleZmenitStav(window.LINKA_DICT ? window.LINKA_DICT.STAV.ZAPNUTO : "Zapnuto", editIds); }

async function rychleSmazat(editIdFull) {
    if (typeof Alpine !== 'undefined') {
        let state = Alpine.store('appState');
        if (!state.isEditMode) return;
        if (!state.isEditor && !state.isAdmin) { showToast("Nemáš práva k úpravám!"); return; }
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM!"); return;
    }
    
    let target = window.resolveMasterTarget(editIdFull);
    if (!target) return;

    let confirmDel = await showCustomModal({ title: "Smazat z Master Dat?", message: `⚠️ Opravdu chceš GLOBÁLNĚ smazat tuto hodnotu pro ${target.msgObj}?`, type: "confirm" });
    if (confirmDel) {
        let dbStore = Alpine.store('trezor');
        let firebasePromise;

        if (target.type === 'vyroba' && target.isSpec) {
            let vyrobaObj = dbStore.databaze_master.vyroba[target.tBase];
            let cleanVarianty = JSON.parse(JSON.stringify(vyrobaObj.varianty || []));
            if (cleanVarianty[target.vIdx] && cleanVarianty[target.vIdx].spec) {
                delete cleanVarianty[target.vIdx].spec[target.editId];
            }
            firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [`vyroba.${target.tBase}.varianty`]: cleanVarianty });
        } else {
            firebasePromise = db.collection('linka_data').doc('databaze_master').update({ [target.path]: firebase.firestore.FieldValue.delete() });
        }

        firebasePromise.then(() => {
            [Alpine.store('trezor'), typeof Trezor !== 'undefined' ? Trezor : null].forEach(st => {
                if (st && st.databaze_master) {
                    let p = target.path.split('.'), o = st.databaze_master;
                    for (let i = 0; i < p.length - 1; i++) { if(!o[p[i]]) o[p[i]] = {}; o = o[p[i]]; }
                    delete o[p[p.length - 1]];
                }
            });
            let cacheKey = 'CP_' + Alpine.store('appState').lastBaseCode + '_' + Alpine.store('appState').activeCode;
            if (window._linkaCache && window._linkaCache[cacheKey] && window._linkaCache[cacheKey].p) { delete window._linkaCache[cacheKey].p[target.editId]; }
            let el = document.querySelector(`[data-edit-id="${editIdFull}"]`);
            if (el) el.innerHTML = "Zadat... " + (Alpine.store('appState').isEditor ? '<span class="edit-icon">✏️</span>' : '');
            showToast("Smazáno z Master Dat!");
        }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
    }
}

function extractArrayDataMaster(editIdFull) {
    let target = window.resolveMasterTarget(editIdFull);
    if (!target) return [];
    
    let dbStore = Alpine.store('trezor');
    let content = null;
    
    // Extrakce hodnoty z paměti pomocí path
    try {
        let parts = target.path.split('.');
        content = dbStore.databaze_master;
        for (let i = 1; i < parts.length; i++) {
            content = content[parts[i]];
        }
    } catch(e) {}
    
    if (Array.isArray(content)) return [...content]; 
    if (typeof content === 'string' && content.trim() !== '') return [{ id: 'legacy_' + Date.now(), text: content, type: 'note' }];
    return [];
}

async function pridatVlastniPoznamku(kod, sekce) {
    if (typeof Alpine !== 'undefined') {
        if (!Alpine.store('appState').isEditMode) return;
        if (!Alpine.store('appState').isAdmin) { showToast("Pouze Admin může přidávat vlastní poznámky!"); return; }
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM!"); return;
    }
    let prefix = sekce.substring(0, 3); let editId = `${prefix}Pozn_${kod}`;
    let text = await showCustomModal({ title: "Nová poznámka do Master Dat", type: "prompt", inputValue: "" });
    if (text === null || text.trim() === "") return; 
    
    let polePolozek = extractArrayDataMaster(editId);
    polePolozek.push({ id: Date.now().toString(), text: text.trim(), type: 'note' });
    
    let target = window.resolveMasterTarget(editId);
    if (target) {
        db.collection('linka_data').doc('databaze_master').update({ [target.path]: polePolozek })
          .then(() => { showToast("Poznámka uložena do Master Dat!"); }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
    }
}

async function pridatVlastniStroj(kod, sekce) {
    if (typeof Alpine !== 'undefined') {
        if (!Alpine.store('appState').isEditMode) return;
        if (!Alpine.store('appState').isAdmin) { showToast("Pouze Admin může přidávat stroje!"); return; }
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM!"); return;
    }
    let n = await showCustomModal({ title: "Název nového stroje", type: "prompt" }); if (!n || n.trim() === "") return;
    let defaultZp = window.LINKA_DICT ? window.LINKA_DICT.STAV.ZAPNUTO : "Zapnuto";
    let v = await showCustomModal({ title: "Hodnota pro " + n, type: "prompt", inputValue: defaultZp }); if (!v || v.trim() === "") return;
    
    let prefix = sekce.substring(0, 3); let editId = `${prefix}Pozn_${kod}`;
    let polePolozek = extractArrayDataMaster(editId);
    polePolozek.push({ id: Date.now().toString(), nazev: n.trim(), hodnota: v.trim(), type: 'machine' });
    
    let target = window.resolveMasterTarget(editId);
    if (target) {
        db.collection('linka_data').doc('databaze_master').update({ [target.path]: polePolozek })
          .then(() => { showToast("Stroj přidán do Master Dat!"); }).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
    }
}

async function smazatVlastniPolozku(kod, sekce, itemId) {
    if (typeof Alpine !== 'undefined') {
        let state = Alpine.store('appState');
        if (!state.isEditMode) return;
        if (!state.isEditor && !state.isAdmin) { showToast("Nemáš práva k úpravám!"); return; }
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM!"); return;
    }
    let confirmDel = await showCustomModal({ title: "Smazat položku z Master Dat?", message: "Opravdu chceš smazat tuto vlastní poznámku/stroj?", type: "confirm" });
    if (!confirmDel) return;

    let prefix = sekce.substring(0, 3); let editId = `${prefix}Pozn_${kod}`;
    let polePolozek = extractArrayDataMaster(editId);
    let newData = polePolozek.filter(item => item.id !== itemId);
    
    let target = window.resolveMasterTarget(editId);
    if (target) {
        let updateVal = newData.length === 0 ? firebase.firestore.FieldValue.delete() : newData;
        db.collection('linka_data').doc('databaze_master').update({ [target.path]: updateVal })
          .then(() => showToast("Smazáno z Master Dat!")).catch(err => { if(typeof showToast === 'function') showToast("❌ Chyba: " + (err.message || err)); });
    }
}