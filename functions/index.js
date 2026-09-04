// index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require('firebase-admin');

// Inicializace administrátorských práv pro server
admin.initializeApp();

// =========================================================================
// 1. FUNKCE PRO ZMĚNU ROLE
// =========================================================================
exports.zmenitRoliServer = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Chybí ověření uživatele.');
    }

    const callerEmail = (request.auth.token.email || '').toLowerCase();
    const callerRole = request.auth.token.role;

    const db = admin.firestore();
    const nastaveniDoc = await db.collection('linka_data').doc('nastaveni').get();
    const nastaveniData = nastaveniDoc.exists ? nastaveniDoc.data() : {};
    const isCallerOwner = nastaveniData.owner_users && nastaveniData.owner_users[request.auth.uid] === true;

    if (!isCallerOwner && callerRole !== 'Admin') {
        throw new HttpsError('permission-denied', 'Operace vyžaduje administrátorské oprávnění.');
    }

    const data = request.data || {};
    const targetUid = data.uid;
    const newRole = data.role;
    const allowedRoles = ['Reader', 'Vip', 'VipPlus', 'Editor', 'Admin'];

    if (!targetUid || !newRole || !allowedRoles.includes(newRole)) {
        throw new HttpsError('invalid-argument', 'Neplatný požadavek na změnu role.');
    }

    const isTargetOwner = nastaveniData.owner_users && nastaveniData.owner_users[targetUid] === true;
    if (isTargetOwner) {
        throw new HttpsError('permission-denied', 'Účet systémového správce je chráněn proti modifikaci.');
    }

    try {
        const userRecord = await admin.auth().getUser(targetUid);
        const currentClaims = userRecord.customClaims || {};

        await admin.auth().setCustomUserClaims(targetUid, {
            ...currentClaims,
            role: newRole
        });

        const remove = admin.firestore.FieldValue.delete();
        const batchData = {
            admin_users: { [targetUid]: remove },
            editor_users: { [targetUid]: remove },
            vip_plus_users: { [targetUid]: remove },
            vip_users: { [targetUid]: remove }
        };

        if (newRole === 'Admin') batchData.admin_users[targetUid] = true;
        if (newRole === 'Editor') batchData.editor_users[targetUid] = true;
        if (newRole === 'VipPlus') batchData.vip_plus_users[targetUid] = true;
        if (newRole === 'Vip') batchData.vip_users[targetUid] = true;

        await db.collection('linka_data').doc('nastaveni').set(batchData, { merge: true });

        return { message: `Role úspěšně nastavena: ${newRole}` };
    } catch (error) {
        console.error("Chyba změny role:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Chyba při aktualizaci role uživatele.');
    }
});

// =========================================================================
// 2. FUNKCE PRO ZMRAZENÍ ÚČTU
// =========================================================================
exports.zmrazitUzivateleServer = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Chybí ověření uživatele.');
    }

    const callerRole = request.auth.token.role;
    const db = admin.firestore();
    const nastaveniDoc = await db.collection('linka_data').doc('nastaveni').get();
    const nastaveniData = nastaveniDoc.exists ? nastaveniDoc.data() : {};
    const isCallerOwner = nastaveniData.owner_users && nastaveniData.owner_users[request.auth.uid] === true;

    if (!isCallerOwner && callerRole !== 'Admin') {
        throw new HttpsError('permission-denied', 'Operace vyžaduje administrátorské oprávnění.');
    }

    const data = request.data || {};
    const targetUid = data.uid;
    const isFrozen = data.isFrozen === true;

    if (!targetUid) {
        throw new HttpsError('invalid-argument', 'Chybí identifikátor uživatele.');
    }

    const isTargetOwner = nastaveniData.owner_users && nastaveniData.owner_users[targetUid] === true;
    if (isTargetOwner || targetUid === request.auth.uid) {
        throw new HttpsError('permission-denied', 'Tento účet nelze deaktivovat.');
    }

    try {
        const userRecord = await admin.auth().getUser(targetUid);
        const currentClaims = userRecord.customClaims || {};

        await admin.auth().setCustomUserClaims(targetUid, {
            ...currentClaims,
            isFrozen: isFrozen
        });

        await db.collection('linka_data').doc('nastaveni').set({
            zmrazeni: { [targetUid]: isFrozen ? true : admin.firestore.FieldValue.delete() }
        }, { merge: true });

        if (isFrozen) {
            await admin.auth().revokeRefreshTokens(targetUid);
        }

        return { message: isFrozen ? 'Účet byl deaktivován.' : 'Účet byl aktivován.' };
    } catch (error) {
        console.error("Chyba deaktivace účtu:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Chyba serveru při správě stavu účtu.');
    }
});

// =========================================================================
// 3. SERVEROVÝ ZÁPIS PŘIHLÁŠENÍ (BEZPEČNÉ LOGOVÁNÍ)
// =========================================================================
exports.zalogovatPrihlaseniServer = onCall({ region: "us-central1" }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Neautorizovaný přístup.');
    }

    const uid = request.auth.uid;
    const email = (request.auth.token.email || '').toLowerCase();
    const data = request.data || {};
    const deviceId = String(data.deviceId || 'Neznámé').slice(0, 50);
    const deviceType = String(data.deviceType || 'Mobilní zařízení').slice(0, 100);
    const now = Date.now();

    const db = admin.firestore();
    const nastaveniDoc = await db.collection('linka_data').doc('nastaveni').get();
    const nastaveniData = nastaveniDoc.exists ? nastaveniDoc.data() : {};
    const isOwnerUser = nastaveniData.owner_users && nastaveniData.owner_users[uid] === true;

    // Systémový správce (Owner) nezanechává stopy v auditním logu
    if (isOwnerUser) {
        return { success: true, isNewDevice: false };
    }

    const rosterRef = db.collection('linka_data').doc('uzivatele');

    try {
        const rosterDoc = await rosterRef.get();
        const rosterData = rosterDoc.exists ? rosterDoc.data() : {};
        const userRoster = rosterData[uid] || { email: email, devices: [], loginHistory: [] };

        const isNewDevice = !userRoster.devices || !userRoster.devices.includes(deviceId);
        if (!userRoster.devices) userRoster.devices = [];
        if (isNewDevice) userRoster.devices.push(deviceId);

        userRoster.email = email;
        userRoster.loginHistory = userRoster.loginHistory || [];
        userRoster.loginHistory.unshift({ time: now, deviceType: deviceType, deviceId: deviceId });
        if (userRoster.loginHistory.length > 5) userRoster.loginHistory.pop();
        userRoster.lastLogin = now;

        await db.collection('security_logs').add({
            uid: uid,
            email: email,
            time: now,
            deviceType: deviceType,
            deviceId: deviceId,
            isNewDevice: isNewDevice
        });

        await rosterRef.set({ [uid]: userRoster }, { merge: true });

        return { success: true, isNewDevice: isNewDevice };
    } catch (error) {
        console.error("Chyba zápisu logu:", error);
        throw new HttpsError('internal', 'Chyba při zápisu přístupového záznamu.');
    }
});