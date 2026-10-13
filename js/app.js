let df = [];
let barChart = null; 
let pieChart = null;
let astroApiCache = null;

const allTithiLabels = [
    "Shukla Prathama", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami", "Shukla Shashti", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami", "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
    "Krishna Prathama", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami", "Krishna Shashti", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami", "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"
];

const CHANGELOG = [
    { v: "1.9.15", date: "2026-10-12", changes: [
        "Added precise Vedic Planetary Hora calculation to Live Swara and Daily Flow schedules.",
        "Integrated discrete Hora Lord filtering to Alignment Scanner and Exact Time Scanner.",
        "Ensured seamless cascading compatibility between Hora filters and Tattva Status (Purna/Sunya) bypassing."
    ]},
    { v: "1.9.14", date: "2026-10-12", changes: [
        "Purged corrupted PWA execution cache preventing application startup sequence.",
        "Verified structural integrity of 'Tattva Status' Purna/Sunya UI mapping module."
    ]},
    { v: "1.9.13", date: "2026-10-12", changes: [
        "Introduced 'Tattva Status' bypass filter to both Alignment and Exact Time scanners.",
        "Enabled unrestricted scanning for Sunya Tattvas alongside Purna Tattvas based on dynamic user selection.",
        "Refactored 7-layer resonance scoring to accurately evaluate non-Purna windows."
    ]},
    { v: "1.9.12", date: "2026-09-29", changes: [
        "Implemented full spatial geometry for Vaara Soola blocking both explicit directions and their +90 degree left-side variants.",
        "Integrated discrete Shani Soola (Saturn) directional layer into unified travel matrix (Sunday=E, Monday=SE, etc.).",
        "Refactored Travel UI to universally utilize absolute date-time formatters (fDateTime) for complete clarity on cross-day expirations."
    ]},
    { v: "1.9.11", date: "2026-09-28", changes: [
        "Implemented Cascading Multi-Filters (Nadi, Tattva, Yaamam) for both Main Alignment Scanner and Exact Time Scanner.",
        "Filters dynamically update active scan results in real-time without requiring re-calculation.",
        "Refactored scanner logic to process complex combinations (e.g., Ida + Earth + Water Yaamam) instantly."
    ]},
    { v: "1.9.10", date: "2026-09-28", changes: [
        "Upgraded Exact Time Scanner with interactive Base Date picker, decoupling logic from current system day.",
        "Added granular scanning modifiers allowing users to analyze specific months, single precise days, or historical/future sliding ranges."
    ]},
    { v: "1.9.9", date: "2026-09-28", changes: [
        "Fixed Purna Tattva designation in Swarodaya Ida sequence: Earth and Water correctly designated as Purna, while Vayu, Agni, and Akasha are set as Sunya."
    ]},
    { v: "1.9.8", date: "2026-09-28", changes: [
        "Implemented Global A/B Engine Toggle (Chintamani Classic vs. Swarodaya Variant)."
    ]}
];

if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=1.9.16').catch(console.error);
}

// Global Engine State Initialization
let swaraEngine = localStorage.getItem('swaraEngine') || 'chintamani';
const engineSelector = document.getElementById('engineSelector');
if (engineSelector) {
    engineSelector.value = swaraEngine;
    engineSelector.addEventListener('change', (e) => {
        swaraEngine = e.target.value;
        localStorage.setItem('swaraEngine', swaraEngine);
        
        if (document.getElementById('daily').classList.contains('active')) document.getElementById('btnDailyScan').click();
        if (document.getElementById('calendar').classList.contains('active') && document.getElementById('scanResults').innerHTML !== "") doScan(0);
    });
}

let loc = JSON.parse(localStorage.getItem('vLoc')) || { name: 'Irvine, CA', lat: 33.6846, lon: -117.8265, tz: 'America/Los_Angeles' };
document.getElementById('locName').innerText = loc.name;

// Isolated location override for the Exact Time Scanner
let exactScannerLoc = null;

const fT = d => {
    try { return d.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit', hour12:false}); }
    catch(e) { return d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:false}); }
};

const fDateTime = d => {
    try { return d.toLocaleString('en-US', {timeZone: loc.tz, weekday: 'short', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'}); }
    catch(e) { return d.toLocaleString('en-US', {weekday: 'short', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'}); }
}

function getTzDateString(tz) {
    let formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(new Date()); 
}

let fpScan = flatpickr("#scanDate", { defaultDate: getTzDateString(loc.tz), disableMobile: false });
let fpAlmanac = flatpickr("#almanacDate", { defaultDate: getTzDateString(loc.tz), disableMobile: false });
let fpDaily = flatpickr("#dailyDate", { defaultDate: getTzDateString(loc.tz), disableMobile: false });
let fpExact = flatpickr("#exactBaseDate", { defaultDate: getTzDateString(loc.tz), disableMobile: false });

function updateDatePickers() {
    let newDateStr = getTzDateString(loc.tz);
    fpScan.setDate(newDateStr);
    fpAlmanac.setDate(newDateStr);
    fpDaily.setDate(newDateStr);
    fpExact.setDate(newDateStr);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggleMobile').innerText = theme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themeToggleDesktop').innerText = theme === 'dark' ? '☀️' : '🌙';
    if(barChart && typeof filterAndRender === 'function') filterAndRender();
}

let currentTheme = localStorage.getItem('swaraTheme') || 'dark';
applyTheme(currentTheme);

const toggleAction = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('swaraTheme', currentTheme);
    applyTheme(currentTheme);
};
document.getElementById('themeToggleMobile').addEventListener('click', toggleAction);
document.getElementById('themeToggleDesktop').addEventListener('click', toggleAction);

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        let btn = e.target.closest('.nav-item');
        if(!btn) return;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.getElementById(btn.dataset.target).classList.add('active');
        btn.classList.add('active');
        
        if (btn.dataset.target === 'daily') {
            document.getElementById('btnDailyScan').click();
        }
    });
});

// Main App Location Search
const locSearch = document.getElementById('locSearch');
const locDropdown = document.getElementById('locDropdown');
let timeoutId;

locSearch.addEventListener('input', function() {
    clearTimeout(timeoutId);
    const val = this.value.trim();
    if(!val) { locDropdown.style.display = 'none'; return; }
    timeoutId = setTimeout(async () => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`);
            const data = await res.json();
            locDropdown.innerHTML = '';
            if(data.length > 0) {
                data.forEach(place => {
                    const div = document.createElement('div');
                    div.innerText = place.display_name;
                    div.onclick = async () => {
                        locDropdown.style.display = 'none';
                        locSearch.value = '';
                        document.getElementById('locName').innerText = 'Fetching TZ...';
                        const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current_weather=true&timezone=auto`);
                        const tzData = await tzRes.json();
                        loc = { name: place.display_name.split(',')[0], lat: parseFloat(place.lat), lon: parseFloat(place.lon), tz: tzData.timezone || 'UTC' };
                        localStorage.setItem('vLoc', JSON.stringify(loc));
                        document.getElementById('locName').innerText = loc.name;
                        updateDatePickers();
                        updateMacroAstro(); 
                    };
                    locDropdown.appendChild(div);
                });
                locDropdown.style.display = 'block';
            } else { locDropdown.style.display = 'none'; }
        } catch(e) {}
    }, 600);
});

document.addEventListener('click', function(e) {
    if (!locSearch.contains(e.target) && !locDropdown.contains(e.target)) {
        locDropdown.style.display = 'none';
    }
});

// GPS Auto-Locate Button
let btnLocate = document.getElementById('btnLocate');
if(btnLocate) {
    btnLocate.addEventListener('click', () => {
        if (!navigator.geolocation) return alert("Geolocation not supported by this browser.");
        document.getElementById('locName').innerText = 'Getting GPS...';
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                let lat = pos.coords.latitude, lon = pos.coords.longitude;
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                const geoData = await geoRes.json();
                let city = geoData.address.city || geoData.address.town || geoData.address.county || "GPS Location";
                
                const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
                const tzData = await tzRes.json();
                
                loc = { name: city, lat: lat, lon: lon, tz: tzData.timezone || 'UTC' };
                localStorage.setItem('vLoc', JSON.stringify(loc));
                document.getElementById('locName').innerText = loc.name;
                updateDatePickers();
                updateMacroAstro();
            } catch(e) { 
                alert("Failed to reverse geocode location.");
                document.getElementById('locName').innerText = loc.name; 
            }
        }, (err) => {
            alert("GPS access denied or unavailable.");
            document.getElementById('locName').innerText = loc.name;
        });
    });
}

// Modular Location Search for Exact Time Scanner
const exactLocSearch = document.getElementById('exactLocSearch');
const exactLocDropdown = document.getElementById('exactLocDropdown');
const exactLocNameEl = document.getElementById('exactLocName');
const btnExactResetLoc = document.getElementById('btnExactResetLoc');
let exactTimeoutId;

if(exactLocSearch) {
    exactLocSearch.addEventListener('input', function() {
        clearTimeout(exactTimeoutId);
        const val = this.value.trim();
        if(!val) { exactLocDropdown.style.display = 'none'; return; }
        exactTimeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`);
                const data = await res.json();
                exactLocDropdown.innerHTML = '';
                if(data.length > 0) {
                    data.forEach(place => {
                        const div = document.createElement('div');
                        div.innerText = place.display_name;
                        div.onclick = async () => {
                            exactLocDropdown.style.display = 'none';
                            exactLocSearch.value = '';
                            exactLocNameEl.innerText = 'Fetching TZ...';
                            const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current_weather=true&timezone=auto`);
                            const tzData = await tzRes.json();
                            exactScannerLoc = {
                                name: place.display_name.split(',')[0],
                                lat: parseFloat(place.lat),
                                lon: parseFloat(place.lon),
                                tz: tzData.timezone || 'UTC'
                            };
                            exactLocNameEl.innerText = exactScannerLoc.name;
                        };
                        exactLocDropdown.appendChild(div);
                    });
                    exactLocDropdown.style.display = 'block';
                } else { exactLocDropdown.style.display = 'none'; }
            } catch(e) {}
        }, 600);
    });

    document.addEventListener('click', function(e) {
        if (!exactLocSearch.contains(e.target) && !exactLocDropdown.contains(e.target)) {
            exactLocDropdown.style.display = 'none';
        }
    });
}

if(btnExactResetLoc) {
    btnExactResetLoc.addEventListener('click', () => {
        exactScannerLoc = null;
        exactLocNameEl.innerText = `Using App Location`;
    });
}

async function updateMacroAstro() {
    let now = new Date();
    
    try {
        const res = await fetch(`/api/astro?time=${now.getTime()}`);
        if (!res.ok) throw new Error("API not reachable");
        const data = await res.json();
        astroApiCache = data;
        
        let tIdx = data.tithi_index;
        let isShukla = tIdx <= 15;
        let nIdx = isShukla ? tIdx : tIdx - 15;
        
        let name = (nIdx===15 && !isShukla) ? "Amavasya" : (nIdx===15 && isShukla) ? "Purnima" : TithiNames[nIdx-1];
        let paksha = isShukla ? "Shukla" : "Krishna";

        document.getElementById('sysTithi').innerText = `${name} (${paksha})`;
        document.getElementById('sysAyana').innerText = data.ayana;

        let tEnd = new Date(data.tithi_end_ms);
        document.getElementById('sysTithiEnd').innerText = `Ends: ${fDateTime(tEnd)}`;

        let pEnd = findExactEndTime(now, isShukla ? 180 : 360, d => getAstro(d).diff, 0.5079);
        let aEnd = findExactEndTime(now, (data.ayana === "Uttarayana") ? 90 : 270, d => getAstro(d).sunSidereal, 0.04107);

        let b = getBoundingSunEvents(now, loc.lat, loc.lon, loc.tz);
        let sRiseStr = b.todayRise.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        let sSetStr = b.todaySet.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        let nxRiseStr = b.nextRise.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        
        let shiftedNow = shiftToTz(now, loc.tz);
        let dateStr = shiftedNow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        document.getElementById('sysDateTime').innerHTML = `
            <div style="font-size: 1rem; color: var(--text-main); margin-bottom: 6px; font-weight: bold;">${dateStr}</div>
            <div style="font-size: 0.85rem; color: var(--purna); font-weight: bold; margin-bottom: 2px;">🌅 Rise: ${sRiseStr}</div>
            <div style="font-size: 0.85rem; color: var(--pingala); font-weight: bold; margin-bottom: 2px;">🌇 Set: ${sSetStr}</div>
            <div style="font-size: 0.85rem; color: var(--ida); font-weight: bold;">⏭️ Next Rise: ${nxRiseStr}</div>
        `;
        
        document.getElementById('sysPakshaEnd').innerText = `Paksha Ends: ${fDateTime(pEnd)}`;
        document.getElementById('sysAyanaEnd').innerText = `Ayana Ends: ${fDateTime(aEnd)}`;

        if(data.sankranti_ms) {
            let nextSankranti = new Date(data.sankranti_ms);
            let nextMonthIdx = (Math.floor(data.sun_sidereal / 30) + 1) % 12;
            let nextMonthName = ["Mesha", "Vrishabha", "Mithuna", "Karkataka", "Simha", "Kanya", "Tula", "Vrischikam", "Dhanusu", "Makaram", "Kumbha", "Meenam"][nextMonthIdx];
            document.getElementById('panchangSankranti').innerHTML = `${fDateTime(nextSankranti)} <span style="font-size:0.85rem; color:var(--text-muted);">(Enters ${nextMonthName})</span>`;
        }
        if(data.nakshatra_end_ms) {
            let nEnd = new Date(data.nakshatra_end_ms);
            document.getElementById('panchangNakEnd').innerText = `Ends: ${fDateTime(nEnd)}`;
        }
        if(data.rashi_end_ms) {
            let rEnd = new Date(data.rashi_end_ms);
            document.getElementById('panchangRashiEnd').innerText = `Ends: ${fDateTime(rEnd)}`;
        }

    } catch(e) {}
}

updateMacroAstro();
setInterval(updateMacroAstro, 60000);

function generateBeepDataURI() {
    const sr = 8000; 
    const dur = 0.5;
    const freq = 432;
    let data = "RIFF" + String.fromCharCode(0,0,0,0) + "WAVEfmt " + String.fromCharCode(16,0,0,0,1,0,1,0) + 
               String.fromCharCode(sr&255, (sr>>8)&255, 0, 0) + 
               String.fromCharCode(sr&255, (sr>>8)&255, 0, 0) + 
               String.fromCharCode(1,0,8,0) + "data" + String.fromCharCode(0,0,0,0);
    for (let i = 0; i < sr * dur; i++) {
        let v = 128 + 127 * Math.sin(2 * Math.PI * freq * (i / sr)) * Math.exp(-3 * (i/sr));
        data += String.fromCharCode(Math.round(v));
    }
    return "data:audio/wav;base64," + btoa(data);
}

let nativeAudio = new Audio(generateBeepDataURI());
let alarmInterval = null;
let lastTriggeredEvent = null;
let isAudioUnlocked = false;

function unlockIOSAudio() {
    if(isAudioUnlocked) return;
    nativeAudio.play().then(() => {
        nativeAudio.pause();
        nativeAudio.currentTime = 0;
    }).catch(e=>{});
    isAudioUnlocked = true;
    document.removeEventListener('touchstart', unlockIOSAudio);
    document.removeEventListener('click', unlockIOSAudio);
}

document.addEventListener('touchstart', unlockIOSAudio);
document.addEventListener('click', unlockIOSAudio);

document.getElementById('btnTestAudio').addEventListener('click', () => {
    playChime(false); 
});

function playChime(isExact) {
    if (!isExact) {
        nativeAudio.currentTime = 0;
        nativeAudio.play().catch(e=>{});
    } else {
        document.body.classList.add('agnihotra-active');
        let count = 0;
        document.getElementById('stopAlarmBtn').style.display = 'block';
        
        nativeAudio.currentTime = 0;
        nativeAudio.play().catch(e=>{});
        
        alarmInterval = setInterval(() => {
            count++;
            if (count >= 12) { 
                stopAlarm();
            } else {
                nativeAudio.currentTime = 0;
                nativeAudio.play().catch(e=>{});
            }
        }, 2000);
    }
}

function stopAlarm() {
    if(alarmInterval) clearInterval(alarmInterval);
    document.body.classList.remove('agnihotra-active');
    document.getElementById('stopAlarmBtn').style.display = 'none';
}
document.getElementById('stopAlarmBtn').addEventListener('click', stopAlarm);

setInterval(() => {
    let now = new Date();
    document.getElementById('liveTime').innerText = fT(now) + ':' + now.getSeconds().toString().padStart(2,'0');
    
    let agniClock = document.getElementById('liveTimeAgnihotra');
    if(agniClock) agniClock.innerText = fT(now) + ':' + now.getSeconds().toString().padStart(2,'0');
    
    let s = getSwaraState(now, loc.lat, loc.lon, loc.tz, swaraEngine);
    let b = getBoundingSunEvents(now, loc.lat, loc.lon, loc.tz);
    
    let elNak = document.getElementById('panchangNakshatra');
    let elRas = document.getElementById('panchangRashi');
    let elMon = document.getElementById('panchangMonth');
    let elClr = document.getElementById('travelClear');
    let elBlk = document.getElementById('travelBlocked');
    let elNextNak = document.getElementById('panchangNextNak');
    let elNextRas = document.getElementById('panchangNextRashi');

    if(elNak) elNak.innerText = s.panchang.nakshatra;
    if(elRas) elRas.innerText = s.panchang.rashi;
    if(elMon) elMon.innerText = s.panchang.solarMonth;
    if(elClr) elClr.innerText = s.travel.clear.join(', ') || 'None';
    if(elBlk) elBlk.innerText = s.travel.blocked.join(', ') || 'None';
    if(elNextNak) elNextNak.innerHTML = `Next: <strong>${s.panchang.nextNakshatra}</strong>`;
    if(elNextRas) elNextRas.innerHTML = `Next: <strong>${s.panchang.nextRashi}</strong>`;

    let tbody = document.getElementById('soolaLayerBody');
    if (tbody && s.travel.layers && astroApiCache) {
        let rowsHtml = "";
        s.travel.layers.forEach(l => {
            let exp = "--:--";
            if (l.type === "nadi") exp = fDateTime(s.nEnd);
            else if (l.type === "sunrise") exp = fDateTime(b.nextRise);
            else if (l.type === "tithi" && astroApiCache.tithi_end_ms) exp = fDateTime(new Date(astroApiCache.tithi_end_ms));
            else if (l.type === "nakshatra" && astroApiCache.nakshatra_end_ms) exp = fDateTime(new Date(astroApiCache.nakshatra_end_ms));
            else if (l.type === "rashi" && astroApiCache.rashi_end_ms) exp = fDateTime(new Date(astroApiCache.rashi_end_ms));

            let blkColor = l.blocked.includes("None") ? "var(--text-muted)" : "var(--sunya)";
            rowsHtml += `<tr>
                <td><strong>${l.name}</strong></td>
                <td>${l.rule}</td>
                <td style="color:${blkColor}; font-weight:bold;">${l.blocked.join(', ')}</td>
                <td style="white-space:nowrap;">${exp}</td>
            </tr>`;
        });
        tbody.innerHTML = rowsHtml;
    }

    document.body.className = s.isIda ? (document.body.classList.contains('agnihotra-active') ? 'ida-mode agnihotra-active' : 'ida-mode') : (document.body.classList.contains('agnihotra-active') ? 'pingala-mode agnihotra-active' : 'pingala-mode');
    document.getElementById('activeNadi').innerText = s.isIda ? "Ida (Lunar - Left)" : "Pingala (Solar - Right)";
    
    document.getElementById('nadiStart').innerText = fT(s.nStart);
    document.getElementById('nadiEnd').innerText = fT(s.nEnd);
    let totalNadiSecs = (s.nEnd - s.nStart) / 1000;
    let nPct = 100 - ((s.remNadi / totalNadiSecs) * 100);
    document.getElementById('nadiProgress').style.width = `${nPct}%`;
    document.getElementById('nadiTimer').innerText = `${Math.floor(s.remNadi/60).toString().padStart(2,'0')}m ${Math.floor(s.remNadi%60).toString().padStart(2,'0')}s remaining`;

    document.getElementById('tattvaName').innerText = s.tattva.n;
    document.getElementById('tattvaIcon').innerText = s.tattva.i;
    document.getElementById('tattvaRuler').innerText = s.tattva.r;
    document.getElementById('tattvaPower').innerText = s.tattva.p;
    document.getElementById('tattvaFace').innerText = s.tattva.f;
    
    let bnd = document.getElementById('tattvaBox');
    let bdg = document.getElementById('tattvaStatus');
    bnd.className = `tattva-box ${s.tattva.s.toLowerCase()}`;
    bdg.className = `badge ${s.tattva.s.toLowerCase()}`;
    bdg.innerText = s.tattva.s;
    document.getElementById('tattvaSubStatus').innerText = s.tattva.sub;

    document.getElementById('tattvaStart').innerText = fT(s.tStart);
    document.getElementById('tattvaEnd').innerText = fT(s.tEnd);
    let totalTattvaSecs = (s.tEnd - s.tStart) / 1000;
    let tPct = 100 - ((s.remTattva / totalTattvaSecs) * 100);
    
    let tTotM = Math.floor(totalTattvaSecs / 60);
    let tTotS = Math.floor(totalTattvaSecs % 60);
    document.getElementById('tattvaTotal').innerText = `Total Duration: ${tTotM}m ${tTotS.toString().padStart(2,'0')}s`;
    
    document.getElementById('tattvaProgress').style.width = `${tPct}%`;
    document.getElementById('tattvaTimer').innerText = `${Math.floor(s.remTattva/60).toString().padStart(2,'0')}m ${Math.floor(s.remTattva%60).toString().padStart(2,'0')}s remaining`;

    document.getElementById('nextTattvaInfo').innerHTML = `<strong>Next Tattva:</strong> ${s.nextTattva.n} ${s.nextTattva.i} (Starts at ${fT(s.tEnd)})`;

    document.getElementById('yamamName').innerText = s.yaamam.split('(')[0];
    document.getElementById('yamamPeriod').innerText = s.yaamam.split('(')[1].replace(')','');
    
    document.getElementById('yamamStart').innerText = fT(s.yStart);
    document.getElementById('yamamEnd').innerText = fT(s.yEnd);
    let yPct = 100 - ((s.remYaamam / (s.yaamamTotalMs / 1000)) * 100);
    document.getElementById('yamamProgress').style.width = `${yPct}%`;
    document.getElementById('yamamTimer').innerText = `${Math.floor(s.remYaamam/60).toString().padStart(2,'0')}m ${Math.floor(s.remYaamam%60).toString().padStart(2,'0')}s remaining`;
    document.getElementById('nextYamamInfo').innerHTML = `<strong>Next Yaamam:</strong> ${s.nextYaamam} (Starts at ${fT(s.yEnd)})`;
    
    let drUI = document.getElementById('dayAlignment');
    drUI.innerText = s.dayRule;
    drUI.style.color = (s.isIda === s.ruleIsIda) ? "var(--purna)" : "var(--text-muted)";
    
    let activeHoraEl = document.getElementById('activeHora');
    if(activeHoraEl) activeHoraEl.innerText = s.hora + " Lord";

    let elHStart = document.getElementById('horaStart');
    let elHEnd = document.getElementById('horaEnd');
    let elHProg = document.getElementById('horaProgress');
    let elHTimer = document.getElementById('horaTimer');

    if(elHStart && s.hStart) elHStart.innerText = fT(s.hStart);
    if(elHEnd && s.hEnd) elHEnd.innerText = fT(s.hEnd);
    if(elHTimer && s.remHora !== undefined) {
        let hMins = Math.floor(Math.max(0, s.remHora) / 60);
        let hSecs = Math.floor(Math.max(0, s.remHora) % 60);
        elHTimer.innerText = `${hMins.toString().padStart(2, '0')}m ${hSecs.toString().padStart(2, '0')}s remaining`;
    }
    if(elHProg && s.horaTotalMs) {
        let hPct = 100 - ((s.remHora / (s.horaTotalMs / 1000)) * 100);
        elHProg.style.width = `${Math.min(100, Math.max(0, hPct))}%`;
    }
    
    let preMins = parseInt(document.getElementById('preAlarmMins').value) * 60000;
    
    let nextAgnihotra = null;
    let isSunriseAgnihotra = true;
    if (now < b.todayRise) { nextAgnihotra = b.todayRise; isSunriseAgnihotra = true; }
    else if (now < b.todaySet) { nextAgnihotra = b.todaySet; isSunriseAgnihotra = false; }
    else { nextAgnihotra = b.nextRise; isSunriseAgnihotra = true; }
    
    let agniDiffSecs = (nextAgnihotra - now) / 1000;
    let agniH = Math.floor(agniDiffSecs / 3600);
    let agniM = Math.floor((agniDiffSecs % 3600) / 60);
    let agniS = Math.floor(agniDiffSecs % 60);
    let nextAgniLabel = isSunriseAgnihotra ? "Sunrise" : "Sunset";
    
    let agniTimerEl = document.getElementById('nextAgnihotraTimer');
    if(agniTimerEl) agniTimerEl.innerHTML = `Next Agnihotra (${nextAgniLabel}): <strong style="color:var(--purna);">${agniH}h ${agniM}m ${agniS}s</strong>`;
    
    if (document.getElementById('chkSunriseAlarm').checked) {
        let riseDiff = b.todayRise.getTime() - now.getTime();
        if (Math.abs(riseDiff) < 1000 && lastTriggeredEvent !== 'rise_exact') {
            lastTriggeredEvent = 'rise_exact'; playChime(true);
        }
        if (preMins > 0 && Math.abs(riseDiff - preMins) < 1000 && lastTriggeredEvent !== 'rise_warn') {
            lastTriggeredEvent = 'rise_warn'; playChime(false);
        }
    }
    
    if (document.getElementById('chkSunsetAlarm').checked) {
        let setDiff = b.todaySet.getTime() - now.getTime();
        if (Math.abs(setDiff) < 1000 && lastTriggeredEvent !== 'set_exact') {
            lastTriggeredEvent = 'set_exact'; playChime(true);
        }
        if (preMins > 0 && Math.abs(setDiff - preMins) < 1000 && lastTriggeredEvent !== 'set_warn') {
            lastTriggeredEvent = 'set_warn'; playChime(false);
        }
    }
    
    let nowMs = now.getTime();
    document.querySelectorAll('#dailyFlowContainer tr[data-start]').forEach(row => {
        let start = parseInt(row.getAttribute('data-start'));
        let end = parseInt(row.getAttribute('data-end'));
        if (nowMs >= start && nowMs < end) {
            row.classList.add('active-tattva-row');
        } else {
            row.classList.remove('active-tattva-row');
        }
    });

}, 1000);

// Instant Filter Change Listeners for Main Scanner
['scanStatusFilter', 'scanFilter', 'scanTattvaFilter', 'scanYaamamFilter', 'scanHoraFilter'].forEach(id => {
    let el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', () => {
            if(document.getElementById('scanResults').innerHTML !== "") doScan(0);
        });
    }
});

document.getElementById('btnPrevScan').addEventListener('click', () => doScan(-1, 0));
document.getElementById('btnScan').addEventListener('click', () => doScan(0, 0));
document.getElementById('btnNextScan').addEventListener('click', () => doScan(1, 0));
document.getElementById('btnScan5').addEventListener('click', () => doScan(0, 5));
document.getElementById('btnScan6').addEventListener('click', () => doScan(0, 6));
document.getElementById('btnScan7').addEventListener('click', () => doScan(0, 7));

function doScan(offset, targetScore = 0) {
    let baseInput = document.getElementById('scanDate').value;
    let days = parseInt(document.getElementById('scanRange').value);
    
    let sStatusFilter = document.getElementById('scanStatusFilter') ? document.getElementById('scanStatusFilter').value : 'purna';
    let sNadiFilter = document.getElementById('scanFilter').value;
    let sTattvaFilter = document.getElementById('scanTattvaFilter').value;
    let sYaamamFilter = document.getElementById('scanYaamamFilter').value;
    let sHoraFilter = document.getElementById('scanHoraFilter') ? document.getElementById('scanHoraFilter').value : 'all';
    
    let startDate = new Date(baseInput + "T00:00:00");
    if (offset !== 0) {
        startDate.setDate(startDate.getDate() + (offset * days));
        document.getElementById('scanDate').value = startDate.toISOString().split('T')[0];
    }
    
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    
    document.getElementById('scanResults').innerHTML = `<div style="text-align:center; padding:20px;">Scanning ${days} days...</div>`;
    
    setTimeout(() => {
        let html = ""; let matchCount = 0;
        let curr = new Date(startDate);
        let currentDayStr = ""; let dayMatchesHTML = "";
        
        while(curr < endDate) {
            let s = getSwaraState(curr, loc.lat, loc.lon, loc.tz, swaraEngine);
            
            let isPurna = (s.tattva.s === "Purna"); 
            let passStatus = (sStatusFilter === 'all' || isPurna);
            
            let yamamElement = s.yaamam.split(':')[1].split('(')[0].trim(); 
            let isYamamMatch = yamamElement.includes(s.tattva.n); 
            let nadiMatchesDay = (s.isIda === s.ruleIsIda); 
            
            if(passStatus) {
                let currentType = s.isIda ? 'ida' : 'pingala';
                let passNadi = (sNadiFilter === 'all' || sNadiFilter === currentType);
                let passTattva = (sTattvaFilter === 'all' || sTattvaFilter.toLowerCase() === s.tattva.n.toLowerCase());
                let passYaamam = (sYaamamFilter === 'all' || yamamElement.includes(sYaamamFilter));
                let passHora = (sHoraFilter === 'all' || s.hora.toLowerCase() === sHoraFilter.toLowerCase());

                if (passNadi && passTattva && passYaamam && passHora) {
                    let score = 0;
                    let matchedText = [];
                    
                    if(isPurna) { score++; matchedText.push("Purna Tattva"); }
                    score++; matchedText.push("Nadi Flow"); 
                    if(isYamamMatch) { score++; matchedText.push("Yaamam"); }
                    if(nadiMatchesDay) { score++; matchedText.push("Vaara"); }
                    
                    let pMatch = s.isIda === s.isShukla; 
                    if(pMatch) { score++; matchedText.push("Paksha"); }
                    
                    let aMatch = s.isIda === s.ayanaIda; 
                    if(aMatch) { score++; matchedText.push("Ayana"); }

                    let isSubtleMatch = (s.tattva.n === s.subtleBodyTattva);
                    if(isSubtleMatch) { score++; matchedText.push(`Subtle Body (${s.subtleBodyTattva})`); }
                    
                    if (score >= targetScore) {
                        let shiftedCurr = shiftToTz(curr, loc.tz);
                        let dateStr = shiftedCurr.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
                        
                        if(dateStr !== currentDayStr) {
                            if(dayMatchesHTML !== "") html += `<div class="card scan-day-header"><h4>${currentDayStr}</h4>${dayMatchesHTML}</div>`;
                            currentDayStr = dateStr; dayMatchesHTML = "";
                        }
                        
                        let scoreColor = score === 7 ? 'var(--purna)' : (score >= 5 ? 'var(--pingala)' : 'var(--text-main)');
                        let typeClass = s.isIda ? 'ida' : 'pingala';
                        let travelZones = s.travel.clear.join(', ') || 'None';
                        let statusTag = isPurna ? '' : ' <span style="color:var(--sunya); font-size:0.8rem;">(Sunya)</span>';
                        
                        dayMatchesHTML += `<div class="scan-match-card ${typeClass}">
                            <div style="display:flex; justify-content:space-between;">
                                <strong style="color:var(--purna)">${fT(s.tStart)} - ${fT(s.tEnd)}</strong>
                                <strong style="color:${scoreColor};">${score}/7 Resonance</strong>
                            </div>
                            <div style="font-size:0.9rem; margin-top:4px;"><strong>${s.isIda?'Ida':'Pingala'}</strong> + <strong>${s.tattva.n} ${s.tattva.i}</strong> (Y: ${s.yaamam.split('(')[0].trim()} | H: ${s.hora})${statusTag}</div>
                            <div style="font-size:0.8rem; color:var(--text-main); margin-top:4px;">
                                <strong>Matched:</strong> ${matchedText.join(', ')}
                            </div>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Power Zone: ${s.tattva.p} | Face: ${s.tattva.f}</div>
                            <div style="font-size:0.8rem; color:var(--purna); margin-top:4px;"><strong>Safe Travel:</strong> ${travelZones}</div>
                        </div>`;
                        matchCount++;
                    }
                }
            }
            curr = new Date(s.tEnd.getTime() + 1000); 
        }
        if(dayMatchesHTML !== "") html += `<div class="card scan-day-header"><h4>${currentDayStr}</h4>${dayMatchesHTML}</div>`;
        if(matchCount === 0) html = `<div class="card"><p style="color:var(--sunya);">No confluences found matching filters.</p></div>`;
        
        let headerText = targetScore > 0 ? `Found ${matchCount} Windows (${targetScore}/7+ Resonance)` : `Found ${matchCount} Windows`;
        document.getElementById('scanResults').innerHTML = `<h3 style="color:var(--purna); margin-top:0;">${headerText}</h3>` + html;
    }, 50);
}

// Instant Filter Change Listeners for Exact Time Scanner
['exactStatusFilter', 'exactNadiFilter', 'exactTattvaFilter', 'exactYaamamFilter', 'exactHoraFilter'].forEach(id => {
    let el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', () => {
            if(document.getElementById('exactScanResults').innerHTML !== "") {
                document.getElementById('btnExactScan').click();
            }
        });
    }
});

// Exact Time Resonance Scanner
document.getElementById('btnExactScan').addEventListener('click', () => {
    let baseDateStr = document.getElementById('exactBaseDate').value;
    let timeVal = document.getElementById('exactTimeInput').value; 
    if(!baseDateStr || !timeVal) return alert("Select a base date and time.");
    let rangeVal = document.getElementById('exactRange').value;
    
    let exactStatusFilter = document.getElementById('exactStatusFilter') ? document.getElementById('exactStatusFilter').value : 'purna';
    let exactNadiFilter = document.getElementById('exactNadiFilter').value;
    let exactTattvaFilter = document.getElementById('exactTattvaFilter').value;
    let exactYaamamFilter = document.getElementById('exactYaamamFilter').value;
    let exactHoraFilter = document.getElementById('exactHoraFilter') ? document.getElementById('exactHoraFilter').value : 'all';
    
    let effLoc = exactScannerLoc || loc;
    document.getElementById('exactScanResults').innerHTML = `<div style="text-align:center; padding:20px;">Generating scan map for <strong>${effLoc.name}</strong>...</div>`;
    
    setTimeout(() => {
        let html = "";
        let matchCount = 0;
        let tz = effLoc.tz;
        
        let [bYear, bMonth, bDay] = baseDateStr.split('-').map(Number);
        
        let targetDaysArray = [];
        if (rangeVal === "1") {
            targetDaysArray.push(new Date(bYear, bMonth - 1, bDay));
        } else if (rangeVal === "month") {
            let lastDay = new Date(bYear, bMonth, 0).getDate();
            for(let i=1; i<=lastDay; i++) {
                targetDaysArray.push(new Date(bYear, bMonth - 1, i));
            }
        } else {
            let rv = parseInt(rangeVal);
            if (rv < 0) {
                for(let i = Math.abs(rv); i >= 0; i--) {
                    let d = new Date(bYear, bMonth - 1, bDay);
                    d.setDate(d.getDate() - i);
                    targetDaysArray.push(d);
                }
            } else {
                for(let i = 0; i <= rv; i++) {
                    let d = new Date(bYear, bMonth - 1, bDay);
                    d.setDate(d.getDate() + i);
                    targetDaysArray.push(d);
                }
            }
        }
        
        let [hh, mm] = timeVal.split(':');
        let ampm = hh >= 12 ? 'PM' : 'AM';
        let h12 = hh % 12 || 12;
        let timeStrDisplay = `${h12}:${mm} ${ampm}`;
        
        for(let i = 0; i < targetDaysArray.length; i++) {
            let targetDay = targetDaysArray[i];
            let y = targetDay.getFullYear();
            let m = String(targetDay.getMonth() + 1).padStart(2, '0');
            let d = String(targetDay.getDate()).padStart(2, '0');
            
            let str = `${y}-${m}-${d}T${timeVal}:00`;
            let evalTime = new Date(str); 
            
            for(let j=0; j<5; j++) {
                let formatter = new Intl.DateTimeFormat('en-US', {timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
                let parts = formatter.formatToParts(evalTime);
                let p = {}; parts.forEach(x => p[x.type] = x.value);
                let currentLocalStr = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00`;
                let targetStr = `${y}-${m}-${d}T${timeVal}:00`;
                let diff = new Date(currentLocalStr + "Z").getTime() - new Date(targetStr + "Z").getTime();
                if (diff === 0) break;
                evalTime = new Date(evalTime.getTime() - diff);
            }
            
            let s = getSwaraState(evalTime, effLoc.lat, effLoc.lon, tz, swaraEngine);
            let isPurna = (s.tattva.s === "Purna");
            let passStatus = (exactStatusFilter === 'all' || isPurna);
            
            if (passStatus) {
                let yamamElement = s.yaamam.split(':')[1].split('(')[0].trim(); 
                
                let currentType = s.isIda ? 'ida' : 'pingala';
                let passNadi = (exactNadiFilter === 'all' || exactNadiFilter === currentType);
                let passTattva = (exactTattvaFilter === 'all' || exactTattvaFilter.toLowerCase() === s.tattva.n.toLowerCase());
                let passYaamam = (exactYaamamFilter === 'all' || yamamElement.includes(exactYaamamFilter));
                let passHora = (exactHoraFilter === 'all' || s.hora.toLowerCase() === exactHoraFilter.toLowerCase());

                if (passNadi && passTattva && passYaamam && passHora) {
                    let isYamamMatch = yamamElement.includes(s.tattva.n); 
                    let nadiMatchesDay = (s.isIda === s.ruleIsIda); 
                    let pMatch = s.isIda === s.isShukla; 
                    let aMatch = s.isIda === s.ayanaIda; 
                    let isSubtleMatch = (s.tattva.n === s.subtleBodyTattva);
                    
                    let score = 1; // Nadi Flow base guarantee
                    let matchedText = ["Nadi Flow"];
                    if(isPurna) { score++; matchedText.unshift("Purna Tattva"); }
                    if(isYamamMatch) { score++; matchedText.push("Yaamam"); }
                    if(nadiMatchesDay) { score++; matchedText.push("Vaara"); }
                    if(pMatch) { score++; matchedText.push("Paksha"); }
                    if(aMatch) { score++; matchedText.push("Ayana"); }
                    if(isSubtleMatch) { score++; matchedText.push(`Subtle Body (${s.subtleBodyTattva})`); }
                    
                    let scoreColor = score === 7 ? 'var(--purna)' : (score >= 5 ? 'var(--pingala)' : 'var(--text-main)');
                    let typeClass = s.isIda ? 'ida' : 'pingala';
                    let travelZones = s.travel.clear.join(', ') || 'None';
                    let dateStr = evalTime.toLocaleDateString('en-US', {timeZone: tz, weekday:'short', month:'short', day:'numeric', year:'numeric'});
                    let statusTag = isPurna ? '' : ' <span style="color:var(--sunya); font-size:0.8rem;">(Sunya)</span>';
                    
                    html += `<div class="scan-match-card ${typeClass}" style="margin-bottom: 10px;">
                        <div style="display:flex; justify-content:space-between;">
                            <strong style="color:var(--text-main)">${dateStr} @ ${timeStrDisplay}</strong>
                            <strong style="color:${scoreColor};">${score}/7 Resonance</strong>
                        </div>
                        <div style="font-size:0.9rem; margin-top:4px;"><strong>${s.isIda?'Ida':'Pingala'}</strong> + <strong>${s.tattva.n} ${s.tattva.i}</strong> (Y: ${s.yaamam.split('(')[0].trim()} | H: ${s.hora})${statusTag}</div>
                        <div style="font-size:0.8rem; color:var(--text-main); margin-top:4px;">
                            <strong>Matched:</strong> ${matchedText.join(', ')}
                        </div>
                        <div style="font-size:0.8rem; color:var(--purna); margin-top:4px;"><strong>Safe Travel:</strong> ${travelZones}</div>
                    </div>`;
                    matchCount++;
                }
            }
        }
        
        if(matchCount === 0) {
            html = `<p style="color:var(--sunya);">No alignments found matching active filters for ${timeStrDisplay} in ${effLoc.name}.</p>`;
        }
        document.getElementById('exactScanResults').innerHTML = `<h4 style="color:var(--purna); margin-top:0;">Found ${matchCount} Matches (${effLoc.name})</h4>` + html;
        
    }, 50);
});

document.getElementById('btnDailyScan').addEventListener('click', () => {
    let dStr = document.getElementById('dailyDate').value;
    let tgt = new Date(dStr + "T12:00:00");
    let b = getBoundingSunEvents(tgt, loc.lat, loc.lon, loc.tz);
    
    let html = "";
    let nowMs = new Date().getTime();
    let groupOpenIdx = -1;
    let nadiIdx = 0;
    
    let currEvalTime = new Date(b.todayRise.getTime() + 1000);
    
    for(let i=0; i<120; i++) {
        let s = getSwaraState(currEvalTime, loc.lat, loc.lon, loc.tz, swaraEngine);
        
        if (i % 5 === 0) {
            if (i !== 0) html += `</tbody></table></div></div></div>`;
            
            let isCurrentGroup = (nowMs >= s.nStart.getTime() && nowMs < s.nEnd.getTime());
            if (isCurrentGroup) groupOpenIdx = nadiIdx;
            
            let nTitle = s.isIda ? "🌙 Ida (Left)" : "☀️ Pingala (Right)";
            let nClass = s.isIda ? "ida" : "pingala";
            
            html += `
            <div class="nadi-group" id="nadi-group-${nadiIdx}">
                <div class="nadi-header ${nClass}" onclick="toggleNadiGroup(${nadiIdx})">
                    <span>${fT(s.nStart)} - ${fT(s.nEnd)} | ${nTitle}</span>
                    <span id="nadi-icon-${nadiIdx}">${isCurrentGroup ? '▼' : '▶'}</span>
                </div>
                <div class="tattva-rows" id="nadi-rows-${nadiIdx}" style="display: ${isCurrentGroup ? 'block' : 'none'};">
                    <div class="table-wrapper">
                        <table class="daily-table">
                            <thead><tr><th>Time</th><th>Tattva</th><th>Yaamam / Hora</th><th>Clearance</th><th>Score</th></tr></thead>
                            <tbody>
            `;
            nadiIdx++;
        }
        
        let isPurna = (s.tattva.s === "Purna"); 
        let yamamElement = s.yaamam.split(':')[1].split('(')[0].trim(); 
        let isYamamMatch = yamamElement.includes(s.tattva.n); 
        let nadiMatchesDay = (s.isIda === s.ruleIsIda); 
        let pMatch = s.isIda === s.isShukla; 
        let aMatch = s.isIda === s.ayanaIda; 
        let isSubtleMatch = (s.tattva.n === s.subtleBodyTattva);
        
        let score = 0;
        if(isPurna) score++;
        score++;
        if(isYamamMatch) score++;
        if(nadiMatchesDay) score++;
        if(pMatch) score++;
        if(aMatch) score++;
        if(isSubtleMatch) score++;
        
        let scoreColor = score === 7 ? 'var(--purna)' : (score >= 5 ? 'var(--pingala)' : 'var(--text-muted)');
        let isCurrentRow = (nowMs >= s.tStart.getTime() && nowMs < s.tEnd.getTime());
        let rowClass = isCurrentRow ? "active-tattva-row" : "";
        let travelClearStr = s.travel.clear.join(', ') || 'None';
        
        html += `<tr class="${rowClass}" data-start="${s.tStart.getTime()}" data-end="${s.tEnd.getTime()}">
            <td style="white-space:nowrap;">${fT(s.tStart)} - ${fT(s.tEnd)}</td>
            <td><strong>${s.tattva.n} ${s.tattva.i}</strong></td>
            <td>
                <div style="white-space:nowrap; margin-bottom:2px;">Y: ${s.yaamam.split('(')[0].trim()}</div>
                <div style="white-space:nowrap; font-size:0.8rem; color:var(--text-muted);">Hora: <strong style="color:var(--text-main);">${s.hora}</strong></div>
            </td>
            <td style="color:var(--purna); font-weight:bold;">${travelClearStr}</td>
            <td><strong style="color:${scoreColor};">${score}/7</strong></td>
        </tr>`;
        
        currEvalTime = new Date(s.tEnd.getTime() + 1000);
    }
    html += `</tbody></table></div></div></div>`;
    
    document.getElementById('dailyFlowContainer').innerHTML = html;
    
    if (groupOpenIdx !== -1) {
        setTimeout(() => {
            let el = document.getElementById(`nadi-group-${groupOpenIdx}`);
            if(el) el.scrollIntoView({behavior: "smooth", block: "center"});
        }, 300);
    }
});

window.toggleNadiGroup = function(idx) {
    let rows = document.getElementById(`nadi-rows-${idx}`);
    let icon = document.getElementById(`nadi-icon-${idx}`);
    if(rows.style.display === "none") {
        rows.style.display = "block";
        icon.innerText = "▼";
    } else {
        rows.style.display = "none";
        icon.innerText = "▶";
    }
}

document.getElementById('btnAlmanacScan').addEventListener('click', () => {
    let dStr = document.getElementById('almanacDate').value;
    let tgt = new Date(dStr + "T12:00:00");
    let b = getBoundingSunEvents(tgt, loc.lat, loc.lon, loc.tz);
    
    let res = document.getElementById('almanacResults');
    let opts = {timeZone: loc.tz, hour:'2-digit', minute:'2-digit', second:'2-digit'};
    
    let shiftedTgt = shiftToTz(tgt, loc.tz);
    
    res.innerHTML = `
        <div style="background:var(--bg-main); padding:15px; border-radius:8px; border:1px solid var(--border);">
            <h4 style="margin-top:0; color:var(--ida);">${shiftedTgt.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})}</h4>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <strong>Sunrise:</strong> <span style="color:var(--purna);">${b.todayRise.toLocaleTimeString('en-US', opts)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <strong>Sunset:</strong> <span style="color:var(--pingala);">${b.todaySet.toLocaleTimeString('en-US', opts)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:15px; border-top:1px solid var(--border);">
                <strong>Next Sunrise:</strong> <span>${b.nextRise.toLocaleTimeString('en-US', opts)}</span>
            </div>
        </div>
    `;
});

const clList = document.getElementById('changelogList');
CHANGELOG.forEach(cl => {
    let liHTML = cl.changes.map(c => `<li>${c}</li>`).join('');
    clList.innerHTML += `
        <div class="cl-item">
            <div class="cl-version">Version ${cl.v}</div>
            <div class="cl-date">${cl.date}</div>
            <ul class="cl-list">${liHTML}</ul>
        </div>
    `;
});

fetch('jackpot_data.json').then(r=>r.json()).then(d=>{ df = d; filterAndRender(); }).catch(e=>{});
['gameFilter','ayanaFilter','pakshaFilter','tithiFilter'].forEach(id => {
    document.getElementById(id).addEventListener('change', filterAndRender);
});

function filterAndRender() {
    let gF = document.getElementById('gameFilter').value;
    let aF = document.getElementById('ayanaFilter').value;
    let pF = document.getElementById('pakshaFilter').value;
    let tF = document.getElementById('tithiFilter').value;

    let tbdy = document.getElementById('tableBody');
    tbdy.innerHTML = "";
    
    let total = 0, pb = 0, mm = 0;
    let shuklaCount = 0, krishnaCount = 0;
    let tCounts = new Array(30).fill(0);

    df.forEach(r => {
        let a = getAstro(new Date(`${r.date}T22:59:00Z`));
        let tithi = Math.floor(a.diff/12)+1;
        let isShukla = tithi <= 15;
        let nIdx = isShukla ? tithi : tithi - 15;
        let name = (nIdx===15 && !isShukla) ? "Amavasya" : (nIdx===15 && isShukla) ? "Purnima" : TithiNames[nIdx-1];
        let fullTithi = (isShukla ? "Shukla " : "Krishna ") + name;
        if(name==="Purnima" || name==="Amavasya") fullTithi = name;
        let ayana = (a.sunSidereal >= 270 || a.sunSidereal < 90) ? "Uttarayana (North)" : "Dakshinayana (South)";

        let matchG = (gF === "All" || r.Game === gF);
        let matchA = (aF === "All" || ayana === aF);
        let matchP = (pF === "Combined" || (pF === "Shukla" && isShukla) || (pF === "Krishna" && !isShukla));
        let matchT = (tF === "All" || name === tF || (tF==="Purnima" && name==="Purnima") || (tF==="Amavasya" && name==="Amavasya"));

        if(matchG && matchA && matchP && matchT) {
            total++;
            if(r.Game === "Powerball") pb++;
            if(r.Game === "Mega Millions") mm++;
            if(isShukla) shuklaCount++; else krishnaCount++;
            
            let tIndex = allTithiLabels.indexOf(fullTithi);
            if(tIndex !== -1) tCounts[tIndex]++;

            tbdy.innerHTML += `<tr><td>${r.date}</td><td><strong>${r.Game}</strong></td><td style="color:var(--purna); font-weight:bold;">${r.amount}</td><td>${r.state}</td><td><strong>${fullTithi}</strong></td><td>${ayana.split(' ')[0]}</td></tr>`;
        }
    });
    document.getElementById('countTotal').innerText = total;
    document.getElementById('countPB').innerText = pb;
    document.getElementById('countMM').innerText = mm;
    renderCharts(tCounts, shuklaCount, krishnaCount, pF);
}

function renderCharts(tData, sC, kC, pF) {
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
    Chart.defaults.font.family = '-apple-system, sans-serif';

    if(barChart) barChart.destroy();
    let ctxBar = document.getElementById('tithiBarChart').getContext('2d');
    
    let labels = [], data = [], bg = [];
    if(pF === "Combined") { labels = allTithiLabels; data = tData; bg = allTithiLabels.map((_,i) => i<15 ? '#f6ad55' : '#9f7aea'); }
    else if(pF === "Shukla") { labels = allTithiLabels.slice(0,15); data = tData.slice(0,15); bg = Array(15).fill('#f6ad55'); }
    else if(pF === "Krishna") { labels = allTithiLabels.slice(15,30); data = tData.slice(15,30); bg = Array(15).fill('#9f7aea'); }

    barChart = new Chart(ctxBar, { type: 'bar', data: { labels: labels, datasets: [{ data: data, backgroundColor: bg, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } } } } });

    if(pieChart) pieChart.destroy();
    let ctxPie = document.getElementById('pakshaPieChart').getContext('2d');
    pieChart = new Chart(ctxPie, { type: 'doughnut', data: { labels: ['Shukla Paksha', 'Krishna Paksha'], datasets: [{ data: [sC, kC], backgroundColor: ['#f6ad55', '#9f7aea'], borderWidth: 2, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}