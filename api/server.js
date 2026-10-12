const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');

const app = express();
app.use(cors());

swisseph.swe_set_ephe_path('/home/pawan/lottery-swara/ephe');

let cache = { dateKey: null, data: null };

function getSamagraAyanamsa(jd) {
    let T = (jd - 2451545.0) / 36525.0; 
    return 23.840018 + (1.395521 * T) + (0.000317 * T * T);
}

const getAstroData = (tMs) => new Promise((resolve) => {
    const jd = tMs / 86400000.0 + 2440587.5;
    swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH, (sun) => {
        swisseph.swe_calc_ut(jd, swisseph.SE_MOON, swisseph.SEFLG_SWIEPH, (moon) => {
            let d = (moon.longitude - sun.longitude) % 360;
            if (d < 0) d += 360;
            const ayanamsa = getSamagraAyanamsa(jd);
            const sunSid = (sun.longitude - ayanamsa + 360) % 360;
            const moonSid = (moon.longitude - ayanamsa + 360) % 360;
            resolve({ diff: d, sunLong: sun.longitude, sunSid, moonSid, ayanamsa });
        });
    });
});

async function findMoonBoundary(startTime, targetAngle) {
    let low = startTime;
    let high = startTime + (3 * 86400000); 
    for (let i = 0; i < 18; i++) {
        let mid = (low + high) / 2;
        let c = await getAstroData(mid);
        let err = (targetAngle - c.moonSid) % 360;
        if (err < -180) err += 360;
        if (err > 180) err -= 360;
        if (err > 0) low = mid;
        else high = mid;
    }
    return Math.round((low + high) / 2);
}

app.get('/api/astro', async (req, res) => {
    try {
        const timeParam = req.query.time ? parseInt(req.query.time) : Date.now();
        const date = new Date(timeParam);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        
        if (cache.dateKey === dateKey && cache.data) {
            return res.json(cache.data); 
        }

        const cur = await getAstroData(date.getTime());
        const tithi = Math.floor(cur.diff / 12) + 1;
        const targetAngle = tithi * 12;
        let tLow = date.getTime();
        let tHigh = tLow + 86400000; 
        
        let guessTime = tLow;
        for (let i = 0; i < 15; i++) {
            guessTime = (tLow + tHigh) / 2;
            let midVal = (await getAstroData(guessTime)).diff;
            let effectiveMid = midVal;
            if (targetAngle === 360 && midVal < 180) effectiveMid += 360;
            if (effectiveMid < targetAngle) tLow = guessTime;
            else tHigh = guessTime;
        }

        const ayana = (cur.sunSid >= 270 || cur.sunSid < 90) ? "Uttarayana" : "Dakshinayana";

        const nextNakAngle = (Math.floor(cur.moonSid / 13.333333) + 1) * 13.333333 % 360;
        const nakEndMs = await findMoonBoundary(date.getTime(), nextNakAngle);

        const nextRashiAngle = (Math.floor(cur.moonSid / 30) + 1) * 30 % 360;
        const rashiEndMs = await findMoonBoundary(date.getTime(), nextRashiAngle);

        const targetSankranti = (Math.floor(cur.sunSid / 30) * 30 + 30) % 360;
        let sLow = date.getTime();
        let sHigh = sLow + (32 * 86400000);
        for (let i = 0; i < 20; i++) {
            let mid = (sLow + sHigh) / 2;
            let c = await getAstroData(mid);
            let err = (targetSankranti - c.sunSid) % 360;
            if (err < -180) err += 360;
            if (err > 180) err -= 360;
            if (err > 0) sLow = mid;
            else sHigh = mid;
        }

        const responsePayload = {
            status: "success",
            julian_date: date.getTime() / 86400000.0 + 2440587.5,
            tithi_index: tithi,
            tithi_end_ms: Math.round(guessTime),
            nakshatra_end_ms: nakEndMs,
            rashi_end_ms: rashiEndMs,
            ayana: ayana,
            sun_sidereal: cur.sunSid,
            moon_sidereal: cur.moonSid,
            sankranti_ms: Math.round((sLow + sHigh) / 2)
        };

        cache.dateKey = dateKey;
        cache.data = responsePayload;
        res.json(responsePayload);
    } catch(err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log("Swara API backend listening on port 3000");
});