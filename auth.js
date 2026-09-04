// =========================================================================
// 🚀 FIREBASE FIRESTORE, PRÁVA A TICHÝ HLÍDAČ (ŽIVÁ OBČANKA)
// =========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBWUcBJhdkbLhE1RYR4RnWZwcPuNX2BPUU",
  authDomain: "moje-linka.firebaseapp.com",
  databaseURL: "https://moje-linka-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "moje-linka",
  storageBucket: "moje-linka.firebasestorage.app",
  messagingSenderId: "263076829675",
  appId: "1:263076829675:web:87f045ff12c8ae55f9a1ae",
  measurementId: "G-SH76YKK825"
};

firebase.initializeApp(firebaseConfig);

// 🛡️ APP CHECK: Ochrana proti botům
try {
    const appCheck = firebase.appCheck();
    appCheck.activate(
      new firebase.appCheck.ReCaptchaEnterpriseProvider('6LdXN8osAAAAAKOg7I-tfffBrvBsvbkAQwf1v9Gm'),
      true 
    );
    console.log("🛡️ App Check úspěšně aktivován.");
} catch (e) {
    console.error("❌ Chyba při aktivaci App Check:", e);
}

const auth = firebase.auth(); 
const db = firebase.firestore();

// 🚀 POJISTKA PRO SERVEROVÉ FUNKCE
let cloudFunctions = null;
try {
    cloudFunctions = firebase.functions();
    console.log("✅ Serverové funkce jsou připraveny.");
} catch (e) {
    console.warn("⚠️ Pozor: Serverové funkce nejsou dostupné offline.");
}

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(err => console.error("Chyba persistence:", err));

// 📡 ZAPNUTÍ OFFLINE PAMĚTI (BEZ OTRAVNÉHO VAROVÁNÍ GOOGLU - VERZE 2.0)
const originalWarn = console.warn;
console.warn = function(...args) {
    const fullMessage = args.join(' ');
    if (fullMessage.includes('enableIndexedDbPersistence') || fullMessage.includes('FirestoreSettings.cache')) return; // Umlčíme Google nadobro
    originalWarn.apply(console, args);
};

db.enablePersistence()
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          originalWarn('Offline režim: Appka je otevřená ve více záložkách naráz.');
      } else if (err.code == 'unimplemented') {
          originalWarn('Offline režim: Tento prohlížeč nepodporuje ukládání dat.');
      }
  });

let CURRENT_USER_KEY = null; 
let CURRENT_EMAIL = null;

let isLoggingIn = false;

let isManuallyDisconnected = localStorage.getItem('isManuallyDisconnected') === 'ano';
if (isManuallyDisconnected) { db.disableNetwork(); }

let isDbListenerActive = false;
let initialDataLoaded = false; 

document.addEventListener('alpine:init', () => {
    Alpine.store('trezor', {
        vyroba: {},
        baleni: {},
        upravy: {},
        nastaveni: { vip_users: {}, vip_plus_users: {}, admin_users: {}, editor_users: {}, owner_users: {}, prezdivky: {}, zmrazeni: {}, sablona: null },
        uzivatele_roster: {},
        zamek: {},
        hlaseni: { id: "audit-01", isActive: false, text: "" },
        databaze_master: { vyroba: {}, baleni: {} },
        
        get adminUserList() {
            let usersSet = new Set([
                ...Object.keys(this.uzivatele_roster || {}),
                ...Object.keys(this.nastaveni.vip_users || {}),
                ...Object.keys(this.nastaveni.vip_plus_users || {}),
                ...Object.keys(this.nastaveni.admin_users || {}),
                ...Object.keys(this.nastaveni.editor_users || {}),
                ...Object.keys(this.nastaveni.zmrazeni || {})
            ]);
            
            let usersArray = Array.from(usersSet);
            let result = [];
            
            usersArray.forEach(safeKey => {
                // Neviditelný Vlastník – nezobrazuje se v seznamu uživatelů
                if (this.nastaveni.owner_users && this.nastaveni.owner_users[safeKey]) return;

                let uData = this.uzivatele_roster[safeKey] || {};
                let displayEmail = uData.email || safeKey;

                if (safeKey.includes(',')) return;

                let role = 'Reader';
                if (this.nastaveni.admin_users && this.nastaveni.admin_users[safeKey]) role = 'Admin';
                else if (this.nastaveni.editor_users && this.nastaveni.editor_users[safeKey]) role = 'Editor';
                else if (this.nastaveni.vip_plus_users && this.nastaveni.vip_plus_users[safeKey]) role = 'VipPlus';
                else if (this.nastaveni.vip_users && this.nastaveni.vip_users[safeKey]) role = 'Vip';

                let isFrozen = this.nastaveni.zmrazeni && this.nastaveni.zmrazeni[safeKey] === true;
                
                // MAGIE PRO ZOBRAZENÍ JMEN: Tvoje pojmenování (Jeho vlastní přezdívka)
                let tvojePrezdivka = this.nastaveni.prezdivky && this.nastaveni.prezdivky[safeKey] ? this.nastaveni.prezdivky[safeKey] : displayEmail;
                let jehoVlastniPrezdivka = uData.vlastniJmeno ? uData.vlastniJmeno : '';
                
                let finalniJmeno = tvojePrezdivka;
                if (jehoVlastniPrezdivka && jehoVlastniPrezdivka !== tvojePrezdivka) {
                    finalniJmeno = `${tvojePrezdivka} (${jehoVlastniPrezdivka})`;
                }
                
                result.push({
                    id: safeKey, email: displayEmail, displayName: finalniJmeno,
                    role: role, isFrozen: isFrozen
                });
            });
            return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
        }
    });

    window.Trezor = Alpine.store('trezor');

    auth.onAuthStateChanged((user) => { 
        if (user) { 
            CURRENT_USER_KEY = user.uid;
            CURRENT_EMAIL = user.email;
            window.dispatchEvent(new Event('auth-loaded')); // 🚀 VYSÍLAČKA PRO ŠICHTU

            applyUserRights();
            startDatabaseListener(); 
            
            if (!isLoggingIn) {
                if (typeof handleAppRouting === 'function') handleAppRouting(true);
            }

        } else {
            CURRENT_USER_KEY = null;
            CURRENT_EMAIL = null;
            if (!isLoggingIn && typeof handleAppRouting === 'function') handleAppRouting(false);
            
            // 🎭 OPONA: Nejsi přihlášený (nebo ses odhlásil), opona musí pryč, abys viděl Login
            if (typeof window.zvedniOponu === 'function') window.zvedniOponu(); 
        }
    });
});

function aktualizujUiPoNacteniDat() {
    if (typeof closeToast === 'function') closeToast(); 
    let state = Alpine.store('appState');
    if (!state) return;

    // Pokud jsme na obyčejných Výsledcích
    if (state.currentScreen === 'resultsScreen' && state.compareMode === 'ne') {
        if(state.activeCode && typeof showResults === 'function') showResults(state.activeCode, false, state.lastBaseCode);
    } 
    // Pokud jsme ve Srovnávači, na Šichtě nebo jsme na Výsledcích se zapnutým srovnáváním
    else if (state.currentScreen === 'resultsScreen' || state.currentScreen === 'compareScreen' || state.currentScreen === 'sichtaScreen') {
        // Tímhle vynutíme, aby si tyhle moduly správně přečetly data, jakmile natečou z cloudu
        if (typeof handleAppRouting === 'function') handleAppRouting(true);
    }
}

let isRosterListenerActive = false;

function ensureRosterListener() {
    let dbStore = Alpine.store('trezor');
    let isOwner = dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[CURRENT_USER_KEY] === true;
    let isAdmin = isOwner || (dbStore.nastaveni.admin_users && dbStore.nastaveni.admin_users[CURRENT_USER_KEY] === true);

    if (isAdmin && !isRosterListenerActive) {
        isRosterListenerActive = true;
        db.collection('linka_data').doc('uzivatele').onSnapshot((doc) => {
            if (doc.exists) {
                Alpine.store('trezor').uzivatele_roster = doc.data() || {};
            }
        }, (err) => console.warn("Roster listener:", err.message));
    }
}

function startDatabaseListener() {
    if (isDbListenerActive) return;
    isDbListenerActive = true;
    
    let dbStore = Alpine.store('trezor');
    let loadedDocs = { nastaveni: false, databaze_master: false };

    function checkInitialReady() {
        if (!initialDataLoaded && loadedDocs.nastaveni && loadedDocs.databaze_master) {
            aktualizujUiPoNacteniDat();
            initialDataLoaded = true;

            requestAnimationFrame(() => {
                if (!isLoggingIn && typeof window.zvedniOponu === 'function') {
                    window.zvedniOponu();
                }
            });
        }
    }

    // 1. Nastavení
    db.collection('linka_data').doc('nastaveni').onSnapshot((doc) => {
        let data = doc.exists ? doc.data() : {};
        let nast = data || {};
        nast.vip_users = nast.vip_users || {};
        nast.vip_plus_users = nast.vip_plus_users || {};
        nast.admin_users = nast.admin_users || {};
        nast.editor_users = nast.editor_users || {};
        nast.prezdivky = nast.prezdivky || {};
        nast.zmrazeni = nast.zmrazeni || {};
        nast.owner_users = nast.owner_users || {};
        dbStore.nastaveni = nast;

        if (data.appVersion) {
            let localVer = localStorage.getItem('currentAppVersion');
            if (!localVer) { 
                localStorage.setItem('currentAppVersion', data.appVersion); 
            } else if (localVer !== data.appVersion) {
                localStorage.setItem('currentAppVersion', data.appVersion);
                let splash = document.getElementById('splashScreen');
                if (splash) {
                    splash.style.display = 'flex'; splash.style.opacity = '1';
                    let sub = splash.querySelector('.splash-subtitle');
                    if (sub) sub.innerText = "Aktualizuji aplikaci...";
                    let t1 = document.getElementById('splashTitleText');
                    if (t1) t1.style.display = 'block';
                    let t2 = document.getElementById('splashSubText');
                    if (t2) t2.style.display = 'block';
                }
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                        caches.keys().then(keys => {
                            Promise.all(keys.map(k => caches.delete(k))).then(() => {
                                for (let r of registrations) { r.update(); }
                                location.reload(true);
                            });
                        });
                    });
                } else { 
                    location.reload(true); 
                }
            }
        }

        if (CURRENT_USER_KEY) {
            applyUserRights();
            checkIfFrozen();
            ensureRosterListener();

            let uData = (dbStore.uzivatele_roster && dbStore.uzivatele_roster[CURRENT_USER_KEY]) || {};
            let myNick = (nast.prezdivky && nast.prezdivky[CURRENT_USER_KEY]) || uData.vlastniJmeno || '';
            let inputPrez = document.getElementById('mojePrezdivkaInput');
            if (inputPrez && myNick) inputPrez.value = myNick;
        }

        loadedDocs.nastaveni = true;
        checkInitialReady();
        localStorage.setItem('posledniAktualizace', Date.now());
    });

    // 2. Master data (Receptury)
    db.collection('linka_data').doc('databaze_master').onSnapshot((doc) => {
        window._linkaCache = {}; // Vyprázdnění paměti pouze při reálné změně receptur
        let d = doc.exists ? doc.data() : { vyroba: {}, baleni: {} };
        dbStore.databaze_master = d;
        dbStore.vyroba = d.vyroba || {};
        dbStore.baleni = d.baleni || {};

        loadedDocs.databaze_master = true;
        checkInitialReady();
        localStorage.setItem('posledniAktualizace', Date.now());
    });

    // 3. Zámek
    db.collection('linka_data').doc('zamek').onSnapshot((doc) => {
        dbStore.zamek = doc.exists ? doc.data() : {};
    });

    // 4. Hlášení
    db.collection('linka_data').doc('hlaseni').onSnapshot((doc) => {
        dbStore.hlaseni = doc.exists ? doc.data() : { id: "audit-01", isActive: false, text: "" };
    });

    // 5. Detekce souběžného přihlášení (pouze vlastní dokument)
    if (CURRENT_USER_KEY) {
        db.collection('uzivatele_online').doc(CURRENT_USER_KEY).onSnapshot((doc) => {
            if (isLoggingIn || doc.metadata.fromCache) return;

            if (doc.exists) {
                let activeDeviceId = doc.data().deviceId;
                let myLocalDeviceId = getDeviceId();
                if (activeDeviceId && activeDeviceId !== myLocalDeviceId) {
                    if (typeof showToast === 'function') showToast("⚠️ Přihlášeno z jiného zařízení. Odhlašuji...");
                    logout();
                }
            }
        });
    }
}

// 🛡️ CHYTRÉ ZMRAZENÍ BEZ SEBEDESTRUKCE
async function checkIfFrozen(force = false) {
    let dbStore = Alpine.store('trezor');
    let isOwner = (dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[CURRENT_USER_KEY] === true);
    if (isOwner) return; // Vlastník má absolutní imunitu

    let isFrozen = force || (dbStore.nastaveni.zmrazeni && dbStore.nastaveni.zmrazeni[CURRENT_USER_KEY] === true);
    
    if (isFrozen) {
        isLoggingIn = false; 
        
        if (typeof toggleWakeLock === 'function' && window.wakeLock !== null) {
            toggleWakeLock(true);
        }

        try { await auth.signOut(); } catch(e) { console.error(e); }

        // Místo smazání úplně všeho jen čistíme přihlášení a utínáme síť
        localStorage.removeItem('casPrihlaseni');
        db.disableNetwork(); 
        
        if (typeof window.zvedniOponu === 'function') window.zvedniOponu();

        let mrazak = document.getElementById('frozenModalOverlay');
        if(mrazak) { mrazak.style.display = 'flex'; setTimeout(() => { mrazak.classList.add('show'); }, 10); }

        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }
}

function forceAppUpdate() {
    let newVer = "UPDATE_" + Date.now();
    db.collection('linka_data').doc('nastaveni').set({ appVersion: newVer }, {merge: true}).then(() => {
        if (typeof showToast === 'function') showToast("🚀 Signál k aktualizaci odeslán všem zařízením!");
    });
}

function applyUserRights() {
  document.getElementById('connectionStatus').style.display = 'flex';
  let dbStore = Alpine.store('trezor');
  
  let isOwner = (dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[CURRENT_USER_KEY] === true);
  let isAdmin = isOwner || (dbStore.nastaveni.admin_users && dbStore.nastaveni.admin_users[CURRENT_USER_KEY] === true);
  let isEditor = isAdmin || (dbStore.nastaveni.editor_users && dbStore.nastaveni.editor_users[CURRENT_USER_KEY] === true);
  let isVipPlus = isEditor || (dbStore.nastaveni.vip_plus_users && dbStore.nastaveni.vip_plus_users[CURRENT_USER_KEY] === true);
  let isVip = isVipPlus || (dbStore.nastaveni.vip_users && dbStore.nastaveni.vip_users[CURRENT_USER_KEY] === true);
  
  const body = document.getElementById('appBody');
  if (isVip) { body.classList.add('is-vip'); } else { body.classList.remove('is-vip'); }
  if (isAdmin) { body.classList.add('is-admin'); } else { body.classList.remove('is-admin'); }

  if (Alpine.store('appState')) {
      let ls = Alpine.store('appState').currentScreen;
      Alpine.store('appState').isVip = isVip;
      Alpine.store('appState').isVipPlus = isVipPlus; 
      Alpine.store('appState').isEditor = isEditor;
      Alpine.store('appState').isAdmin = isAdmin;

      if (!isEditor && Alpine.store('appState').isEditMode) Alpine.store('appState').toggleEdit();
      if (!isVip && ls === 'compareScreen' && initialDataLoaded) {
          if (typeof goToScreen === 'function') goToScreen('searchScreen');
          if (typeof showToast === 'function') showToast("VIP přístup byl odebrán. Přístup odepřen.");
      }
  }

  // === LOGIKA PRO PROFIL V MENU ===
  let profDiv = document.getElementById('menuUserProfile');
  if (profDiv && CURRENT_USER_KEY) {
      let roleName = "Čtenář";
      let roleClass = "";
      let emoji = "👤"; // Výchozí panáček

      if (isAdmin) { roleName = "Administrátor"; roleClass = "badge-admin"; emoji = "👑"; }
      else if (isEditor) { roleName = "Editor"; roleClass = "badge-editor"; emoji = "🗝️"; }
      else if (isVipPlus) { roleName = "VIP Plus"; roleClass = "badge-vipplus"; emoji = "☄️"; }
      else if (isVip) { roleName = "VIP"; roleClass = "badge-vip"; emoji = "⭐"; }

      let uData = dbStore.uzivatele_roster[CURRENT_USER_KEY] || {};
      let customNick = (dbStore.nastaveni.prezdivky && dbStore.nastaveni.prezdivky[CURRENT_USER_KEY]) || uData.vlastniJmeno;
      let jehoVlastniPrezdivka = customNick || CURRENT_EMAIL;

      let emailEl = document.getElementById('menuUserEmail');
      let nickEl = document.getElementById('menuUserNick');
      let roleEl = document.getElementById('menuUserRole');
      let avatarEl = document.getElementById('menuUserAvatar');

      if (nickEl) nickEl.innerText = jehoVlastniPrezdivka;
      if (emailEl) emailEl.innerText = CURRENT_EMAIL;
      
      if (roleEl) {
          roleEl.innerText = roleName;
          roleEl.className = "menu-user-role badge-role " + roleClass; 
      }
      
      if (avatarEl) {
          avatarEl.innerText = emoji;
      }
      
      profDiv.style.display = 'flex';
  }
}

// 🚀 FUNKCE PRO ROLETKU V ADMIN PANELU S EXPLICITNÍM TOKENEM
async function zmenitRoli(uid, novaRole) {
    if (isLoggingIn || (typeof isManuallyDisconnected !== 'undefined' && isManuallyDisconnected) || !navigator.onLine || !cloudFunctions) { 
        if(typeof showToast === 'function') showToast("⛔ Potřebuješ internet a funkční spojení k úpravě rolí!"); return; 
    }

    let currentUser = auth.currentUser;
    if (!currentUser) {
        if(typeof showToast === 'function') showToast("⛔ Nejsi přihlášený v aplikaci!"); return;
    }

    if(typeof showToast === 'function') showToast("Měním roli na serveru, vydrž...");
    
    try {
        const zmenitRoliServer = cloudFunctions.httpsCallable('zmenitRoliServer');
        await zmenitRoliServer({ uid: uid, role: novaRole });
        
        if(typeof showToast === 'function') showToast("Role úspěšně uložena (Server potvrzen)!");
    } catch (e) {
        console.error("Chyba ze serveru:", e);
        if(typeof showToast === 'function') showToast("❌ Chyba změny role: " + e.message);
    }
}

// 🚀 FUNKCE PRO ZMRAZENÍ
async function toggleFreezeStatus(uid, status) {
    if (isLoggingIn || (typeof isManuallyDisconnected !== 'undefined' && isManuallyDisconnected) || !navigator.onLine || !cloudFunctions) { 
        if(typeof showToast === 'function') showToast("⛔ Potřebuješ internet a funkční spojení k úpravě zmrazení!"); return; 
    }

    let currentUser = auth.currentUser;
    if (!currentUser) {
        if(typeof showToast === 'function') showToast("⛔ Nejsi přihlášený v aplikaci!"); return;
    }

    if(typeof showToast === 'function') showToast("Odesílám rozsudek na server...");

    try {
        const zmrazitServer = cloudFunctions.httpsCallable('zmrazitUzivateleServer');
        await zmrazitServer({ uid: uid, isFrozen: status });
        
        if(typeof showToast === 'function') showToast(status ? "Účet tvrdě zmrazen!" : "Účet odmrazen!");
    } catch (e) {
        console.error("Chyba mrazáku:", e);
        if(typeof showToast === 'function') showToast("❌ Chyba mrazáku: " + e.message);
    }
}

function getReadableDevice() {
    const ua = navigator.userAgent;
    if (ua.includes("Samsung")) return "Samsung Phone";
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("Windows")) return "Windows PC";
    if (ua.includes("Android")) return "Android Device";
    return "Mobilní zařízení";
}

function getDeviceId() {
    let did = localStorage.getItem('linka_device_id');
    if (!did) {
        did = 'TAB-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        localStorage.setItem('linka_device_id', did);
    }
    return did;
}

// 🛡️ CHYTRÉ PŘIHLÁŠENÍ S ŽIVOU OBČANKOU
async function checkLogin() {
  const userEmail = document.getElementById('username').value.trim().toLowerCase();
  const p = document.getElementById('password').value.trim();
  if(!userEmail || !p) { if(typeof showToast === 'function') showToast("Musíš zadat e-mail i heslo!"); return; }

  let btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.innerText = "OVĚŘUJI...";

  isLoggingIn = true; // ZÁMEK: Tímto říkáme databázovému listeneru "Nesahej na oponu!"

  // 1. ZAPNUTÍ OPONY: Ručně zvedneme plentu, protože z HTML je vypnutá
  let splash = document.getElementById('splashScreen');
  if (splash) {
      splash.style.display = 'flex';
      requestAnimationFrame(() => { splash.style.opacity = '1'; });
      let t1 = document.getElementById('splashTitleText');
      if (t1) t1.style.display = 'block';
      let t2 = document.getElementById('splashSubText');
      if (t2) {
          t2.style.display = 'block';
          t2.innerText = "Ověřuji a stahuji data...";
      }
  }

  // 2. PROBUZENÍ SÍTĚ: Pokud mobil usnul po minulém zmrazení, nahodíme mu dráty
  if (!isManuallyDisconnected) {
      db.enableNetwork().catch(e => console.warn(e));
  }

  let hasAgreed = localStorage.getItem('eulaEnterprise3') === 'true';
  if (!hasAgreed && typeof toggleWakeLock === 'function') { toggleWakeLock(true); }

  try {
      let userCredential = await auth.signInWithEmailAndPassword(userEmail, p);
      let uid = userCredential.user.uid;
      
      // 3. ŽIVÁ OBČANKA: Zjistíme stav přímo od Googlu, ne z offline paměti
      let idTokenResult = await userCredential.user.getIdTokenResult(true);
      
      if (idTokenResult.claims.isFrozen === true) {
          isLoggingIn = false;
          checkIfFrozen(true); // Posíláme povel k tvrdému zmrazení
          return;
      }

      // 4. OČISTA: Pokud ho server pustil, smažeme lokální paměť o jeho zmrazení
      let dbStore = Alpine.store('trezor');
      if (dbStore.nastaveni && dbStore.nastaveni.zmrazeni && dbStore.nastaveni.zmrazeni[uid]) {
          delete dbStore.nastaveni.zmrazeni[uid];
      }

      let devId = getDeviceId();
      let devName = getReadableDevice();

      if (cloudFunctions) {
          const zalogovatPrihlaseni = cloudFunctions.httpsCallable('zalogovatPrihlaseniServer');
          await zalogovatPrihlaseni({ deviceId: devId, deviceType: devName }).catch(e => console.warn("Logování:", e));
      }
      await db.collection('uzivatele_online').doc(uid).set({ deviceId: devId }); 

      localStorage.setItem("casPrihlaseni", Date.now());
      btn.disabled = false; btn.innerText = "VSTOUPIT";
      document.getElementById('loginError').style.display = 'none';

      // 5. SMĚROVÁNÍ (ROUTING)
      if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
          let state = Alpine.store('appState');
          
          if (!hasAgreed) {
              state.setScreen('settingsScreen', false);
              history.replaceState({screen: 'settingsScreen'}, "", "");
              if (typeof ukazEulaModal === 'function') ukazEulaModal(true);
          } else {
              let lastScreen = state.currentScreen || 'searchScreen';
              if (lastScreen === 'loginScreen') lastScreen = 'searchScreen';
              history.replaceState({screen: lastScreen}, "", "");
              
              if (lastScreen === 'resultsScreen') { 
                  if (state.compareMode !== 'ne') {
                      let el = document.getElementById('compareContainer');
                      if (el && el._x_dataStack) { 
                          el._x_dataStack[0].initCompareAction();
                      }
                  } else if (state.activeCode) {
                      showResults(state.activeCode, false);
                  } else {
                      state.setScreen('searchScreen', false);
                  }
              } 
              else if (lastScreen === 'katalogDetailScreen') {
                  state.setScreen('katalogDetailScreen', false);
              } else {
                  state.setScreen('searchScreen', false);
              }
          }
      }

      // 6. KONEČNÁ OPONA: Synchronní předání po dokončení renderu bez odpočítávání času
      requestAnimationFrame(() => {
          if (initialDataLoaded && typeof window.zvedniOponu === 'function') {
              window.zvedniOponu();
          }
          isLoggingIn = false;
      });

  } catch (error) {
      isLoggingIn = false;
      // 🎭 OPONA ZÁCHRANA: Přihlášení selhalo. Musíme oponu ihned zvednout, abys viděl chybovou hlášku.
      if (typeof window.zvedniOponu === 'function') window.zvedniOponu();
      
      btn.disabled = false; btn.innerText = "VSTOUPIT";
      
      console.error("Podrobný log chyby přihlášení:", error);
      
      let errorMsg = "";
      
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
          errorMsg = "❌ Špatné heslo nebo e-mail!";
      } else if (error.code === "auth/network-request-failed") {
          errorMsg = "❌ Chyba sítě - zkontroluj připojení!";
      } else if (error.code === "auth/user-not-found") {
          errorMsg = "❌ Účet neexistuje!";
      } else if (error.code === "auth/too-many-requests") {
          errorMsg = "❌ Zablokováno (příliš mnoho pokusů). Zkuste to za chvíli.";
      } else if (error.code === "permission-denied") {
          errorMsg = "❌ Účet ověřen, ale přístup do databáze byl zamítnut.";
          auth.signOut(); 
      } else {
          const safeMessage = vycistiText(error.message || 'Neznámá chyba');
          const safeCode = vycistiText(error.code || 'ERR');
          errorMsg = `❌ CHYBA: ${safeMessage} <br><span style="font-size:10px">(${safeCode})</span>`;
      }

      document.getElementById('loginError').innerHTML = errorMsg; 
      document.getElementById('loginError').style.display = 'block'; 
  }
}

function logout() {
    // 🚀 ASYNCHRONNÍ ČEKÁNÍ: Spustíme odhlášení a počkáme, až databáze potvrdí uložení kompletního data s rokem
    let rampa = (typeof nahlasMojeSpojeni === 'function') ? nahlasMojeSpojeni(false) : Promise.resolve();
    
    Promise.resolve(rampa).finally(() => {
        auth.signOut().then(() => { 
            localStorage.removeItem('casPrihlaseni'); 
            window.location.reload(); 
        }).catch(() => { window.location.reload(); });
    });
}

function loadSecurityLogs() {
    let listDiv = document.getElementById('adminSecurityList');
    if (listDiv) listDiv.innerHTML = "<div style='padding: 20px; text-align: center; color: #94a3b8;'>Načítám data ze serveru... ⏳</div>";

    db.collection('security_logs').orderBy('time', 'desc').onSnapshot((snapshot) => {
        if(!listDiv) return;
        
        if (snapshot.empty) { listDiv.innerHTML = "<div style='padding: 20px; text-align: center; color: #94a3b8;'>Zatím žádná historie (Zlatá kniha je prázdná).</div>"; return; }
        
        let dbStore = Alpine.store('trezor');
        let html = '';
        let logs = [];
        snapshot.forEach((doc) => { logs.push(doc.data()); });
        logs.sort((a, b) => b.time - a.time);
        
        logs.forEach((p) => {
            // Záznamy Vlastníka jsou v auditní historii skryté
            if (dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[p.uid]) return;

            let d = new Date(p.time);
            let timeStr = d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'});
            let keyToFind = p.uid;
            let rawNick = (dbStore.nastaveni.prezdivky && dbStore.nastaveni.prezdivky[keyToFind]) ? dbStore.nastaveni.prezdivky[keyToFind] : p.email;
            
            let esc = (str) => typeof vycistiText === 'function' ? vycistiText(str) : String(str || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
            let safeNick = esc(rawNick);
            let safeEmail = esc(p.email);
            let safeDeviceId = esc(p.deviceId || 'Neznámé');
            let safeDeviceStr = p.deviceType ? `(${esc(p.deviceType)})` : '';
            
            let iconText = p.isNewDevice ? '🚨 NOVÉ ZAŘÍZENÍ' : '✅ Běžné přihlášení';
            let color = p.isNewDevice ? '#ef4444' : '#10b981';

            html += `<div class="sec-log-row">
                        <span class="sec-log-nick">${safeNick}</span> <span class="sec-log-email">(${safeEmail})</span> <span class="sec-log-device">[${safeDeviceId}]</span><br>
                        <span class="sec-log-time">${timeStr} ${safeDeviceStr} - <span style="color:${color}; font-weight:bold;">${iconText}</span></span>
                     </div>`;
        });
        listDiv.innerHTML = html;
    }, (error) => {
        // 🚀 PROFI CHYTAČ CHYB: Vypíše přesný důvod selhání rovnou na obrazovku!
        if (listDiv) {
            const safeErr = vycistiText(error.message || 'Chyba serveru');
            listDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center; font-weight: bold; border: 1px dashed #ef4444; margin-top: 10px; border-radius: 8px;">
                ❌ CHYBA NAČÍTÁNÍ HISTORIE:<br>
                <span style="font-size: 11px; font-weight: normal;">${safeErr}</span>
            </div>`;
        }
        console.error("Chyba při stahování historie:", error);
    });
}

async function smazatHistoriiPsu() {
    let userConfirmed = await showCustomModal({ title: "Spláchnout historii?", message: "Opravdu chceš smazat celou historii přihlášení (Zlatou knihu)?", type: "confirm" });
    if(userConfirmed) {
        let listDiv = document.getElementById('adminSecurityList');
        if(listDiv) listDiv.innerHTML = "Splachuji historii na pozadí, vydrž... 🚽";
        
        (async () => {
            try {
                while (true) {
                    let snapshot = await db.collection('security_logs').limit(500).get();
                    if (snapshot.empty) break;
                    let batch = db.batch();
                    snapshot.docs.forEach((doc) => { batch.delete(doc.ref); });
                    await batch.commit();
                }
                if (typeof showToast === 'function') showToast("Historie byla úspěšně spláchnuta! 🚽");
                if (listDiv) listDiv.innerHTML = "Zatím žádná historie.";
            } catch (err) {
                if (typeof showToast === 'function') showToast("❌ Chyba při mazání: " + err);
                if (listDiv) listDiv.innerHTML = "Chyba při mazání historie.";
            }
        })();
    }
}

function zobrazitHistoriiUzivatele(uid) {
    let dbStore = Alpine.store('trezor');
    let userRoster = dbStore.uzivatele_roster[uid];
    if (!userRoster || !userRoster.loginHistory || userRoster.loginHistory.length === 0) {
        if(typeof showToast === 'function') showToast("Pro tohoto uživatele zatím nemáme uloženou historii.");
        return;
    }
    let esc = (str) => typeof vycistiText === 'function' ? vycistiText(str) : String(str || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
    let html = "<div style='text-align:left; font-size:13px; line-height:1.5;'>";
    userRoster.loginHistory.forEach((log, i) => {
        let d = new Date(log.time);
        let timeStr = d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'});
        let safeDeviceType = esc(log.deviceType || 'Neznámé');
        let safeDeviceId = esc(log.deviceId || 'N/A');
        html += `<b>${i+1}.</b> ${timeStr} <br><span style='color:#64748b; font-size:11px;'>Zařízení: ${safeDeviceType} [${safeDeviceId}]</span><hr style='border:0; border-top:1px solid #e2e8f0; margin:5px 0;'>`;
    });
    html += "</div>";
    showCustomModal({ title: `Posledních 5 přihlášení:`, message: html, type: "confirm" }); 
}

function openAdminSettings() {
  if (typeof closeMenu === 'function') closeMenu();
  let dbStore = Alpine.store('trezor');
  let isOwner = (dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[CURRENT_USER_KEY] === true);
  let jeAdmin = isOwner || (dbStore.nastaveni.admin_users && dbStore.nastaveni.admin_users[CURRENT_USER_KEY] === true);
  
  if (!jeAdmin) {
      if (typeof showToast === 'function') showToast("❌ Na tuto stránku nemáš přístup!");
      if (typeof goToScreen === 'function') goToScreen('searchScreen', false);
      return;
  }

  document.getElementById('adminAnnActive').value = dbStore.hlaseni.isActive ? "true" : "false";
  document.getElementById('adminAnnText').value = dbStore.hlaseni.text;
  document.getElementById('adminAnnId').value = dbStore.hlaseni.id;
  loadSecurityLogs();
  if (typeof goToScreen === 'function') goToScreen('adminScreen');
}

function saveAdminSettings() {
  const newAnnouncement = {
      isActive: document.getElementById('adminAnnActive').value === "true",
      text: document.getElementById('adminAnnText').value.trim(),
      id: document.getElementById('adminAnnId').value.trim()
  };
  db.collection('linka_data').doc('hlaseni').set(newAnnouncement).then(() => { 
      if (typeof showToast === 'function') showToast("Hlášení uloženo!"); 
  });
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById('adminTab-' + tab).classList.add('active');
}

function zobrazitUpravyAdmin() {
  let listDiv = document.getElementById('adminUpravyList');
  if (listDiv.style.display === 'block') { listDiv.style.display = 'none'; return; }
  
  let dbStore = Alpine.store('trezor');
  let poleUprav = [];
  
  for (let k in dbStore.upravy) {
      let rawData = dbStore.upravy[k];
      if (typeof rawData === 'object' && rawData !== null) {
          poleUprav.push({ id: k, data: rawData, time: rawData.time || 0 });
      } else {
          poleUprav.push({ id: k, data: rawData, time: 0 });
      }
  }
  
  poleUprav.sort((a, b) => b.time - a.time);

  let out = "";
  poleUprav.forEach(item => {
      let rawData = item.data;
      if (typeof rawData === 'object') {
          let val = (typeof vycistiText === 'function') ? vycistiText(rawData.val) : rawData.val;
          let emailFromRoster = dbStore.uzivatele_roster[rawData.by] ? dbStore.uzivatele_roster[rawData.by].email : 'Neznámý';
          let prezdivka = rawData.by ? (dbStore.nastaveni.prezdivky[rawData.by] || emailFromRoster) : 'Neznámý';
          let cas = rawData.time ? new Date(rawData.time).toLocaleString('cs-CZ', {day:'numeric', month:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Očištěno';
          
          out += `<div class="admin-upravy-row">
                    <div class="admin-upravy-key">${item.id}</div>
                    <div class="admin-upravy-val">${val}</div>
                    <div class="admin-upravy-meta">Změnil: <span class="admin-upravy-author">${prezdivka}</span> (${cas})</div>
                  </div>`;
      } else {
          let bezpecnaHodnota = (typeof vycistiText === 'function') ? vycistiText(rawData) : rawData;
          out += `<div class="admin-upravy-row-old"><b>${item.id}</b>: <span class="admin-upravy-val">${bezpecnaHodnota}</span> <span class="admin-upravy-meta">(Pročištěný záznam)</span></div>`;
      }
  });

  listDiv.innerHTML = out === "" ? "V cloudu nejsou uloženy žádné ruční úpravy." : out;
  listDiv.style.display = 'block';
}

function stahnoutZalohu() {
    let dbStore = Alpine.store('trezor');
    if (Object.keys(dbStore.upravy).length === 0) {
        if (typeof showToast === 'function') showToast("Není co zálohovat, žádné úpravy neexistují.");
        return;
    }
    let textZalohy = "ZÁLOHA RUČNÍCH ÚPRAV (Moje Linka)\n";
    let d = new Date();
    textZalohy += "Vytvořeno: " + d.toLocaleDateString('cs-CZ') + " " + d.toLocaleTimeString('cs-CZ') + "\n";
    textZalohy += "=========================================\n\n";

    for (let key in dbStore.upravy) {
        let rawData = dbStore.upravy[key];
        if (typeof rawData === 'object' && rawData !== null) {
            let prezdivka = rawData.by ? (dbStore.nastaveni.prezdivky[rawData.by] || rawData.by) : 'Neznámý';
            let cas = rawData.time ? new Date(rawData.time).toLocaleString('cs-CZ') : 'Očištěno';
            textZalohy += `${key}: ${rawData.val} (Změnil: ${prezdivka}, ${cas})\n`;
        } else {
            textZalohy += `${key}: ${rawData}\n`;
        }
    }

    let blob = new Blob([textZalohy], { type: "text/plain;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Zaloha-Linka-${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof showToast === 'function') showToast("Záloha byla stažena!");
}

async function zmenitPrezdivku(uid, currentNick) {
    let novyNick = await showCustomModal({ title: "Změna přezdívky", inputValue: currentNick, type: "prompt" });
        if (novyNick !== null && novyNick.trim() !== "") {
            db.collection('linka_data').doc('nastaveni').set({ prezdivky: { [uid]: novyNick.trim() } }, {merge: true})
            .then(() => { if (typeof showToast === 'function') showToast("Přezdívka uložena!"); });
        }
    }

    async function ulozMojeJmeno() {
        let inputEl = document.getElementById('mojePrezdivkaInput');
        if (!inputEl) return;
        let novyNick = inputEl.value.trim();

        if (!novyNick) {
            if (typeof showToast === 'function') showToast("Musíš zadat přezdívku!");
            return;
        }
        if (!CURRENT_USER_KEY) {
            if (typeof showToast === 'function') showToast("Nejsi přihlášen!");
            return;
        }

        let dbStore = Alpine.store('trezor');
        let isOwner = dbStore.nastaveni.owner_users && dbStore.nastaveni.owner_users[CURRENT_USER_KEY] === true;

        try {
            if (isOwner) {
                // Vlastník ukládá do privátní mapy nastavení (nezapisuje se do veřejného seznamu uživatelů)
                await db.collection('linka_data').doc('nastaveni').set({
                    prezdivky: { [CURRENT_USER_KEY]: novyNick }
                }, { merge: true });
                dbStore.nastaveni.prezdivky[CURRENT_USER_KEY] = novyNick;
            } else {
                // Běžný uživatel ukládá do své karty uživatele
                await db.collection('linka_data').doc('uzivatele').set({
                    [CURRENT_USER_KEY]: { vlastniJmeno: novyNick }
                }, { merge: true });
                if (!dbStore.uzivatele_roster[CURRENT_USER_KEY]) dbStore.uzivatele_roster[CURRENT_USER_KEY] = {};
                dbStore.uzivatele_roster[CURRENT_USER_KEY].vlastniJmeno = novyNick;
            }

            applyUserRights();
            if (typeof showToast === 'function') showToast("Přezdívka úspěšně uložena!");
        } catch (err) {
            if (typeof showToast === 'function') showToast("❌ Chyba při ukládání: " + err.message);
        }
    }

function toggleUserStatus(typKategorie, safeKey, novyStav) {
  if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
      if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro změnu práv potřebuješ signál!"); return;
  }
  if(novyStav) {
      db.collection('linka_data').doc('nastaveni').set({ [typKategorie]: { [safeKey]: true } }, {merge: true})
      .then(() => { if(typeof showToast === 'function') showToast("Stav uložen!"); });
  } else {
      db.collection('linka_data').doc('nastaveni').set({ [typKategorie]: { [safeKey]: firebase.firestore.FieldValue.delete() } }, {merge: true})
      .then(() => { if(typeof showToast === 'function') showToast("Stav odebrán!"); });
  }
}

function toggleConnection() {
  isManuallyDisconnected = !isManuallyDisconnected;
  localStorage.setItem('isManuallyDisconnected', isManuallyDisconnected ? 'ano' : 'ne');
  const gear = document.getElementById('gearIcon');
  if (isManuallyDisconnected) {
      if(gear) gear.style.transform = 'rotate(180deg)';
      localStorage.setItem('casRucnihoOdpojeni', Date.now());
      db.disableNetwork();
      if (typeof showToast === 'function') showToast("Odpojeno ručně, nevyužívá žádné internetové připojení.");
  } else {
      if(gear) gear.style.transform = 'rotate(0deg)';
      localStorage.removeItem('casRucnihoOdpojeni');
      db.enableNetwork();
      if (typeof showToast === 'function') showToast("Znovu připojeno");
  }
  updateOnlineStatus();
}

async function isActuallyOnline() {
    // Čistá, rychlá a spolehlivá kontrola přes prohlížeč (žádné dotazování serverů RTDB)
    return navigator.onLine;
}

async function updateOnlineStatus() {
  const s = document.getElementById('connectionStatus'); 
  const t = document.getElementById('statusText');
  const gear = document.getElementById('gearIcon');
  const logoutBtn = document.querySelector('.btn-logout-menu');
  
  let actuallyOnline = false;
  if (!isManuallyDisconnected) {
      actuallyOnline = await isActuallyOnline();
  }
  let isOffline = isManuallyDisconnected || !actuallyOnline;

  if (isManuallyDisconnected) {
      if(s) s.className = 'status-badge status-manual-offline';
      let casOdpojeni = localStorage.getItem('casRucnihoOdpojeni');
      if (casOdpojeni) {
          let d = new Date(parseInt(casOdpojeni));
          let timeStr = d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'});
          if(t) t.innerText = 'OFFLINE (Ručně od ' + timeStr + ')';
      } else {
          if(t) t.innerText = 'OFFLINE (Ručně)';
      }
      if(gear) gear.style.transform = 'rotate(180deg)';
  } else {
      if(gear) gear.style.transform = 'rotate(0deg)';
  }
  
  if (isOffline) {
      if(!isManuallyDisconnected) {
          if(s) s.className = 'status-badge status-offline'; 
          let lastSync = localStorage.getItem('posledniAktualizace'); 
          let d = lastSync ? new Date(parseInt(lastSync)) : new Date(); 
          let timeStr = d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'}); 
          if(t) t.innerText = '⚠️ Žádný signál od ' + timeStr;
      }
      if(logoutBtn) {
          logoutBtn.innerText = "⛔ OFFLINE (Nelze odhlásit)";
          logoutBtn.style.background = "#64748b";
          logoutBtn.style.borderColor = "#94a3b8";
      }
  } else {
      if(s) s.className = 'status-badge status-online'; 
      if(t) t.innerText = 'ONLINE'; 
      localStorage.setItem('posledniAktualizace', Date.now());
      if(logoutBtn) {
          logoutBtn.innerText = "❌ Odhlásit";
          logoutBtn.style.background = "#b91c1c";
          logoutBtn.style.borderColor = "#fca5a5";
      }
  }
}
window.addEventListener('online', updateOnlineStatus); window.addEventListener('offline', updateOnlineStatus); updateOnlineStatus();

// =========================================================================
// 📡 NEPRŮSTŘELNÝ PRESENCE MODUL S PROMISE POJISTKOU (RULES APPROVED)
// =========================================================================
function nahlasMojeSpojeni(budeOnline) {
    const uid = window.currentUid || CURRENT_USER_KEY || (auth.currentUser ? auth.currentUser.uid : null);
    if (!uid) return Promise.resolve();

    if (budeOnline) {
        return db.collection('uzivatele_online').doc(uid).set({ deviceId: getDeviceId() }).catch(() => {});
    } else {
        let smazatOnline = db.collection('uzivatele_online').doc(uid).delete().catch(() => {});
        
        // Rules Approved zápis: Posílá kompletní ISO časové razítko včetně roku
        let zapsatOdchod = db.collection('linka_data').doc('uzivatele').set({
            [uid]: { odpojen: new Date().toISOString() }
        }, { merge: true }).catch(() => {});
        
        return Promise.all([smazatOnline, zapsatOdchod]);
    }
}

document.addEventListener('visibilitychange', () => {
    nahlasMojeSpojeni(document.visibilityState === 'visible');
});

window.addEventListener('pagehide', () => {
    nahlasMojeSpojeni(false);
});

auth.onAuthStateChanged((user) => {
    if (user) {
        CURRENT_USER_KEY = user.uid;
        window.currentUid = user.uid; // Bezpečné zálohování pro kritické systémové události okna
        nahlasMojeSpojeni(true);
    }
});