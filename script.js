// --- INIT PETA ---
const streetMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' });
const satelliteMap = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20, attribution: '© Google Maps' });

const map = L.map('map', { zoomControl: false, layers: [streetMap] }).setView([-2.5, 118], 5);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const baseMaps = { "🌐 Peta Jalan": streetMap, "🛰️ Citra Satelit": satelliteMap };
L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(map);

const markerCluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 40, showCoverageOnHover: true });
map.addLayer(markerCluster);

let allSitesData = [];

// --- INIT CHARTS (KOSONG DI AWAL) ---
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.color = '#7f8c8d';

let coverageChart = new Chart(document.getElementById('coverageChart'), {
    type: 'doughnut', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%'}
});

let cityChart = new Chart(document.getElementById('cityChart'), {
    type: 'bar', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
});

let rfsChart = new Chart(document.getElementById('rfsChart'), {
    type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, elements: { line: { tension: 0.3 } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
});

// --- LOGIKA DRAG & DROP & UPLOAD ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('excel-upload');
const uploadStatus = document.getElementById('upload-status');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('active-drag'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('active-drag'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('active-drag');
    if (e.dataTransfer.files.length) processExcelFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) processExcelFile(e.target.files[0]);
});

// --- BACA DATA EXCEL ---
function processExcelFile(file) {
    if(!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        uploadStatus.innerHTML = "❌ Format file Excel!"; uploadStatus.style.color = "#c0392b"; return;
    }
    uploadStatus.innerHTML = "⏳ Sedang memproses data..."; uploadStatus.style.color = "#2d98da";

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet);
            
            allSitesData = [];
            excelData.forEach(row => {
                let lat = parseFloat(row["Latitude"]);
                let lng = parseFloat(row["Longitude"]);

                if (!isNaN(lat) && lat >= -90 && lat <= 90 && lat !== 0 &&
                    !isNaN(lng) && lng >= -180 && lng <= 180 && lng !== 0) {
                    
                    allSitesData.push({
                        emr: row["EMR Project ID"] || "Unknown",
                        city: row["Kab/Kota"] || "-",
                        coverage: row["Coverage Type"] || "Unknown",
                        rfs: row["RFS Date"], 
                        lat: lat, 
                        lng: lng
                    });
                }
            });
            
            uploadStatus.innerHTML = `✅ Berhasil memuat ${allSitesData.length} site!`;
            uploadStatus.style.color = "#27ae60";

            populateDropdowns();
            applyFilters();
            
            if (allSitesData.length > 0) map.fitBounds(L.latLngBounds(allSitesData.map(s => [s.lat, s.lng])));

        } catch (error) {
            uploadStatus.innerHTML = "❌ Gagal membaca isi Excel."; uploadStatus.style.color = "#c0392b"; console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- FILTER KOTA ---
function populateDropdowns() {
    const kotaSet = new Set();
    allSitesData.forEach(site => { if(site.city && site.city !== "-") kotaSet.add(site.city); });

    const select = document.getElementById('filter-kota');
    while (select.options.length > 1) { select.remove(1); }
    Array.from(kotaSet).sort().forEach(item => { select.add(new Option(item, item)); });
}

// --- LOGIKA UTAMA (FILTER MAP & UPDATE CHARTS) ---
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const coverageFilter = document.getElementById('filter-coverage').value;
    const kotaFilter = document.getElementById('filter-kota').value;

    markerCluster.clearLayers();
    const markersToAdd = [];
    let filteredDataForCharts = [];
    
    let countTotal = 0; let countGreen = 0; let countBrown = 0;

    allSitesData.forEach(site => {
        const matchSearch = site.emr.toLowerCase().includes(searchTerm);
        const matchCoverage = coverageFilter === "All" || site.coverage === coverageFilter;
        const matchKota = kotaFilter === "All" || site.city === kotaFilter;

        if (matchSearch && matchCoverage && matchKota) {
            filteredDataForCharts.push(site); // Simpan untuk chart
            
            countTotal++;
            if (site.coverage === "Green") countGreen++;
            else if (site.coverage === "Brown") countBrown++;

            let markerColor = site.coverage === "Green" ? "#27ae60" : "#b8592b"; 
            
            let rfsBadge = (!site.rfs || site.rfs == 0 || site.rfs === "0") 
                ? `<span style="background:#f1c40f; color:#000; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">⏳ TBD (Pending)</span>`
                : `<span style="background:#27ae60; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">✅ RFS: ${site.rfs}</span>`;

            const marker = L.circleMarker([site.lat, site.lng], {
                color: markerColor, fillColor: markerColor, fillOpacity: 0.8, radius: 8, weight: 2
            });

            marker.bindPopup(`
                <div style="min-width: 190px; padding: 2px;">
                    <h4 style="margin: 0 0 8px 0; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px; font-size:14px; color:#333;">${site.emr}</h4>
                    <p style="margin: 5px 0; font-size: 12px;"><b>Kab/Kota:</b> ${site.city}</p>
                    <p style="margin: 5px 0; font-size: 12px;"><b>Coverage:</b> <span style="color:${markerColor}; font-weight:bold;">${site.coverage === 'Green' ? 'FWA Only' : 'FWA + FTTH'}</span></p>
                    <div style="margin-top: 10px; margin-bottom: 4px;">${rfsBadge}</div>
                </div>
            `);
            markersToAdd.push(marker);
        }
    });

    markerCluster.addLayers(markersToAdd);
    
    document.getElementById('count-total').innerText = countTotal;
    document.getElementById('count-green').innerText = countGreen;
    document.getElementById('count-brown').innerText = countBrown;

    // UPDATE CHARTS DENGAN DATA TERSARING
    updateAnalytics(filteredDataForCharts, countGreen, countBrown);
}

function updateAnalytics(data, green, brown) {
    // 1. Update Donut Chart
    coverageChart.data = {
        labels: ['Green (FWA)', 'Brown (Hybrid)'],
        datasets: [{ data: [green, brown], backgroundColor: ['#27ae60', '#b8592b'], borderWidth: 0 }]
    };
    coverageChart.update();

    // 2. Update Bar Chart (Top Kota)
    let cityCount = {};
    data.forEach(s => { cityCount[s.city] = (cityCount[s.city] || 0) + 1; });
    // Sort & Ambil Top 5
    let sortedCities = Object.entries(cityCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    cityChart.data = {
        labels: sortedCities.map(c => c[0]),
        datasets: [{ label: 'Total Site', data: sortedCities.map(c => c[1]), backgroundColor: '#2d98da', borderRadius: 6 }]
    };
    cityChart.update();

    // 3. Update Line Chart (RFS Timeline)
    let rfsCount = {};
    data.forEach(s => {
        // Ambil Bulan & Tahun saja (misal: "Jun 10, 2026" jadi "Jun 2026")
        let label = "TBD";
        if (s.rfs && s.rfs !== "0" && s.rfs !== 0) {
            let parts = s.rfs.toString().split(" ");
            if(parts.length >= 3) label = parts[0] + " " + parts[2];
            else label = s.rfs;
        }
        rfsCount[label] = (rfsCount[label] || 0) + 1;
    });

    // Pindahkan "TBD" ke urutan pertama, sisanya dibiarkan (bisa dikembangkan agar sort berdasar waktu)
    let sortedRfsLabels = Object.keys(rfsCount).sort((a,b) => a === "TBD" ? -1 : b === "TBD" ? 1 : a.localeCompare(b));

    rfsChart.data = {
        labels: sortedRfsLabels,
        datasets: [{ label: 'Site RFS', data: sortedRfsLabels.map(l => rfsCount[l]), borderColor: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.2)', fill: true, pointBackgroundColor: '#9b59b6' }]
    };
    rfsChart.update();
}

// --- EVENT LISTENERS ---
document.getElementById('search-input').addEventListener('keyup', applyFilters);
document.getElementById('filter-coverage').addEventListener('change', applyFilters);
document.getElementById('filter-kota').addEventListener('change', applyFilters);