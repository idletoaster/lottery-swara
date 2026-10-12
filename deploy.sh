#!/bin/bash
mkdir -p css js

cat << 'INNER_EOF' > index.html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Vedic Swara Analytics v1.8.0</title>
    <link rel="manifest" href="manifest.json?v=1.8.0">
    
    <!-- Flatpickr Calendar CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/dark.css">
    
    <link rel="stylesheet" href="css/style.css?v=1.8.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <header class="mobile-header">
        <h1>SwaraHub <span class="version-tag">v1.8.0</span></h1>
        <button id="themeToggleMobile" class="btn-icon">🌓</button>
    </header>

    <div class="app-layout">
        <nav class="sidebar">
            <div class="sidebar-brand">
                <div class="brand-title">
                    <h1>SwaraHub</h1>
                    <span class="version-tag">v1.8.0</span>
                </div>
                <button id="themeToggleDesktop" class="btn-icon">🌓</button>
            </div>
            
            <div class="nav-menu">
                <button class="nav-item active" data-target="clock">
                    <span class="nav-icon">⏱️</span>
                    <span class="nav-text">Live Swara</span>
                </button>
                <button class="nav-item" data-target="calendar">
                    <span class="nav-icon">🎯</span>
                    <span class="nav-text">Alignments</span>
                </button>
                <button class="nav-item" data-target="almanac">
                    <span class="nav-icon">🔥</span>
                    <span class="nav-text">Agnihotra</span>
                </button>
                <button class="nav-item" data-target="analytics">
                    <span class="nav-icon">📊</span>
                    <span class="nav-text">Lottery DB</span>
                </button>
                <button class="nav-item" data-target="changelog">
                    <span class="nav-icon">📜</span>
                    <span class="nav-text">Updates</span>
                </button>
            </div>
        </nav>

        <main class="main-area">
            <div class="content-wrapper">
                
                <div class="location-module card">
                    <div class="loc-header">
                        <strong>Location:</strong> <span id="locName" class="highlight">Loading...</span>
                    </div>
                    <div class="autocomplete-wrapper">
                        <input type="text" id="locSearch" placeholder="Search City (e.g., Chennai)..." autocomplete="off">
                        <div id="locDropdown" class="dropdown-content"></div>
                    </div>
                </div>

                <!-- TAB 1: LIVE CLOCK -->
                <section id="clock" class="tab-content active">
                    <div class="card astro-timings-card">
                        <div class="astro-grid">
                            <div>
                                <div class="label">Local Date & Astro Sun</div>
                                <div class="val" id="sysDateTime">...</div>
                            </div>
                            <div>
                                <div class="label">Active Tithi & Paksha</div>
                                <div class="val highlight-orange" id="sysTithi">...</div>
                                <div class="sub-val" id="sysTithiEnd">...</div>
                                <div class="sub-val" id="sysPakshaEnd">...</div>
                            </div>
                            <div>
                                <div class="label">Active Ayana (Sidereal)</div>
                                <div class="val highlight-purple" id="sysAyana">...</div>
                                <div class="sub-val" id="sysAyanaEnd">...</div>
                            </div>
                        </div>
                    </div>

                    <div class="card nadi-card">
                        <div class="clock-display" id="liveTime">00:00:00</div>
                        <div class="nadi-title" id="activeNadi">Loading Nadi...</div>
                        <div class="nadi-timings">
                            <span>Started: <strong id="nadiStart">--:--</strong></span>
                            <span>Ends: <strong id="nadiEnd">--:--</strong></span>
                        </div>
                        <div class="progress-bar-container"><div class="progress-bar" id="nadiProgress"></div></div>
                        <div class="timer-text" id="nadiTimer">00m 00s remaining</div>
                    </div>

                    <div class="grid-2">
                        <div class="card tattva-card">
                            <h4 class="section-title">Active Tattva (Proportional)</h4>
                            <div class="tattva-box" id="tattvaBox">
                                <div class="tattva-details">
                                    <h2 id="tattvaName">...</h2>
                                    <div class="ruler">Ruler: <strong id="tattvaRuler">...</strong></div>
                                    <div class="badge" id="tattvaStatus">...</div>
                                    <div class="tattva-sub" id="tattvaSubStatus">...</div>
                                </div>
                                <div class="tattva-icon" id="tattvaIcon">⏳</div>
                            </div>
                            <div class="tattva-timings" style="margin-bottom: 5px;">
                                <span>Started: <strong id="tattvaStart">--:--</strong></span>
                                <span>Ends: <strong id="tattvaEnd">--:--</strong></span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-bottom: 5px;" id="tattvaTotal">Total Duration: --m --s</div>
                            <div class="progress-bar-container"><div class="progress-bar" id="tattvaProgress"></div></div>
                            <div class="timer-text" id="tattvaTimer">00m 00s remaining</div>
                            
                            <div class="directions-box">
                                <div><strong>Power Zone:</strong> <span id="tattvaPower">...</span></div>
                                <div><strong>Action Facing:</strong> <span id="tattvaFace">...</span></div>
                            </div>
                        </div>

                        <div class="card yamam-card">
                            <h4 class="section-title">Macro Yaamam & Day Rule</h4>
                            <h2 class="yamam-name" id="yamamName">...</h2>
                            <p class="yamam-period" id="yamamPeriod">...</p>
                            <div class="day-rule-box">
                                <h4 class="section-title">Vedic Day Rulership</h4>
                                <div id="dayAlignment" class="day-alignment">...</div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- TAB 2: ALIGNMENTS SCANNER -->
                <section id="calendar" class="tab-content">
                    <div class="card">
                        <h3>Cosmic Confluence Scanner</h3>
                        <p class="sub-text">Calculates exact alignments across 6 layers: <strong>Ayana, Paksha, Vaara, Yaamam, Nadi, & Purna Tattva.</strong></p>
                        
                        <div class="cal-controls">
                            <input type="text" id="scanDate" class="flatpickr-input" placeholder="Select Date...">
                            <select id="scanRange">
                                <option value="1">1 Day</option>
                                <option value="7">7 Days</option>
                                <option value="30" selected>30 Days</option>
                                <option value="365">1 Year</option>
                            </select>
                            <select id="scanFilter">
                                <option value="all">Show All Alignments</option>
                                <option value="ida">Ida (Lunar) Only</option>
                                <option value="pingala">Pingala (Solar) Only</option>
                            </select>
                        </div>
                        <div class="cal-buttons">
                            <button id="btnPrevScan" class="btn">◄ Prev</button>
                            <button id="btnScan" class="btn btn-primary">Scan Period</button>
                            <button id="btnNextScan" class="btn">Next ►</button>
                        </div>
                        <div id="scanResults" class="scan-results-container"></div>
                    </div>
                </section>

                <!-- TAB 3: AGNIHOTRA TIMER -->
                <section id="almanac" class="tab-content">
                    <div class="card">
                        <h3>Agnihotra Timer & Almanac</h3>
                        <p class="sub-text">Precise geometric Sunrise & Sunset with 24-second audio chimes.</p>
                        
                        <div class="cal-controls" style="margin-bottom: 20px;">
                            <input type="text" id="almanacDate" class="flatpickr-input" placeholder="Select Date...">
                            <button id="btnAlmanacScan" class="btn btn-primary">Get Solar Times</button>
                        </div>
                        
                        <div class="alarm-controls">
                            <h4 style="margin-bottom: 10px;">Audio Alerts</h4>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <label><input type="checkbox" id="chkSunriseAlarm"> Enable Sunrise Alarm</label>
                                <label><input type="checkbox" id="chkSunsetAlarm"> Enable Sunset Alarm</label>
                            </div>
                            <div style="margin-bottom:15px;">
                                <label style="font-size:0.8rem; color:var(--text-muted);">Warning Alert Timing:</label>
                                <select id="preAlarmMins">
                                    <option value="0">No Warning (Exact Time Only)</option>
                                    <option value="5">5 Mins Before</option>
                                    <option value="10">10 Mins Before</option>
                                    <option value="15" selected>15 Mins Before</option>
                                </select>
                            </div>
                            <button id="stopAlarmBtn" class="btn" style="background:var(--sunya); color:#fff; display:none; font-size:1.2rem; padding:15px;">🛑 STOP ALARM</button>
                        </div>

                        <div id="almanacResults" style="margin-top: 20px;"></div>
                    </div>
                </section>

                <!-- TAB 4: LOTTERY -->
                <section id="analytics" class="tab-content">
                    <div class="card filters-card">
                        <h4 class="section-title">Analytics Filters</h4>
                        <div class="filters-grid">
                            <div>
                                <label>Game:</label>
                                <select id="gameFilter"><option value="All">All Games</option><option value="Powerball">Powerball</option><option value="Mega Millions">Mega Millions</option></select>
                            </div>
                            <div>
                                <label>Ayana (Sidereal):</label>
                                <select id="ayanaFilter"><option value="All">Both Ayanas</option><option value="Uttarayana (North)">Uttarayana</option><option value="Dakshinayana (South)">Dakshinayana</option></select>
                            </div>
                            <div>
                                <label>Paksha:</label>
                                <select id="pakshaFilter"><option value="Combined">Both Phases</option><option value="Shukla">Shukla Paksha</option><option value="Krishna">Krishna Paksha</option></select>
                            </div>
                            <div>
                                <label>Specific Tithi:</label>
                                <select id="tithiFilter">
                                    <option value="All">All Tithis</option>
                                    <option value="Prathama">1. Prathama</option><option value="Dwitiya">2. Dwitiya</option><option value="Tritiya">3. Tritiya</option><option value="Chaturthi">4. Chaturthi</option>
                                    <option value="Panchami">5. Panchami</option><option value="Shashti">6. Shashti</option><option value="Saptami">7. Saptami</option><option value="Ashtami">8. Ashtami</option>
                                    <option value="Navami">9. Navami</option><option value="Dashami">10. Dashami</option><option value="Ekadashi">11. Ekadashi</option><option value="Dwadashi">12. Dwadashi</option>
                                    <option value="Trayodashi">13. Trayodashi</option><option value="Chaturdashi">14. Chaturdashi</option><option value="Purnima">15. Purnima (Shukla)</option><option value="Amavasya">15. Amavasya (Krishna)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="grid-3 metrics-grid">
                        <div class="card metric-card"><div class="metric-title">Filtered Hits</div><div class="metric-value highlight-blue" id="countTotal">0</div></div>
                        <div class="card metric-card"><div class="metric-title">Powerball</div><div class="metric-value highlight-orange" id="countPB">0</div></div>
                        <div class="card metric-card"><div class="metric-title">Mega Millions</div><div class="metric-value highlight-purple" id="countMM">0</div></div>
                    </div>

                    <div class="grid-2 charts-grid">
                        <div class="card"><h3 class="chart-title">Frequency by Tithi</h3><div class="chart-wrapper"><canvas id="tithiBarChart"></canvas></div></div>
                        <div class="card"><h3 class="chart-title">Macro Paksha Split</h3><div class="chart-wrapper pie-wrapper"><canvas id="pakshaPieChart"></canvas></div></div>
                    </div>

                    <div class="card table-card">
                        <h3>Verified Jackpot Registry</h3>
                        <div class="table-wrapper">
                            <table id="registryTable">
                                <thead><tr><th>Date</th><th>Game</th><th>Amount</th><th>State</th><th>Tithi</th><th>Ayana</th></tr></thead>
                                <tbody id="tableBody"></tbody>
                            </table>
                        </div>
                    </div>
                </section>
                
                <!-- TAB 5: CHANGELOG -->
                <section id="changelog" class="tab-content">
                    <div class="card">
                        <h3>System Updates & Changelog</h3>
                        <div id="changelogList"></div>
                    </div>
                </section>

            </div>
        </main>
    </div>

    <!-- Flatpickr JS -->
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    
    <script src="js/astro-engine.js?v=1.8.0"></script>
    <script src="js/app.js?v=1.8.0"></script>
</body>
</html>

INNER_EOF

cat << 'INNER_EOF' > css/style.css
/* Modular CSS for Swara Analytics PWA - App Layout */
:root {
    --bg-main: #0e1117;
    --bg-card: #1a1f2c;
    --bg-sidebar: #131720;
    --text-main: #e2e8f0;
    --text-muted: #a0aec0;
    --border: #2d3748;
    --purna: #48bb78;
    --purna-bg: rgba(72,187,120,0.2);
    --sunya: #f56565;
    --sunya-bg: rgba(245,101,101,0.2);
    --ida: #63b3ed;
    --pingala: #f6ad55;
    --radius: 8px;
    --pad: 15px;
}
[data-theme="light"] {
    --bg-main: #f0f4f8;
    --bg-card: #ffffff;
    --bg-sidebar: #ffffff;
    --text-main: #1a202c;
    --text-muted: #4a5568;
    --border: #cbd5e1;
    --purna: #38a169;
    --sunya: #e53e3e;
    --ida: #3182ce;
    --pingala: #dd6b20;
}
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
body { margin: 0; color: var(--text-main); font-size: 14px; line-height: 1.5; transition: background-color 0.3s ease; height: 100vh; overflow: hidden; background-color: var(--bg-main); }
h1, h2, h3, h4 { margin-top: 0; color: var(--text-main); }
.highlight { color: var(--ida); }
.highlight-orange { color: var(--pingala); }
.highlight-purple { color: #9f7aea; }
.sub-text { color: var(--text-muted); font-size: 0.9rem; }
body.ida-mode { background-color: var(--bg-main); }
body.pingala-mode { background-color: var(--bg-main); }
[data-theme="dark"] body.ida-mode { background-color: #0b1a2a; }
[data-theme="dark"] body.pingala-mode { background-color: #261300; }
[data-theme="light"] body.ida-mode { background-color: #e0f2fe; }
[data-theme="light"] body.pingala-mode { background-color: #ffedd5; }
.mobile-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-card); border-bottom: 1px solid var(--border); z-index: 50; }
.mobile-header h1 { margin: 0; font-size: 1.2rem; }
.version-tag { font-size: 0.7rem; background: var(--ida); color: #000; padding: 2px 6px; border-radius: 4px; vertical-align: middle; }
.btn-icon { background: transparent; border: 1px solid var(--border); font-size: 1.2rem; cursor: pointer; padding: 5px 10px; border-radius: 4px; color: var(--text-main); }
.app-layout { display: flex; flex-direction: column; height: calc(100vh - 60px); }
.main-area { flex: 1; overflow-y: auto; padding: 15px; padding-bottom: 80px; }
.content-wrapper { max-width: 1200px; margin: 0 auto; }
.sidebar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-sidebar); border-top: 1px solid var(--border); z-index: 100; padding: 5px 0; padding-bottom: env(safe-area-inset-bottom); }
.sidebar-brand { display: none; }
.nav-menu { display: flex; justify-content: space-around; align-items: center; width: 100%; overflow-x: auto; }
.nav-item { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-muted); padding: 8px; cursor: pointer; font-size: 0.75rem; font-weight: bold; min-width: 65px; }
.nav-item .nav-icon { font-size: 1.4rem; }
.nav-item.active { color: var(--ida); }
body.pingala-mode .nav-item.active { color: var(--pingala); }
@media (min-width: 768px) {
    body { overflow: hidden; height: 100vh; }
    .mobile-header { display: none; }
    .app-layout { flex-direction: row; height: 100vh; }
    .sidebar { position: static; width: 260px; height: 100vh; border-top: none; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 0; }
    .sidebar-brand { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border); margin-bottom: 10px; }
    .brand-title h1 { margin: 0; font-size: 1.5rem; }
    .nav-menu { flex-direction: column; padding: 10px; gap: 5px; }
    .nav-item { flex-direction: row; width: 100%; padding: 15px 20px; font-size: 1rem; border-radius: 8px; justify-content: flex-start; gap: 15px; }
    .nav-item .nav-icon { font-size: 1.2rem; }
    .nav-item:hover { background: rgba(0,0,0,0.1); }
    [data-theme="dark"] .nav-item:hover { background: rgba(255,255,255,0.05); }
    .nav-item.active { background: rgba(99, 179, 237, 0.1); border-left: 4px solid var(--ida); }
    body.pingala-mode .nav-item.active { background: rgba(246, 173, 85, 0.1); border-left: 4px solid var(--pingala); }
    .main-area { padding-bottom: 15px; }
}
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--pad); margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.grid-2, .grid-3 { display: grid; gap: 15px; }
.grid-2 { grid-template-columns: 1fr; }
.grid-3 { grid-template-columns: 1fr; }
@media (min-width: 900px) {
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
}
input, select, button.btn { width: 100%; padding: 10px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 4px; outline: none; transition: border-color 0.2s; }
input:focus, select:focus { border-color: var(--ida); }
button.btn { cursor: pointer; font-weight: bold; }
button.btn:hover { background: var(--border); }
button.btn-primary { background: var(--purna); color: #fff; border-color: var(--purna); }
button.btn-primary:hover { background: #38a169; }
.autocomplete-wrapper { position: relative; margin-top: 10px; }
.dropdown-content { display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border); z-index: 9999; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 0 0 8px 8px; }
.dropdown-content div { padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border); }
.dropdown-content div:hover { background: var(--bg-main); }
.tab-content { display: none; animation: fadeIn 0.3s ease; }
.tab-content.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.astro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
.astro-grid .label { color: var(--purna); font-size: 0.8rem; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
.astro-grid .val { font-size: 1.1rem; font-weight: bold; }
.astro-grid .sub-val { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
.clock-display { font-size: 2.5rem; font-weight: bold; text-align: center; font-variant-numeric: tabular-nums; margin: 10px 0; }
.nadi-title { font-size: 1.5rem; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
.ida-mode .nadi-title { color: var(--ida); }
.pingala-mode .nadi-title { color: var(--pingala); }
.nadi-timings, .tattva-timings { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-top: 10px; }
.progress-bar-container { height: 4px; background: var(--border); border-radius: 2px; margin: 8px 0; overflow: hidden; }
.progress-bar { height: 100%; width: 0%; transition: width 1s linear; }
.ida-mode .progress-bar { background: var(--ida); }
.pingala-mode .progress-bar { background: var(--pingala); }
.timer-text { text-align: center; font-size: 0.9rem; font-weight: bold; color: var(--text-muted); }
.tattva-box { display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 15px; border-left: 4px solid var(--border); border-radius: 0 4px 4px 0; margin-bottom: 10px; }
.tattva-box.purna { border-left-color: var(--purna); }
.tattva-box.sunya { border-left-color: var(--sunya); }
.tattva-icon { font-size: 3rem; }
.badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; margin-top: 5px; }
.badge.purna { background: var(--purna-bg); color: var(--purna); }
.badge.sunya { background: var(--sunya-bg); color: var(--sunya); }
.tattva-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; }
.directions-box { background: var(--bg-main); padding: 10px; border-radius: 4px; font-size: 0.9rem; margin-top: 10px; border: 1px solid var(--border); }
.yamam-name { color: var(--purna); margin-bottom: 5px; }
.day-rule-box { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--border); }
.day-alignment { font-size: 1.1rem; font-weight: bold; }
.cal-controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
@media (min-width: 600px) { .cal-controls { flex-direction: row; } }
.cal-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
.scan-match-card { background: var(--bg-main); border-left: 4px solid var(--border); padding: 10px; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
.scan-match-card.ida { border-left-color: var(--ida); }
.scan-match-card.pingala { border-left-color: var(--pingala); }

.scan-day-header { border-bottom: 1px solid var(--border); padding-bottom: 5px; margin-bottom: 10px; margin-top: 20px; }
.filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.filters-grid label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 3px; }
.metric-card { text-align: center; }
.metric-title { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); }
.metric-value { font-size: 1.8rem; font-weight: bold; margin-top: 5px; }
.chart-wrapper { position: relative; height: 250px; width: 100%; }
.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
th { background: var(--bg-main); position: sticky; top: 0; z-index: 10; font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); }
tr:hover { background: rgba(0,0,0,0.05); }
[data-theme="dark"] tr:hover { background: rgba(255,255,255,0.05); }

/* Changelog Styles */
.cl-item { border-left: 3px solid var(--ida); padding-left: 15px; margin-bottom: 20px; }
.cl-version { font-size: 1.1rem; font-weight: bold; color: var(--text-main); margin-bottom: 5px; }
.cl-date { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
.cl-list { margin: 0; padding-left: 20px; color: var(--text-muted); font-size: 0.95rem; }
.cl-list li { margin-bottom: 4px; }
.alarm-controls { background: var(--bg-main); padding: 15px; border-radius: 8px; border: 1px solid var(--border); }

INNER_EOF

cat << 'INNER_EOF' > js/app.js
/**
 * App UI Logic v1.8.0
 */

let df = [];
let barChart = null; 
let pieChart = null;
const allTithiLabels = [
    "Shukla Prathama", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami", "Shukla Shashti", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami", "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
    "Krishna Prathama", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami", "Krishna Shashti", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami", "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"
];

const CHANGELOG = [
    { v: "1.8.0", date: "2026-09-15", changes: ["Fixed UTC anchor drift: Engine now rigidly anchors to Local Midnight to preserve exact minute accuracy for Sunrise/Sunset.", "Integrated Flatpickr for universal, full-screen calendar UI.", "Upgraded Scanner to 6-Layer Cosmic Filter (Ayana, Paksha, Vaara, Yaamam, Nadi, Tattva) with alignment scoring.", "Added Agnihotra Audio Engine: Dual-alert system (Warning chime + Exact 24-second continuous chime).", "Added proportional Tattva Total Duration and Live Countdown UI."] },
    { v: "1.7.0", date: "2026-09-15", changes: ["Implemented Samagra Pakṣa Ayanāṃśa (Fixes Lahiri Drift, exact Sidereal calculations).", "Rebuilt Nadi/Tattva/Yaamam engine to use true Proportional durations.", "Added Solar Almanac Tab.", "Optimized Confluence Scanner for instant 365-day calculation without freezing."] },
];

if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=1.8.0').catch(console.error);
}

// Flatpickr Init
flatpickr("#scanDate", { defaultDate: "today", disableMobile: false });
flatpickr("#almanacDate", { defaultDate: "today", disableMobile: false });

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
    });
});

let loc = JSON.parse(localStorage.getItem('vLoc')) || { name: 'Irvine, CA', lat: 33.6846, lon: -117.8265, tz: 'America/Los_Angeles' };
document.getElementById('locName').innerText = loc.name;

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

function updateMacroAstro() {
    let now = new Date();
    let a = getAstro(now);
    
    let tIdx = Math.floor(a.diff / 12) + 1;
    let isShukla = tIdx <= 15;
    let nIdx = isShukla ? tIdx : tIdx - 15;
    let name = (nIdx===15 && !isShukla) ? "Amavasya" : (nIdx===15 && isShukla) ? "Purnima" : TithiNames[nIdx-1];
    let paksha = isShukla ? "Shukla" : "Krishna";
    let ayana = (a.sunSidereal >= 270 || a.sunSidereal < 90) ? "Uttarayana" : "Dakshinayana";

    document.getElementById('sysTithi').innerText = `${name} (${paksha})`;
    document.getElementById('sysAyana').innerText = ayana;

    let tEnd = findExactEndTime(now, tIdx*12, d => getAstro(d).diff, 0.5079);
    let pEnd = findExactEndTime(now, isShukla ? 180 : 360, d => getAstro(d).diff, 0.5079);
    let aEnd = findExactEndTime(now, (a.sunSidereal >= 270 || a.sunSidereal < 90) ? 90 : 270, d => getAstro(d).sunSidereal, 0.04107);

    let opts = { timeZone: loc.tz, dateStyle:'short', timeStyle:'short' };
    try {
        let b = getBoundingSunEvents(now, loc.lat, loc.lon);
        let sRiseStr = b.todayRise.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        let sSetStr = b.todaySet.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        let nxRiseStr = b.nextRise.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit'});
        
        let dateStr = now.toLocaleDateString('en-US', { timeZone: loc.tz, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        
        document.getElementById('sysDateTime').innerHTML = `
            <div style="font-size: 1rem; color: var(--text-main); margin-bottom: 6px; font-weight: bold;">${dateStr}</div>
            <div style="font-size: 0.85rem; color: var(--purna); font-weight: bold; margin-bottom: 2px;">🌅 Rise: ${sRiseStr}</div>
            <div style="font-size: 0.85rem; color: var(--pingala); font-weight: bold; margin-bottom: 2px;">🌇 Set: ${sSetStr}</div>
            <div style="font-size: 0.85rem; color: var(--ida); font-weight: bold;">⏭️ Next Rise: ${nxRiseStr}</div>
        `;
        
        document.getElementById('sysTithiEnd').innerText = `Ends: ${tEnd.toLocaleString('en-US', opts)}`;
        document.getElementById('sysPakshaEnd').innerText = `Paksha Ends: ${pEnd.toLocaleString('en-US', opts)}`;
        document.getElementById('sysAyanaEnd').innerText = `Ayana Ends: ${aEnd.toLocaleString('en-US', opts)}`;
    } catch(e) {}
}

updateMacroAstro();
setInterval(updateMacroAstro, 60000); 

const fT = d => {
    try { return d.toLocaleTimeString('en-US', {timeZone: loc.tz, hour:'2-digit', minute:'2-digit', hour12:false}); }
    catch(e) { return d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', hour12:false}); }
};

// AUDIO ALERT SYSTEM
let audioCtx = null;
let alarmInterval = null;
let lastTriggeredEvent = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if(audioCtx.state === 'suspended') audioCtx.resume();
}

['chkSunriseAlarm', 'chkSunsetAlarm'].forEach(id => {
    document.getElementById(id).addEventListener('change', initAudio);
});

function playChime(isExact) {
    initAudio();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    // Single strike
    const strike = () => {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, audioCtx.currentTime); // 432Hz Healing Frequency
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 3);
    };

    if (!isExact) {
        strike(); // Just one warning chime
    } else {
        // Agnihotra 24-second continuous loop
        let count = 0;
        document.getElementById('stopAlarmBtn').style.display = 'block';
        strike();
        alarmInterval = setInterval(() => {
            count++;
            if (count >= 12) { // 12 strikes * 2s = 24 seconds
                stopAlarm();
            } else {
                strike();
            }
        }, 2000);
    }
}

function stopAlarm() {
    if(alarmInterval) clearInterval(alarmInterval);
    document.getElementById('stopAlarmBtn').style.display = 'none';
}
document.getElementById('stopAlarmBtn').addEventListener('click', stopAlarm);

setInterval(() => {
    let now = new Date();
    document.getElementById('liveTime').innerText = fT(now) + ':' + now.getSeconds().toString().padStart(2,'0');
    
    let s = getSwaraState(now, loc.lat, loc.lon);
    document.body.className = s.isIda ? 'ida-mode' : 'pingala-mode';
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
    
    // Proportional Tattva UI
    let tTotM = Math.floor(totalTattvaSecs / 60);
    let tTotS = Math.floor(totalTattvaSecs % 60);
    document.getElementById('tattvaTotal').innerText = `Total Duration: ${tTotM}m ${tTotS.toString().padStart(2,'0')}s`;
    
    document.getElementById('tattvaProgress').style.width = `${tPct}%`;
    document.getElementById('tattvaTimer').innerText = `${Math.floor(s.remTattva/60).toString().padStart(2,'0')}m ${Math.floor(s.remTattva%60).toString().padStart(2,'0')}s remaining`;

    document.getElementById('yamamName').innerText = s.yaamam.split('(')[0];
    document.getElementById('yamamPeriod').innerText = s.yaamam.split('(')[1].replace(')','');
    
    let drUI = document.getElementById('dayAlignment');
    drUI.innerText = s.dayRule;
    drUI.style.color = (s.isIda === s.ruleIsIda) ? "var(--purna)" : "var(--text-muted)";
    
    // Check Alarms
    let preMins = parseInt(document.getElementById('preAlarmMins').value) * 60000;
    let b = getBoundingSunEvents(now, loc.lat, loc.lon);
    
    if (document.getElementById('chkSunriseAlarm').checked) {
        let riseDiff = b.todayRise.getTime() - now.getTime();
        // Exact
        if (Math.abs(riseDiff) < 1000 && lastTriggeredEvent !== 'rise_exact') {
            lastTriggeredEvent = 'rise_exact'; playChime(true);
        }
        // Warning
        if (preMins > 0 && Math.abs(riseDiff - preMins) < 1000 && lastTriggeredEvent !== 'rise_warn') {
            lastTriggeredEvent = 'rise_warn'; playChime(false);
        }
    }
    
    if (document.getElementById('chkSunsetAlarm').checked) {
        let setDiff = b.todaySet.getTime() - now.getTime();
        // Exact
        if (Math.abs(setDiff) < 1000 && lastTriggeredEvent !== 'set_exact') {
            lastTriggeredEvent = 'set_exact'; playChime(true);
        }
        // Warning
        if (preMins > 0 && Math.abs(setDiff - preMins) < 1000 && lastTriggeredEvent !== 'set_warn') {
            lastTriggeredEvent = 'set_warn'; playChime(false);
        }
    }
    
}, 1000);

// Calendar Scanner 6-Layer
document.getElementById('btnPrevScan').addEventListener('click', () => doScan(-1));
document.getElementById('btnScan').addEventListener('click', () => doScan(0));
document.getElementById('btnNextScan').addEventListener('click', () => doScan(1));

function doScan(offset) {
    let baseInput = document.getElementById('scanDate').value;
    let days = parseInt(document.getElementById('scanRange').value);
    let sFilter = document.getElementById('scanFilter').value;
    
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
            let s = getSwaraState(curr, loc.lat, loc.lon);
            
            // 6-Layer Resonance
            let isPurna = (s.tattva.s === "Purna"); // Layer 1
            let yamamElement = s.yaamam.split(':')[1].split('(')[0].trim(); 
            let isYamamMatch = yamamElement.includes(s.tattva.n); // Layer 2
            let nadiMatchesDay = (s.isIda === s.ruleIsIda); // Layer 3
            
            // Core condition for a "Perfect Alignment" base
            if(isPurna && isYamamMatch && nadiMatchesDay) {
                
                // Filter Check
                let currentType = s.isIda ? 'ida' : 'pingala';
                if (sFilter === 'all' || sFilter === currentType) {
                    
                    let score = 3;
                    let pMatch = s.isIda === s.isShukla; // Layer 4
                    if(pMatch) score++;
                    let aMatch = s.isIda === s.ayanaIda; // Layer 5
                    if(aMatch) score++;
                    
                    let dateStr = curr.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
                    if(dateStr !== currentDayStr) {
                        if(dayMatchesHTML !== "") html += `<div class="card scan-day-header"><h4>${currentDayStr}</h4>${dayMatchesHTML}</div>`;
                        currentDayStr = dateStr; dayMatchesHTML = "";
                    }
                    
                    let scoreColor = score === 5 ? 'var(--purna)' : 'var(--text-main)';
                    let typeClass = s.isIda ? 'ida' : 'pingala';
                    
                    dayMatchesHTML += `<div class="scan-match-card ${typeClass}">
                        <div style="display:flex; justify-content:space-between;">
                            <strong style="color:var(--purna)">${fT(s.tStart)} - ${fT(s.tEnd)}</strong>
                            <strong style="color:${scoreColor};">${score}/5 Resonance</strong>
                        </div>
                        <div style="font-size:0.9rem; margin-top:4px;"><strong>${s.isIda?'Ida':'Pingala'}</strong> + <strong>${s.tattva.n} ${s.tattva.i}</strong> (${s.yaamam})</div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">
                            Matches: Day Rule, Yaamam
                            ${pMatch ? ', Paksha' : ''}
                            ${aMatch ? ', Ayana' : ''}
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Power Zone: ${s.tattva.p} | Face: ${s.tattva.f}</div>
                    </div>`;
                    matchCount++;
                }
            }
            // Jump to the start of the next Tattva to avoid micro-looping
            curr = new Date(s.tEnd.getTime() + 1000); 
        }
        if(dayMatchesHTML !== "") html += `<div class="card scan-day-header"><h4>${currentDayStr}</h4>${dayMatchesHTML}</div>`;
        if(matchCount === 0) html = `<div class="card"><p style="color:var(--sunya);">No confluences found matching filters.</p></div>`;
        
        document.getElementById('scanResults').innerHTML = `<h3 style="color:var(--purna); margin-top:0;">Found ${matchCount} Windows</h3>` + html;
    }, 50);
}

// Almanac Logic
document.getElementById('btnAlmanacScan').addEventListener('click', () => {
    let dStr = document.getElementById('almanacDate').value;
    let tgt = new Date(dStr + "T12:00:00");
    let b = getBoundingSunEvents(tgt, loc.lat, loc.lon);
    
    let res = document.getElementById('almanacResults');
    let opts = {timeZone: loc.tz, hour:'2-digit', minute:'2-digit', second:'2-digit'};
    
    res.innerHTML = `
        <div style="background:var(--bg-main); padding:15px; border-radius:8px; border:1px solid var(--border);">
            <h4 style="margin-top:0; color:var(--ida);">${tgt.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'})}</h4>
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

// Load Changelog
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

// Lottery Analytics Engine
fetch('jackpot_data.json').then(r=>r.json()).then(d=>{ df = d; filterAndRender(); }).catch(e=>console.log("No JSON data."));
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

INNER_EOF

cat << 'INNER_EOF' > js/astro-engine.js
/**
 * Astro Engine v1.8.0 (Local Midnight Anchor + Sidereal Scoring)
 */

const JD = d => (d.getTime() / 86400000.0) + 2440587.5;

function getSamagraAyanamsa(jd) {
    let T = (jd - 2451545.0) / 36525.0; 
    return 23.840018 + (1.395521 * T) + (0.000317 * T * T);
}

function getAstro(d) {
    let T = (JD(d) - 2451545.0) / 36525.0; 
    let L0 = (280.46646 + 36000.76983 * T) % 360;
    let M = (357.52911 + 35999.05029 * T) * Math.PI/180;
    let sunLong = (L0 + (1.914602 - 0.004817*T)*Math.sin(M) + 0.019993*Math.sin(2*M)) % 360;
    if(sunLong < 0) sunLong += 360;

    let L_m = (218.3165 + 481267.8813 * T) % 360;
    let M_m = (134.963 + 477198.869 * T) * Math.PI/180;
    let D = (297.8502 + 445267.1115 * T) * Math.PI/180; 
    let F = (93.272 + 483202.017 * T) * Math.PI/180;

    let moonLong = (L_m + 6.289*Math.sin(M_m) + 1.274*Math.sin(2*D-M_m) + 0.658*Math.sin(2*D) + 0.214*Math.sin(2*M_m) - 0.186*Math.sin(M_m) - 0.114*Math.sin(2*F)) % 360;
    if(moonLong < 0) moonLong += 360;

    let ayanamsa = getSamagraAyanamsa(JD(d));
    let siderealSun = (sunLong - ayanamsa + 360) % 360;
    let siderealMoon = (moonLong - ayanamsa + 360) % 360;
    let diff = (siderealMoon - siderealSun + 360) % 360;

    return { sunTropical: sunLong, sunSidereal: siderealSun, diff: diff, ayanamsa: ayanamsa };
}

function getGeometricSunTimesForDate(date, lat, lon) {
    // FIX: Extract LOCAL year, month, date to lock to the specific local day requested, 
    // removing the 1-minute drift caused by evening UTC rollovers.
    let utcMidnight = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
    let jd = (utcMidnight.getTime() / 86400000.0) + 2440587.5;
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

    let cosHA = (Math.sin(0) - Math.sin(lat * Math.PI/180) * Math.sin(dec * Math.PI/180)) / (Math.cos(lat * Math.PI/180) * Math.cos(dec * Math.PI/180));
    cosHA = Math.max(-1, Math.min(1, cosHA));
    let HA = Math.acos(cosHA) * 180/Math.PI;

    let solarNoonGMT = 720 - (lon * 4) - eqTime;
    let riseMin = solarNoonGMT - (HA * 4);
    let setMin = solarNoonGMT + (HA * 4);

    let rise = new Date(utcMidnight.getTime() + riseMin * 60000);
    let set = new Date(utcMidnight.getTime() + setMin * 60000);

    return { rise, set };
}

function getBoundingSunEvents(time, lat, lon) {
    let tTime = time.getTime();
    let yesterday = new Date(tTime - 86400000);
    let today = new Date(tTime);
    let tomorrow = new Date(tTime + 86400000);
    
    let yGeo = getGeometricSunTimesForDate(yesterday, lat, lon);
    let tGeo = getGeometricSunTimesForDate(today, lat, lon);
    let tmGeo = getGeometricSunTimesForDate(tomorrow, lat, lon);
    
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

const TATTVA_IDA = [
    {n:"Earth", i:"🌍", r:"Mercury", s:"Purna", sub:"Full Result", p:"East", f:"West"},
    {n:"Water", i:"💧", r:"Moon", s:"Purna", sub:"Full Result", p:"West", f:"East"},
    {n:"Agni", i:"🔥", r:"Venus", s:"Sunya", sub:"Negative Result", p:"South", f:"North"},
    {n:"Vayu", i:"💨", r:"Jupiter", s:"Sunya", sub:"Negative Result", p:"North", f:"South"},
    {n:"Akasha", i:"🌌", r:"Ketu", s:"Sunya", sub:"Negative Result", p:"Top", f:"Upwards"}
];
const TATTVA_PINGALA = [
    {n:"Vayu", i:"💨", r:"Rahu", s:"Purna", sub:"Full Result", p:"North", f:"South"},
    {n:"Agni", i:"🔥", r:"Mars", s:"Purna", sub:"Full Result", p:"South", f:"North"},
    {n:"Earth", i:"🌍", r:"Sun", s:"Sunya", sub:"Negative Result", p:"East", f:"West"},
    {n:"Water", i:"💧", r:"Saturn", s:"Sunya", sub:"Negative Result", p:"West", f:"East"},
    {n:"Akasha", i:"🌌", r:"Ketu", s:"Purna", sub:"Full Result", p:"Top", f:"Upwards"}
];

function getSwaraState(time, lat, lon) {
    let b = getBoundingSunEvents(time, lat, lon);
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
        let tempGeo = getGeometricSunTimesForDate(new Date(time.getTime() - 43200000), lat, lon);
        activeSunrise = tempGeo.rise;
    }

    let astroAtRise = getAstro(activeSunrise);
    let tithi = Math.floor(astroAtRise.diff / 12) + 1;
    let isShukla = tithi <= 15;
    let adjTithi = isShukla ? tithi : tithi - 15;

    let idaStarts = isShukla ? [1,2,3,7,8,9,13,14,15].includes(adjTithi) : [4,5,6,10,11,12].includes(adjTithi);
    
    let currentIsIda = idaStarts ? (nIdx % 2 === 0) : (nIdx % 2 !== 0);
    
    let nadiStartMs = b.start.getTime() + (nIdx * nadiDurationMs);
    let nadiEndMs = nadiStartMs + nadiDurationMs;
    let remNadiSecs = (nadiEndMs - time.getTime()) / 1000;

    let activeTattva = currentIsIda ? TATTVA_IDA[tIdx] : TATTVA_PINGALA[tIdx];

    let tattvaStartMs = nadiStartMs + (tIdx * tattvaDurationMs);
    let tattvaEndMs = tattvaStartMs + tattvaDurationMs;
    let remTattvaSecs = (tattvaEndMs - time.getTime()) / 1000;

    let yaamams = ["1st: Earth", "2nd: Water", "3rd: Agni", "4th: Vayu & Akasha"];
    let yType = b.isDay ? "Day" : "Night";

    let day = activeSunrise.getDay(); 
    let dayRule = "", ruleIsIda = false;
    if([1,3,5].includes(day)) { dayRule = "Ida Dominant (Mon, Wed, Fri)"; ruleIsIda = true; }
    else if([0,2,4].includes(day)) { dayRule = "Pingala Dominant (Sun, Tue, Thu)"; ruleIsIda = false; }
    else { 
        ruleIsIda = !b.isDay; 
        dayRule = b.isDay ? "Pingala Dominant (Sat Day)" : "Ida Dominant (Sat Night)"; 
    }

    // Expose Sidereal Ayana logic for the Scanner
    let currentAstro = getAstro(time);
    let ayanaIda = (currentAstro.sunSidereal >= 270 || currentAstro.sunSidereal < 90);

    return { 
        isIda: currentIsIda, tattva: activeTattva, 
        nStart: new Date(nadiStartMs), nEnd: new Date(nadiEndMs), remNadi: remNadiSecs, 
        tStart: new Date(tattvaStartMs), tEnd: new Date(tattvaEndMs), remTattva: remTattvaSecs, 
        geomRise: activeSunrise, geomSet: b.todaySet, nextRise: b.nextRise,
        yaamam: `${yaamams[yIdx]} (${yType})`, dayRule, ruleIsIda,
        isShukla: isShukla, ayanaIda: ayanaIda 
    };
}

INNER_EOF

cat << 'INNER_EOF' > sw.js
const CACHE_NAME = 'swara-v1.8.0';
const ASSETS = [
    './',
    './index.html',
    './css/style.css?v=1.8.0',
    './js/astro-engine.js?v=1.8.0',
    './js/app.js?v=1.8.0',
    './manifest.json?v=1.8.0',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
    'https://cdn.jsdelivr.net/npm/flatpickr'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('jackpot_data.json') || e.request.url.includes('nominatim') || e.request.url.includes('open-meteo')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

INNER_EOF

echo "Files successfully created!"
