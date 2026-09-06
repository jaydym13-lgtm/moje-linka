// =========================================================================
// 🧠 JÁDRO APLIKACE A ROUTOVÁNÍ
// =========================================================================

// 🛠️ MIGRACE STARÝCH DAT A OCHRANA PŘED REFREŠEM
const stareKlice = ['lastScreen', 'activeCode', 'lastBaseCode', 'compareOld', 'compareNew', 'isCompareMode', 'activeProg'];
stareKlice.forEach(k => {
    let val = localStorage.getItem(k);
    if (val !== null && !val.startsWith('"') && !val.startsWith('{') && !val.startsWith('[')) {
        localStorage.setItem(k, JSON.stringify(val));
    }
});

// 🛡️ CSP COMPLIANT INICIALIZACE SPLASH SCREENU
if (localStorage.getItem('casPrihlaseni')) {
    const ss = document.getElementById('splashScreen');
    const t1 = document.getElementById('splashTitleText');
    const t2 = document.getElementById('splashSubText');
    if (ss) { ss.style.display = 'flex'; ss.style.opacity = '1'; }
    if (t1) t1.style.display = 'block';
    if (t2) t2.style.display = 'block';
}

// 🚀 OCHRANA WIZZARDU: Pokud appka startuje a v paměti visí wizzard, vykopneme ho do Adminu
let storedLastScreen = localStorage.getItem('lastScreen');
if (storedLastScreen && storedLastScreen.includes('wizard')) {
    localStorage.setItem('lastScreen', JSON.stringify('adminScreen'));
}

// 🎭 OPONA: Deterministické skrytí po dokončení CSS animace (bez časovače)
window.zvedniOponu = function() {
    let splash = document.getElementById('splashScreen');
    if (splash && splash.style.display !== 'none') {
        splash.style.opacity = '0';
        const onEnd = () => {
            splash.style.display = 'none';
            splash.removeEventListener('transitionend', onEnd);
        };
        splash.addEventListener('transitionend', onEnd);
    }
};

// 🧠 CHYTRÝ MATCHER PRO ROLETKY (ZABRÁNÍ PÁDU DO "VYPNUTO" PŘI POUTÁNÍ NA MATKU)
window.najdiHodnotuProRoletku = function(strojId, rawVal, dSablona) {
    if (!rawVal || !dSablona) return rawVal;
    let stroj = null;
    for (let sekce in dSablona) {
        if (Array.isArray(dSablona[sekce])) {
            stroj = dSablona[sekce].find(s => s.id === strojId);
            if (stroj) break;
        }
    }
    if (stroj && stroj.type === 'select') {
        let volby = stroj.options || (stroj.optionsStr ? stroj.optionsStr.split(';').map(s => s.trim()).filter(Boolean) : []);
        let nalezenaVolba = volby.find(opt => opt === rawVal || opt.startsWith(rawVal + ' '));
        if (nalezenaVolba) return nalezenaVolba;
    }
    return rawVal;
};

// 🔌 GLOBÁLNÍ SDÍLENÍ: Šablona je nyní přístupná pro všechny skripty v aplikaci
window.DEFAULT_SABLONA = {
    pekarna: [
        { id: "pekVel", label: "Velikost", type: "text" },
        { id: "pekVyk", label: "Vykrajovák", type: "text" },
        { id: "pekPln", label: "Plnička", type: "select", options: ["Vypnuto", "Sýr", "Omáčka", "Ručně párky", "Dodáme"] },
        { id: "pekJez", label: "Ježek", type: "select", options: ["Ano", "Ne", "Dodáme"] }
    ],
    kynarna: [
        { id: "kynZac", label: "Začátek mezery", type: "number", unit: "s" },
        { id: "kynMez", label: "Mezera", type: "number", unit: "s" },
        { id: "kynDp", label: "Plný DP", type: "number" },
        { id: "kynDp6", label: "DP 1-6", type: "number", unit: "s" },
        { id: "kynPas", label: "Počet pásů", type: "number" },
        { id: "kynTep", label: "Teplota", type: "number", unit: "°C" },
        { id: "kynVlh", label: "Vlhkost", type: "number", unit: "%" }
    ],
    pec: [
        { id: "pecZ1t", label: "Zóna 1 Teplota", type: "number", unit: "°C" },
        { id: "pecZ1p1", label: "Zóna 1 PL 1", type: "number", unit: "%" },
        { id: "pecZ1p2", label: "Zóna 1 PL 2", type: "number", unit: "%" },
        { id: "pecZ2t", label: "Zóna 2 Teplota", type: "number", unit: "°C" },
        { id: "pecZ2p1", label: "Zóna 2 PL 1", type: "number", unit: "%" },
        { id: "pecZ2p2", label: "Zóna 2 PL 2", type: "number", unit: "%" },
        { id: "pecZ3t", label: "Zóna 3 Teplota", type: "number", unit: "°C" },
        { id: "pecZ3p1", label: "Zóna 3 PL 1", type: "number", unit: "%" },
        { id: "pecZ3p2", label: "Zóna 3 PL 2", type: "number", unit: "%" },
        { id: "pecZ4t", label: "Zóna 4 Teplota", type: "number", unit: "°C" },
        { id: "pecZ4p1", label: "Zóna 4 PL 1", type: "number", unit: "%" },
        { id: "pecZ4p2", label: "Zóna 4 PL 2", type: "number", unit: "%" },
        { id: "pecZ5t", label: "Zóna 5 Teplota", type: "number", unit: "°C" },
        { id: "pecZ5p1", label: "Zóna 5 PL 1", type: "number", unit: "%" },
        { id: "pecZ5p2", label: "Zóna 5 PL 2", type: "number", unit: "%" },
        { id: "pecCas", label: "Pečná doba", type: "number", unit: "minut" },
        { id: "pecJez", label: "Ježek", type: "select", options: ["Ano", "Ne", "Dodáme"] },
        { id: "pecOd1", label: "Odtah 1", type: "select", options: ["Vypnuto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Dodáme"] },
        { id: "pecOd2", label: "Odtah 2", type: "select", options: ["Vypnuto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Dodáme"] },
        { id: "pecOd3", label: "Odtah 3", type: "select", options: ["Vypnuto", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Dodáme"] }
    ],
    pecPrujezd: [
        { id: "pecCas", label: "Průjezd studenou pecí", type: "number", unit: "minut" },
        { id: "pecJez", label: "Ježek", type: "select", options: ["Ano", "Ne", "Dodáme"] }
    ],
    pripravna: [
        { id: "priProg", label: "Program", type: "text" },
        { id: "priPuf", label: "Puffer", type: "select", options: ["Modrý pás", "Válečky a rovně", "Válečky a do \"V\"", "Válečky užší", "Sjezdový plech", "Text", "Dodáme"] },
        { id: "priKec", label: "Kečup", type: "select", options: ["Vypnuto", "Vodopád", "Kapky 20,5 cm", "Kapky 22 cm", "Kapky 24 cm", "Kapky 26 cm", "Kapky 28 cm", "Dodáme"] },
        { id: "priRad", label: "Počet v řadě", type: "number" },
        { id: "priZdo1", label: "Zdobící pás č.1", type: "select", options: ["Vypnuto", "Zdobička č. 1", "Zdobička č. 2", "Dodáme"] },
        { id: "priZdo2", label: "Zdobící pás č.2", type: "select", options: ["Vypnuto", "Zdobička č. 1", "Zdobička č. 2", "Dodáme"] },
        { id: "alimecMat", label: "Alimec matrice", type: "select", options: ["Vypnuto", "38 mm", "48 mm", "Dodáme"] },
        { id: "alimecKol", label: "Počet koleček", type: "select", options: ["Vypnuto", "6", "7", "8", "9", "13", "15", "Dodáme"] },
        { id: "maslicko", label: "Máslíčko", type: "select", options: ["Vypnuto", "16 kapek", "8 kapek", "5 čárek", "4 čárky", "Dodáme"] },
        { id: "holSyr", label: "Holac Sýr", type: "select", options: ["Vypnuto", "Program 1 (8x29 plátky)", "Program 2 (8x12 plátky)", "Program 3 (4x4x12 sirky)", "Program 4 (4x4x29 sirky)", "Program 5 (8x8 kostky)", "Program 6 (12x16 plátky)", "Program 7 (8x12 chorizo)", "Program 8 (16x24 plátky)", "Program 9 (6x18)", "Program 10 (6x36)", "Program 11 (Véčko)", "Program 12 (4x2x29 sirky)", "Dodáme"] },
        { id: "diskSyr", label: "Disk", type: "text" },
        { id: "holSal", label: "Holac Salám", type: "select", options: ["Vypnuto", "Program 1 (8x29 plátky)", "Program 2 (8x12 plátky)", "Program 3 (4x4x12 sirky)", "Program 4 (4x4x29 sirky)", "Program 5 (8x8 kostky)", "Program 6 (12x16 plátky)", "Program 7 (8x12 chorizo)", "Program 8 (16x24 plátky)", "Program 9 (6x18)", "Program 10 (6x36)", "Program 11 (Véčko)", "Program 12 (4x2x29 sirky)", "Dodáme"] },
        { id: "diskSal", label: "Disk", type: "text" },
        { id: "priMraz", label: "Zmrazovač", type: "text", unit: "minut" }
    ],
    baleniKrabicky: [
        { id: "nadpis_datumovka", label: "DATUMOVKA", type: "nadpis" },
        { id: "balTrv", label: "Trvanlivost", type: "select", options: ["12 měsíců", "9 měsíců", "Dodáme"] },
        { id: "datumRadky", label: "Počet řádků", type: "select", options: ["1", "2", "Text", "Dodáme"] },
        { id: "nadpis_novopac", label: "NOVOPAC", type: "nadpis" },
        { id: "balKs", label: "Počet kusů", type: "number", unit: "ks" },
        { id: "novoTunel", label: "Sváření fólie a tunel", type: "select", options: ["Zapnuto", "Vypnuto", "Dodáme"] }
    ],
    baleniKarton: [
        { id: "pak1", label: "Režim balení", type: "select", options: ["Do kartonu", "Dodáme"] },
        { id: "balTrv", label: "Datumovka", type: "text" },
        { id: "pak2", label: "Etiketa", type: "select", options: ["Bez etikety", "Kulatá (Program1)", "Hranatá XXL (Program2)", "Dodáme"] }
    ],
    baleniMiropack: [
        { id: "miroProg", label: "Program", type: "number", unit: "" },
        { id: "miroMat", label: "Matrice", type: "text", unit: "" },
        { id: "miro3", label: "3 boční vedení zásobníku", type: "number", unit: "" },
        { id: "miro4", label: "4 výška stoupacího pásu", type: "number", unit: "" },
        { id: "miro6", label: "6 čidlo doplnění krabiček", type: "number", unit: "" },
        { id: "miro7", label: "7 výška přisávání", type: "number", unit: "" },
        { id: "miro8", label: "8 pozice přísavky levá", type: "number", unit: "" },
        { id: "miro9", label: "9 šířka vod. válečku", type: "number", unit: "" },
        { id: "miro10", label: "10 délka vod. válečku", type: "number", unit: "" },
        { id: "miro11", label: "11 vedení dolní klopy", type: "number", unit: "" },
        { id: "miro12", label: "12 poloha můstku", type: "number", unit: "" },
        { id: "miro13", label: "13 výška horní klopy", type: "number", unit: "" },
        { id: "miro14", label: "14 šířka horní chlopně", type: "number", unit: "" },
        { id: "miro15", label: "15 zavírač uší levý", type: "number", unit: "" },
        { id: "miro16", label: "16 výška nástrčného plechu", type: "number", unit: "" },
        { id: "miro17", label: "17 výška zvedače krycí klopy", type: "number", unit: "" },
        { id: "miro18", label: "18 šířka zvedače krycí klopy", type: "number", unit: "" },
        { id: "miro20", label: "20 šířka krabičky", type: "number", unit: "" },
        { id: "miro21", label: "21 lišta lepící hlavy levá", type: "number", unit: "" },
        { id: "miro22", label: "22 lepící hlava levá", type: "number", unit: "" },
        { id: "miro28", label: "28 zavírač uší pravý", type: "number", unit: "" },
        { id: "miro29", label: "29 výška nástrčného plechu", type: "number", unit: "" },
        { id: "miro30", label: "30 lišta lepící hlavy pravá", type: "number", unit: "" },
        { id: "miro31", label: "31 lepící hlava pravá", type: "number", unit: "" }
    ]
};

document.addEventListener('alpine:init', () => {
    // HLAVNÍ STAV APLIKACE
    Alpine.store('appState', {
        isAppReady: false, 
        currentScreen: Alpine.$persist('loginScreen').as('lastScreen'),
        isEditMode: false,
        activeCode: Alpine.$persist(null).as('activeCode'),
        lastBaseCode: Alpine.$persist(null).as('lastBaseCode'),
        compareOld: Alpine.$persist(null).as('compareOld'),
        compareNew: Alpine.$persist(null).as('compareNew'),
        compareOldBase: Alpine.$persist(null).as('compareOldBase'),
        compareNewBase: Alpine.$persist(null).as('compareNewBase'),
        compareMode: Alpine.$persist('ne').as('isCompareMode'),
        compareDetailMode: Alpine.$persist(false).as('compareDetailMode'),
        activeProg: Alpine.$persist(null).as('activeProg'),

        alwaysExpand: Alpine.$persist(false).as('alwaysExpand'), // 🚀 GLOBÁLNÍ DEFAULT STAV PANELŮ

        // Práva uživatele pro UI
        isVip: false,
        isVipPlus: false,
        isEditor: false,
        isAdmin: false,

        // 📲 PWA detekce instalace a platforem
        isStandalone: (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true),
        canInstallPwa: false,
        isIos: (/iphone|ipad|ipod/i.test(navigator.userAgent || '') && !window.MSStream),

        variantModal: {
            isOpen: false,
            baseCode: '',
            variants: [],
            targetInput: '',
            isBaseSelection: false 
        },

        rodokmenModal: { isOpen: false, matka: null, deti: [] },

        openVariantModal(baseCode, variants, targetInput, isBaseSelection = false) {
            this.variantModal.baseCode = baseCode;
            this.variantModal.variants = variants;
            this.variantModal.targetInput = targetInput;
            this.variantModal.isBaseSelection = isBaseSelection;
            this.variantModal.isOpen = true;
        },

        closeVariantModal() {
            this.variantModal.isOpen = false;
        },

        openRodokmenModal(matka, deti) {
            this.rodokmenModal.matka = matka;
            this.rodokmenModal.deti = deti;
            this.rodokmenModal.isOpen = true;
        },

        closeRodokmenModal() { 
            this.rodokmenModal.isOpen = false; 
        },

        setScreen(screenId, pushHistory = true) {
            this.currentScreen = screenId;
            if (pushHistory) history.pushState({screen: screenId}, "", "");
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            updateHeaderTitle(screenId);
        },

        toggleEdit() {
            if (!this.isEditor && !this.isAdmin) {
                if (typeof showToast === 'function') showToast("Nemáš oprávnění k úpravám!");
                return;
            }
            this.isEditMode = !this.isEditMode;
        },
        
        setProduct(code, baseCode) {
            this._closeAllPanels(); 
            this.activeCode = code; 
            this.lastBaseCode = baseCode;
            this.compareMode = 'ne'; 
            
            // RESET ZÁLOŽEK BALENÍ NA "MIROPACK"
            document.querySelectorAll('.baleni-tab-wrapper').forEach(el => {
                if (el._x_dataStack && el._x_dataStack[0]) {
                    el._x_dataStack[0].activeTab = 'miro';
                }
            });

            Alpine.nextTick(() => {
                if(typeof scrollToTop === 'function') scrollToTop();
            });
        },
        
        setCompare(oldC, newC, mode = 'ano') {
            this._closeAllPanels(); 
            this.compareOld = oldC; 
            this.compareNew = newC; 
            this.compareOldBase = null;
            this.compareNewBase = null;
            this.compareMode = mode;
            
            Alpine.nextTick(() => {
                if(typeof scrollToTop === 'function') scrollToTop();
            });
        },
        
        setKatalogProg(progKey) { this.activeProg = progKey; },
        
        _closeAllPanels() {
            document.querySelectorAll('.product-group').forEach(g => g.classList.remove('is-fully-expanded'));
            // ÚKLIDOVÁ ČETA: Nemilosrdně zavře všechny panely na celé obrazovce
            document.querySelectorAll('details').forEach(d => d.removeAttribute('open'));

            // 🚀 ROZUZLENÍ 2.0: Kompletní vyčištění a reset všech stop po hromadném rozbalení z ui.js
            const provedResetBaleni = () => {
                // 1. Vrátíme Alpine.js kartu na výchozí Miropack
                document.querySelectorAll('.baleni-tab-wrapper').forEach(el => {
                    if (el._x_dataStack && el._x_dataStack[0]) {
                        el._x_dataStack[0].activeTab = 'miro';
                    }
                });
                // 2. Pozavíráme vnitřní harmoniky, pokud nějaké zbyly otevřené
                document.querySelectorAll('.baleni-data details, [id*="baleni"] details').forEach(d => d.removeAttribute('open'));
                
                // 3. 🔥 KLÍČOVÝ RESET: Totálně vymažeme vynucené bloky a vrátíme tlačítka přepínání
                document.querySelectorAll('.baleni-inner-content').forEach(tab => tab.style.display = '');
                document.querySelectorAll('.tab-bar').forEach(bar => bar.style.display = '');
            };

            provedResetBaleni();
            Alpine.nextTick(() => provedResetBaleni());
        }
    });

    Alpine.data('wizardVyrobaData', () => ({
        sablona: { pekarna: [], kynarna: [], pec: [], pecPrujezd: [], pripravna: [], baleniKrabicky: [], baleniKarton: [], baleniMiropack: [] },
        stavKodu: '', // 🚀 SLEDOVAČ PRO INLINE SIGNALIZACI WIZZARDU
        form: {
            pecRezim: '', 
            balRezim: '', 
            poloprodukty: [{kod: '', label: ''}],
            sourceCode: '', // Hlavni odkaz na matku
            sourceCodes: { pekarna: '', kynarna: '', pec: '', pripravna: '', baleni: '' }, // 🚀 ADOPTIVNI MATKY
            sync: { pekarna: true, kynarna: true, pec: true, pripravna: true, baleni: true }, // Vypínače
            exceptions: [], // 🚀 POLE PRO LOKÁLNÍ VÝJIMKY 🚀
            tvurce: 'LV',
            pecDig: 'Vždy zapnutá',
            od1: '',
            od2: '',
            od3: '',
            kynDp: '1220'
        },
        // 🚀 PROFI ŘEŠENÍ: Statické pole a bezpečný renderKey pro Alpine.js
        plnySeznamVariant: [],
        
        obnovSeznamMatek() {
            let dbStore = Alpine.store('trezor');
            if (!dbStore || !dbStore.databaze_master || !dbStore.databaze_master.vyroba) {
                this.plnySeznamVariant = [];
                return;
            }
            let seznam = [];
            let sortedBases = Object.keys(dbStore.databaze_master.vyroba).sort();
            for (let base of sortedBases) {
                let main = dbStore.databaze_master.vyroba[base];
                
                if (!main.varianty || !Array.isArray(main.varianty) || main.varianty.length === 0) continue;
                
                let myCode = main.varianty[0].kod;
                let pocetPropojenych = ['pekarna_source', 'kynarna_source', 'pec_source', 'pripravna_source', 'baleni_source'].filter(k => main.spolecne && main.spolecne[k]).length;
                
                // Zjistíme, jestli jsem pro někoho Adoptivní Matka (saje ze mě někdo jiný?)
                let jeAdoptivniMatka = false;
                for (let otherB in dbStore.databaze_master.vyroba) {
                    if (otherB === base) continue;
                    let oMain = dbStore.databaze_master.vyroba[otherB];
                    if (['pekarna_source', 'kynarna_source', 'pec_source', 'pripravna_source', 'baleni_source'].some(k => oMain.spolecne && oMain.spolecne[k] === myCode)) {
                        jeAdoptivniMatka = true; break;
                    }
                }

                // VIP ROLETKA: Pouštíme Matku (0), Hybrida (1-4) a Adoptivní Matky (mají děti).
                // Zbytečné Klony a Rebely (všech 5 sekcí propjeno, ale nemají děti) nekompromisně vykopneme!
                if (jeAdoptivniMatka || pocetPropojenych < 5) {
                    let v = main.varianty[0];
                    let vk = typeof v === 'object' && v !== null ? v.kod : v;
                    let vl = typeof v === 'object' && v !== null ? v.label : v;
                    
                    vk = vk ? String(vk).trim() : "BASE_" + base;
                    vl = vl ? String(vl).trim() : vk;
                    
                    let nazev = (main.nazevBase || 'Neznámý') + (vl === main.nazevBase ? '' : ' - ' + vl);
                    
                    // renderKey zaručuje, že Alpine nepadne ani u logických duplikátů z jiných rodin
                    // 🚀 Ukládáme složený klíč BASE_VARIANTA, abychom udrželi absolutní unikátnost!
                    seznam.push({ renderKey: base + '_' + vk, kod: base + '_' + vk, text: `${base}_${vk} - ${nazev}` });
                }
            }
            this.plnySeznamVariant = seznam;
        },

        init() {
            this.$watch('$store.appState.currentScreen', (val) => {
                if (val === 'wizardVyrobaModal') {
                    this.sablona = nactiSablonu();
                    this.obnovSeznamMatek(); // Načte se bezpečně JEDNOU po otevření okna
                }
            });
            
            // 🚀 ENTERPRISE 3.1: Watcher s pojistkou proti přemazání dat při načítání existující výroby
            this.$watch('form.sourceCode', (newSource) => {
                if (window.isLinkaLoading) return;

                if (!newSource) { 
                    this.form.sync = { pekarna: false, kynarna: false, pec: false, pripravna: false, baleni: false };
                    this.form.sourceCodes = { pekarna: '', kynarna: '', pec: '', pripravna: '', baleni: '' };
                    return; 
                } else {
                    this.form.sync = { pekarna: true, kynarna: true, pec: true, pripravna: true, baleni: true };
                }
                
                let dbStore = Alpine.store('trezor');
                // 🚀 FÁZE 6: Plně rekurzivní načtení matky při změně hlavní roletky
                let motherP = typeof getVariantData === 'function' ? getVariantData(newSource) : null;
                
                if (motherP) {
                    this.form.pecRezim = motherP.pecRezim;
                    this.form.balRezim = motherP.baleniRezim;
                    
                    // 🚀 ENTERPRISE TICK PROTECTION: Počkáme, až se přes x-if vyrenderují správné pod-panely (Karton/Krabičky), a až pak bezpečně nalijeme hodnoty do roletek!
                    Alpine.nextTick(() => {
                        Object.keys(motherP).forEach(k => {
                            if (k === 'nazevBase') return; // 🚀 POJISTKA: Název nové pizzy nikdy nekopírovat ze vzoru!
                            if (!k.includes('source') && !k.includes('Pozn_')) {
                                this.form[k] = window.najdiHodnotuProRoletku(k, motherP[k], this.sablona);
                            }
                        });
                    });
                }
            });
        },
            getSekceStitek(sekce) {
            if (!this.form.sync[sekce]) return '🔓 UNIKÁTNÍ';

            let stroje = [];
            if (sekce === 'pec' && this.form.pecRezim === 'sablona') stroje = this.sablona.pecPrujezd || [];
            else if (sekce === 'pec') stroje = this.sablona.pec || [];
            else if (sekce === 'baleni' && this.form.balRezim === 'krabicky') stroje = this.sablona.baleniKrabicky || [];
            else if (sekce === 'baleni') stroje = this.sablona.baleniKarton || [];
            else stroje = this.sablona[sekce] || [];

            let maOdemcenyZamek = stroje.some(stroj => this.form.exceptions.includes(stroj.id));

            if (sekce === 'pec' && !maOdemcenyZamek && this.form.pecRezim === 'pece') {
                for (let i = 1; i <= 3; i++) { if (this.form.exceptions.includes('pecOd' + i)) maOdemcenyZamek = true; }
            }
            if (sekce === 'baleni' && !maOdemcenyZamek && this.form.balRezim === 'krabicky') {
                if (this.form.exceptions.includes('miroProg')) maOdemcenyZamek = true;
            }

            if (maOdemcenyZamek) return '🐺 REBEL';

            return '🔗 PROPOJENO';
        },

            getSekceStyl(sekce) {
               let stitek = this.getSekceStitek(sekce);
               if (stitek === '🔓 UNIKÁTNÍ') {
                return 'background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.3);';
            } else if (stitek === '🐺 REBEL') {
                return 'background:rgba(148,163,184,0.1); color:#cbd5e1; border:1px solid rgba(148,163,184,0.3);';
            } else {
                return 'background:rgba(14,165,233,0.1); color:#0ea5e9; border:1px solid rgba(14,165,233,0.3);';
            }
        },

            toggleSync(sekce) {
                this.form.sync[sekce] = !this.form.sync[sekce];
            if(typeof showToast === 'function') {
                if (this.form.sync[sekce]) showToast(`🔗 Sekce ${sekce.toUpperCase()} propojena s Matkou`);
                else showToast(`🔓 Sekce ${sekce.toUpperCase()} odpojena! Můžeš upravovat.`);
            }
        },// 🚀 FUNKCE PRO LOKÁLNÍ VÝJIMKY 🚀
        nactiDataZMatky(zdrojovyKod, sekce) {
            if (!zdrojovyKod) return;
            let dbStore = Alpine.store('trezor');
            // 🚀 FÁZE 6: Plně rekurzivní čtení Matky při změně v roletce Wizzardu
            let motherP = typeof getVariantData === 'function' ? getVariantData(zdrojovyKod) : null;

            if (motherP) {

                let stroje = [];
                if (sekce === 'pec' && this.form.pecRezim === 'sablona') stroje = this.sablona.pecPrujezd || [];
                else if (sekce === 'pec') stroje = this.sablona.pec || [];
                else if (sekce === 'baleni' && this.form.balRezim === 'krabicky') stroje = this.sablona.baleniKrabicky || [];
                else if (sekce === 'baleni') stroje = this.sablona.baleniKarton || [];
                else stroje = this.sablona[sekce] || [];

                stroje.forEach(stroj => {
                if (motherP[stroj.id] !== undefined) {
                    this.form[stroj.id] = window.najdiHodnotuProRoletku(stroj.id, motherP[stroj.id], this.sablona);
                }
            });

                if (sekce === 'baleni' && this.form.balRezim === 'krabicky') {
                     if (motherP.miroProg !== undefined) this.form.miroProg = motherP.miroProg;
                }
                if(typeof showToast === 'function') showToast("Data z Adoptivní matky načtena!");
            }
        },
        toggleException(strojId) {
            let idx = this.form.exceptions.indexOf(strojId);
            if (idx === -1) {
                this.form.exceptions.push(strojId); // Odemknout
                if(typeof showToast === 'function') showToast("🔓 Políčko uvolněno pro vlastní hodnotu");
            } else {
                this.form.exceptions.splice(idx, 1); // Zamknout
                if(typeof showToast === 'function') showToast("🔗 Políčko se opět řídí Matkou");
            }
        },
        pridatVariantu() {
            this.form.poloprodukty.push({ kod: '', label: '', exceptions: [] });
        },
        smazatVariantu(idx) {
            if (this.form.poloprodukty.length > 1) {
                this.form.poloprodukty.splice(idx, 1);
            } else {
                if(typeof showToast === 'function') showToast("⚠️ Musí zůstat alespoň jedna varianta!");
            }
        },
        toggleVariantException(polo, strojId) {
            if (!polo.exceptions) polo.exceptions = [];
            let idx = polo.exceptions.indexOf(strojId);
            if (idx === -1) {
                polo.exceptions.push(strojId); // Odemknout lokálně
                if(typeof showToast === 'function') showToast("🔓 Specifická hodnota pro variantu aktivována");
            } else {
                polo.exceptions.splice(idx, 1); // Zamknout
                if(typeof showToast === 'function') showToast("🔗 Řídí se společným nastavením");
            }
        },
        
        // 🚀 ENTERPRISE NAŠEPTÁVAČ EXISTUJÍCÍCH RECEPTUR (BLESKOVÝ MECHANISMUS)
        async zkontrolovatExistujiciPoloprodukt() {
            let raw = this.form.poloprodukty[0].kod ? this.form.poloprodukty[0].kod.trim().toUpperCase() : '';
            if (!raw) { this.stavKodu = ''; return; }

    let dbStore = Alpine.store('trezor');
    if (!dbStore || !dbStore.databaze_master || !dbStore.databaze_master.vyroba) return;

    let nalezeneBase = null;
    let nalezenaMain = null;
    let nalezenaVarianta = null;

    for (let base in dbStore.databaze_master.vyroba) {
        let main = dbStore.databaze_master.vyroba[base];
        if (!main || !main.varianty) continue;
        let v = main.varianty.find(x => x.kod && x.kod.toUpperCase() === raw);
        if (v) {
            nalezeneBase = base;
            nalezenaMain = main;
            nalezenaVarianta = v;
            break;
        }
    }

    if (nalezenaMain && nalezenaVarianta) {
        this.stavKodu = 'existuje';
        let ano = await showCustomModal({
                    title: "Tento poloprodukt už známe! 🧠",
                    message: `Poloprodukt <b>${raw}</b> už v systému existuje u receptury <b>${nalezenaMain.nazevBase}</b> (${nalezeneBase}).<br><br>Chceš z ní automaticky zkopírovat kompletní nastavení strojů a zámečků?`,
                    type: "confirm"
                });

                if (ano) {
                    // 🛡️ ENTERPRISE ŠTÍT: Uložíme si na bok VŠECHNO, co už uživatel stihl ručně naklikat (včetně Matky!)
                    let staryFormKod = this.form.kod;
                    let staryFormNazevBase = this.form.nazevBase;
                    let staryFormLabelVar = this.form.poloprodukty[0].label;
                    let staryFormTvurce = this.form.tvurce;
                    let staryFormSourceCode = this.form.sourceCode;
                    let staryFormSourceCodes = this.form.sourceCodes ? { ...this.form.sourceCodes } : { pekarna: '', kynarna: '', pec: '', pripravna: '', baleni: '' };
                    let staryFormSync = this.form.sync ? { ...this.form.sync } : { pekarna: false, kynarna: false, pec: false, pripravna: false, baleni: false };

                    // Načteme režimy z klonovaného vzoru
                    this.form.pecRezim = nalezenaMain.pecRezim;
                    this.form.balRezim = nalezenaMain.baleniRezim;

                    // Vyčistíme staré proměnné, ale do whitelistu přidáme sourceCode, sourceCodes a sync, aby Alpine neproblikával
                    Object.keys(this.form).forEach(key => {
                        if (!['poloprodukty', 'tvurce', 'kod', 'nazevBase', 'pecRezim', 'balRezim', 'sourceCode', 'sourceCodes', 'sync', 'sablona', 'obnovSeznamMatek', 'plnySeznamVariant', 'init', 'getSekceStitek', 'getSekceStyl', 'toggleSync', 'nactiDataZMatky', 'toggleException', 'pridatVariantu', 'smazatVariantu', 'toggleVariantException', 'zkontrolovatExistujiciPoloprodukt'].includes(key)) {
                            delete this.form[key];
                        }
                    });

                    // 1. Překlopíme společná hardwarová data linky
                    if (nalezenaMain.spolecne) {
                        Object.keys(nalezenaMain.spolecne).forEach(k => {
                            this.form[k] = nalezenaMain.spolecne[k];
                        });
                    }

                    // 2. Pokud měla tato varianta svá vlastní rebelující specifika (spec), nakrmíme jimi základ nové pizzy
                    if (nalezenaVarianta.spec) {
                        Object.keys(nalezenaVarianta.spec).forEach(k => {
                            this.form[k] = nalezenaVarianta.spec[k];
                        });
                    }

                    // 3. Překlopíme batoh odemčených zámečků (výjimky)
                    this.form.exceptions = nalezenaVarianta.exceptions ? [...nalezenaVarianta.exceptions] : [];

                    // 4. CHYTRÁ KOORDINACE RODOKMENU: Pokud uživatel už Matku sám ručně vybral, má absolutní přednost!
                    if (staryFormSourceCode) {
                        this.form.sourceCode = staryFormSourceCode;
                        this.form.sourceCodes = staryFormSourceCodes;
                        this.form.sync = staryFormSync;
                    } else {
                        // Pouze pokud uživatel Matku nevybral (Úplně nová výroba), načteme rodokmen z klonovaného produktu
                        let srcPek = nalezenaMain.spolecne ? (nalezenaMain.spolecne['pekarna_source'] || '') : '';
                        let srcKyn = nalezenaMain.spolecne ? (nalezenaMain.spolecne['kynarna_source'] || '') : '';
                        let srcPec = nalezenaMain.spolecne ? (nalezenaMain.spolecne['pec_source'] || '') : '';
                        let srcPri = nalezenaMain.spolecne ? (nalezenaMain.spolecne['pripravna_source'] || '') : '';
                        let srcBal = nalezenaMain.spolecne ? (nalezenaMain.spolecne['baleni_source'] || '') : '';

                        let zdrojeList = [srcPek, srcKyn, srcPec, srcPri, srcBal].filter(Boolean);
                        let hlavniMatkaZdroje = zdrojeList.length > 0 ? zdrojeList[0] : '';

                        this.form.sourceCode = hlavniMatkaZdroje;
                        this.form.sourceCodes = {
                            pekarna: srcPek !== hlavniMatkaZdroje ? srcPek : '',
                            kynarna: srcKyn !== hlavniMatkaZdroje ? srcKyn : '',
                            pec: srcPec !== hlavniMatkaZdroje ? srcPec : '',
                            pripravna: srcPri !== hlavniMatkaZdroje ? srcPri : '',
                            baleni: srcBal !== hlavniMatkaZdroje ? srcBal : ''
                        };

                        this.form.sync = {
                            pekarna: !!srcPek,
                            kynarna: !!srcKyn,
                            pec: !!srcPec,
                            pripravna: !!srcPri,
                            baleni: !!srcBal
                        };
                    }

                    // 🔥 DOSAZENÍ POJISTKY: Vrátíme uživateli do panelu Základní info to, co zadal sám ručně
                    this.form.kod = staryFormKod;
                    this.form.nazevBase = staryFormNazevBase;
                    this.form.poloprodukty[0].kod = raw;
                    this.form.poloprodukty[0].label = staryFormLabelVar;
                    this.form.tvurce = staryFormTvurce;

                    if (typeof showToast === 'function') showToast("⚡ Kompletní řetězec mašin naklonován, tvá Matka zůstává zajištěná!");
                }
            } else {
                this.stavKodu = 'novy';
            }
        }
    }));

    Alpine.data('wizardBaleniData', () => ({
        form: {}
    }));

    Alpine.data('wizardSablonaData', () => ({
        form: { pekarna: [], kynarna: [], pec: [], pecPrujezd: [], pripravna: [], baleniKrabicky: [], baleniKarton: [] },
        init() {
            this.$watch('$store.appState.currentScreen', (val) => {
                if (val === 'wizardSablonaModal') {
                    let sab = nactiSablonu();
                    ['pekarna', 'kynarna', 'pec', 'pecPrujezd', 'pripravna', 'baleniKrabicky', 'baleniKarton', 'baleniMiropack'].forEach(s => {
                        if (sab[s]) {
                            sab[s].forEach(stroj => {
                                if (stroj.type === 'select' && stroj.options) {
                                    stroj.optionsStr = stroj.options.filter(o => o !== 'Dodáme' && o !== 'custom').join(';');
                                }
                            });
                        }
                    });
                    this.form.pekarna = sab.pekarna || [];
                    this.form.kynarna = sab.kynarna || [];
                    this.form.pec = sab.pec || [];
                    this.form.pecPrujezd = sab.pecPrujezd || [];
                    this.form.pripravna = sab.pripravna || [];
                    this.form.baleniKrabicky = sab.baleniKrabicky || [];
                    this.form.baleniKarton = sab.baleniKarton || [];
                    this.form.baleniMiropack = sab.baleniMiropack || [];
                }
            });
        },
        posunStrojWiz(sekce, index, smer) {
            if (index + smer < 0 || index + smer >= this.form[sekce].length) return;
            let temp = this.form[sekce][index];
            this.form[sekce][index] = this.form[sekce][index + smer];
            this.form[sekce][index + smer] = temp;
        },
        smazatStrojWiz(sekce, index) {
            this.form[sekce].splice(index, 1);
        },
        pridatStrojWiz(sekce) {
            this.form[sekce].push({ id: '', label: '', type: 'text', unit: '', optionsStr: '' });
        },
        pridatPoznamkuWiz(sekce) {
            this.form[sekce].push({ id: 'pozn_' + Date.now().toString().slice(-6), label: 'Vlastní text (nadpis)', type: 'nadpis', unit: '', optionsStr: '' });
        },
        
        // --- CHYBĚJÍCÍ FUNKCE PRO ROLETKY (SELECTY) ---
        pridatOptWiz(stroj, val) {
            if (!val || val.trim() === '') return;
            let arr = stroj.optionsStr ? stroj.optionsStr.split(';').map(s => s.trim()).filter(Boolean) : [];
            if (!arr.includes(val.trim())) {
                arr.push(val.trim());
                stroj.optionsStr = arr.join(';');
            }
        },
        smazatOptWiz(stroj, idx) {
            let arr = stroj.optionsStr ? stroj.optionsStr.split(';').map(s => s.trim()).filter(Boolean) : [];
            arr.splice(idx, 1);
            stroj.optionsStr = arr.join(';');
        }, async editovatOptWiz(stroj, idx) {
            let arr = stroj.optionsStr ? stroj.optionsStr.split(';').map(s => s.trim()).filter(Boolean) : [];
            let staryNazev = arr[idx];
            
            let novyNazev = await showCustomModal({ 
                title: "Přejmenovat v celém systému", 
                message: `Přejmenováním "<b>${staryNazev}</b>" dojde k OKAMŽITÉMU přepsání u všech výrobků v Cloudu!`, 
                inputValue: staryNazev, 
                type: "prompt" 
            });

            if (!novyNazev || novyNazev.trim() === "" || novyNazev === staryNazev) return;
            novyNazev = novyNazev.trim();

            // 1. Aktualizace v šabloně (lokálně ve wizardu)
            arr[idx] = novyNazev;
            stroj.optionsStr = arr.join(';');

            // 2. HROMADNÁ MIGRACE V PAMĚTI (Trezor)
            let dbStore = Alpine.store('trezor');
            let count = 0;

            // Prohledáme výrobu (společná data i varianty)
            if (dbStore.databaze_master.vyroba) {
                Object.values(dbStore.databaze_master.vyroba).forEach(vyroba => {
                    if (vyroba.spolecne && vyroba.spolecne[stroj.id] === staryNazev) {
                        vyroba.spolecne[stroj.id] = novyNazev;
                        count++;
                    }
                    if (vyroba.varianty) {
                        vyroba.varianty.forEach(v => {
                            if (v.spec && v.spec[stroj.id] === staryNazev) {
                                v.spec[stroj.id] = novyNazev;
                                count++;
                            }
                        });
                    }
                });
            }

            // Prohledáme balení (programy)
            if (dbStore.databaze_master.baleni) {
                Object.values(dbStore.databaze_master.baleni).forEach(prog => {
                    if (prog[stroj.id] === staryNazev) {
                        prog[stroj.id] = novyNazev;
                        count++;
                    }
                });
            }

            // 3. OKAMŽITÝ ZÁPIS DO FIREBASE (MASTER DATA)
            try {
                await db.collection('linka_data').doc('databaze_master').set(dbStore.databaze_master);
                if(typeof showToast === 'function') showToast(`✅ Úspěšně přejmenováno a opraveno ${count} záznamů přímo v Masteru!`);
            } catch (err) {
                console.error("Chyba při hromadném přepisování Master Dat:", err);
                if(typeof showToast === 'function') showToast("❌ Chyba při ukládání do Cloudu!");
            }
        }
    }));

    // --- ENGINE PRO MOJI ŠICHTU ---
    Alpine.data('sichtaEngine', () => ({
        activeTab: 'aktivni',
        novyKod: '',
        autoVymaz: false,
        lastShiftId: '',
        fronta: [],

        init() {
            this.loadState();
            
            this.$watch('autoVymaz', val => this.saveState());
            this.$watch('fronta', val => this.saveState());

            this.checkAutoClear();

            // 🚀 PŘIJÍMAČ: Jakmile Firebase potvrdí účet (nebo ho změníš), načti data znovu!
            window.addEventListener('auth-loaded', () => {
                this.loadState();
                this.checkAutoClear();
            });

            this.$watch('$store.appState.currentScreen', screen => {
                if (screen === 'sichtaScreen') {
                    this.activeTab = 'aktivni'; 
                    this.loadState(); 
                    this.checkAutoClear();
                }
            });
        },

        getShiftId() {
            let d = new Date();
            let h = d.getHours();
            let shift = (h >= 6 && h < 18) ? 'Denni' : 'Nocni';
            if (h < 6) { d.setDate(d.getDate() - 1); }
            let dateStr = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
            return dateStr + '-' + shift;
        },

        checkAutoClear() {
            if (!this.autoVymaz) return;
            let currentShift = this.getShiftId();
            if (this.lastShiftId !== '' && this.lastShiftId !== currentShift) {
                this.fronta = [];
                this.lastShiftId = currentShift;
                this.saveState();
                if(typeof showToast === 'function') showToast("Auto-výmaz: Nová směna, stůl vyčištěn!");
            } else if (this.lastShiftId === '') {
                this.lastShiftId = currentShift;
                this.saveState();
            }
        },

        getStorageKey() {
            let uid = (typeof CURRENT_USER_KEY !== 'undefined' && CURRENT_USER_KEY) ? CURRENT_USER_KEY : 'guest';
            return 'sichta_data_' + uid;
        },

        loadState() {
            let key = this.getStorageKey();
            let saved = localStorage.getItem(key);
            if (saved) {
                try {
                    let parsed = JSON.parse(saved);
                    this.autoVymaz = parsed.autoVymaz || false;
                    this.lastShiftId = parsed.lastShiftId || '';
                    this.fronta = parsed.fronta || [];
                } catch(e) { console.error(e); }
            } else {
                this.fronta = [];
                this.autoVymaz = false;
                this.lastShiftId = this.getShiftId();
            }
        },

        saveState() {
            let key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify({
                autoVymaz: this.autoVymaz,
                lastShiftId: this.lastShiftId,
                fronta: this.fronta
            }));
        },

        getVyrobaList() { return this.fronta.filter(x => x.typ === 'vyroba'); },
        getBaleniList() { return this.fronta.filter(x => x.typ === 'baleni'); },

        pridatDoSichty(explicitBaseCode = null) {
            let raw = this.novyKod.trim().replace(/\s+/g, '').toUpperCase();
            if (!raw) return;

            let baleniKey = raw;
            if (/^\d+$/.test(raw) && raw.length !== 6) {
                baleniKey = "PROGRAM" + raw;
            } else if (raw.startsWith("PROG") && !raw.startsWith("PROGRAM")) {
                baleniKey = raw.replace("PROG", "PROGRAM");
            }
            
            if (Trezor.databaze_master.baleni && Trezor.databaze_master.baleni[baleniKey]) {
                let dbNazev = Trezor.databaze_master.baleni[baleniKey].nazev;
                this.fronta = [...this.fronta, { id: Date.now() + Math.random().toString(), kod: baleniKey, nazev: dbNazev, typ: 'baleni', hotovo: false }];
                this.novyKod = '';
                this.saveState();
                if(typeof showToast === 'function') showToast("Přidáno do balení");
                return;
            }

            // Batůžek
            let matches = [];
            for (let base in Trezor.databaze_master.vyroba) {
                let main = Trezor.databaze_master.vyroba[base];
                if (!main || !main.varianty) continue;
                for (let v of main.varianty) {
                    if (v.kod.toUpperCase() === raw) {
                        matches.push({ baseCode: base, kod: v.kod, label: main.nazevBase + (v.label === main.nazevBase ? '' : ' - ' + v.label) });
                    }
                }
            }

            // Ochrana před špatnou etiketou (Více matek pro jeden poloprodukt!)
            if (matches.length > 1 && !explicitBaseCode) {
                let modalVariants = matches.map(m => ({ kod: m.baseCode, label: m.label }));
                Alpine.store('appState').openVariantModal(raw, modalVariants, 'sichta', true);
                this.novyKod = '';
                return;
            }

            let finalBase = explicitBaseCode || (matches.length > 0 ? matches[0].baseCode : null);

            if (finalBase) {
                let m = Trezor.databaze_master.vyroba[finalBase];
                let v = m.varianty.find(x => x.kod.toUpperCase() === raw);
                let label = m.nazevBase + (v.label === m.nazevBase ? '' : ' - ' + v.label);
                this.vlozitVyrobu(v.kod, label, finalBase);
                this.novyKod = '';
                return;
            }

            let codeDigits = raw.replace(/\D/g, '');
            if (codeDigits.length === 6 && Trezor.databaze_master.vyroba[codeDigits]) {
                let main = Trezor.databaze_master.vyroba[codeDigits];
                if (main.varianty && main.varianty.length > 1) {
                    Alpine.store('appState').openVariantModal(codeDigits, main.varianty, 'sichta', false);
                    this.novyKod = '';
                    return;
                } else if (main.varianty && main.varianty.length === 1) {
                    this.vlozitVyrobu(main.varianty[0].kod, main.nazevBase + (main.varianty[0].label === main.nazevBase ? '' : ' - ' + main.varianty[0].label), codeDigits);
                    this.novyKod = '';
                    return;
                }
            }

            if(typeof showToast === 'function') showToast("❌ Kód " + raw + " nebyl nalezen!");
        },

        vlozitVyrobu(kod, nazev, baseCode) {
            if (!baseCode) {
                for (let base in Trezor.databaze_master.vyroba) {
                    if (Trezor.databaze_master.vyroba[base].varianty && Trezor.databaze_master.vyroba[base].varianty.find(x => x.kod === kod)) {
                        baseCode = base; break;
                    }
                }
            }
            this.fronta = [...this.fronta, { id: Date.now() + Math.random().toString(), kod: kod, nazev: nazev, baseCode: baseCode || '', typ: 'vyroba', hotovo: false }];
            this.saveState();
            if(typeof showToast === 'function') showToast("Přidáno do výroby");
        },

        toggleHotovo(id) {
            let item = this.fronta.find(x => x.id === id);
            if (item) {
                item.hotovo = !item.hotovo;
                this.fronta = [...this.fronta]; 
                this.saveState();
            }
        },

        posunPolozku(typ, index, smer) {
            let list = typ === 'vyroba' ? this.getVyrobaList() : this.getBaleniList();
            if (index + smer < 0 || index + smer >= list.length) return;
            
            let itemA = list[index];
            let itemB = list[index + smer];
            
            let realIndexA = this.fronta.findIndex(x => x.id === itemA.id);
            let realIndexB = this.fronta.findIndex(x => x.id === itemB.id);
            
            let temp = this.fronta[realIndexA];
            this.fronta[realIndexA] = this.fronta[realIndexB];
            this.fronta[realIndexB] = temp;
            this.fronta = [...this.fronta]; 
            this.saveState();
        },

        async smazatPolozku(id) {
            this.fronta = this.fronta.filter(x => x.id !== id);
            this.saveState();
        },

        async smazatCelouSichtu() {
            let ok = await showCustomModal({ title: "ÚKLID ŠICHTY", message: "Opravdu chceš smazat všechny připravené kódy z výroby i balení? Akci nelze vzít zpět.", type: "confirm" });
            if (ok) {
                this.fronta = [];
                this.saveState();
                if(typeof showToast === 'function') showToast("Šichta kompletně vymazána!");
            }
        },

        compareNext(typ, index) {
            let list = typ === 'vyroba' ? this.getVyrobaList() : this.getBaleniList();
            if (index <= 0 || index >= list.length) return;
            
            let kNew = list[index].kod;
            let kOld = list[index - 1].kod;

            let el = document.getElementById('compareContainer');
            if (el && el._x_dataStack) {
                let state = Alpine.store('appState');
                state.compareOld = kOld;
                state.compareNew = kNew;
                el._x_dataStack[0].initCompareAction();
            }
        }
    }));
});

// GLOBÁLNÍ FUNKCE PRO PŘEPÍNÁNÍ OBRAZOVEK
window.goToScreen = function(screenId, checkAuth = true) {
    // --- BOD 12: Automatické mizení Toastu při překliku ---
    if (window.keepNextToast) {
        window.keepNextToast = false; // Spotřebujeme štít, Toast přežije tento překlik
    } else {
        document.querySelectorAll('.toast').forEach(toast => toast.classList.remove('show'));
    }

    if (typeof closeMenu === 'function') closeMenu();
    if (typeof window.closeAllPhotos === 'function') window.closeAllPhotos();
    
    // Pojistka pro odhlášené
    if (checkAuth && !CURRENT_USER_KEY && screenId !== 'loginScreen') {
        screenId = 'loginScreen';
    }

        if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        let store = Alpine.store('appState');
        if (store.isEditMode && screenId !== 'resultsScreen' && screenId !== 'katalogDetailScreen') store.toggleEdit();
        
        if (screenId !== 'resultsScreen' && screenId !== 'compareScreen') {
            store.compareMode = 'ne';
        }
        
        store.setScreen(screenId, true);

        if (screenId === 'resultsScreen' && store.alwaysExpand) {
            requestAnimationFrame(() => {
                if (typeof toggleGlobalExpand === 'function') toggleGlobalExpand(true);
            });
        }
    }
    
    if (screenId === 'searchScreen' && document.getElementById('productSearch')) document.getElementById('productSearch').value = '';
        if (screenId === 'compareScreen' && document.getElementById('compOld')) { document.getElementById('compOld').value = ''; document.getElementById('compNew').value = ''; }

        // ÚKLIDOVÁ ČETA: Zavře panely i při přepínání z/do Wizzardů a Databáze
        document.querySelectorAll('details').forEach(d => d.removeAttribute('open'));
        
        document.querySelectorAll('.data-screen').forEach(el => { el.scrollTop = 0; });
        window.scrollTo(0, 0);
    };

// 🚀 ZVEDNUTÍ OPONY: CHYTRÉ ROUTOVÁNÍ PO PŘIHLÁŠENÍ
window.handleAppRouting = function(isLoggedIn) {
    if (!isLoggedIn) {
        if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
            Alpine.store('appState').setScreen('loginScreen', false);
            history.replaceState({screen: 'loginScreen'}, "", "");
        }
        if (typeof window.zvedniOponu === 'function') window.zvedniOponu(); // Nejsi přihlášen, zvedáme oponu hned
        return;
    }

    // Uživatel JE přihlášený -> zkontrolujeme EULU
    let hasAgreed = localStorage.getItem('eulaEnterprise3') === 'true';
    
    if (!hasAgreed) {
        // NEMÁ EULU -> Rovnou na Nastavení v pozadí
        if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
             Alpine.store('appState').setScreen('settingsScreen', false);
             history.replaceState({screen: 'settingsScreen'}, "", "");
        }
        if (typeof ukazEulaModal === 'function') ukazEulaModal(true);
        if (typeof window.zvedniOponu === 'function') window.zvedniOponu(); // Může číst EULU
    } else {
        // MÁ EULU -> Jde rovnou tam, kde byl
        if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
            let state = Alpine.store('appState');
            let lastScreen = state.currentScreen || 'searchScreen';
            if (lastScreen === 'loginScreen') lastScreen = 'searchScreen';
            history.replaceState({screen: lastScreen}, "", "");
            
            if (lastScreen === 'resultsScreen') { 
                if (state.compareMode === 'ano' || state.compareMode === 'prog') {
                    let el = document.querySelector('[x-data="compareEngine"]');
                    if (el && el._x_dataStack) { 
                        if (state.compareMode === 'ano') {
                            let oD = getVariantData(state.compareOld);
                            let nD = getVariantData(state.compareNew);
                            if (oD && nD) el._x_dataStack[0].executeCompareData(oD, nD);
                        } else {
                            el._x_dataStack[0].executeCompareProgData(state.compareOld, state.compareNew);
                        }
                        if (typeof window.aplikovatAutoShrink === 'function') window.aplikovatAutoShrink();
                    }
                } else if (state.activeCode) {
                    showResults(state.activeCode, false, state.lastBaseCode);
                } else {
                    state.setScreen('searchScreen', false);
                }
            } 
            else if (lastScreen === 'katalogDetailScreen') { 
                if (state.activeProg) openKatalogProg(state.activeProg, false); else state.setScreen('katalogScreen', false);
            }
            else { state.setScreen(lastScreen, false); }
            
            // ⚠️ OPONU ZDE NEZVEDÁME - čekáme na Firebase data v auth.js!
        }
    }
};

function updateHeaderTitle(screenId) {
    let titleEl = document.getElementById('globalTitle');
    if (!titleEl) return;
    
    let isCompareActive = false;

    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        let state = Alpine.store('appState');
        isCompareActive = state.compareMode !== 'ne';
    } else {
        let storedMode = localStorage.getItem('isCompareMode');
        isCompareActive = storedMode ? (storedMode.includes('ano') || storedMode.includes('prog')) : false;
    }

    if (isCompareActive || screenId === 'compareScreen') {
        titleEl.innerText = 'SROVNÁVAČ';
    } else if (screenId === 'resultsScreen') {
        let lastS = localStorage.getItem('lastScreen') || '';
        titleEl.innerText = lastS.includes('searchScreen') ? 'VYHLEDÁVAČ' : 'DATABÁZE';
    } else if (screenId === 'databaseScreen') {
        titleEl.innerText = 'DATABÁZE';
    } else if (screenId === 'katalogScreen' || screenId === 'katalogDetailScreen') {
        titleEl.innerText = 'BALENÍ';
    } else if (screenId === 'sichtaScreen') {
        titleEl.innerText = 'PLÁNOVAČ';
    } else if (screenId === 'searchScreen') {
        titleEl.innerText = 'VYHLEDÁVAČ';
    } else {
        titleEl.innerText = 'MOJE LINKA';
    }
}

// ⚙️ UPRAVIT ZÁKLAD (MASTER DATA) - FÁZE 2
window.zkusUpravitZaklad = async function() {
    window.isLinkaLoading = true;
    let state = typeof Alpine !== 'undefined' ? Alpine.store('appState') : null;
    if (!state || !state.lastBaseCode) return;
    
    if (!state.isAdmin) {
        if(typeof showToast === 'function') showToast("⛔ Přístup odepřen: Na tuto akci musíš být Administrátor!"); return;
    }
    
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro úpravy potřebuješ signál!"); return;
    }
    
    const zamekRef = db.collection('linka_data').doc('zamek');
    try {
        await db.runTransaction(async (transaction) => {
            const zamekDoc = await transaction.get(zamekRef);
            const now = Date.now();
            if (zamekDoc.exists) {
                const z = zamekDoc.data();
                if (z.kdo && z.kdo !== CURRENT_USER_KEY && (now - (z.cas || 0) < 300000)) {
                    const uData = Trezor.uzivatele_roster[z.kdo] || {};
                    const prezdivka = (Trezor.nastaveni.prezdivky && Trezor.nastaveni.prezdivky[z.kdo]) || uData.email || 'jiný uživatel';
                    throw new Error(`BLOCKED:${prezdivka}`);
                }
            }
            transaction.set(zamekRef, { kdo: CURRENT_USER_KEY, cas: now, typ: 'vyroba' });
        });
    } catch (err) {
        window.isLinkaLoading = false;
        if (err.message && err.message.startsWith('BLOCKED:')) {
            showToast(`⛔ POZOR! Databázi právě upravuje: ${err.message.replace('BLOCKED:', '')}`);
        } else {
            showToast("❌ Chyba komunikace při ověřování zámku.");
        }
        return;
    }

    let mainData = Trezor.databaze_master.vyroba[state.lastBaseCode];
    if (!mainData) return;

    let dSablona = nactiSablonu();
    let SPEC_FIELDS = [];
    ['pekarna', 'kynarna', 'pec', 'pecPrujezd', 'pripravna', 'baleniKrabicky', 'baleniKarton', 'baleniMiropack'].forEach(sekce => {
        if (dSablona[sekce]) dSablona[sekce].forEach(stroj => { if (stroj.isVariant) SPEC_FIELDS.push(stroj.id); });
    });

    // 🚀 ENTERPRISE 4.0: Načtení odkazů na Adoptivní matky 🚀
    let sourcePek = mainData.spolecne ? mainData.spolecne['pekarna_source'] : '';
    let sourceKyn = mainData.spolecne ? mainData.spolecne['kynarna_source'] : '';
    let sourcePec = mainData.spolecne ? mainData.spolecne['pec_source'] : '';
    let sourcePri = mainData.spolecne ? mainData.spolecne['pripravna_source'] : '';
    let sourceBal = mainData.spolecne ? mainData.spolecne['baleni_source'] : '';

    let allSources = [sourcePek, sourceKyn, sourcePec, sourcePri, sourceBal].filter(x => x);
    let firstSource = allSources.length > 0 ? allSources[0] : '';
    let globalSource = firstSource; // 🚀 HYBRID FIX: Ukážeme hlavní matku hned nahoře i při částečném odpojení

    let newForm = {
        kod: state.lastBaseCode,
        nazevBase: mainData.nazevBase,
        tvurce: mainData.zdroj || 'LV',
        pecRezim: mainData.pecRezim,
        balRezim: mainData.baleniRezim,
        poloprodukty: [],
        sourceCode: globalSource,
        sourceCodes: {
            pekarna: sourcePek !== globalSource ? sourcePek : '',
            kynarna: sourceKyn !== globalSource ? sourceKyn : '',
            pec: sourcePec !== globalSource ? sourcePec : '',
            pripravna: sourcePri !== globalSource ? sourcePri : '',
            baleni: sourceBal !== globalSource ? sourceBal : ''
        },
        sync: {
            pekarna: mainData.spolecne ? !!mainData.spolecne['pekarna_source'] : false,
            kynarna: mainData.spolecne ? !!mainData.spolecne['kynarna_source'] : false,
            pec: mainData.spolecne ? !!mainData.spolecne['pec_source'] : false,
            pripravna: mainData.spolecne ? !!mainData.spolecne['pripravna_source'] : false,
            baleni: mainData.spolecne ? !!mainData.spolecne['baleni_source'] : false
        },
        exceptions: [] // Budeme plnit dole
    };
    
    if (mainData.spolecne) {
        Object.keys(mainData.spolecne).forEach(k => {
            newForm[k] = mainData.spolecne[k];
        });
    }

    if (mainData.varianty) {
        mainData.varianty.forEach((v, idx) => {
            let p = { 
                kod: v.kod || v,
                label: v.label || (v.kod || v), // Načtení názvu (např. Cheese)
                exceptions: v.exceptions ? [...v.exceptions] : [] // 🚀 OPRAVA: Pamatovák na odemčené zámky!
            };
            
            // První varianta (Matka) nahrává své specifické položky rovnou do hlavního formuláře
            if (idx === 0) {
                if (v.spec) {
                    Object.keys(v.spec).forEach(k => {
                        if (SPEC_FIELDS.includes(k)) newForm[k] = v.spec[k];
                    });
                }
                SPEC_FIELDS.forEach(sf => {
                    if (mainData.spolecne && mainData.spolecne[sf] && !newForm[sf]) {
                        newForm[sf] = mainData.spolecne[sf];
                    }
                });
            } else {
                if (v.spec) {
                    Object.keys(v.spec).forEach(k => {
                        if (SPEC_FIELDS.includes(k)) p[k] = v.spec[k];
                    });
                }
                SPEC_FIELDS.forEach(sf => {
                    if (mainData.spolecne && mainData.spolecne[sf] && !p[sf]) {
                        p[sf] = mainData.spolecne[sf];
                    }
                });
            }
            newForm.poloprodukty.push(p);
        });
    }

    if (newForm.poloprodukty.length === 0) {
        newForm.poloprodukty.push({ kod: '', label: '' });
    }

    // 🚀 FÁZE 3 OPRAVA: PŘÍMÉ NAČTENÍ VÝJIMEK 🚀
    // Už žádné složité dedukce, které padají na patchwork lince!
    // Prostě si vezmeme batůžek výjimek, který jsme si u první pizzy uložili ve Fázi 2.
    if (mainData.varianty && mainData.varianty.length > 0) {
        newForm.exceptions = mainData.varianty[0].exceptions ? [...mainData.varianty[0].exceptions] : [];
    } else {
        newForm.exceptions = [];
    }

    // 🚀 ENTERPRISE 3.5: DOČASŇOVÁK PRO PŘEDVYPLNĚNÍ ZDĚDĚNÝCH DAT DO FORMULÁŘE WIZZARDU
    ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].forEach(sekce => {
        let syncKey = sekce;
        let aktivniMatka = newForm.sourceCodes[syncKey] || newForm.sourceCode;
        
        if (newForm.sync[syncKey] && aktivniMatka) {
            // 🚀 FÁZE 6: Plně rekurzivní čtení (včetně babiček), aby zamčené hodnoty nespadly na Vypnuto!
            let motherP = typeof getVariantData === 'function' ? getVariantData(aktivniMatka) : null;
            if (motherP) {
                
                let sekceList = [sekce];
                if (sekce === 'pec') sekceList = ['pec', 'pecPrujezd'];
                if (sekce === 'baleni') sekceList = ['baleniKrabicky', 'baleniKarton', 'baleniMiropack'];

                sekceList.forEach(sKey => {
                    if (dSablona[sKey]) {
                        dSablona[sKey].forEach(stroj => {
                        if (stroj.id && !newForm.exceptions.includes(stroj.id) && newForm[stroj.id] === undefined && motherP[stroj.id] !== undefined) {
                            newForm[stroj.id] = window.najdiHodnotuProRoletku(stroj.id, motherP[stroj.id], dSablona);
                        }
                    });
                    }
                });

                // Zónová pec vyčištěna. Ponecháváme pouze systémovou pojistku pro digestoř:
                if (sekce === 'pec' && newForm.pecRezim === 'pece') {
                    if (newForm.pecDig === undefined && motherP.pecDig !== undefined) newForm.pecDig = motherP.pecDig;
                }

                // Miropack programy - předvyplnění do Wizzardu
                if (sekce === 'baleni' && newForm.balRezim === 'krabicky') {
                    if (newForm.miroProg === undefined && motherP.miroProg !== undefined) newForm.miroProg = motherP.miroProg;
                    let progKey = "PROGRAM" + (newForm.miroProg || '').toString().trim();
                    let miroData = Trezor.databaze_master.baleni?.[progKey];
                    if (miroData) {
                        if (dSablona.baleniMiropack) {
                            dSablona.baleniMiropack.forEach(mStroj => {
                                if (newForm[mStroj.id] === undefined && miroData[mStroj.id] !== undefined) {
                                    newForm[mStroj.id] = miroData[mStroj.id];
                                }
                            });
                        }
                        ['balTrv', 'datumRadky', 'balKs', 'novoElko', 'novoTunel'].forEach(k => {
                            if (newForm[k] === undefined && miroData[k] !== undefined) newForm[k] = miroData[k];
                        });
                    }
                }
            }
        }
    });

    let scope = document.getElementById('wizVyrobaScope');
    if (scope && scope._x_dataStack) {
        let alpineData = scope._x_dataStack[0];
        
        // 1. Nejdříve pošleme do UI šablonu, aby vědělo, jaké stroje a roletky existují
        alpineData.sablona = dSablona;
        alpineData.obnovSeznamMatek(); // 🚀 BUGFIX: Znovu načteme čerstvý seznam všech matek do paměti!
        
        // 2. PROFESIONÁLNÍ FIX: Alpine.nextTick počká na fyzické vykreslení <select> a <option> v DOMu
        Alpine.nextTick(() => {
            alpineData.form = newForm; // Až teď bezpečně nacpeme do existujících roletek data z databáze
        });
    }
    Alpine.nextTick(() => { window.isLinkaLoading = false; });

    window.goToScreen('wizardVyrobaModal', false);
};

window.nasilneOdemknoutZamek = async function() {
    let state = typeof Alpine !== 'undefined' ? Alpine.store('appState') : null;
    if (!state || !state.isAdmin) {
        if(typeof showToast === 'function') showToast("⛔ Přístup odepřen: Musíš být Administrátor!"); return;
    }
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro odemčení potřebuješ signál!"); return;
    }
    
    let ok = await showCustomModal({ title: "Násilné odemčení?", message: "Opravdu chceš smazat zámek databáze? Pokud v ní teď někdo dělá úpravy, přijde o ně a může dojít k přepsání dat!", type: "confirm" });
    if (!ok) return;

    if (typeof db !== 'undefined') {
        db.collection('linka_data').doc('zamek').delete()
          .then(() => { if(typeof showToast === 'function') showToast("🔓 Zámek byl úspěšně zničen!"); })
          .catch((err) => { if(typeof showToast === 'function') showToast("❌ Chyba při mazání zámku: " + err); });
    }
};

function zkusOtevritWizzard(typ) {
    if (typeof Alpine !== 'undefined' && !Alpine.store('appState').isAdmin) {
        if(typeof showToast === 'function') showToast("⛔ Přístup odepřen: Na tuto akci musíš být Administrátor!"); return;
    }

    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro úpravy potřebuješ signál!"); return;
    }
    const zamekRef = db.collection('linka_data').doc('zamek');
    (async () => {
        try {
            await db.runTransaction(async (transaction) => {
                const zamekDoc = await transaction.get(zamekRef);
                const now = Date.now();
                if (zamekDoc.exists) {
                    const z = zamekDoc.data();
                    if (z.kdo && z.kdo !== CURRENT_USER_KEY && (now - (z.cas || 0) < 300000)) {
                        const uData = Trezor.uzivatele_roster[z.kdo] || {};
                        const prezdivka = (Trezor.nastaveni.prezdivky && Trezor.nastaveni.prezdivky[z.kdo]) || uData.email || 'jiný uživatel';
                        throw new Error(`BLOCKED:${prezdivka}`);
                    }
                }
                transaction.set(zamekRef, { kdo: CURRENT_USER_KEY, cas: now, typ: typ });
            });

            if (typ === 'vyroba') {
                window.isLinkaLoading = true;
                let scope = document.getElementById('wizVyrobaScope');
                if (scope && scope._x_dataStack) {
                    scope._x_dataStack[0].form = {
                        kod: '', nazevBase: '', tvurce: 'LV', pecRezim: '', balRezim: '', poloprodukty: [{kod: '', label: ''}], 
                        sourceCode: '', sourceCodes: { pekarna: '', kynarna: '', pec: '', pripravna: '', baleni: '' },
                        sync: { pekarna: false, kynarna: false, pec: false, pripravna: false, baleni: false }, exceptions: [],
                        pecDig: 'Vždy zapnutá', pecOd1: '', pecOd2: '', pecOd3: ''
                    };
                }
                Alpine.nextTick(() => { window.isLinkaLoading = false; });
                window.goToScreen('wizardVyrobaModal', false);
            }
            else if (typ === 'baleni') {
                let scope = document.getElementById('wizBaleniScope');
                if (scope && scope._x_dataStack) {
                    let existsKey = window.upravovanyProgramKey;
                    if (existsKey && Trezor.databaze_master.baleni[existsKey]) {
                        let pData = Trezor.databaze_master.baleni[existsKey];
                        let formObj = { key: existsKey, nazev: pData.nazev, wsProg: pData.miroProg, wsMat: pData.miroMat, novoElko: pData.novoElko || 'Malé' };
                        
                        let sab = nactiSablonu();
                        if (sab.baleniMiropack) {
                            sab.baleniMiropack.forEach(stroj => {
                                if (pData[stroj.id]) formObj['ws' + stroj.id.replace('miro','')] = pData[stroj.id];
                            });
                        }
                        scope._x_dataStack[0].form = formObj;
                    } else {
                        scope._x_dataStack[0].form = { key: '', nazev: '', wsProg: '', wsMat: '', novoElko: 'Malé' };
                    }
                }
                window.goToScreen('wizardBaleniModal', false);
            }
            else if (typ === 'sablona') {
                window.goToScreen('wizardSablonaModal', false);
            }
        } catch (err) {
            if (err.message && err.message.startsWith('BLOCKED:')) {
                if(typeof showToast === 'function') showToast(`⛔ POZOR! Databázi právě upravuje: ${err.message.replace('BLOCKED:', '')}`);
            } else {
                if(typeof showToast === 'function') showToast("❌ Chyba komunikace při ověřování zámku.");
            }
        }
    })();
}

async function uvolniZamekAZavri(skipWarning = false) {
    let zamek = Trezor.zamek || {};
    
    if (!skipWarning && typeof Alpine !== 'undefined' && Alpine.store('appState').currentScreen.startsWith('wizard')) {
        let ok = await showCustomModal({ title: "Zavřít editor?", message: "Máš neuložená data. Opravdu chceš okno zavřít a všechno zahodit?", type: "confirm" });
        if (!ok) return;
    }

    if (zamek.kdo === CURRENT_USER_KEY && typeof db !== 'undefined') { db.collection('linka_data').doc('zamek').delete(); }
    window.goToScreen('adminScreen', false);
}

window.addEventListener('popstate', async function(e) {
    let isWiz = false;
    let wizScreen = "";
    
    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        let current = Alpine.store('appState').currentScreen;
        if (current && current.startsWith('wizard')) {
            isWiz = true;
            wizScreen = current;
        }
        if (Alpine.store('appState').isEditMode) Alpine.store('appState').toggleEdit();
    }

    if (isWiz) {
        history.pushState({screen: wizScreen}, "", "");
        let ok = await showCustomModal({ title: "Odejít z editoru?", message: "Máš neuložená data. Opravdu chceš odejít a všechno zahodit?", type: "confirm" });
        if (ok) {
            let zamek = (typeof Trezor !== 'undefined') ? Trezor.zamek : {};
            if (zamek.kdo === CURRENT_USER_KEY && typeof db !== 'undefined') { db.collection('linka_data').doc('zamek').delete(); }
            
            if (e.state && e.state.screen) { window.goToScreen(e.state.screen, false); } else {
                if (typeof CURRENT_USER_KEY !== 'undefined' && CURRENT_USER_KEY) window.goToScreen('searchScreen', false);
                else window.goToScreen('loginScreen', false);
            }
        }
        return; 
    }

    if (e.state && e.state.screen) { window.goToScreen(e.state.screen, false); } else {
        if (typeof CURRENT_USER_KEY !== 'undefined' && CURRENT_USER_KEY) window.goToScreen('searchScreen', false);
        else window.goToScreen('loginScreen', false);
    }
});

function showSearch() { window.goToScreen('searchScreen'); }

function showDatabase(pushHistory = true) { 
    window.goToScreen('databaseScreen', pushHistory); 
}
window.showKatalogBaleni = function(pushHistory = true) {
    window.goToScreen('katalogScreen', pushHistory);
};

function searchFromDb(code) { if (document.getElementById('productSearch')) document.getElementById('productSearch').value = code; executeSearch(); }

function openKatalogProg(progKey, pushHistory = true) {
    if (typeof closeMenu === 'function') closeMenu();
    if (typeof Alpine !== 'undefined') {
        Alpine.store('appState').setKatalogProg(progKey);
    }
    window.goToScreen('katalogDetailScreen', pushHistory);
}

function handleDatabaseClick(baseCode) {
    if (!Trezor || !Trezor.databaze_master || !Trezor.databaze_master.vyroba[baseCode]) return;
    let main = Trezor.databaze_master.vyroba[baseCode];
    
    if (main.varianty && main.varianty.length > 1) {
        Alpine.store('appState').openVariantModal(baseCode, main.varianty, 'search', false);
    } else if (main.varianty && main.varianty.length === 1) { 
        showResults(main.varianty[0].kod, true, baseCode); 
    }
}

window.selectVariant = function(selectedCode) {
    let state = Alpine.store('appState');
    let target = state.variantModal.targetInput;
    let originalModalBaseCode = state.variantModal.baseCode;
    let isChoosingBaseForVariant = state.variantModal.isBaseSelection;
    
    state.closeVariantModal();

    Alpine.nextTick(() => {
        let finalCode = isChoosingBaseForVariant ? originalModalBaseCode : selectedCode;
        let finalBase = isChoosingBaseForVariant ? selectedCode : originalModalBaseCode;

        if (target === 'search') {
            if (isChoosingBaseForVariant) showResults(finalCode, true, finalBase);
            else showResults(selectedCode, true, finalBase);
        } else if (target === 'compOld' || target === 'compNew') {
            if (typeof window.processCompareVariantSelection === 'function') {
                window.processCompareVariantSelection(target, finalCode, isChoosingBaseForVariant ? finalBase : null);
            }
        } else if (target === 'sichta') {
            // 🚀 CLEAN EVENT BRIDGE: Vykašleme se na padající hledání elementů v DOMu a pošleme data bezpečně přes globální událost
            let nazev = "Neznámý";
            let bCode = isChoosingBaseForVariant ? finalBase : originalModalBaseCode;
            let kCode = isChoosingBaseForVariant ? finalCode : selectedCode;
            
            if (Trezor.databaze_master.vyroba[bCode]) {
                let m = Trezor.databaze_master.vyroba[bCode];
                let v = m.varianty.find(x => x.kod === kCode);
                if (v) nazev = m.nazevBase + (v.label === m.nazevBase ? '' : ' - ' + v.label);
            }
            window.dispatchEvent(new CustomEvent('add-to-sichta', { detail: { kod: kCode, nazev: nazev, baseCode: bCode } }));
        }
    });
};

function executeSearch(explicitBaseCode = null) {
    let inputEl = document.getElementById('productSearch'); if(!inputEl) return;
    let raw = inputEl.value.trim().replace(/\s+/g, '').toUpperCase(); if (!raw) return;

    let baleniKey = raw;
    if (/^\d+$/.test(raw) && raw.length !== 6) {
        baleniKey = "PROGRAM" + raw;
    } else if (raw.startsWith("PROG") && !raw.startsWith("PROGRAM")) {
        baleniKey = raw.replace("PROG", "PROGRAM");
    }

    if (Trezor.databaze_master.baleni[baleniKey]) { if(typeof openKatalogProg === 'function') openKatalogProg(baleniKey); return; }

    let matches = [];
    for (let base in Trezor.databaze_master.vyroba) {
        let main = Trezor.databaze_master.vyroba[base];
        if (!main || !main.varianty || !Array.isArray(main.varianty)) continue;
        for (let v of main.varianty) { 
            if (v && v.kod && v.kod.toUpperCase() === raw) { 
                matches.push({ baseCode: base, kod: v.kod, label: main.nazevBase });
            } 
        }
    }

    if (matches.length > 1 && !explicitBaseCode) {
        let modalVariants = matches.map(m => ({ kod: m.baseCode, label: m.label }));
        Alpine.store('appState').openVariantModal(raw, modalVariants, 'search', true);
        return;
    }

    let finalBase = explicitBaseCode || (matches.length > 0 ? matches[0].baseCode : null);
    if (finalBase) {
        showResults(raw, true, finalBase);
        return;
    }

    let code = raw.replace(/\D/g, ''); 
    if (code.length === 6) { 
        let main = Trezor.databaze_master.vyroba[code];
        if (main) {
            handleDatabaseClick(code);
            return;
        }
    }
    
    if(typeof showToast === 'function') showToast("❌ Kód " + raw + " nebyl nalezen!");
}

function showResults(code, pushHistory = true, explicitBaseCode = null) {
    let baseCode = explicitBaseCode;
    if (!baseCode) {
        for (let base in Trezor.databaze_master.vyroba) {
            if (!Trezor.databaze_master.vyroba[base].varianty || !Array.isArray(Trezor.databaze_master.vyroba[base].varianty)) continue;
            let v = Trezor.databaze_master.vyroba[base].varianty.find(x => x.kod === code);
            if (v) { baseCode = base; break; }
        }
    }
    if (baseCode) { 
        Alpine.store('appState').setProduct(code, baseCode); 
        Alpine.nextTick(() => {
            window.goToScreen('resultsScreen', pushHistory);
            requestAnimationFrame(() => { if (typeof window.aplikovatAutoShrink === 'function') window.aplikovatAutoShrink(); });
        });
    }
    else {
        if (typeof showToast === 'function' && typeof Alpine !== 'undefined' && Alpine.store('appState').isAppReady) {
            showToast("Kód nenalezen v databázi!"); 
        }
    }
}

function isVariantMissing(m, v) {
    let p = {...m.spolecne, ...v.spec}; let kod = v.kod;
    
    // --- PROFI FIX: Diktatura Master Dat přepisuje lokální data (Otočeno pořadí ...p) ---
    if (m.baleniRezim === 'krabicky' || (window.LINKA_DICT && m.baleniRezim === window.LINKA_DICT.REZIM_BALENI.KRABICKY)) {
        let progNum = p.miroProg;
        if (progNum) {
            let progKey = "PROGRAM" + progNum;
            if (typeof Trezor !== 'undefined' && Trezor.databaze_master && Trezor.databaze_master.baleni && Trezor.databaze_master.baleni[progKey]) {
                // OPRAVA STÍNOVÁNÍ: Data z programu přepíší lokální paměť pizzy
                p = {...p, ...Trezor.databaze_master.baleni[progKey]};
            }
        }
    }
    // ----------------------------------------------------------------
    
    let checkStr = (str) => {
        if (typeof str === 'string') {
            let s = str.toLowerCase();
            if (s.includes('dodám') || s.includes('pozděj') || s.includes('nedodán') || s.includes('nejsou data') || s.includes('zjistit') || s.includes('pracujeme na tom')) return true;
        }
        return false;
    };
    if (checkStr(m.zdroj) || checkStr(m.nazevBase) || checkStr(v.label)) return true;
    for (let key in p) {
        let editId = `${key}_${kod}`; let rawVal = p[key];
        if (checkStr(rawVal)) return true;
    }
    return false;
}

function isSectionMissing(sekce, kod) {
    if (typeof Trezor === 'undefined' || !Trezor.databaze_master || !Trezor.databaze_master.vyroba) return false;
    
    let mainData = null;
    let p = {};

    // 🚀 ENTERPRISE FIX 2.0: Inteligentní spárování keše podle unikátního konce složeného kódu varianty
    let cacheKey = Object.keys(window._linkaCache || {}).find(k => k.endsWith('_' + kod));
    
    if (cacheKey && window._linkaCache[cacheKey]) {
        let cp = window._linkaCache[cacheKey];
        mainData = cp.main;
        p = cp.p;
    } else {
        // Profi kompletní Fallback včetně kompletního rekurzivního rodokmenu (pokud keš chybí)
        let variantData = null;
        for (let base in Trezor.databaze_master.vyroba) {
            let main = Trezor.databaze_master.vyroba[base];
            if (!main.varianty || !Array.isArray(main.varianty)) continue;
            let v = main.varianty.find(x => x.kod === kod);
            if (v) { mainData = main; variantData = v; break; }
        }
        if (!mainData || !variantData) return false;

        p = JSON.parse(JSON.stringify({ ...mainData.spolecne, ...variantData.spec }));
        
        // Kompletní prošplhání adoptivních matek a babiček přímo ve fallbacku hlídače
        const sekceList = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'];
        sekceList.forEach(s => {
            let sourceKey = s + '_source';
            if (p[sourceKey]) {
                let visited = new Set();
                let currentMotherCode = p[sourceKey];
                let motherP = {};
                while (currentMotherCode && !visited.has(currentMotherCode)) {
                    visited.add(currentMotherCode);
                    let targetBase = currentMotherCode.includes('_') ? currentMotherCode.split('_')[0] : null;
                    let targetVar = currentMotherCode.includes('_') ? currentMotherCode.split('_')[1] : currentMotherCode;
                    if (!targetBase) {
                        for (let b in Trezor.databaze_master.vyroba) {
                            if (Trezor.databaze_master.vyroba[b].varianty && Array.isArray(Trezor.databaze_master.vyroba[b].varianty) && Trezor.databaze_master.vyroba[b].varianty.some(x => x.kod === targetVar)) {
                                targetBase = b; break;
                            }
                        }
                    }
                    if (targetBase && Trezor.databaze_master.vyroba[targetBase] && Trezor.databaze_master.vyroba[targetBase].varianty && Array.isArray(Trezor.databaze_master.vyroba[targetBase].varianty)) {
                        let tempMain = Trezor.databaze_master.vyroba[targetBase];
                        let v = tempMain.varianty.find(x => x.kod === targetVar);
                        if (v) {
                            let tempP = { ...tempMain.spolecne, ...(v.spec || {}) };
                            motherP = { ...tempP, ...motherP };
                            currentMotherCode = tempP[sourceKey] && tempP[sourceKey] !== currentMotherCode ? tempP[sourceKey] : null;
                        } else { currentMotherCode = null; }
                    } else { currentMotherCode = null; }
                }
                Object.keys(motherP).forEach(key => {
                    if (p[key] === undefined) p[key] = motherP[key];
                });
            }
        });

        if (mainData.baleniRezim === 'krabicky' || (window.LINKA_DICT && mainData.baleniRezim === window.LINKA_DICT.REZIM_BALENI.KRABICKY)) {
            let progNum = p.miroProg;
            if (progNum) {
                let progKey = "PROGRAM" + progNum;
                if (Trezor.databaze_master.baleni && Trezor.databaze_master.baleni[progKey]) {
                    Object.keys(Trezor.databaze_master.baleni[progKey]).forEach(mKey => {
                        if (p[mKey] === undefined) p[mKey] = Trezor.databaze_master.baleni[progKey][mKey];
                    });
                }
            }
        }
    }
    
    let sablona = nactiSablonu();
    
    let checkStr = (str) => {
        if (typeof str === 'string') {
            let s = str.toLowerCase();
            if (s.includes('dodám') || s.includes('pozděj') || s.includes('nedodán') || s.includes('nejsou data') || s.includes('zjistit') || s.includes('pracujeme na tom')) return true;
        }
        return false;
    };

    let checkPolozku = (id) => {
        let rawVal = window.getVal ? window.getVal(`${id}_${kod}`, p[id]) : p[id];
        return checkStr(rawVal);
    };

    if (sekce === 'baleni') {
        if (mainData.baleniRezim === window.LINKA_DICT?.REZIM_BALENI?.KRABICKY || mainData.baleniRezim === 'krabicky') {
            if (checkPolozku('miroProg') || checkPolozku('miroMat') || checkPolozku('balTrv') || checkPolozku('datumRadky') || checkPolozku('balKs')) return true;
            for (let stroj of (sablona.baleniKrabicky || [])) { if (checkPolozku(stroj.id)) return true; }
        } else {
            if (checkPolozku('pak1') || checkPolozku('balTrv') || checkPolozku('pak2')) return true;
            for (let stroj of (sablona.baleniKarton || [])) { if (checkPolozku(stroj.id)) return true; }
        }
        return false;
    }

    if (sekce === 'pec') {
        let sablonaPec = (mainData.pecRezim === 'sablona' || mainData.pecRezim === window.LINKA_DICT?.REZIM_PEC?.SABLONA) 
            ? (sablona.pecPrujezd || []) 
            : (sablona.pec || []);
        
        for (let stroj of sablonaPec) { 
            if (checkPolozku(stroj.id)) return true; 
        }
        return false;
    }

    let sList = sablona[sekce] || [];
    for (let stroj of sList) {
        if (checkPolozku(stroj.id)) return true;
    }

    return false;
}

function nactiSablonu() {
    let sab;
    if (typeof Trezor !== 'undefined' && Trezor.nastaveni && Trezor.nastaveni.sablona && Object.keys(Trezor.nastaveni.sablona).length > 0) {
        sab = JSON.parse(JSON.stringify(Trezor.nastaveni.sablona));
    } else {
        sab = JSON.parse(JSON.stringify(DEFAULT_SABLONA));
    }

    if (!sab.baleniKrabicky || sab.baleniKrabicky.length === 0) {
        sab.baleniKrabicky = JSON.parse(JSON.stringify(DEFAULT_SABLONA.baleniKrabicky));
    }
    if (!sab.baleniKarton || sab.baleniKarton.length === 0) {
        sab.baleniKarton = JSON.parse(JSON.stringify(DEFAULT_SABLONA.baleniKarton));
    }
    if (!sab.baleniMiropack || sab.baleniMiropack.length === 0) {
        sab.baleniMiropack = JSON.parse(JSON.stringify(DEFAULT_SABLONA.baleniMiropack));
    }
    return sab;
}

function ulozitSablonuWizzard() {
    let scope = document.getElementById('wizSablonaScope');
    if (!scope || typeof Alpine === 'undefined') { if(typeof showToast === 'function') showToast("❌ Chyba: Alpine.js není načten!"); return; }
    
    let data = Alpine.$data(scope).form;
    let cleanData = {};
    
    ['pekarna', 'kynarna', 'pec', 'pecPrujezd', 'pripravna', 'baleniKrabicky', 'baleniKarton', 'baleniMiropack'].forEach(s => {
        cleanData[s] = [];
        if(data[s]) {
            data[s].forEach(item => {
                if(item.label && item.label.trim() && item.id && item.id.trim()) {
                    let newItem = { id: item.id.trim(), label: item.label.trim(), type: item.type || 'text' };
                    if (item.unit && item.unit.trim()) newItem.unit = item.unit.trim();
                    if (item.isVariant) newItem.isVariant = true; // Uložíme si, že tento stroj je rozdílový
                    
                    if (item.type === 'select') {
                        let baseOpts = [];
                        if (item.optionsStr !== undefined) {
                            baseOpts = item.optionsStr.split(';').map(str => str.trim()).filter(str => str !== '');
                        } else if (item.options && Array.isArray(item.options)) {
                            baseOpts = item.options.filter(o => o !== "Dodáme" && o !== "custom");
                        } else {
                            baseOpts = ["Vypnuto", "Zapnuto"];
                        }
                        
                        newItem.options = [...baseOpts, "Dodáme"];
                    }
                    cleanData[s].push(newItem);
                }
            });
        }
    });

    db.collection('linka_data').doc('nastaveni').set({ sablona: cleanData }, {merge: true})
      .then(() => { 
          if(typeof showToast === 'function') showToast("Šablona uložena do Cloudu!"); 
          setTimeout(() => { uvolniZamekAZavri(true); }, 1500); // 🕒 Počkáme, ať si uživatel Toast přečte
      })
      .catch((err) => { if(typeof showToast === 'function') showToast("❌ Chyba při nahrávání: " + err); });
}

async function ulozVyrobuPomociAppJs() {
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro uložení potřebuješ signál!"); return;
    }
    let scope = document.getElementById('wizVyrobaScope');
    if (!scope || typeof Alpine === 'undefined') { if(typeof showToast === 'function') showToast("❌ Chyba: Alpine.js není načten!"); return; }
    
    let data = Alpine.$data(scope).form;
    let kodBase = data.kod ? data.kod.toString().trim() : ''; let nazevBase = data.nazevBase ? data.nazevBase.trim() : '';
    if (kodBase.length !== 6 || !nazevBase) { if(typeof showToast === 'function') showToast("⚠️ Vyplň 6-místný Kód produktu a Název!"); return; }

    if (!data.pecRezim || !data.balRezim) { 
        if(typeof showToast === 'function') showToast("⚠️ Musíš vybrat Režim pece a Režim balení!"); 
        return; 
    }

    let existuje = Trezor && Trezor.databaze_master && Trezor.databaze_master.vyroba && Trezor.databaze_master.vyroba[kodBase];
    if (existuje) {
        let ok = await showCustomModal({ title: "Kód už existuje!", message: "Tento 6-místný kód už v databázi je. Opravdu ho chceš kompletně PŘEPSAT novými daty? (Zapečené vlastní poznámky budou zachovány)", type: "confirm" });
        if (!ok) return;
    }

    let varianty = [];
    let spolecne = {}; 
    let sablona = nactiSablonu();
    
    let SPEC_FIELDS = [];
    ['pekarna', 'kynarna', 'pec', 'pecPrujezd', 'pripravna', 'baleniKrabicky', 'baleniKarton', 'baleniMiropack'].forEach(sekce => {
        if (sablona[sekce]) sablona[sekce].forEach(stroj => { if (stroj.isVariant) SPEC_FIELDS.push(stroj.id); });
    });

    if (existuje && existuje.spolecne) {
        Object.keys(existuje.spolecne).forEach(k => {
            if (k.includes('Pozn_')) spolecne[k] = existuje.spolecne[k];
        });
    }

    // 1. Zpracování Účtenek (Variant a jejich Specifikací)
    if (data.poloprodukty) {
        data.poloprodukty.forEach((p, idx) => { 
            let val = p.kod ? p.kod.trim().toUpperCase() : ''; 
            let label = p.label ? p.label.trim() : val; // Název varianty (např. Cheese)
            if(val) {
                let spec = {};
                
                if (existuje && existuje.varianty) {
                     let staraVar = existuje.varianty.find(x => x.kod === val);
                     if (staraVar && staraVar.spec) {
                         Object.keys(staraVar.spec).forEach(k => {
                             if (k.includes('Pozn_')) spec[k] = staraVar.spec[k];
                         });
                     }
                }

                // PROFI POŠŤÁK: Balí batoh s výjimkami POUZE Rebelům (Varianta 2 a další)
                if (idx > 0) {
                    SPEC_FIELDS.forEach(f => {
                        let rawVal = p[f]; 
                        if (rawVal === 'custom') rawVal = p[f + '_custom'];
                        
                        let isUnlocked = p.exceptions && p.exceptions.includes(f);
                        if (isUnlocked && rawVal !== undefined && rawVal !== '') {
                            spec[f] = rawVal.toString().trim();
                        }
                    });
                } else {
                    // Zlaté dítě (Pizza 1) nebalí z formuláře žádné výjimky strojů,
                    // ale PONECHÁVÁ SI poznámky, které jsme načetli o pár řádků výše!
                    Object.keys(spec).forEach(k => {
                        if (!k.includes('Pozn_')) delete spec[k];
                    });
                }

                varianty.push({ 
                        kod: val, 
                        label: label, 
                        spec: spec, 
                        // 🚀 FÁZE 2 OPRAVA: První pizza (Základ) si musí pamatovat své odemčené zámečky!
                        // Bere si je z hlavního formuláře (data.exceptions).
                        exceptions: (idx === 0) ? [...(data.exceptions || [])] : [...(p.exceptions || [])] 
                    });
            }
        });
    }
    
    if (varianty.length === 0) { if(typeof showToast === 'function') showToast("⚠️ Přidej alespoň jeden kód poloproduktu!"); return; }

    // 2. Zpracování ZÁKLADU (Těsto)
    let sekceProSber = ['pekarna', 'kynarna', 'pec', 'pecPrujezd', 'pripravna', 'baleniKrabicky', 'baleniKarton'];
    sekceProSber.forEach(sekce => {
        if (!sablona[sekce]) return;
        sablona[sekce].forEach(stroj => {
            
            let val = data[stroj.id];
            if (val === 'custom') val = data[stroj.id + '_custom'] || 'Dodáme';
            
            if (stroj.id === 'priKec' && val === 'Kapky') {
                let prumer = data[stroj.id + '_custom'];
                if (prumer && prumer.trim() !== '') val = `Kapky Ø ${prumer} cm`;
            }
            
            // 🚀 FÁZE 4 OPRAVA: Zápis Matky nebo vlastních dat (VČETNĚ MAZÁNÍ ZOMBIE DAT!) 🚀
            let syncKey = sekce;
            if (sekce === 'pecPrujezd') syncKey = 'pec';
            if (sekce.startsWith('baleni')) syncKey = 'baleni';

            let aktivniMatka = data.sourceCodes[syncKey] || data.sourceCode;
            let jeSekceSync = aktivniMatka && data.sync[syncKey];
            let maVyjimku = data.exceptions && data.exceptions.includes(stroj.id);

            if (jeSekceSync) {
                        spolecne[`${syncKey}_source`] = aktivniMatka;
                        
                        // Má výjimku a je vyplněná? Uložíme ji jako lokální vzpouru Rebela.
                        if (maVyjimku && val && val !== '') {
                            spolecne[stroj.id] = val.toString().trim();
                        }
                        // Pokud výjimku nemá, do objektu 'spolecne' ji vůbec nezapíšeme -> v cloudu se při přepsání sama smaže!
                    } else {
                        // Sekce je volná (odpojená od Matky), ukládáme normálně všechno, pokud není prázdná
                        if (val && val !== '') {
                            spolecne[stroj.id] = val.toString().trim();
                        }
                    }
        });
    });
    let dbPecRezim = data.pecRezim;
    if (dbPecRezim.includes('5 Zón') || dbPecRezim === 'pece') dbPecRezim = 'pece';
    else if (dbPecRezim.includes('Průjezd') || dbPecRezim.includes('šablona') || dbPecRezim === 'sablona') dbPecRezim = 'sablona';

    let dbBalRezim = data.balRezim;
    if (dbBalRezim.includes('Krabičky') || dbBalRezim === 'krabicky') dbBalRezim = 'krabicky';
    else if (dbBalRezim.includes('Karton') || dbBalRezim.includes('karton') || dbBalRezim === 'karton') dbBalRezim = 'karton';

    if (dbPecRezim === 'pece') {
        spolecne.pecDig = "Vždy zapnutá"; 
    }

    // ---------------------------------------------------------
    // ✨ MAGIE: ODSLECHOVÁNÍ A PŘEPIS BALÍCÍHO PROGRAMU ✨
    // ---------------------------------------------------------
    let baleniBudeUpraveno = false;
    let progKey = "";
    let novyProgData = {};

    if (dbBalRezim === 'krabicky' && data.miroProg) {
        spolecne.miroProg = data.miroProg; // K Pizze se uloží jen číslo programu jako odkaz!

        progKey = "PROGRAM" + data.miroProg.toString().trim();
        let staryProgData = Trezor.databaze_master.baleni && Trezor.databaze_master.baleni[progKey];

        if (staryProgData) {
            novyProgData = { ...staryProgData }; // Zkopírujeme starý program
            let hasChanges = false;

            // A. Zkontrolujeme, jestli se nezměnily parametry Miropacku (čidla, pásy...)
            if (sablona.baleniMiropack) {
                sablona.baleniMiropack.forEach(stroj => {
                    let valZeWizzardu = data[stroj.id];
                    if (valZeWizzardu !== undefined && valZeWizzardu.toString().trim() !== '') {
                        let novaHodnota = valZeWizzardu.toString().trim();
                        // Pokud je to nové číslo jiné než to, co bylo v databázi, bereme ho!
                        if (novyProgData[stroj.id] !== novaHodnota) {
                            novyProgData[stroj.id] = novaHodnota;
                            hasChanges = true;
                        }
                    }
                });
            }

            // B. Zkontrolujeme i obecné věci z krabiček (Datumovka, Zvedací elko...)
            ['balTrv', 'datumRadky', 'balKs', 'novoElko', 'novoTunel'].forEach(k => {
                let valZeWizzardu = data[k];
                if (valZeWizzardu !== undefined && valZeWizzardu.toString().trim() !== '') {
                    let novaHodnota = valZeWizzardu.toString().trim();
                    if (novyProgData[k] !== novaHodnota) {
                        novyProgData[k] = novaHodnota;
                        hasChanges = true;
                    }
                }
            });

            // Pokud editor fakt něco přepsal, aktivujeme ukládání do balení
            if (hasChanges) {
                baleniBudeUpraveno = true;
            }
        }
    }
    // ---------------------------------------------------------

    // 3. Složení Pizzy (Výroby)
    let novaVyroba = { 
        nazevBase: nazevBase, 
        baseCode: kodBase, 
        zdroj: data.tvurce || 'LV', 
        baleniRezim: dbBalRezim, 
        pecRezim: dbPecRezim, 
        spolecne: spolecne, 
        varianty: varianty 
    };
    
    // 4. PROFI SANITIZACE A DVOJITÉ CÍLENÉ ULOŽENÍ DO CLOUDU
    try {
        let cleanVyroba = JSON.parse(JSON.stringify(novaVyroba));
        let updates = {
            [`vyroba.${kodBase}`]: cleanVyroba
        };

        let cleanBaleni = null;
        if (baleniBudeUpraveno) {
            cleanBaleni = JSON.parse(JSON.stringify(novyProgData));
            updates[`baleni.${progKey}`] = cleanBaleni;
        }

        // Atomický zápis – výroba i program balení se zapíší v jediné operaci
        await db.collection('linka_data').doc('databaze_master').update(updates);

        if (typeof Trezor !== 'undefined' && Trezor.databaze_master) {
            if (Trezor.databaze_master.vyroba) Trezor.databaze_master.vyroba[kodBase] = cleanVyroba;
            if (cleanBaleni && Trezor.databaze_master.baleni) Trezor.databaze_master.baleni[progKey] = cleanBaleni;
        }
        let dbStore = Alpine.store('trezor');
        if (dbStore && dbStore.databaze_master) {
            if (dbStore.databaze_master.vyroba) dbStore.databaze_master.vyroba[kodBase] = cleanVyroba;
            if (cleanBaleni && dbStore.databaze_master.baleni) dbStore.databaze_master.baleni[progKey] = cleanBaleni;
        }

        if (typeof showToast === 'function') showToast("🚀 Výroba úspěšně nahrána do Cloudu!");
        window._linkaCache = {};
        uvolniZamekAZavri(true);
    } catch (err) {
        console.error("Chyba zápisu do Master Dat:", err);
        if (typeof showToast === 'function') showToast("❌ Chyba při nahrávání: " + err.message);
    }
}

// =========================================================================
// 📦 ULOŽENÍ BALÍCÍHO PROGRAMU Z WIZZARDU
// =========================================================================
async function ulozBaleniPomociAppJs() {
    if (typeof isManuallyDisconnected !== 'undefined' && (isManuallyDisconnected || !navigator.onLine)) {
        if(typeof showToast === 'function') showToast("⛔ OFFLINE REŽIM: Pro uložení potřebuješ signál!"); return;
    }
    let scope = document.getElementById('wizBaleniScope');
    if (!scope || typeof Alpine === 'undefined') { if(typeof showToast === 'function') showToast("❌ Chyba: Alpine.js není načten!"); return; }
    
    let data = Alpine.$data(scope).form;
    let key = data.key ? data.key.toString().trim().toUpperCase() : '';
    let nazev = data.nazev ? data.nazev.trim() : '';

    if (!key || key.length < 5) {
        if(typeof showToast === 'function') showToast("⚠️ Vyplň správně Klíč v DB (např. PROGRAM10)!"); return;
    }
    // Automatická oprava, pokud napíšeš jen číslo
    if (!key.startsWith('PROGRAM')) {
        key = 'PROGRAM' + key.replace(/\D/g, ''); 
    }

    if (!nazev) {
        if(typeof showToast === 'function') showToast("⚠️ Vyplň Název v roletce!"); return;
    }

    let existuje = Trezor && Trezor.databaze_master && Trezor.databaze_master.baleni && Trezor.databaze_master.baleni[key];
    let isEdit = window.upravovanyProgramKey === key;

    // Ochrana před nechtěným přepsáním jiného programu
    if (existuje && !isEdit) {
        let ok = await showCustomModal({ title: "Program už existuje!", message: "Tento kód programu už v databázi je. Opravdu ho chceš přepsat novými daty?", type: "confirm" });
        if (!ok) return;
    }

    let novyProgram = {
        nazev: nazev,
        novoElko: data.novoElko || 'Dodáme'
    };

    let sablona = typeof nactiSablonu === 'function' ? nactiSablonu() : window.DEFAULT_SABLONA;
    if (sablona.baleniMiropack) {
        sablona.baleniMiropack.forEach(stroj => {
            let klicForm = 'ws' + stroj.id.replace('miro', '');
            let val = data[klicForm];
            if (val !== undefined && val !== '') {
                novyProgram[stroj.id] = val.toString().trim();
            }
        });
    }

    try {
        // Zápis do databáze (změní nebo vytvoří nový)
        await db.collection('linka_data').doc('databaze_master').set({ baleni: { [key]: novyProgram } }, {merge: true});
        
        // Pokud jsme při úpravě změnili klíč (např. z PROGRAM3 na PROGRAM4), smažeme ten starý
        if (window.upravovanyProgramKey && window.upravovanyProgramKey !== key) {
            await db.collection('linka_data').doc('databaze_master').update({ [`baleni.${window.upravovanyProgramKey}`]: firebase.firestore.FieldValue.delete() });
        }

        if(typeof showToast === 'function') showToast("📦 Balící program úspěšně uložen!");
        window.upravovanyProgramKey = null; // Vyčistíme paměť
        uvolniZamekAZavri(true);
    } catch (err) {
        if(typeof showToast === 'function') showToast("❌ Chyba při nahrávání: " + err);
    }
}

window.vyhovujeFiltrumMaster = function(baseCode, db, filtrTyp) {
    if (filtrTyp === 'vse') return true;
    if (!db || !db[baseCode]) return false;
    
    let s = db[baseCode].spolecne || {};
    let pocetPropojeni = ['pekarna_source', 'kynarna_source', 'pec_source', 'pripravna_source', 'baleni_source'].filter(x => s[x]).length;
    
    if (filtrTyp === 'matky') return pocetPropojeni === 0;
    if (filtrTyp === 'hybridi') return pocetPropojeni > 0 && pocetPropojeni < 5;
    return true;
};

// =========================================================================
// 🚀 PWA REGISTRACE A AUTOMATICKÁ SYNCHRONIZACE VERZE Z SW.JS
// =========================================================================
(function inicializujVerziAWorker() {
    function aplikujVerzi(ver) {
        if (!ver) return;
        localStorage.setItem('app_version', ver);
        const badgeEl = document.getElementById('versionBadge');
        if (badgeEl) badgeEl.innerText = ver;
    }

    // 1. Okamžitý render z lokální paměti
    const ulozenaVerze = localStorage.getItem('app_version');
    if (ulozenaVerze) aplikujVerzi(ulozenaVerze);

    // 2. Registrace Service Workeru, automatická obnova a čistka
    if ('serviceWorker' in navigator) {
        let hadController = Boolean(navigator.serviceWorker.controller);
        let reloading = false;

        // 🔄 AUTOMATICKÝ RELOAD: Jakmile nový worker aktivuje a smaže starou keš, stránka se sama restartuje
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!hadController) {
                hadController = true;
                return;
            }
            if (reloading) return;
            reloading = true;
            window.location.reload();
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'VERSION') {
                aplikujVerzi(event.data.version);
            }
        });

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    const dotazNaVerzi = () => {
                        const worker = navigator.serviceWorker.controller || reg.active || reg.installing;
                        if (worker) worker.postMessage({ type: 'GET_VERSION' });
                    };

                    // Detekce nového SW a vyžádání verze po instalaci
                    reg.onupdatefound = () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' || newWorker.state === 'activated') {
                                    dotazNaVerzi();
                                }
                            });
                        }
                    };

                    // Kontrola aktualizací při návratu do okna
                    window.addEventListener('focus', () => reg.update());
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') reg.update();
                    });

                    dotazNaVerzi();
                    reg.update();
                })
                .catch(err => console.error('Chyba Service Workeru:', err));
        });
    }
})();

// =========================================================================
// 📲 PWA INSTALACE A NÁVOD PRO APPLE
// =========================================================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        Alpine.store('appState').canInstallPwa = true;
    }
    const btnLoginInstall = document.getElementById('btnInstallPwa');
    if (btnLoginInstall && !Alpine.store('appState')?.isStandalone) {
        btnLoginInstall.style.display = 'flex';
    }
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
        Alpine.store('appState').canInstallPwa = false;
        Alpine.store('appState').isStandalone = true;
    }
    const btnLoginInstall = document.getElementById('btnInstallPwa');
    if (btnLoginInstall) btnLoginInstall.style.display = 'none';
    if (typeof showToast === 'function') showToast("🎉 Aplikace byla úspěšně nainstalována na plochu!");
});

window.installPWA = window.triggerPwaInstall = async function() {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            if (typeof Alpine !== 'undefined' && Alpine.store('appState')) {
                Alpine.store('appState').canInstallPwa = false;
            }
            const btnLoginInstall = document.getElementById('btnInstallPwa');
            if (btnLoginInstall) btnLoginInstall.style.display = 'none';
        }
        deferredInstallPrompt = null;
    } else {
        if (typeof showToast === 'function') showToast("Instalace není dostupná nebo již proběhla.");
    }
};

window.otevriNavodIphone = function() {
    if (typeof showCustomModal === 'function') {
        showCustomModal({
            title: "📲 INSTALACE NA IPHONE",
            message: "Aplikaci přidáš na plochu ve 3 krocích:<br><br>" +
                     "1️⃣ V Safari dole klepni na tlačítko <b>Sdílet</b> (čtvereček se šipkou ⎋).<br><br>" +
                     "2️⃣ V nabídce sjeď níže a zvol <b>Přidat na plochu</b> (➕).<br><br>" +
                     "3️⃣ Vpravo nahoře klepni na <b>Přidat</b>.",
            type: "alert"
        });
        const btnCancel = document.getElementById('modalBtnCancel');
        const btnConfirm = document.getElementById('modalBtnConfirm');
        if (btnCancel) btnCancel.style.display = 'none';
        if (btnConfirm) btnConfirm.innerText = 'ROZUMÍM';
    }
};