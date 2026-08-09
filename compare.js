// =========================================================================
// ⚖️ SROVNÁVAČ LINKY (POROVNÁVAČ VIP) - ALPINE.JS ENGINE (v3.0.0 Enterprise)
// =========================================================================

// --- POMOCNÁ FUNKCE PRO ZÁCHRANU NUL ---
function safeGet(val) {
    return (val !== undefined && val !== null) ? val : '';
}

function getVariantData(code, explicitBase = null) {
    if (!code) return null;
    code = code.replace(/\s+/g, '').toUpperCase();
    
    // 🚀 ENTERPRISE 3.0: Zpracování složeného klíče (pokud existuje)
    if (code.includes('_')) {
        let parts = code.split('_');
        explicitBase = parts[0];
        code = parts[1];
    }
    
    let dbStore = typeof Alpine !== 'undefined' ? Alpine.store('trezor') : window.Trezor;
    if (!dbStore || !dbStore.databaze_master || !dbStore.databaze_master.vyroba) return null;

    const extractData = (mainData, variantData) => {
        // --- 1. ZÁKLADNÍ SLOŽENÍ DAT ---
        let pCombined = { ...mainData.spolecne, ...variantData.spec };
        pCombined.baleniRezim = mainData.baleniRezim;
        pCombined.pecRezim = mainData.pecRezim;
        let exceptions = variantData.exceptions || [];

        // --- 2. 🚀 ENTERPRISE 3.0: CHYTRÝ SKENER DĚDIČNOSTI S VÝJIMKAMI 🚀 ---
        const sekceList = ['pekarna', 'kynarna', 'pec', 'pripravna', 'baleni'];
        sekceList.forEach(sekce => {
            let sourceKey = sekce + '_source';
            let syncKey = sekce + '_sync';
            
            // Pokud má sekce nastavenou Matku a je zapnutý SYNC
            if (pCombined[sourceKey] && variantData[syncKey] !== false) {
                let visited = new Set();
                let currentMotherCode = pCombined[sourceKey];
                let motherP = {};
                let motherMain = null;

                // Cyklus pro případné "Babičky" a "Prababičky"
                while (currentMotherCode && !visited.has(currentMotherCode)) {
                    visited.add(currentMotherCode);
                    let tempMain = null; let tempSpec = {};
                    
                    // 🚀 ENTERPRISE 3.0: Bezpečné rozbití složeného klíče uvnitř smyčky dědičnosti srovnávače
                    let targetBase = currentMotherCode.includes('_') ? currentMotherCode.split('_')[0] : null;
                    let targetVar = currentMotherCode.includes('_') ? currentMotherCode.split('_')[1] : currentMotherCode;

                    let bCode = targetBase;
                    if (!bCode) {
                        for (let b in dbStore.databaze_master.vyroba) {
                            if (dbStore.databaze_master.vyroba[b].varianty && Array.isArray(dbStore.databaze_master.vyroba[b].varianty) && dbStore.databaze_master.vyroba[b].varianty.some(x => x.kod === targetVar)) {
                                bCode = b; break;
                            }
                        }
                    }

                    if (bCode && dbStore.databaze_master.vyroba[bCode] && dbStore.databaze_master.vyroba[bCode].varianty && Array.isArray(dbStore.databaze_master.vyroba[bCode].varianty)) {
                        let v = dbStore.databaze_master.vyroba[bCode].varianty.find(x => x.kod === targetVar);
                        if (v) { tempMain = dbStore.databaze_master.vyroba[bCode]; tempSpec = v.spec || {}; }
                    }
                    
                    if (tempMain) {
                        if (!motherMain) motherMain = tempMain; 
                        let tempP = { ...tempMain.spolecne, ...tempSpec };
                        motherP = { ...tempP, ...motherP }; 
                        
                        if (tempP[sourceKey] && tempP[sourceKey] !== currentMotherCode) {
                            currentMotherCode = tempP[sourceKey]; 
                        } else {
                            currentMotherCode = null; 
                        }
                    } else {
                        currentMotherCode = null;
                    }
                }

                if (motherMain) {
                    let engine = window.linkaEngine ? window.linkaEngine() : null;
                    let sablonaSekce = engine ? (engine.sablona[sekce] || []) : [];
                    if (sekce === 'pec' && engine && engine.sablona['pecPrujezd']) {
                        sablonaSekce = [...sablonaSekce, ...engine.sablona['pecPrujezd']];
                    }
                    if (sekce === 'baleni' && engine) {
                        sablonaSekce = [...(engine.sablona.baleniKrabicky||[]), ...(engine.sablona.baleniKarton||[])];
                    }

                    sablonaSekce.forEach(stroj => {
                        if (stroj.id) {
                            // 🚀 OPRAVA: Pokud Klon nebo Rebel nemá svoji vlastní hodnotu, teprve pak vezmi od Matky
                            if (pCombined[stroj.id] === undefined && motherP[stroj.id] !== undefined) {
                                pCombined[stroj.id] = motherP[stroj.id];
                            }
                        }
                    });

                    // Speciální systémové klíče a statická data Pece
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

        // --- 3. PROPOJENÍ S MIROPACKEM ---
        if (pCombined.baleniRezim === window.LINKA_DICT.REZIM_BALENI.KRABICKY && pCombined.miroProg) {
            let progKey = "PROGRAM" + pCombined.miroProg;
            let miroData = dbStore.databaze_master.baleni[progKey];
            if (miroData) {
                // 🚀 OPRAVA: Respektujeme výjimky od Rebela i Klona
                Object.keys(miroData).forEach(mKey => {
                    if (pCombined[mKey] === undefined) {
                        pCombined[mKey] = miroData[mKey];
                    }
                });
            }
        }
        
        // --- 4. NORMALIZACE HOLAC ---
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

        // --- 5. PŘÍPRAVA PRO DIFF ENGINE ---
        // Nakrmíme kombinovaný objekt dodatečnými metadaty pro zobrazení hlaviček
        pCombined.baseCode = mainData.baseCode || explicitBase;
        pCombined.code = variantData.kod;
        pCombined.fullCode = (mainData.baseCode || explicitBase) + '_' + variantData.kod;
        pCombined.nazevBase = mainData.nazevBase;
        pCombined.label = variantData.label || variantData.kod;
        pCombined.zdroj = mainData.zdroj || 'LV';

        return pCombined;
    };

    if (explicitBase && dbStore.databaze_master.vyroba[explicitBase]) {
        let main = dbStore.databaze_master.vyroba[explicitBase];
        let v = main.varianty.find(x => x.kod === code);
        if (v) return extractData(main, v);
    }

    let matches = [];
    for (let base in dbStore.databaze_master.vyroba) {
        let main = dbStore.databaze_master.vyroba[base];
        if (!main || !main.varianty || !Array.isArray(main.varianty)) continue; 
        let v = main.varianty.find(x => x.kod === code);
        if (v) matches.push({ baseCode: base, variant: v, main: main });
    }

    if (matches.length > 1) {
        return { needsBaseSelection: true, variantCode: code, matches: matches };
    }
    if (matches.length === 1) {
        return extractData(matches[0].main, matches[0].variant);
    }
    
    let digits = code.replace(/\D/g, '');
    if (digits.length === 6 && dbStore.databaze_master.vyroba[digits]) {
        let main = dbStore.databaze_master.vyroba[digits];
        if (!main || !main.varianty || !Array.isArray(main.varianty)) return null; 
        if (main.varianty.length > 1) return { needsVariantSelection: true, baseCode: digits, variants: main.varianty };
        else return extractData(main, main.varianty[0]);
    }
    return null;
}

function getDisplayVal(prop, code, rawVal, unit) {
    let finalVal = window.getVal(prop + '_' + code, rawVal);
    let display = window.formatValForDisplay(finalVal, unit, prop);
    let text = display.text || finalVal;
    if (text === window.LINKA_DICT.STAV.DODAME) {
        return `<span class="val-missing">${text}</span>`;
    }
    return text;
}

document.addEventListener('alpine:init', () => {
    Alpine.data('compareEngine', () => ({
        result: null, 
        
        initCompareAction() {
            let state = Alpine.store('appState');
            let oldRaw = state.compareOld;
            let newRaw = state.compareNew;

            let oldInput = (oldRaw && oldRaw !== 'null') ? String(oldRaw).replace(/\s+/g, '').toUpperCase() : '';
            let newInput = (newRaw && newRaw !== 'null') ? String(newRaw).replace(/\s+/g, '').toUpperCase() : '';

            if (!oldInput || !newInput) { 
                showToast("Vyplň oba kódy!"); 
                return; 
            }
            
            if (oldInput.startsWith('PROG') || newInput.startsWith('PROG')) { 
                this.executeCompareProgData(oldInput, newInput); 
                return; 
            }

            let oldData = getVariantData(oldInput, state.compareOldBase);
            if (oldData && oldData.needsBaseSelection) {
                let mVariants = oldData.matches.map(m => ({ kod: m.baseCode, label: m.main.nazevBase }));
                askForCompareVariant('compOld', oldData.variantCode, mVariants, oldInput, newInput, true);
                return;
            }

            let newData = getVariantData(newInput, state.compareNewBase);
            if (newData && newData.needsBaseSelection) {
                let mVariants = newData.matches.map(m => ({ kod: m.baseCode, label: m.main.nazevBase }));
                askForCompareVariant('compNew', newData.variantCode, mVariants, oldInput, newInput, true);
                return;
            }

            if (oldData && oldData.needsVariantSelection) { 
                askForCompareVariant('compOld', oldData.baseCode, oldData.variants, oldInput, newInput, false); 
                return; 
            }
            if (newData && newData.needsVariantSelection) { 
                askForCompareVariant('compNew', newData.baseCode, newData.variants, oldInput, newInput, false); 
                return; 
            }
            if(!oldData) { showToast(`Kód ${oldInput} nenalezen!`); return; } 
            if(!newData) { showToast(`Kód ${newInput} nenalezen!`); return; }

            this.executeCompareData(oldData, newData);
        },

        buildMachineDiff(sekceKey, oD, nD) {
            if (sekceKey === 'pecPrujezd') return null; 
            
            let engine = window.linkaEngine();
            let sablonaProSekci = engine.sablona[sekceKey] || [];
            let rows = []; 
            let alerts = [];
            
            let oRezim = (oD.pecRezim || '').toLowerCase().trim();
            let nRezim = (nD.pecRezim || '').toLowerCase().trim();
            // ZMĚŇ NA:
let isOldPrujezd = (oRezim === 'sablona' || oRezim === 'prujezd');
let isNewPrujezd = (nRezim === 'sablona' || nRezim === 'prujezd');

// Pokud porovnáváme, musíme zajistit, že stroje a data taháme ze složených klíčů
let oCode = oD.baseCode + '_' + oD.code;
let nCode = nD.baseCode + '_' + nD.code;

            if (sekceKey === 'pec' && isNewPrujezd) {
                sablonaProSekci = engine.sablona['pecPrujezd'] || sablonaProSekci;
            }

            if (sekceKey === window.LINKA_DICT.SEKCE.KYNARNA) {
                alerts.push({ title: '⚠️ NEZAPOMEŇ', text: 'Plný DP je vždy <span class="comp-kyn-highlight">1220</span>!' });
            }

            if (sekceKey === 'pec') {
                if (!isOldPrujezd && isNewPrujezd) {
                    alerts.push({ title: '⚠️ ZMĚNA REŽIMU PECE', text: 'Pečení ➔ <span class="comp-kyn-highlight">PRŮJEZD STUDENOU PECÍ</span>' });
                } else if (isOldPrujezd && !isNewPrujezd) {
                    alerts.push({ title: '⚠️ ZMĚNA REŽIMU PECE', text: 'Průjezd ➔ <span class="comp-kyn-highlight">PEČENÍ</span>' });
                }

                if (!isNewPrujezd) {
                    alerts.push({ title: '⚠️ NEZAPOMEŇ', text: 'Digestoř při pečení je <span class="comp-kyn-highlight">VŽDY ZAPNUTÁ</span>!' });
                    
                    let hasZoneChanges = false;
                    let zony = [];
                    for(let i=1; i<=5; i++) {
                        let rawOt = isOldPrujezd ? '' : safeGet(oD[`pecZ${i}t`]);
                        let rawNt = safeGet(nD[`pecZ${i}t`]);
                        let rawOp1 = isOldPrujezd ? '' : safeGet(oD[`pecZ${i}p1`]);
                        let rawNp1 = safeGet(nD[`pecZ${i}p1`]);
                        let rawOp2 = isOldPrujezd ? '' : safeGet(oD[`pecZ${i}p2`]);
                        let rawNp2 = safeGet(nD[`pecZ${i}p2`]);

                        // 👑 UNIKÁTNÍ FIX: getDisplayVal nyní poctivě poslouchá tvůj složený kód!
                        let oldT = getDisplayVal(`pecZ${i}t`, oCode, rawOt, "°C");
                        let newT = getDisplayVal(`pecZ${i}t`, nCode, rawNt, "°C");
                        let oldP1 = getDisplayVal(`pecZ${i}p1`, oCode, rawOp1, "%");
                        let newP1 = getDisplayVal(`pecZ${i}p1`, nCode, rawNp1, "%");
                        let oldP2 = getDisplayVal(`pecZ${i}p2`, oCode, rawOp2, "%");
                        let newP2 = getDisplayVal(`pecZ${i}p2`, nCode, rawNp2, "%");

                        let tC = oldT !== newT;
                        let p1C = oldP1 !== newP1;
                        let p2C = oldP2 !== newP2;
                        if(tC || p1C || p2C) hasZoneChanges = true;

                        zony.push({ 
                            idx: i, 
                            t: { o: oldT, n: newT, c: tC }, 
                            p1: { o: oldP1, n: newP1, c: p1C }, 
                            p2: { o: oldP2, n: newP2, c: p2C } 
                        });
                    }
                    if (hasZoneChanges) { rows.push({ isGrid: true, zones: zony }); }
                    
                    for(let i=1; i<=3; i++) {
                        let rawOod = isOldPrujezd ? '' : safeGet(oD[`pecOd${i}`]);
                        let rawNod = safeGet(nD[`pecOd${i}`]);
                        let oldVal = getDisplayVal(`pecOd${i}`, oCode, rawOod, "");
                        let newVal = getDisplayVal(`pecOd${i}`, nCode, rawNod, "");
                        if (oldVal !== newVal) {
                            rows.push({ label: `Odtah ${i}`, oldVal: oldVal, newVal: newVal, changed: true });
                        }
                    }
                }
            }

            let changedHolSyr = false;
            let changedHolSal = false;

            const getFullHolacName = (val) => {
                if (!val) return val;
                let s = val.toString().trim();
                if (window.HOLAC_MAP && window.HOLAC_MAP[s]) return s;
                let cleanProg = s.toLowerCase().split('(')[0].trim();
                for (let key in window.HOLAC_MAP) {
                    if (key.toLowerCase().startsWith(cleanProg)) return key;
                }
                return val;
            };

            const getShortHolacName = (val) => {
                if (!val) return val;
                let displayStr = val.toString();
                if (displayStr.includes('(') && displayStr.includes(')')) {
                    displayStr = displayStr.split('(')[1].split(')')[0].trim();
                    displayStr = displayStr.charAt(0).toUpperCase() + displayStr.slice(1);
                }
                return displayStr;
            };

            sablonaProSekci.forEach(stroj => {
                let p = stroj.id;
                // 👑 FILTR DUPLICIT: Pokud smyčka narazí na zóny pece nebo odtahy, přeskočí je, protože už jsou v mřížce nahoře
                if (p.startsWith('pecZ') || p.startsWith('pecOd')) return;

                let sLabel = stroj.label; 
                let rawO = safeGet(oD[p]); 
                let rawN = safeGet(nD[p]);

                if (p === 'holSyr' || p === 'holSal') {
                    rawO = getFullHolacName(rawO);
                    rawN = getFullHolacName(rawN);
                }

                // 👑 UNIKÁTNÍ FIX: Celá šablona mašin i vnitřní doplňky jedou striktně přes oCode/nCode
                let oldText = getDisplayVal(p, oCode, rawO, stroj.unit);
                let newText = getDisplayVal(p, nCode, rawN, stroj.unit);

                if (p === 'holSyr' || p === 'holSal') {
                    if (oldText !== window.LINKA_DICT.STAV.DODAME && !oldText.includes('class="val-missing"')) {
                        oldText = getShortHolacName(oldText);
                    }
                    if (newText !== window.LINKA_DICT.STAV.DODAME && !newText.includes('class="val-missing"')) {
                        newText = getShortHolacName(newText);
                    }
                }

                if (p === 'pekVyk') {
                    let oPln = getDisplayVal('pekPln', oCode, safeGet(oD['pekPln']), '');
                    let nPln = getDisplayVal('pekPln', nCode, safeGet(nD['pekPln']), '');

                    let isPlnActive = (val) => val && !String(val).toLowerCase().includes('vypnuto') && val.trim() !== '';
                    let isVykOff = (val) => val === '' || String(val).toLowerCase().includes('vypnuto');

                    if (isPlnActive(oPln)) {
                        oldText = 'Form & Fris'; 
                    } else if (isVykOff(oldText)) {
                        oldText = getDisplayVal('pekVel', oCode, safeGet(oD['pekVel']), ''); 
                    }

                    if (isPlnActive(nPln)) {
                        newText = 'Form & Fris'; 
                    } else if (isVykOff(newText)) {
                        newText = getDisplayVal('pekVel', nCode, safeGet(nD['pekVel']), ''); 
                    }
                }

                let changed = oldText !== newText;

                if (p === 'holSyr' && changed) changedHolSyr = true;
                if (p === 'holSal' && changed) changedHolSal = true;

                if (p === 'diskSyr' && changedHolSyr && newText && !newText.toLowerCase().includes('vypnuto')) changed = true;
                if (p === 'diskSal' && changedHolSal && newText && !newText.toLowerCase().includes('vypnuto')) changed = true;

                if (changed) {
                    let isCompDivider = false;
                    const cG1 = ['priProg', 'priPuf', 'priKec', 'priRad', 'priZdo1', 'priZdo2'];
                    const cG2 = ['alimecMat', 'alimecKol', 'maslicko'];
                    const cG3 = ['holSyr', 'diskSyr'];
                    const cG4 = ['holSal', 'diskSal'];
                    let cGroup = cG1.includes(p) ? cG1 : (cG2.includes(p) ? cG2 : (cG3.includes(p) ? cG3 : (cG4.includes(p) ? cG4 : null)));
                    if (cGroup) {
                        let rawCurr = nD[p];
                        let isCurrHidden = (!rawCurr || rawCurr.toString().toLowerCase().trim() === 'vypnuto' || rawCurr.toString().trim() === '');
                        if (p === 'diskSyr' || p === 'diskSal') {
                            let parentKey = p === 'diskSyr' ? 'holSyr' : 'holSal';
                            let pVal = nD[parentKey] ? nD[parentKey].toString().toLowerCase() : '';
                            if (!pVal || pVal.includes('vypnuto') || pVal.includes('dodá') || pVal.includes('zjistit')) isCurrHidden = true;
                        }
                        
                        if (!isCurrHidden) {
                            let hasVisibleAfter = false;
                            for (let i = cGroup.indexOf(p) + 1; i < cGroup.length; i++) {
                                let nId = cGroup[i];
                                let val = nD[nId];
                                let isHidden = (!val || val.toString().toLowerCase().trim() === 'vypnuto' || val.toString().trim() === '');
                                if (nId === 'diskSyr' || nId === 'diskSal') {
                                    let parentKey = nId === 'diskSyr' ? 'holSyr' : 'holSal';
                                    let pVal = nD[parentKey] ? nD[parentKey].toString().toLowerCase() : '';
                                    if (!pVal || pVal.includes('vypnuto') || pVal.includes('dodá') || pVal.includes('zjistit')) isHidden = true;
                                }
                                if (!isHidden) {
                                    hasVisibleAfter = true; break;
                                }
                            }
                            if (!hasVisibleAfter) isCompDivider = true;
                        }
                    }

                    let r = { label: sLabel, oldVal: oldText, newVal: newText, changed: changed, photoUrl: '', photoId: '', isDivider: isCompDivider };
                    
                    if (['alimecKol', 'diskSyr', 'diskSal'].includes(p)) {
                        // 👑 UNIKÁTNÍ FIX: I fotky teď párujeme nekompromisně podle složeného nCode klíče
                        let purl = engine.getPhotoUrlForStroj(p, nD, nCode);
                        if (purl) { r.photoUrl = purl; r.photoId = `comp_foto_${p}_${nCode}`; }
                    }
                    
                    if ((r.newVal && !r.newVal.toLowerCase().includes('vypnuto')) || oldText !== newText) {
                        rows.push(r);
                    }
                }
            });

            let isChanged = rows.length > 0;
            if (sekceKey === 'pec' && rows.length === 0 && !isOldPrujezd && !isNewPrujezd) isChanged = false;

            return { key: sekceKey, name: engine.getSekceName(sekceKey), changed: isChanged, rows: rows, alerts: isChanged ? alerts : [] };
        },

        buildBaleniDiff(oD, nD) {
            let engine = window.linkaEngine();
            let isChanged = false;
            let groups = [];

            let isOldKrabice = oD.baleniRezim === 'krabicky';
            let isNewKrabice = nD.baleniRezim === 'krabicky';

            if (oD.baleniRezim !== nD.baleniRezim) {
                isChanged = true;
            }

            if (isNewKrabice) {
                let miroRows = [];
                [...engine.miroList.map(x=>({id: x.id, label: x.name}))].forEach(pObj => {
                    let rawO = isOldKrabice ? safeGet(oD[pObj.id]) : 'Vypnuto';
                    let rawN = safeGet(nD[pObj.id]);
                    let oldVal = getDisplayVal(pObj.id, oD.code, rawO, '');
                    let newVal = getDisplayVal(pObj.id, nD.code, rawN, '');
                    if (oldVal !== newVal) {
                        miroRows.push({ label: pObj.label, oldVal: oldVal, newVal: newVal, isProg: pObj.id === 'miroProg', changed: true });
                        isChanged = true;
                    }
                });
                if (miroRows.length > 0) {
                    groups.push({ header: 'MIROPACK', rows: miroRows });
                }
                
                let currentHeader = '';
                let currentRows = [];
                (engine.sablona.baleniKrabicky || []).forEach(stroj => {
                    if (stroj.type === 'nadpis') { 
                        if (currentRows.length > 0) {
                            groups.push({ header: currentHeader, rows: currentRows });
                            currentRows = [];
                        }
                        currentHeader = stroj.label; 
                        return; 
                    }
                    let rawO = isOldKrabice ? safeGet(oD[stroj.id]) : 'Vypnuto';
                    let rawN = safeGet(nD[stroj.id]);
                    let oldVal = getDisplayVal(stroj.id, oD.code, rawO, stroj.unit);
                    let newVal = getDisplayVal(stroj.id, nD.code, rawN, stroj.unit);
                    
                    if (oldVal !== newVal) {
                        let r = { label: stroj.label, oldVal: oldVal, newVal: newVal, changed: true };
                        if (stroj.id === 'datumRadky') { 
                            let purl = engine.getPhotoUrlForDatum(nD, nD.code); 
                            if(purl) { r.photoUrl = purl; r.photoId = `comp_foto_datum_${nD.code}`; } 
                        }
                        currentRows.push(r);
                        isChanged = true;
                    }
                });
                if (currentRows.length > 0) {
                    groups.push({ header: currentHeader, rows: currentRows });
                }
            } else {
                let currentHeader = '';
                let currentRows = [];
                (engine.sablona.baleniKarton || []).forEach(stroj => {
                    if (stroj.type === 'nadpis') { 
                        if (currentRows.length > 0) {
                            groups.push({ header: currentHeader, rows: currentRows });
                            currentRows = [];
                        }
                        currentHeader = stroj.label; 
                        return; 
                    }
                    
                    let rawO = !isOldKrabice ? safeGet(oD[stroj.id]) : 'Vypnuto';
                    if (stroj.id === 'pak1' && isOldKrabice) {
                        rawO = 'Do krabiček';
                    }

                    let rawN = safeGet(nD[stroj.id]);
                    let oldVal = getDisplayVal(stroj.id, oD.code, rawO, stroj.unit);
                    let newVal = getDisplayVal(stroj.id, nD.code, rawN, stroj.unit);
                    
                    if (oldVal !== newVal) {
                        currentRows.push({ label: stroj.label, oldVal: oldVal, newVal: newVal, changed: true });
                        isChanged = true;
                    }
                });
                if (currentRows.length > 0) {
                    groups.push({ header: currentHeader, rows: currentRows });
                }
            }
            return { changed: isChanged, groups: groups, isKrabice: isNewKrabice };
        },

        executeCompareData(oD, nD) {
            Alpine.store('appState').setCompare(oD.fullCode, nD.fullCode, 'ano');
            
            let oldName = oD.nazevBase + (oD.label === oD.nazevBase ? '' : ' - ' + oD.label);
            let newName = nD.nazevBase + (nD.label === nD.nazevBase ? '' : ' - ' + nD.label);

            let oldBase = oD.fullCode.replace(/\D/g, '');
            let newBase = nD.fullCode.replace(/\D/g, '');
            
            let oldVarCode = 'S' + oD.fullCode.replace(/\D/g, '') + oD.fullCode.replace(/[^A-Z]/g, '');
            let newVarCode = 'S' + nD.fullCode.replace(/\D/g, '') + nD.fullCode.replace(/[^A-Z]/g, '');
            if(oldBase === oD.fullCode) oldVarCode = '';
            if(newBase === nD.fullCode) newVarCode = '';

            this.result = { 
                type: 'standard', 
                oldCode: oD.baseCode + '_' + oD.code, 
                newCode: nD.baseCode + '_' + nD.code, 
                oldName: oldName,
                newName: newName,
                oldBase: oD.baseCode,
                newBase: nD.baseCode,
                oldZdroj: oD.zdroj,
                newZdroj: nD.zdroj,
                oldVarCode: oD.code,
                newVarCode: nD.code,
                sections: [
                    this.buildMachineDiff('pekarna', oD, nD), 
                    this.buildMachineDiff('kynarna', oD, nD), 
                    this.buildMachineDiff('pec', oD, nD), 
                    this.buildMachineDiff('pripravna', oD, nD)
                ].filter(s => s !== null), 
                baleni: this.buildBaleniDiff(oD, nD) 
            };
            
            Alpine.nextTick(() => {
                goToScreen('resultsScreen', false);
                setTimeout(() => { if (typeof window.aplikovatAutoShrink === 'function') window.aplikovatAutoShrink(); }, 50);
            });
        },

        executeCompareProgData(oldP, newP) {
            let dbStore = typeof Alpine !== 'undefined' ? Alpine.store('trezor') : window.Trezor;
            let dbBaleni = dbStore.databaze_master.baleni;
            let o = dbBaleni[oldP]; 
            let n = dbBaleni[newP];
            if(!o || !n) { showToast(`Program nenalezen!`); return; }
            
            Alpine.store('appState').setCompare(oldP, newP, 'prog');
            let rows = []; 
            let engine = window.linkaEngine();
            
            [...engine.miroList, {id: 'novoElko', name: 'Novopac - Zvedací elko'}].forEach(item => {
                    if (item.id === 'miroProg') return;
                    let vO = safeGet(o[item.id]); 
                let vN = safeGet(n[item.id]);

                if (item.id === 'novoElko') {
                    if (vO === '') vO = 'Dodáme';
                    if (vN === '') vN = 'Dodáme';
                }

                let oldVal = getDisplayVal('kat_' + item.id, oldP, vO, '');
                let newVal = getDisplayVal('kat_' + item.id, newP, vN, '');
                
                if (oldVal !== newVal) { 
                    rows.push({ label: item.name, oldVal: oldVal, newVal: newVal, changed: true });
                }
            });

            this.result = { 
                type: 'prog', 
                oldProgNum: oldP.replace(/\D/g, ''),
                newProgNum: newP.replace(/\D/g, ''),
                rows: rows 
            };
            
            Alpine.nextTick(() => {
                goToScreen('resultsScreen', false);
                setTimeout(() => { if (typeof window.aplikovatAutoShrink === 'function') window.aplikovatAutoShrink(); }, 50);
            });
        }
    }));
});

function askForCompareVariant(inputId, baseCode, variants, oldVal, newVal, isBaseSelection = false) {
    let state = Alpine.store('appState');
    state.compareOld = oldVal;
    state.compareNew = newVal;
    
    state.openVariantModal(baseCode, variants, inputId, isBaseSelection);
}

window.processCompareVariantSelection = function(inputId, selectedCode, finalBase = null) {
    let state = Alpine.store('appState');

    if (inputId === 'compOld') {
        state.compareOld = selectedCode;
        state.compareOldBase = finalBase;
    } else {
        state.compareNew = selectedCode;
        state.compareNewBase = finalBase;
    }

    let el = document.getElementById('compareContainer');
    if (el) {
        Alpine.$data(el).initCompareAction(); 
    }
};

window.initCompare = function() {
    let oldInputEl = document.getElementById('compOld');
    let newInputEl = document.getElementById('compNew');
    let oldInput = oldInputEl ? oldInputEl.value.trim() : '';
    let newInput = newInputEl ? newInputEl.value.trim() : '';
    
    let state = Alpine.store('appState');
    if (oldInput) state.compareOld = oldInput;
    if (newInput) state.compareNew = newInput;

    let el = document.getElementById('compareContainer');
    if (el) {
        Alpine.$data(el).initCompareAction(); 
    }
};