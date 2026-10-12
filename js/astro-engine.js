const JD = d => (d.getTime() / 86400000.0) + 2440587.5;

function getSamagraAyanamsa(jd) {
    let T = (jd - 2451545.0) / 36525.0; 
    return 23.840018 + (1.395521 * T) + (0.000317 * T * T);
}

function shiftToTz(date, tz) {
    if (!tz) return date;
    try { return new Date(date.toLocaleString('en-US', { timeZone: tz })); } 
    catch(e) { return date; }
}

function getAstro(d) {
    let jde = JD(d) + (69.2 / 86400.0);
    let T = (jde - 2451545.0) / 36525.0; 
    
    let omega = 125.04452 - 1934.136261 * T;
    let dPsi = -0.00478 * Math.sin(omega * Math.PI/180);

    let L0 = (280.46646 + 36000.76983 * T) % 360;
    let M = (357.52911 + 35999.05029 * T) * Math.PI/180;
    let sunTrue = (L0 + (1.914602 - 0.004817*T)*Math.sin(M) + 0.019993*Math.sin(2*M)) % 360;
    let sunApp = sunTrue + dPsi; 
    if(sunApp < 0) sunApp += 360;

    let L_m = (218.3164477 + 481267.88123421 * T) % 360;
    let D = (297.8501921 + 445267.1114034 * T) * Math.PI/180;
    let M_sun = M;
    let M_moon = (134.9633964 + 477198.8675055 * T) * Math.PI/180;
    let F = (93.2720950 + 483202.0175233 * T) * Math.PI/180;

    const moon_args = [
        [0,0,1,0, 6288774], [2,0,-1,0, 1274027], [2,0,0,0, 658314], [0,0,2,0, 213618], 
        [0,1,0,0, -185116], [0,0,0,2, -114332], [2,0,-2,0, 58793], [2,-1,-1,0, 57066], 
        [2,0,1,0, 53322], [2,-1,0,0, 45758], [0,1,-1,0, -40923], [1,0,0,0, -34720], 
        [0,1,1,0, -30383], [2,0,0,-2, 15327], [0,0,1,2, -12528], [0,0,1,-2, 9224], 
        [1,0,0,1, 8929], [2,0,-1,2, 8827], [2,0,-2,-2, 7311], [1,0,0,-1, 7155], 
        [2,0,1,-2, 7003], [0,0,3,0, 6847], [2,1,-1,0, 6766], [2,1,0,0, 5634], 
        [0,-1,1,0, 4174], [2,-2,0,0, 3958], [0,0,2,-2, 3258], [2,0,-3,0, 3165], 
        [2,0,-1,-2, 2616], [0,-1,0,2, -2589], [2,-1,1,0, 2354], [2,-2,-1,0, -2258], 
        [0,2,0,0, -2125], [2,0,2,0, -2117], [0,1,-2,0, 2065], [2,0,0,2, -2059], 
        [0,-1,2,0, 1922], [2,-1,-2,0, -1815], [0,0,2,2, -1701], [1,0,1,0, -1640], 
        [2,1,1,0, 1585], [1,0,-1,0, -1525], [2,-1,0,-2, -1455], [2,0,-2,2, 1406], 
        [0,2,-1,0, -1270], [0,0,0,4, -1249], [2,0,3,0, -1227], [2,1,-2,0, 1184], 
        [2,-1,-1,-2, -1141], [0,1,0,2, -1100], [2,-2,1,0, 1076], [2,0,-1,1, -1045], 
        [0,2,1,0, 1042], [2,0,1,1, 1032], [2,1,0,-2, 1009], [2,-2,0,-2, 989], 
        [2,-1,0,2, -988], [2,0,0,-4, 981], [0,0,1,4, -978], [2,-1,-2,-2, 951]
    ];

    let ptb_sum = 0;
    for(let i=0; i<moon_args.length; i++) {
        let a = moon_args[i];
        let arg = a[0]*D + a[1]*M_sun + a[2]*M_moon + a[3]*F;
        ptb_sum += a[4] * Math.sin(arg);
    }
    
    let moon_ptb = ptb_sum / 1000000.0;
    let moonTrue = (L_m + moon_ptb) % 360;
    let moonApp = moonTrue + dPsi; 
    if(moonApp < 0) moonApp += 360;

    let ayanamsa = getSamagraAyanamsa(JD(d));
    let siderealSun = (sunApp - ayanamsa + 360) % 360;
    let siderealMoon = (moonApp - ayanamsa + 360) % 360;
    let diff = (siderealMoon - siderealSun + 360) % 360;

    return { sunTropical: sunApp, sunSidereal: siderealSun, moonSidereal: siderealMoon, diff: diff, ayanamsa: ayanamsa };
}

function getGeometricSunTimesForDate(date, lat, lon, tz) {
    let tzDate = shiftToTz(date, tz);
    let utcMidnight = new Date(Date.UTC(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate(), 0, 0, 0));
    let jd_midnight = (utcMidnight.getTime() / 86400000.0) + 2440587.5;

    function sunParams(jd) {
        let jc = (jd - 2451545.0) / 36525.0;
        let L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
        let M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
        let e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);

        let C = Math.sin(M * Math.PI/180) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + 
                Math.sin(2 * M * Math.PI/180) * (0.019993 - 0.000101 * jc) + 
                Math.sin(3 * M * Math.PI/180) * 0.000289;

        let sunTrueLong = L0 + C;
        let omega = 125.04 - 1934.136 * jc;
        let sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI/180);

        let epsilon0 = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
        let epsilon = epsilon0 + 0.00256 * Math.cos(omega * Math.PI/180);

        let dec = Math.asin(Math.sin(epsilon * Math.PI/180) * Math.sin(sunAppLong * Math.PI/180)) * 180/Math.PI;
        let y = Math.pow(Math.tan(epsilon / 2 * Math.PI/180), 2);

        let eqTime = 4 * (y * Math.sin(2 * L0 * Math.PI/180) - 
                     2 * e * Math.sin(M * Math.PI/180) + 
                     4 * e * y * Math.sin(M * Math.PI/180) * Math.cos(2 * L0 * Math.PI/180) - 
                     0.5 * y * y * Math.sin(4 * L0 * Math.PI/180) - 
                     1.25 * e * e * Math.sin(2 * M * Math.PI/180)) * 180/Math.PI;
        
        return { eqTime, dec };
    }

    let initial = sunParams(jd_midnight);
    let cosHA = (Math.sin(0) - Math.sin(lat * Math.PI/180) * Math.sin(initial.dec * Math.PI/180)) / (Math.cos(lat * Math.PI/180) * Math.cos(initial.dec * Math.PI/180));
    cosHA = Math.max(-1, Math.min(1, cosHA));
    let HA = Math.acos(cosHA) * 180/Math.PI;
    let solarNoonGMT = 720 - (lon * 4) - initial.eqTime;
    
    let riseMin = solarNoonGMT - (HA * 4);
    let setMin = solarNoonGMT + (HA * 4);

    for(let i=0; i<3; i++) {
        let jd_rise = jd_midnight + (riseMin / 1440.0);
        let p = sunParams(jd_rise);
        let cHA = (Math.sin(0) - Math.sin(lat * Math.PI/180) * Math.sin(p.dec * Math.PI/180)) / (Math.cos(lat * Math.PI/180) * Math.cos(p.dec * Math.PI/180));
        cHA = Math.max(-1, Math.min(1, cHA));
        riseMin = (720 - (lon * 4) - p.eqTime) - (Math.acos(cHA) * 180/Math.PI * 4);
    }

    for(let i=0; i<3; i++) {
        let jd_set = jd_midnight + (setMin / 1440.0);
        let p = sunParams(jd_set);
        let cHA = (Math.sin(0) - Math.sin(lat * Math.PI/180) * Math.sin(p.dec * Math.PI/180)) / (Math.cos(lat * Math.PI/180) * Math.cos(p.dec * Math.PI/180));
        cHA = Math.max(-1, Math.min(1, cHA));
        setMin = (720 - (lon * 4) - p.eqTime) + (Math.acos(cHA) * 180/Math.PI * 4);
    }

    let rise = new Date(utcMidnight.getTime() + riseMin * 60000);
    let set = new Date(utcMidnight.getTime() + setMin * 60000);

    return { rise, set };
}

function getBoundingSunEvents(time, lat, lon, tz) {
    let tTime = time.getTime();
    let yesterday = new Date(tTime - 86400000);
    let today = new Date(tTime);
    let tomorrow = new Date(tTime + 86400000);
    
    let yGeo = getGeometricSunTimesForDate(yesterday, lat, lon, tz);
    let tGeo = getGeometricSunTimesForDate(today, lat, lon, tz);
    let tmGeo = getGeometricSunTimesForDate(tomorrow, lat, lon, tz);
    
    let events = [
        {type: 'rise', time: yGeo.rise}, {type: 'set', time: yGeo.set},
        {type: 'rise', time: tGeo.rise}, {type: 'set', time: tGeo.set},
        {type: 'rise', time: tmGeo.rise}, {type: 'set', time: tmGeo.set}
    ];
    
    events.sort((a,b) => a.time - b.time);
    
    let startEvent = events[0], endEvent = events[1];
    let isDay = false;
    let nextRise = null;
    let prevSet = null;
    let todayRise = tGeo.rise, todaySet = tGeo.set, tmRise = tmGeo.rise;

    for (let i = 0; i < events.length - 1; i++) {
        if (time >= events[i].time && time < events[i+1].time) {
            startEvent = events[i];
            endEvent = events[i+1];
            isDay = (startEvent.type === 'rise');
            break;
        }
    }
    
    for (let i = 0; i < events.length; i++) {
        if(events[i].time > time && events[i].type === 'rise' && !nextRise) nextRise = events[i].time;
        if(events[i].time <= time && events[i].type === 'set') prevSet = events[i].time;
    }

    return { start: startEvent.time, end: endEvent.time, isDay, nextRise, prevSet, todayRise, todaySet, tmRise };
}

function findExactEndTime(startDate, targetAngle, angleFunc, approxDegPerHour) {
    let guessTime = startDate.getTime();
    let currentAngle = angleFunc(startDate);
    let angleDiff = (targetAngle - currentAngle) % 360;
    if (angleDiff <= 0) angleDiff += 360;
    guessTime += (angleDiff / approxDegPerHour) * 3600000;

    for (let i = 0; i < 5; i++) {
        let newAngle = angleFunc(new Date(guessTime));
        let err = (targetAngle - newAngle) % 360;
        if (err < -180) err += 360;
        if (err > 180) err -= 360;
        if (Math.abs(err) < 0.001) break;
        guessTime += (err / approxDegPerHour) * 3600000;
    }
    return new Date(guessTime);
}

const TithiNames = ["Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima", "Amavasya"];
const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushyami", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshta", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
const RASHIS = ["Mesham (Aries)", "Vrishabham (Taurus)", "Midhunam (Gemini)", "Karkataka (Cancer)", "Simham (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischikam (Scorpio)", "Dhanusu (Sagittarius)", "Makaram (Capricorn)", "Kumbha (Aquarius)", "Meenam (Pisces)"];
const SOLAR_MONTHS = ["Mesha", "Vrishabha", "Mithuna", "Karkataka", "Simha", "Kanya", "Tula", "Vrischikam", "Dhanusu", "Makaram", "Kumbha", "Meenam"];
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const TATTVA_CHINTAMANI_IDA = [
    {n:"Earth", i:"🌍", r:"Mercury", s:"Purna", sub:"Full Result", p:"East", f:"West"},
    {n:"Water", i:"💧", r:"Moon", s:"Purna", sub:"Full Result", p:"West", f:"East"},
    {n:"Agni", i:"🔥", r:"Venus", s:"Sunya", sub:"Negative Result", p:"South", f:"North"},
    {n:"Vayu", i:"💨", r:"Jupiter", s:"Sunya", sub:"Negative Result", p:"North", f:"South"},
    {n:"Akasha", i:"🌌", r:"Ketu", s:"Sunya", sub:"Negative Result", p:"Top", f:"Upwards"}
];

const TATTVA_SWARODAYA_IDA = [
    {n:"Vayu", i:"💨", r:"Jupiter", s:"Sunya", sub:"Negative Result", p:"North", f:"South"},
    {n:"Agni", i:"🔥", r:"Venus", s:"Sunya", sub:"Negative Result", p:"South", f:"North"},
    {n:"Earth", i:"🌍", r:"Mercury", s:"Purna", sub:"Full Result", p:"East", f:"West"},
    {n:"Water", i:"💧", r:"Moon", s:"Purna", sub:"Full Result", p:"West", f:"East"},
    {n:"Akasha", i:"🌌", r:"Ketu", s:"Sunya", sub:"Negative Result", p:"Top", f:"Upwards"}
];

const TATTVA_PINGALA_UNIVERSAL = [
    {n:"Vayu", i:"💨", r:"Rahu", s:"Purna", sub:"Full Result", p:"North", f:"South"},
    {n:"Agni", i:"🔥", r:"Mars", s:"Purna", sub:"Full Result", p:"South", f:"North"},
    {n:"Earth", i:"🌍", r:"Sun", s:"Sunya", sub:"Negative Result", p:"East", f:"West"},
    {n:"Water", i:"💧", r:"Saturn", s:"Sunya", sub:"Negative Result", p:"West", f:"East"},
    {n:"Akasha", i:"🌌", r:"Ketu", s:"Purna", sub:"Full Result", p:"Top", f:"Upwards"}
];

function getTattvaSequence(isIda, mode) {
    if (!isIda) return TATTVA_PINGALA_UNIVERSAL;
    if (mode === 'swarodaya') return TATTVA_SWARODAYA_IDA; 
    return TATTVA_CHINTAMANI_IDA; 
}

function getSwaraState(time, lat, lon, tz, mode = 'chintamani') {
    let b = getBoundingSunEvents(time, lat, lon, tz);
    let msSinceStart = time.getTime() - b.start.getTime();
    let totalMs = b.end.getTime() - b.start.getTime();
    
    let nadiDurationMs = totalMs / 12;
    let tattvaDurationMs = nadiDurationMs / 5;
    let yaamamDurationMs = totalMs / 4;

    let nIdx = Math.floor(msSinceStart / nadiDurationMs); 
    let tIdx = Math.floor((msSinceStart % nadiDurationMs) / tattvaDurationMs); 
    let yIdx = Math.floor(msSinceStart / yaamamDurationMs); 

    let activeSunrise = b.isDay ? b.start : (b.prevSet ? new Date(b.start.getTime() - (b.start.getTime() - b.prevSet.getTime())) : b.start); 
    if(!b.isDay) {
        let tempGeo = getGeometricSunTimesForDate(new Date(time.getTime() - 43200000), lat, lon, tz);
        activeSunrise = tempGeo.rise;
    }

    let astroAtRise = getAstro(activeSunrise);
    let tithi = Math.floor(astroAtRise.diff / 12) + 1;
    let isShukla = tithi <= 15;
    let adjTithi = isShukla ? tithi : tithi - 15;

    let subtleBodyTattva = "";
    if ([1, 2, 3, 14, 15].includes(adjTithi)) subtleBodyTattva = "Earth";
    else if ([4, 5, 6, 7].includes(adjTithi)) subtleBodyTattva = "Water";
    else if (adjTithi === 8) subtleBodyTattva = "Akasha";
    else if ([9, 10].includes(adjTithi)) subtleBodyTattva = "Vayu";
    else if ([11, 12, 13].includes(adjTithi)) subtleBodyTattva = "Agni";

    let idaStarts = isShukla ? [1,2,3,7,8,9,13,14,15].includes(adjTithi) : [4,5,6,10,11,12].includes(adjTithi);
    
    let absNIdx = b.isDay ? nIdx : nIdx + 6;
    let currentIsIda = idaStarts ? (absNIdx % 2 === 0) : (absNIdx % 2 !== 0);
    
    let nadiStartMs = b.start.getTime() + (nIdx * nadiDurationMs);
    let nadiEndMs = nadiStartMs + nadiDurationMs;
    let remNadiSecs = (nadiEndMs - time.getTime()) / 1000;

    let activeTattvaSeq = getTattvaSequence(currentIsIda, mode);
    let activeTattva = activeTattvaSeq[tIdx];

    let tattvaStartMs = nadiStartMs + (tIdx * tattvaDurationMs);
    let tattvaEndMs = tattvaStartMs + tattvaDurationMs;
    let remTattvaSecs = (tattvaEndMs - time.getTime()) / 1000;

    let yaamams = ["1st: Earth", "2nd: Water", "3rd: Agni", "4th: Vayu & Akasha"];
    let yType = b.isDay ? "Day" : "Night";

    let yStartMs = b.start.getTime() + (yIdx * yaamamDurationMs);
    let yEndMs = yStartMs + yaamamDurationMs;
    let remYaamamSecs = (yEndMs - time.getTime()) / 1000;

    let nextYIdx = (yIdx + 1) % 4;
    let nextYType = yIdx === 3 ? (b.isDay ? "Night" : "Day") : yType;
    let nextYaamam = `${yaamams[nextYIdx]} (${nextYType})`;

    let tzActiveRise = shiftToTz(activeSunrise, tz);
    let day = tzActiveRise.getDay(); 
    
    let dayRule = "", ruleIsIda = false;
    
    if (mode === 'swarodaya') {
        const idaDays = [1, 3, 4, 5]; 
        ruleIsIda = idaDays.includes(day);
        dayRule = ruleIsIda ? "Ida Dominant (Mon, Wed, Thu, Fri)" : "Pingala Dominant (Sun, Tue, Sat)";
    } else {
        if([1,3,5].includes(day)) { dayRule = "Ida Dominant (Mon, Wed, Fri)"; ruleIsIda = true; }
        else if([0,2,4].includes(day)) { dayRule = "Pingala Dominant (Sun, Tue, Thu)"; ruleIsIda = false; }
        else { 
            ruleIsIda = !b.isDay; 
            dayRule = b.isDay ? "Pingala Dominant (Sat Day)" : "Ida Dominant (Sat Night)"; 
        }
    }

    let currentAstro = getAstro(time);
    let ayanaIda = (currentAstro.sunSidereal >= 270 || currentAstro.sunSidereal < 90);
    
    let nakshatraIdx = Math.floor(currentAstro.moonSidereal / 13.333333);
    let rashiIdx = Math.floor(currentAstro.moonSidereal / 30);
    let solarMonthIdx = Math.floor(currentAstro.sunSidereal / 30);

    let blocked = new Set();
    let soolaLayers = [];
    
    let nBlocked = currentIsIda ? ["E", "N"] : ["S", "W"];
    nBlocked.forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Nadi Soola",
        rule: currentIsIda ? "Ida (Chandra)" : "Pingala (Surya)",
        blocked: nBlocked,
        type: "nadi"
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const vaaraSoolaPrimary = [["W"], ["E"], ["N"], ["N"], ["S"], ["W"], ["E"]];
    const vaaraSoolaLeft = [["N"], ["S"], ["E"], ["E"], ["W"], ["N"], ["S"]];
    const vaaraSoola = vaaraSoolaPrimary.map((p, i) => [p[0], vaaraSoolaLeft[i][0]]);
    
    vaaraSoola[day].forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Vaara Soola",
        rule: dayNames[day],
        blocked: vaaraSoola[day],
        type: "sunrise"
    });

    const rahuSoola = [["E"], ["S"], ["W"], ["N"], ["E"], ["S"], ["N"]];
    rahuSoola[day].forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Kaala Rahu",
        rule: dayNames[day],
        blocked: rahuSoola[day],
        type: "sunrise"
    });

    const shaniSoola = [["E"], ["SE"], ["S"], ["SW"], ["W"], ["NW"], ["N"]];
    shaniSoola[day].forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Shani Soola",
        rule: dayNames[day],
        blocked: shaniSoola[day],
        type: "sunrise"
    });

    const thidhiSoola = {
        1: ["E"], 2: ["S"], 3: ["SE"], 4: ["SW"], 5: ["S"], 6: ["W"], 7: ["NW"], 8: ["NE"], 9: ["E"], 10: ["S"], 11: ["SE"], 12: ["SW"], 13: ["S"], 14: ["W"]
    };
    let evalTithi = Math.floor(currentAstro.diff / 12) + 1;
    let evalAdjTithi = evalTithi <= 15 ? evalTithi : evalTithi - 15;
    let tBlocked = [];
    if (thidhiSoola[evalAdjTithi]) tBlocked = thidhiSoola[evalAdjTithi];
    if (evalAdjTithi === 15) tBlocked = (evalTithi === 15) ? ["NW"] : ["NE"];
    tBlocked.forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Thidhi Soola",
        rule: `${TithiNames[evalAdjTithi - 1] || 'Amavasya'} (${evalTithi <= 15 ? 'Shukla' : 'Krishna'})`,
        blocked: tBlocked,
        type: "tithi"
    });

    const nakSoola = { 17: ["E"], 22: ["E"], 21: ["S"], 0: ["S"], 7: ["W"], 3: ["W"], 12: ["N"], 24: ["N"] };
    let nakBlocked = nakSoola[nakshatraIdx] || [];
    nakBlocked.forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Nakshatra Soola",
        rule: NAKSHATRAS[nakshatraIdx],
        blocked: nakBlocked.length ? nakBlocked : ["None"],
        type: "nakshatra"
    });

    const rashiSoola = { 2: ["E"], 6: ["E"], 10: ["E"], 3: ["S"], 7: ["S"], 11: ["S"], 1: ["N"], 5: ["N"], 9: ["N"], 0: ["W"], 4: ["W"], 8: ["W"] };
    let rashiBlocked = rashiSoola[rashiIdx] || [];
    rashiBlocked.forEach(d => blocked.add(d));
    soolaLayers.push({
        name: "Rashi Soola",
        rule: RASHIS[rashiIdx],
        blocked: rashiBlocked.length ? rashiBlocked : ["None"],
        type: "rashi"
    });

    let clearDirs = DIRS.filter(d => !blocked.has(d));

    let nextTIdx = (tIdx + 1) % 5;
    let nextNIdx = nIdx;
    let nextIsIda = currentIsIda;
    if(tIdx === 4) {
        nextNIdx = nIdx + 1;
        let nextAbsNIdx = b.isDay ? nextNIdx : nextNIdx + 6;
        nextIsIda = idaStarts ? (nextAbsNIdx % 2 === 0) : (nextAbsNIdx % 2 !== 0);
    }
    
    let nextTattvaSeq = getTattvaSequence(nextIsIda, mode);
    let nextTattva = nextTattvaSeq[nextTIdx];

    return { 
        isIda: currentIsIda, tattva: activeTattva, 
        nStart: new Date(nadiStartMs), nEnd: new Date(nadiEndMs), remNadi: remNadiSecs, 
        tStart: new Date(tattvaStartMs), tEnd: new Date(tattvaEndMs), remTattva: remTattvaSecs, 
        yStart: new Date(yStartMs), yEnd: new Date(yEndMs), remYaamam: remYaamamSecs, yaamamTotalMs: yaamamDurationMs, nextYaamam: nextYaamam,
        geomRise: activeSunrise, geomSet: b.todaySet, nextRise: b.nextRise,
        yaamam: `${yaamams[yIdx]} (${yType})`, dayRule, ruleIsIda,
        isShukla: isShukla, ayanaIda: ayanaIda,
        nextTattva: nextTattva,
        subtleBodyTattva: subtleBodyTattva,
        panchang: {
            nakshatra: NAKSHATRAS[nakshatraIdx],
            nextNakshatra: NAKSHATRAS[(nakshatraIdx + 1) % 27],
            rashi: RASHIS[rashiIdx],
            nextRashi: RASHIS[(rashiIdx + 1) % 12],
            solarMonth: SOLAR_MONTHS[solarMonthIdx],
            nextSolarMonth: SOLAR_MONTHS[(solarMonthIdx + 1) % 12]
        },
        travel: {
            blocked: Array.from(blocked),
            clear: clearDirs,
            layers: soolaLayers
        }
    };
}