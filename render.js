// =========================================================================
// 📦 ZPRACOVÁNÍ A VYKRESLENÍ DAT
// =========================================================================

window.LINKA_DICT = {
    SEKCE: { PEKARNA: 'pekarna', KYNARNA: 'kynarna', PEC: 'pec', PRIPRAVNA: 'pripravna', BALENI: 'baleni' },
    REZIM_PEC: { PECE: 'pece', SABLONA: 'sablona' },
    REZIM_BALENI: { KRABICKY: 'krabicky', KARTON: 'karton' },
    STAV: { VYPNUTO: 'Vypnuto', ZAPNUTO: 'Zapnuto', DODAME: 'Dodáme', CUSTOM: 'custom' },
    AUTOR: { LV: 'LV', MAKYAN: 'M' }
};

window.HOLAC_MAP = {
    "Program 1 (8x29 plátky)": { label: "4x s deskou", foto: "img/fotoholac4xsdeskou.jpg" },
    "Program 2 (8x12 plátky)": { label: "4x s deskou", foto: "img/fotoholac4xsdeskou.jpg" },
    "Program 3 (4x4x12 sirky)": { label: "4x bez desky", foto: "img/fotoholac4xbezdesky.jpg" },
    "Program 4 (4x4x29 sirky)": { label: "4x bez desky", foto: "img/fotoholac4xbezdesky.jpg" },
    "Program 5 (8x8 kostky)": { label: "2x bez desky", foto: "img/fotoholac2xbezdesky.jpg" },
    "Program 6 (12x16 plátky)": { label: "4x s deskou", foto: "img/fotoholac4xsdeskou.jpg" },
    "Program 7 (8x12 chorizo)": { label: "4x bez desky", foto: "img/fotoholac4xbezdesky.jpg" },
    "Program 8 (16x24 plátky)": { label: "4x s deskou", foto: "img/fotoholac4xsdeskou.jpg" },
    "Program 9": { label: "6x18", foto: "img/fotoholacdisk6x18.jpg" },
    "Program 10": { label: "6x36", foto: "img/fotoholacdisk6x36.jpg" },
    "Program 11": { label: "Véčko", foto: "img/fotoholacdiskv.jpg" },
    "Program 12 (4x2x29 sirky)": { label: "4x bez desky", foto: "img/fotoholac4xbezdesky.jpg" }
};

// 🔧 CHYTRÝ AUTOPILOT: Doplňuje chybějící závorky z databáze a sjednocuje názvy
window.getFullHolacName = function(val) {
    if (!val) return val;
    let s = val.toString().trim();
    if (window.HOLAC_MAP[s]) return s; 
    
    let search = s.toLowerCase().split('(')[0].trim(); 
    if (!search) return val;

    for (let key in window.HOLAC_MAP) {
        let keyPart = key.toLowerCase().split('(')[0].trim();
        if (keyPart === search) return key; 
    }
    return val; 
};

window.getHolacInfo = function(progName) {
    if (!progName) return null;
    let fullProg = window.getFullHolacName(progName);
    return window.HOLAC_MAP[fullProg] || null;
};

const MIROPACK_LIST = [
    { id: "miro3", name: "3 boční vedení zásobníku", def: "172" }, { id: "miro4", name: "4 výška stoupacího pásu", def: "105" },
    { id: "miro6", name: "6 čidlo doplnění krabiček", def: "30" }, { id: "miro7", name: "7 výška přisávání", def: "160" },
    { id: "miro8", name: "8 pozice přísavky levá", def: "240" }, { id: "miro9", name: "9 šířka vod. válečku", def: "127" },
    { id: "miro10", name: "10 délka vod. válečku", def: "215" }, { id: "miro11", name: "11 vedení dolní klopy", def: "23" },
    { id: "miro12", name: "12 poloha můstku", def: "3" }, { id: "miro13", name: "13 výška horní klopy", def: "32" }, 
    { id: "miro14", name: "14 šířka horní chlopně", def: "20" }, { id: "miro15", name: "15 zavírač uší levý", def: "75" }, 
    { id: "miro16", name: "16 výška nástrčného plechu", def: "100" }, { id: "miro17", name: "17 výška zvedače krycí klopy", def: "46" }, 
    { id: "miro18", name: "18 šířka zvedače krycí klopy", def: "16" }, { id: "miro20", name: "20 šířka krabičky", def: "253,5" }, 
    { id: "miro21", name: "21 lišta lepící hlavy levá", def: "30" }, { id: "miro22", name: "22 lepící hlava levá", def: "15" }, 
    { id: "miro28", name: "28 zavírač uší pravý", def: "75" }, { id: "miro29", name: "29 výška nástrčného plechu P", def: "100" }, 
    { id: "miro30", name: "30 lišta lepící hlavy pravá", def: "30" }, { id: "miro31", name: "31 lepící hlava pravá", def: "15" }
];

function vycistiText(text) {
    if (text === null || text === undefined) return '';
    const entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
    };
    return String(text).replace(/[&<>"'`\/]/g, (char) => entityMap[char]);
}

function resolveAssetPath(filename) {
    if (!filename) return '';
    let s = String(filename).trim();
    if (s.startsWith('http') || s.startsWith('img/')) return s;
    if (s.includes('.')) return 'img/' + s;
    return '';
}

window.formatValForDisplay = function(val, unit, idFull) {
    if (val === null || val === undefined) return { text: "", colorClass: '', hide: true };
    let vStr = val.toString().toLowerCase().trim();
    let STAV = window.LINKA_DICT.STAV;
    
    let id = idFull ? idFull.split('_')[0] : '';

    let shouldHide = (vStr === STAV.VYPNUTO.toLowerCase() || vStr === 'ne' || vStr === '-' || vStr === '');

    if (shouldHide) {
        if (vStr === STAV.VYPNUTO.toLowerCase()) {
            // 🛑 TADY JE ČERNÁ LISTINA - co se má schovat, když je to Vypnuto
const SKRYT_KDYZ_VYPNUTO = [
    'pekPln', 
    'priZdo1', 
    'priZdo2', 
    'alimecMat', 
    'maslicko', 
    'diskSyr', 
    'diskSal'
];
            
            if (SKRYT_KDYZ_VYPNUTO.includes(id)) {
                return { text: val, colorClass: '', hide: true }; // Plnička mizí
            } else {
                return { text: "Vypnuto", colorClass: '', hide: false }; // Vše ostatní svítí klasicky černě!
            }
        }
        // Pro prázdné hodnoty, pomlčky a "ne" se schováme vždy
        return { text: val, colorClass: '', hide: true };
    }
    
    let displayVal = val.toString();
    displayVal = displayVal.charAt(0).toUpperCase() + displayVal.slice(1);

    if (vStr.includes('dodám') || vStr.includes('zjistit') || vStr.includes('pozděj')) {
        return { text: STAV.DODAME, colorClass: 'cervena', hide: false }; 
    }

    if (idFull) {
        if (idFull.includes('pekVel')) {
            if (/^\d+$/.test(displayVal) || /^\d+[.,]\d+$/.test(displayVal)) displayVal = "Ø " + displayVal;
            if (!displayVal.includes('cm') && !displayVal.toLowerCase().includes('gastro')) displayVal += " cm";
        }
        if (idFull.includes('pecOd') && (/^\d+$/.test(displayVal) || /^\d+[.,]\d+$/.test(displayVal))) { 
            displayVal = "Potenciometr na " + displayVal; 
        }
    }
    
    if (unit) {
        let cleanUnit = unit.trim().toLowerCase();
        let lowerVal = displayVal.toLowerCase();
        if (!lowerVal.includes(cleanUnit)) {
            displayVal += ' ' + unit.trim();
        }
    }
    
    let c = vStr.includes('odstranit') ? 'cervena' : ''; // "ano" a "zapnuto" už nebudou zelené, ale čistě černé
    
    // 🇨🇿 Česká desetinná čárka: Přepíše tečku mezi čísly (např. 2.7 -> 2,7)
    displayVal = displayVal.replace(/(\d)\.(\d)/g, '$1,$2');
    
    return { text: displayVal, colorClass: c, hide: false };
};

window.getVal = function(id, defaultVal) {
    let val = defaultVal;
    
    if (val === undefined || val === "") {
        let baseId = id.split('_')[0];
        const povinnaPoleBaleni = ['balTrv', 'datumRadky', 'balKs', 'novoElko', 'novoTunel', 'pak1', 'pak2'];
        if (povinnaPoleBaleni.includes(baseId)) {
            val = window.LINKA_DICT.STAV.DODAME;
        } else {
            val = window.LINKA_DICT.STAV.VYPNUTO;
        }
    }

    if (typeof val === 'string') {
        val = vycistiText(val);
        
        let baseId = id.split('_')[0];
        if (baseId === 'holSyr' || baseId === 'holSal') {
            val = window.getFullHolacName(val);
        }
    }
    
    return val;
};

function showKatalogBaleni(pushHistory = true) { goToScreen('katalogScreen', pushHistory); }
function openKatalogProg(progKey, pushHistory = true) {
    let p = Trezor.databaze_master.baleni[progKey]; if(!p) return;
    if (typeof Alpine !== 'undefined' && Alpine.store('appState')) { Alpine.store('appState').setKatalogProg(progKey); }
    goToScreen('katalogDetailScreen', pushHistory);
}

function linkaEngine() {
    return {
        get app() { return Alpine.store('appState'); },
        get db() { return Alpine.store('trezor'); },
        get sablona() { 
            let sab = (typeof nactiSablonu === 'function') ? nactiSablonu() : window.DEFAULT_SABLONA; 
            if (!sab.baleniKrabicky || sab.baleniKrabicky.length === 0) {
                if (typeof window.DEFAULT_SABLONA !== 'undefined' && window.DEFAULT_SABLONA.baleniKrabicky) sab.baleniKrabicky = window.DEFAULT_SABLONA.baleniKrabicky;
            }
            if (!sab.baleniKarton || sab.baleniKarton.length === 0) {
                if (typeof window.DEFAULT_SABLONA !== 'undefined' && window.DEFAULT_SABLONA.baleniKarton) sab.baleniKarton = window.DEFAULT_SABLONA.baleniKarton;
            }
            // MAGIE: Automatické zobrazení vypočítaných Disků na lince, i když tě neotravují ve Wizzardu
            if (sab.pripravna) {
                let syrIdx = sab.pripravna.findIndex(x => x.id === 'holSyr');
                if (syrIdx !== -1 && !sab.pripravna.find(x => x.id === 'diskSyr')) {
                    sab.pripravna.splice(syrIdx + 1, 0, { id: 'diskSyr', label: 'Disk', type: 'text', unit: '' });
                }
                
                let salIdx = sab.pripravna.findIndex(x => x.id === 'holSal');
                if (salIdx !== -1 && !sab.pripravna.find(x => x.id === 'diskSal')) {
                    sab.pripravna.splice(salIdx + 1, 0, { id: 'diskSal', label: 'Disk', type: 'text', unit: '' });
                }
            }
            return sab;
        },
        get miroList() { 
            let ml = this.sablona.baleniMiropack || []; 
            return ml.map(x => ({ id: x.id, name: x.label, def: "" }));
        },

        get rodinaStatus() {
            window._linkaCache = window._linkaCache || {};
            let cacheKey = 'RS_' + this.app.lastBaseCode + '_' + this.app.activeCode;
            if (window._linkaCache[cacheKey]) return window._linkaCache[cacheKey];

            if (!this.app.activeCode) return null;
            let myVarCode = this.app.activeCode;
            let cP = this.currentProduct; // Tohle samo o sobě už použije cache z druhého getteru
            if (!cP || !cP.p) return null;

            let myCompositeCode = this.app.lastBaseCode + '_' + myVarCode;
            let maMatku = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].some(s => {
                let src = cP.p[`${s}_source`];
                return src && src !== myVarCode && src !== myCompositeCode;
            });
            
            let urciPramatku = (c, db) => {
                let visited = new Set();
                while (c && c.includes('_') && !visited.has(c)) {
                    visited.add(c);
                    let b = c.split('_')[0];
                    let next = db[b] && db[b].spolecne && (db[b].spolecne.pekarna_source || db[b].spolecne.kynarna_source || db[b].spolecne.pec_source || db[b].spolecne.pripravna_source || db[b].spolecne.baleni_source);
                    if (next && next !== c) c = next; else break;
                }
                return c;
            };

            let jeMatkou = false;
            for (let b in this.db.vyroba) {
                let main = this.db.vyroba[b];
                if (!main.varianty || !Array.isArray(main.varianty)) continue;
                for (let v of main.varianty) {
                    if (v.kod === myVarCode && b === this.app.lastBaseCode) continue;
                    let hasSrc = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].some(s => {
                        let src = (v.spec && v.spec[`${s}_source`]) || (main.spolecne && main.spolecne[`${s}_source`]);
                        return src && urciPramatku(src, this.db.vyroba) === myCompositeCode;
                    });
                    if (hasSrc) { jeMatkou = true; break; }
                }
                if (jeMatkou) break;
            }
            // Skutečná kontrola rebela - má u sebe v databázi odemčené zámečky?
            let maVlastniVyjimky = cP.variant && cP.variant.exceptions && cP.variant.exceptions.length > 0;
            let jePrvni = (cP.main.varianty && cP.main.varianty[0].kod === myVarCode);
            
            // ENTERPRISE 3.0: Zjištění plného vs částečného propojení (Hybrid logika)
            let pocetPropojenych = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].filter(s => {
                let src = cP.p[`${s}_source`];
                return src && src !== myVarCode && src !== myCompositeCode;
            }).length;
            let jeCastecnePropojeno = pocetPropojenych > 0 && pocetPropojenych < 5;

            let result;
            if (jeMatkou && maMatku) result = { label: 'ADOPTIVNÍ MATKA', icon: '🤱', class: 'badge-adoptivni' };
            else if (jeMatkou) result = { label: 'MATKA', icon: '👑', class: 'badge-matka' };
            else if (jeCastecnePropojeno && maMatku) result = { label: 'HYBRID', icon: '🎛️', class: 'badge-hybrid' };
            else if (maVlastniVyjimky && (maMatku || !jePrvni)) result = { label: 'REBEL', icon: '🐺', class: 'badge-rebel' };
            else if (jePrvni && maMatku) result = { label: 'KLON', icon: '🧬', class: 'badge-adoptivni' };
            else if (jePrvni) result = { label: 'MATKA', icon: '👑', class: 'badge-matka' };
            else result = { label: 'DÍTĚ', icon: '👶', class: 'badge-dite' }; 
            
            window._linkaCache[cacheKey] = result;
            return result;
        },

        get currentProduct() {
            window._linkaCache = window._linkaCache || {};
            let cacheKey = 'CP_' + this.app.lastBaseCode + '_' + this.app.activeCode;
            if (window._linkaCache[cacheKey]) return window._linkaCache[cacheKey];

            if (!this.app.activeCode || !this.app.lastBaseCode) return null;
            let mainData = this.db.vyroba[this.app.lastBaseCode];
            if (!mainData || !mainData.varianty || !Array.isArray(mainData.varianty)) return null;
            let variantData = mainData.varianty.find(x => x.kod === this.app.activeCode);
            if (!variantData) return null;
            
            // --- ZÁKLADNÍ SLOŽENÍ DAT ---
            let pCombined = { ...mainData.spolecne, ...variantData.spec };
            let exceptions = variantData.exceptions || [];

            // 🚀 ENTERPRISE 3.0: CHYTRÝ SKENER DĚDIČNOSTI S VÝJIMKAMI 🚀
            const sekceList = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'];
            sekceList.forEach(sekce => {
                let sourceKey = sekce + '_source';
                let syncKey = sekce + '_sync';
                
                // Pokud má sekce nastavenou Matku a je zapnutý SYNC (ŠPLHÁNÍ K BABIČKÁM)
                if (pCombined[sourceKey] && variantData[syncKey] !== false) {
                    let visited = new Set();
                    let currentMotherCode = pCombined[sourceKey];
                    let motherP = {};
                    let motherMain = null;

                    while (currentMotherCode && !visited.has(currentMotherCode)) {
                        visited.add(currentMotherCode);
                        let tempMain = null; let tempSpec = {};
                        // 🚀 ZPRACOVÁNÍ SLOŽENÉHO KLÍČE (aby motor našel šuplík i poloprodukt)
                        let targetBase = null;
                        let targetVar = currentMotherCode;
                        if (currentMotherCode.includes('_')) {
                            let parts = currentMotherCode.split('_');
                            targetBase = parts[0];
                            targetVar = parts[1];
                        }

                        let bCode = targetBase;
                        if (!bCode) {
                            for (let b in this.db.vyroba) {
                                if (this.db.vyroba[b].varianty && Array.isArray(this.db.vyroba[b].varianty) && this.db.vyroba[b].varianty.some(x => x.kod === targetVar)) {
                                    bCode = b; break;
                                }
                            }
                        }

                        if (bCode && this.db.vyroba[bCode] && this.db.vyroba[bCode].varianty && Array.isArray(this.db.vyroba[bCode].varianty)) {
                            let v = this.db.vyroba[bCode].varianty.find(x => x.kod === targetVar);
                            if (v) { tempMain = this.db.vyroba[bCode]; tempSpec = v.spec || {}; }
                        }
                        
                        if (tempMain) {
                            if (!motherMain) motherMain = tempMain; // První matka diktuje globální režim pece/balení
                            let tempP = { ...tempMain.spolecne, ...tempSpec };
                            motherP = { ...tempP, ...motherP }; // Novější generace nepřepisuje starší
                            
                            if (tempP[sourceKey] && tempP[sourceKey] !== currentMotherCode) {
                                currentMotherCode = tempP[sourceKey]; // Šplháme výš
                            } else {
                                currentMotherCode = null; // Našli jsme pra-matku, končíme
                            }
                        } else {
                            currentMotherCode = null;
                        }
                    }

                    if (motherMain) {

                        // Projdeme všechny stroje v šabloně pro tuto sekci
                        let sablonaSekce = this.sablona[sekce] || [];
                        if (sekce === 'pec' && this.sablona['pecPrujezd']) {
                            sablonaSekce = [...sablonaSekce, ...this.sablona['pecPrujezd']];
                        }
                        if (sekce === 'baleni') {
                            sablonaSekce = [...(this.sablona.baleniKrabicky||[]), ...(this.sablona.baleniKarton||[])];
                        }

                        sablonaSekce.forEach(stroj => {
                            if (stroj.id) {
                                // 🚀 OPRAVA: Pokud Klon nebo Rebel nemá svoji vlastní hodnotu, teprve pak vezmi od Matky
                                if (pCombined[stroj.id] === undefined && motherP[stroj.id] !== undefined) {
                                    pCombined[stroj.id] = motherP[stroj.id];
                                }
                            }
                        });

                        // Speciální systémové klíče (Režimy) a zadrátované hodnoty pece
                    if (sekce === 'pec') {
                        if (pCombined.pecRezim === undefined) pCombined.pecRezim = motherMain.pecRezim;
                        // 🚀 OPRAVA PECE: I tady respektujeme vlastní hodnoty Klona
                        if (motherMain.pecRezim === 'pece' || (window.LINKA_DICT && motherMain.pecRezim === window.LINKA_DICT.REZIM_PEC.PECE)) {
                            for(let i=1; i<=5; i++) {
                                if (pCombined[`pecZ${i}t`] === undefined && motherP[`pecZ${i}t`] !== undefined) pCombined[`pecZ${i}t`] = motherP[`pecZ${i}t`];
                                if (pCombined[`pecZ${i}p1`] === undefined && motherP[`pecZ${i}p1`] !== undefined) pCombined[`pecZ${i}p1`] = motherP[`pecZ${i}p1`];
                                if (pCombined[`pecZ${i}p2`] === undefined && motherP[`pecZ${i}p2`] !== undefined) pCombined[`pecZ${i}p2`] = motherP[`pecZ${i}p2`];
                            }
                            for(let i=1; i<=3; i++) {
                                if (pCombined[`pecOd${i}`] === undefined && motherP[`pecOd${i}`] !== undefined) pCombined[`pecOd${i}`] = motherP[`pecOd${i}`];
                            }
                            if (pCombined.pecDig === undefined && motherP.pecDig !== undefined) pCombined.pecDig = motherP.pecDig;
                        }
                    }
                    if (sekce === 'baleni') pCombined.baleniRezim = motherMain.baleniRezim;
                    }
                }
            });
            
            // Propojení s Miropack programem (pokud existuje)
            if (mainData.baleniRezim === window.LINKA_DICT.REZIM_BALENI.KRABICKY && pCombined.miroProg) {
                let progKey = "PROGRAM" + pCombined.miroProg;
                let miroData = this.db.baleni[progKey];
                if (miroData) {
                    // 🚀 OPRAVA: Respektujeme výjimky od Rebela i Klona
                    Object.keys(miroData).forEach(mKey => {
                        if (pCombined[mKey] === undefined) {
                            pCombined[mKey] = miroData[mKey];
                        }
                    });
                }
            }

            // Normalizace názvů pro Holac
            if (pCombined.holSyr) pCombined.holSyr = window.getFullHolacName(pCombined.holSyr);
            if (pCombined.holSal) pCombined.holSal = window.getFullHolacName(pCombined.holSal);

            if (pCombined.holSyr) {
                let info = window.getHolacInfo(pCombined.holSyr);
                if (info) pCombined.diskSyr = info.label;
            }
            if (pCombined.holSal) {
                let info = window.getHolacInfo(pCombined.holSal);
                if (info) pCombined.diskSal = info.label;
            }
            
            let plnyNazev = (variantData.label === mainData.nazevBase || variantData.label.includes(mainData.nazevBase)) 
                ? variantData.label 
                : mainData.nazevBase + ' - ' + variantData.label;

            // ENTERPRISE: Zjistíme vazbu. Buď adoptivní (z jiné výroby), nebo přirozenou (základní receptura téže výroby)
            let explicitniVazba = pCombined.pekarna_source || pCombined.pec_source || pCombined.pripravna_source || pCombined.baleni_source;
            let prirozenaVazba = (mainData.varianty && mainData.varianty.length > 0 && mainData.varianty[0].kod !== this.app.activeCode) ? mainData.varianty[0].kod : null;
            let finalniVazba = explicitniVazba || prirozenaVazba;

            let result = {
                baseCode: this.app.lastBaseCode, 
                code: this.app.activeCode, 
                main: mainData, 
                variant: variantData, 
                p: pCombined,
                plnyNazev: plnyNazev,
                exceptions: exceptions,
                vazbaText: finalniVazba ? '(vazba na ' + finalniVazba + ')' : ''
            };
            window._linkaCache[cacheKey] = result;
            return result;
        },

        resolvePhoto(val, code) {
        if (!val) return '';
        let s = String(val).trim();
        if (s.includes('.')) return resolveAssetPath(s); 
        let v = s.toLowerCase();

        if (v.includes("13")) {
            // 👑 PROFI DETEKTIV: Místo strict === použijeme inteligentní .includes(), aby kód bezpečně přečetl i tvůj unikátní složený klíč ze Srovnávače!
            let codeStr = String(code || '');
            return (codeStr.includes('511408') || codeStr.includes('S511339')) ? 'img/fotoalimec13kolecek.jpg' : 'img/fotoalimec13kolecekkulata.jpg';
        }
            if (v.includes("15")) return "img/fotoalimec15kolecek.jpg";
            if (v.includes("9")) return "img/fotoalimec9kolecek.jpg";
            if (v.includes("8")) return "img/fotoalimec8kolecek.jpg";
            if (v.includes("7")) return "img/fotoalimec7kolecek.jpg";
            if (v.includes("6") && !v.includes("6x")) return "img/fotoalimec6kolecek.jpg";

            const PHOTO_MAP = {
                "véčko": "img/fotoholacdiskv.jpg", "vecko": "img/fotoholacdiskv.jpg",
                "4x bez desky": "img/fotoholac4xbezdesky.jpg", "4x bez": "img/fotoholac4xbezdesky.jpg", "4xbez": "img/fotoholac4xbezdesky.jpg",
                "4x s deskou": "img/fotoholac4xsdeskou.jpg", "4x s": "img/fotoholac4xsdeskou.jpg", "4xs": "img/fotoholac4xsdeskou.jpg",
                "2x bez desky": "img/fotoholac2xbezdesky.jpg", "2x bez": "img/fotoholac2xbezdesky.jpg", "2xbez": "img/fotoholac2xbezdesky.jpg",
                "6x18": "img/fotoholacdisk6x18.jpg", "6x36": "img/fotoholacdisk6x36.jpg",
                "1": "img/fotodatum1radek.jpg", "1 řádek": "img/fotodatum1radek.jpg", "1 radek": "img/fotodatum1radek.jpg",
                "2": "img/fotodatum2radky.jpg", "2 řádky": "img/fotodatum2radky.jpg", "2 radky": "img/fotodatum2radky.jpg"
            };

            return PHOTO_MAP[v] || "";
        },

        getPhotoUrlForStroj(id, p, code) {
            if (!['alimecKol', 'diskSyr', 'diskSal'].includes(id)) return '';
            
            let explicitPhoto = '';
            if (id === 'alimecKol') explicitPhoto = p.alimecFoto;
            if (id === 'diskSyr') explicitPhoto = p.diskSyrFoto;
            if (id === 'diskSal') explicitPhoto = p.diskSalFoto;
            
            if (explicitPhoto && String(explicitPhoto).includes('.')) return resolveAssetPath(explicitPhoto);
            
            if (id === 'alimecKol') {
                let ziveKol = window.getVal ? window.getVal('alimecKol_' + code, p.alimecKol) : p.alimecKol;
                let ziveMat = window.getVal ? window.getVal('alimecMat_' + code, p.alimecMat) : p.alimecMat;
                
                let kol = String(ziveKol || '').toLowerCase().trim();
                let mat = String(ziveMat || '').toLowerCase().trim();
                
                if (kol.includes('8') && mat.includes('48')) return 'img/fotoalimec8kolecek48mm.jpg';
                return this.resolvePhoto(ziveKol, code);
            }

            if (id === 'diskSyr') {
                let ziveSyr = window.getVal ? window.getVal('holSyr_' + code, p.holSyr) : p.holSyr;
                let info = window.getHolacInfo(ziveSyr);
                if (info) return info.foto;
                let ziveDiskSyr = window.getVal ? window.getVal('diskSyr_' + code, p.diskSyr) : p.diskSyr;
                return this.resolvePhoto(ziveDiskSyr, code);
            }
            if (id === 'diskSal') {
                let ziveSal = window.getVal ? window.getVal('holSal_' + code, p.holSal) : p.holSal;
                let info = window.getHolacInfo(ziveSal);
                if (info) return info.foto;
                let ziveDiskSal = window.getVal ? window.getVal('diskSal_' + code, p.diskSal) : p.diskSal;
                return this.resolvePhoto(ziveDiskSal, code);
            }

            return '';
        },

        getPhotoUrlForDatum(p, code) {
            if (p.datumFoto && String(p.datumFoto).includes('.')) return resolveAssetPath(p.datumFoto);
            let ziveDatum = window.getVal ? window.getVal('datumRadky_' + code, p.datumRadky) : p.datumRadky;
            return this.resolvePhoto(ziveDatum, code) || 'img/fotodatum1radek.jpg';
        },

        getCustomItems(code, sekce) {
            let prefix = sekce.substring(0, 3); 
            let editId = `${prefix}Pozn_${code}`;
            
            let content = null;
            if (this.currentProduct && this.currentProduct.p && this.currentProduct.p[editId] !== undefined) {
                content = this.currentProduct.p[editId];
            }
            
            if (!content) return [];
            
            if (Array.isArray(content)) {
                return content.map(item => {
                    let safeItem = { ...item };
                    if (safeItem.nazev) safeItem.nazev = vycistiText(safeItem.nazev);
                    if (safeItem.hodnota) safeItem.hodnota = vycistiText(safeItem.hodnota);
                    if (safeItem.text) safeItem.text = vycistiText(safeItem.text);
                    return safeItem;
                });
            }
            
            if (typeof content === 'string' && content.trim() !== '') {
                return [{ id: 'legacy', text: vycistiText(content), type: 'note' }];
            }
            
            return [];
        },
        
        formatRow(idFull, defVal, unit) { 
            let id = idFull.split('_')[0];
            let p = this.currentProduct ? this.currentProduct.p : {};
            let code = this.currentProduct ? this.currentProduct.code : '';
            let exceptions = this.currentProduct ? this.currentProduct.exceptions : [];
            
            // Speciální případy pro Pekárnu (Výkyv a Alimec)
            if (id === 'pekVyk') {
                let zivePln = window.getVal ? window.getVal('pekPln_' + code, p['pekPln']) : p['pekPln'];
                if (zivePln && !String(zivePln).toLowerCase().includes('vypnuto') && zivePln !== '') {
                    return formatValForDisplay('Form & Fris', unit, idFull);
                }

                let ziveVel = window.getVal ? window.getVal('pekVel_' + code, p['pekVel']) : p['pekVel'];
                let vel = ziveVel || '';
                let velStr = vel.toString().trim();
                if (/^\d+$/.test(velStr) || /^\d+[.,]\d+$/.test(velStr)) {
                    return { text: defVal, colorClass: '', hide: true };
                }
            }

            if (id === 'alimecKol') {
                let ziveMat = window.getVal ? window.getVal('alimecMat_' + code, p['alimecMat']) : p['alimecMat'];
                let mat = ziveMat || '';
                let s = mat.toString().toLowerCase().trim();
                if (s === 'vypnuto' || s === 'ne' || s === '-' || s === '') {
                    return { text: defVal, colorClass: '', hide: true };
                }
            }

            // Holac normalizace pro zobrazení
            if (id === 'holSyr' || id === 'holSal') {
                let ziveVal = window.getVal ? window.getVal(idFull, p[id]) : p[id];
                let s = (ziveVal || '').toString().toLowerCase().trim();
                if (s === 'vypnuto' || s === 'ne' || s === '-' || s === '') {
                    return { text: defVal, colorClass: '', hide: true };
                }
                
                let displayStr = (ziveVal || '').toString();
                if (displayStr.includes('(') && displayStr.includes(')')) {
                    displayStr = displayStr.split('(')[1].split(')')[0].trim();
                    displayStr = displayStr.charAt(0).toUpperCase() + displayStr.slice(1);
                }
                
                return formatValForDisplay(displayStr, unit, idFull);
            }

            // Disky (výpočetní pole)
            if (id === 'diskSyr' || id === 'diskSal') {
                let prefix = id === 'diskSyr' ? 'holSyr' : 'holSal';
                let ziveParent = window.getVal ? window.getVal(prefix + '_' + code, p[prefix]) : p[prefix];
                if (!ziveParent || ziveParent.toString().toLowerCase().trim() === 'vypnuto') return { text: defVal, colorClass: '', hide: true };
                
                let info = window.getHolacInfo(ziveParent);
                let diskLabel = info ? info.label : (window.getVal ? window.getVal(idFull, p[id]) : p[id]);
                
                return formatValForDisplay(diskLabel, unit, idFull);
            }

            // Standardní pole
            return formatValForDisplay(getVal(idFull, defVal), unit, idFull);
        },
        
        getSekceName(sekce) { 
            const names = { 
                [window.LINKA_DICT.SEKCE.PEKARNA]: 'Pekárna', 
                [window.LINKA_DICT.SEKCE.KYNARNA]: 'Kynárna', 
                [window.LINKA_DICT.SEKCE.PEC]: 'Pec', 
                'pecPrujezd': 'Pec (Průjezd)',
                [window.LINKA_DICT.SEKCE.PRIPRAVNA]: 'Přípravna', 
                [window.LINKA_DICT.SEKCE.BALENI]: 'Balení' 
            };
            return names[sekce] || (sekce.charAt(0).toUpperCase() + sekce.slice(1)); 
        },

        maMitCaru(strojId) {
            const g1 = ['priProg', 'priPuf', 'priKec', 'priRad', 'priZdo1', 'priZdo2'];
            const g2 = ['alimecMat', 'alimecKol', 'maslicko'];
            const g3 = ['holSyr', 'diskSyr'];
            const g4 = ['holSal', 'diskSal'];

            let group = g1.includes(strojId) ? g1 : (g2.includes(strojId) ? g2 : (g3.includes(strojId) ? g3 : (g4.includes(strojId) ? g4 : null)));
            if (!group) return false;

            let cp = this.currentProduct;
            if (!cp || !cp.p) return false;

            if (this.formatRow(strojId + '_' + cp.code, cp.p[strojId], '').hide) return false;

            let myIdx = group.indexOf(strojId);
            for (let i = myIdx + 1; i < group.length; i++) {
                let nId = group[i];
                if (this.sablona.pripravna.find(x => x.id === nId)) {
                    if (!this.formatRow(nId + '_' + cp.code, cp.p[nId], '').hide) {
                        return false;
                    }
                }
            }
            return true;
        },
        ukazRodokmen() {
            let cp = this.currentProduct;
            if (!cp) return;

            let myCompositeCode = cp.baseCode + '_' + cp.code;
            let myVarCode = cp.code;

            // 1. Kdo je moje matka?
            let matka = null;
            let srcCode = cp.p.pekarna_source || cp.p.kynarna_source || cp.p.pec_source || cp.p.pripravna_source || cp.p.baleni_source;
            
            if (srcCode && srcCode !== myVarCode && srcCode !== myCompositeCode) {
                let mBase = null; let mVar = srcCode;
                if (srcCode.includes('_')) {
                    let p = srcCode.split('_'); mBase = p[0]; mVar = p[1];
                } else {
                    for (let b in this.db.vyroba) {
                        if (this.db.vyroba[b].varianty && Array.isArray(this.db.vyroba[b].varianty) && this.db.vyroba[b].varianty.some(x => x.kod === mVar)) {
                            mBase = b; break;
                        }
                    }
                }
                if (mBase && this.db.vyroba[mBase] && this.db.vyroba[mBase].varianty && Array.isArray(this.db.vyroba[mBase].varianty)) {
                    let v = this.db.vyroba[mBase].varianty.find(x => x.kod === mVar);
                    if (v) matka = { base: mBase, kod: mVar, nazev: this.db.vyroba[mBase].nazevBase + (v.label === this.db.vyroba[mBase].nazevBase ? '' : ' - ' + v.label), ikona: window.getIkonaRodiny(mBase) };
                }
            }

            // 2. Kdo jsou moje děti?
            let deti = [];
            let urciPramatku = (c, db) => {
                let visited = new Set();
                while (c && c.includes('_') && !visited.has(c)) {
                    visited.add(c);
                    let b = c.split('_')[0];
                    let next = db[b] && db[b].spolecne && (db[b].spolecne.pekarna_source || db[b].spolecne.kynarna_source || db[b].spolecne.pec_source || db[b].spolecne.pripravna_source || db[b].spolecne.baleni_source);
                    if (next && next !== c) c = next; else break;
                }
                return c;
            };

            for (let b in this.db.vyroba) {
                let m = this.db.vyroba[b];
                if (!m.varianty || !Array.isArray(m.varianty)) continue;
                for (let v of m.varianty) {
                    if (v.kod === myVarCode && b === cp.baseCode) continue; 
                    let hasSrc = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].some(s => {
                        let src = (v.spec && v.spec[`${s}_source`]) || (m.spolecne && m.spolecne[`${s}_source`]);
                        return src && urciPramatku(src, this.db.vyroba) === myCompositeCode;
                    });
                    if (hasSrc) deti.push({ base: b, kod: v.kod, nazev: m.nazevBase + (v.label === m.nazevBase ? '' : ' - ' + v.label), ikona: window.getIkonaRodiny(b) });
                }
            }
            this.app.openRodokmenModal(matka, deti);
        },
        getSortedBaleniKeys() { 
            if (!this.db.baleni) return [];
            return Object.keys(this.db.baleni).sort((a, b) => { let numA = parseInt(a.replace(/\D/g, '')) || 0; let numB = parseInt(b.replace(/\D/g, '')) || 0; return numA - numB; });
        }
    };
}

// =========================================================================
// 📏 AUTO-SHRINK SKENER: 2D CANVAS ENGINE (CESTA 1)
// =========================================================================
window.aplikovatAutoShrink = function() {
    const canvas = window._shrinkCanvas || (window._shrinkCanvas = document.createElement('canvas'));
    const ctx = canvas.getContext('2d');

    const activeScreen = document.querySelector('.data-screen:not([style*="display: none"])') || document.body;
    const container = activeScreen.querySelector('.app-container') || document.querySelector('.app-container');
    const containerWidth = container ? container.clientWidth : Math.min(window.innerWidth, 1000);
    const availableInnerWidth = Math.max(containerWidth - 26, 200);

    const rows = document.querySelectorAll('.data-row .row-content.grid-standard, .grid-standard');
    if (!rows.length) return;

    rows.forEach(row => {
        if (row.classList.contains('grid-row-lupa') || row.closest('.pec-zongrid')) return;

        const isKatalog = row.closest('#katalogDetailScreen') !== null;
        const leftRatio = isKatalog ? 0.68 : 0.60;
        const rightRatio = isKatalog ? 0.32 : 0.40;
        const gap = isKatalog ? 8 : 20;

        // Pokud je řádek rozbalený, změříme jeho reálnou šířku v DOMu
        const rowWidth = (row.clientWidth && row.clientWidth > 50) ? row.clientWidth : availableInnerWidth;
        const totalNetWidth = Math.max(rowWidth - gap, 100);

        // 4px bezpečnostní nárazník proti nechtěným třem tečkám na hraně
        const maxLeftWidth = Math.floor(totalNetWidth * leftRatio) - 4;
        const maxRightWidth = Math.floor(totalNetWidth * rightRatio) - 4;

        const baseFontSize = 15;
        const minFontSize = 10; // Posunuto z 11 na 10 pro dlouhé montážní texty

        // 1. Levý sloupec (název stroje / montážní parametr)
        const popisEl = row.querySelector('.popis');
        if (popisEl) {
            const text = (popisEl.textContent || '').replace(/[✏️📷]/g, '').trim();
            if (text) {
                ctx.font = `bold ${baseFontSize}px "Segoe UI", sans-serif`;
                const textWidth = ctx.measureText(text).width;

                if (textWidth > maxLeftWidth) {
                    const newSize = Math.max(minFontSize, Math.floor((maxLeftWidth / textWidth) * baseFontSize * 10) / 10);
                    popisEl.style.fontSize = newSize + 'px';
                } else {
                    popisEl.style.fontSize = '';
                }
            }
        }

        // 2. Pravý sloupec (hodnota / nastavení)
        const hodnotaEl = row.querySelector('.hodnota');
        if (hodnotaEl) {
            const targetTextEl = hodnotaEl.querySelector('.comp-new-stacked') 
                              || hodnotaEl.querySelector('.diff-new') 
                              || hodnotaEl;

            const hasPhotoIcon = hodnotaEl.querySelector('.foto-inline-icon') !== null;
            const hasPhotoBtn = hodnotaEl.querySelector('.foto-hodnota-btn') !== null;
            const reservedPhotoSpace = hasPhotoBtn ? 45 : (hasPhotoIcon ? 22 : 0);
            const allowedRightWidth = maxRightWidth - reservedPhotoSpace;

            const text = (targetTextEl.textContent || '').replace(/[✏️📷]/g, '').trim();
            if (text) {
                ctx.font = `bold ${baseFontSize}px "Segoe UI", sans-serif`;
                const textWidth = ctx.measureText(text).width;

                if (textWidth > allowedRightWidth) {
                    const newSize = Math.max(minFontSize, Math.floor((allowedRightWidth / textWidth) * baseFontSize * 10) / 10);
                    targetTextEl.style.fontSize = newSize + 'px';
                } else {
                    targetTextEl.style.fontSize = '';
                }
            }
        }
    });
};

// Automatické spuštění při změně velikosti okna nebo rozkliknutí libovolného akordeonu
if (!window._shrinkListenersBound) {
    window._shrinkListenersBound = true;
    window.addEventListener('resize', () => window.aplikovatAutoShrink());
    document.addEventListener('toggle', (e) => {
        if (e.target && e.target.tagName === 'DETAILS' && e.target.open) {
            window.aplikovatAutoShrink();
        }
    }, true);
}

// =========================================================================
// 👑 VIP IKONY PRO DATABÁZI VÝROB
// =========================================================================
window.getIkonaRodiny = function(baseCode) {
    let dbStore = typeof Alpine !== 'undefined' ? Alpine.store('trezor') : null;
    if (!dbStore || !dbStore.databaze_master || !dbStore.databaze_master.vyroba || !dbStore.databaze_master.vyroba[baseCode]) return '';
    let main = dbStore.databaze_master.vyroba[baseCode];
    if (!main || !main.varianty || !Array.isArray(main.varianty) || main.varianty.length === 0) return '';

    // Analyzujeme první variantu (Základ dané rodiny)
    let myVarCode = main.varianty[0].kod;
    let cP_p = { ...(main.spolecne || {}), ...(main.varianty[0].spec || {}) };
    let exceptions = main.varianty[0].exceptions || [];

    let myCompositeCode = baseCode + '_' + myVarCode;
    let maMatku = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].some(s => {
        let src = cP_p[`${s}_source`];
        return src && src !== myVarCode && src !== myCompositeCode;
    });

    // Zjištění, zda z nás někdo saje data
    let jeMatkou = false;
    for (let b in dbStore.databaze_master.vyroba) {
        if (b === baseCode) continue;
        let oMain = dbStore.databaze_master.vyroba[b];
        if (!oMain || !oMain.varianty || !Array.isArray(oMain.varianty)) continue;
        for (let v of oMain.varianty) {
            let hasSrc = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].some(s => {
                let src = (v.spec && v.spec[`${s}_source`]) || (oMain.spolecne && oMain.spolecne[`${s}_source`]);
                let urciPramatku = (c, db) => {
                    let visited = new Set();
                    while (c && c.includes('_') && !visited.has(c)) {
                        visited.add(c);
                        let b = c.split('_')[0];
                        let next = db[b] && db[b].spolecne && (db[b].spolecne.pekarna_source || db[b].spolecne.kynarna_source || db[b].spolecne.pec_source || db[b].spolecne.pripravna_source || db[b].spolecne.baleni_source);
                        if (next && next !== c) c = next; else break;
                    }
                    return c;
                };
                return src && urciPramatku(src, dbStore.databaze_master.vyroba) === myCompositeCode;
            });
            if (hasSrc) { jeMatkou = true; break; }
        }
        if (jeMatkou) break;
    }

    let maVlastniVyjimky = exceptions.length > 0;
    let pocetPropojenych = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'].filter(s => {
        let src = cP_p[`${s}_source`];
        return src && src !== myVarCode && src !== myCompositeCode;
    }).length;
    let jeCastecnePropojeno = pocetPropojenych > 0 && pocetPropojenych < 5;

    // Vracíme čistou ikonku s mezerou
    if (jeMatkou && maMatku) return '🤱 ';
    else if (jeMatkou) return '👑 ';
    else if (jeCastecnePropojeno && maMatku) return '🎛️ ';
    else if (maVlastniVyjimky && maMatku) return '🐺 ';
    else if (maMatku) return '🧬 ';
    else return '👑 '; // Čistokrevný základ bez matky
};

// =========================================================================
// 🚨 ENTERPRISE 3.1: CHYTRÝ DETEKTIV PRO NEKOMPLETNÍ VÝROBY (VYKŘIČNÍKY)
// =========================================================================
window.isBaseMissing = function(baseCode) {
    let dbStore = typeof Alpine !== 'undefined' ? Alpine.store('trezor') : null;
    if (!dbStore || !dbStore.databaze_master || !dbStore.databaze_master.vyroba || !dbStore.databaze_master.vyroba[baseCode]) return false;
    let main = dbStore.databaze_master.vyroba[baseCode];
    if (!main || !main.varianty || !Array.isArray(main.varianty) || main.varianty.length === 0) return false;

    // Bereme první variantu jako zástupce rodiny pro seznam
    let myVarCode = main.varianty[0].kod;
    let pCombined = { ...(main.spolecne || {}), ...(main.varianty[0].spec || {}) };

    // 1. ŠPLHÁNÍ DO RODOKMENU (Stejná logika jako v detailu)
    const sekceList = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'];
    sekceList.forEach(sekce => {
        let sourceKey = sekce + '_source';
        if (pCombined[sourceKey]) {
            let visited = new Set();
            let currentMotherCode = pCombined[sourceKey];
            let motherP = {};

            while (currentMotherCode && !visited.has(currentMotherCode)) {
                visited.add(currentMotherCode);
                let targetBase = null;
                let targetVar = currentMotherCode;
                if (currentMotherCode.includes('_')) {
                    let parts = currentMotherCode.split('_');
                    targetBase = parts[0];
                    targetVar = parts[1];
                }

                let bCode = targetBase;
                if (!bCode) {
                    for (let b in dbStore.databaze_master.vyroba) {
                        if (dbStore.databaze_master.vyroba[b].varianty && dbStore.databaze_master.vyroba[b].varianty.some(x => x.kod === targetVar)) {
                            bCode = b; break;
                        }
                    }
                }
                
                if (bCode && dbStore.databaze_master.vyroba[bCode]) {
                    let tempMain = dbStore.databaze_master.vyroba[bCode];
                    let v = tempMain.varianty.find(x => x.kod === targetVar);
                    if (v) {
                        let tempP = { ...tempMain.spolecne, ...(v.spec || {}) };
                        motherP = { ...tempP, ...motherP }; // Nabalujeme historii
                        currentMotherCode = tempP[sourceKey] && tempP[sourceKey] !== currentMotherCode ? tempP[sourceKey] : null;
                    } else { currentMotherCode = null; }
                } else { currentMotherCode = null; }
            }

            // Aplikujeme matčiny geny na prázdná místa Klona/Rebela
            Object.keys(motherP).forEach(key => {
                if (pCombined[key] === undefined) {
                    pCombined[key] = motherP[key];
                }
            });
        }
    });

    // 2. SKENER NA EXPLICITNÍ TEXTY "Dodáme"
    for (let key in pCombined) {
        let val = pCombined[key];
        if (val && typeof val === 'string') {
            let vStr = val.toLowerCase();
            if (vStr.includes('dodám') || vStr.includes('zjistit') || vStr.includes('pozděj')) {
                return true; // Našli jsme rest, spouštíme alarm! ❗️
            }
        }
    }

    // 3. SKENER NA CHYBĚJÍCÍ POVINNÁ POLE (Chytrý - kontroluje aktivní Šablonu!)
    if (typeof DEFAULT_SABLONA !== 'undefined') {
        let bRezim = main.baleniRezim || (main.spolecne && main.spolecne.baleniRezim) || 'krabicky';
        let bRezimKlic = (typeof window.LINKA_DICT !== 'undefined') ? window.LINKA_DICT.REZIM_BALENI.KARTON : 'karton';
        
        // Vezmeme jen tu šablonu, která se pro danou pizzu reálně používá
        let sablonaBaleni = (bRezim === bRezimKlic) ? (DEFAULT_SABLONA.baleniKarton || []) : (DEFAULT_SABLONA.baleniKrabicky || []);
        
        const povinnaPoleBaleni = ['balTrv', 'datumRadky', 'balKs', 'novoElko', 'novoTunel', 'pak1', 'pak2'];
        
        for (let stroj of sablonaBaleni) {
            if (!stroj.id) continue;
            let baseId = stroj.id.split('_')[0];
            
            // Kontrolujeme jen ty stroje, co v té šabloně reálně jsou
            if (povinnaPoleBaleni.includes(baseId)) {
                if (pCombined[baseId] === undefined || pCombined[baseId] === '') {
                    return true; // Políčko JE v šabloně a JE prázdné -> Teprve teď oprávněný Alarm! ❗️
                }
            }
        }
    }

    return false; // Všechno je tip ťop, pizza je 100% zmapovaná!
};