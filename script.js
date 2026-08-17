// 1. Definisikan Mode Peta (Basemaps)
const streetMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { 
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
});

const satelliteMap = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { 
    maxZoom: 20, 
    attribution: '© Google Maps'
});

// 2. Inisialisasi Peta dengan Default Peta Jalan
const map = L.map('map', { 
    zoomControl: false,
    layers: [streetMap] 
}).setView([-2.5, 118], 5);

L.control.zoom({ position: 'bottomright' }).addTo(map);

// 3. Tambahkan Tombol Switcher Layer
const baseMaps = {
    "🌐 Peta Jalan": streetMap,
    "🛰️ Citra Satelit": satelliteMap
};
L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(map);

// 4. Inisialisasi Marker Cluster (Garis Biru/Coverage Diaktifkan Kembali!)
const markerCluster = L.markerClusterGroup({ 
    chunkedLoading: true, 
    maxClusterRadius: 40,
    showCoverageOnHover: true // <--- Diubah kembali menjadi true
});
map.addLayer(markerCluster);

let allSitesData = [];

// --- LOGIKA DRAG & DROP & UPLOAD ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('excel-upload');
const uploadStatus = document.getElementById('upload-status');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active-drag');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active-drag');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active-drag');
    if (e.dataTransfer.files.length) {
        processExcelFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        processExcelFile(e.target.files[0]);
    }
});

function processExcelFile(file) {
    if(!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        uploadStatus.innerHTML = "❌ Format file harus Excel!";
        uploadStatus.style.color = "#c0392b";
        return;
    }

    uploadStatus.innerHTML = "⏳ Sedang memproses data...";
    uploadStatus.style.color = "#2d98da";

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = XLSX.utils.sheet_to_json(worksheet);
            
            allSitesData = [];
            excelData.forEach(row => {
                const lat = parseFloat(row["Latitude"]);
                const lng = parseFloat(row["Longitude"]);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    allSitesData.push({
                        name: row["Tower ID"] || "Unknown",
                        emr: row["EMR Project ID"] || "-",
                        type: row["Site Type"] || "Unknown",
                        lat: lat, lng: lng,
                        city: row["Kab/Kota"] || "-",
                        prov: row["Provinsi"] || "-",
                        vendor: row["Vendor"] || "Belum Ada Data"
                    });
                }
            });
            
            uploadStatus.innerHTML = `✅ Berhasil memuat ${allSitesData.length} site!`;
            uploadStatus.style.color = "#27ae60";

            populateDropdowns();
            applyFilters();
            
            if (allSitesData.length > 0) {
                map.fitBounds(L.latLngBounds(allSitesData.map(s => [s.lat, s.lng])));
            }

        } catch (error) {
            uploadStatus.innerHTML = "❌ Gagal membaca isi Excel.";
            uploadStatus.style.color = "#c0392b";
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- LOGIKA DROPDOWN CASCADING ---
function fillSelect(id, itemsSet) {
    const select = document.getElementById(id);
    while (select.options.length > 1) { select.remove(1); }
    Array.from(itemsSet).sort().forEach(item => {
        select.add(new Option(item, item));
    });
}

function populateDropdowns() {
    const provSet = new Set();
    const vendorSet = new Set();

    allSitesData.forEach(site => {
        if(site.prov && site.prov !== "-") provSet.add(site.prov);
        if(site.vendor) vendorSet.add(site.vendor);
    });

    fillSelect('filter-provinsi', provSet);
    fillSelect('filter-vendor', vendorSet);
    updateKotaDropdown(); 
}

function updateKotaDropdown() {
    const selectedProv = document.getElementById('filter-provinsi').value;
    const kotaSet = new Set();
    
    allSitesData.forEach(site => {
        if (selectedProv === "All" || site.prov === selectedProv) {
            if(site.city && site.city !== "-") kotaSet.add(site.city);
        }
    });
    
    fillSelect('filter-kota', kotaSet);
}

// --- LOGIKA FILTER & RENDER PETA ---
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const provFilter = document.getElementById('filter-provinsi').value;
    const kotaFilter = document.getElementById('filter-kota').value;
    const vendorFilter = document.getElementById('filter-vendor').value;

    markerCluster.clearLayers();
    const markersToAdd = [];
    let counts = { Macro: 0, Minimacro: 0, Inbuilding: 0 };

    allSitesData.forEach(site => {
        const matchSearch = site.name.toLowerCase().includes(searchTerm) || site.emr.toLowerCase().includes(searchTerm);
        const matchType = typeFilter === "All" || site.type === typeFilter;
        const matchProv = provFilter === "All" || site.prov === provFilter;
        const matchKota = kotaFilter === "All" || site.city === kotaFilter;
        const matchVendor = vendorFilter === "All" || site.vendor === vendorFilter;

        if (matchSearch && matchType && matchProv && matchKota && matchVendor) {
            
            if(counts[site.type] !== undefined) counts[site.type]++;

            let markerColor = "#2d98da"; 
            if (site.type === "Minimacro") markerColor = "#fc5c65";
            if (site.type === "Inbuilding") markerColor = "#9b59b6";

            const marker = L.circleMarker([site.lat, site.lng], {
                color: markerColor, fillColor: markerColor, fillOpacity: 0.8, radius: 8, weight: 2
            });

            marker.bindPopup(`
                <div style="min-width: 180px; padding: 2px;">
                    <h4 style="margin: 0 0 6px 0; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px; font-size:14px;">${site.name}</h4>
                    <p style="margin: 3px 0; font-size: 11px;"><b>EMR ID:</b> ${site.emr}</p>
                    <p style="margin: 3px 0; font-size: 11px;"><b>Tipe:</b> ${site.type}</p>
                    <p style="margin: 3px 0; font-size: 11px;"><b>Lokasi:</b> ${site.city}, ${site.prov}</p>
                    <p style="margin: 3px 0; font-size: 11px;"><b>Vendor:</b> ${site.vendor}</p>
                </div>
            `);
            markersToAdd.push(marker);
        }
    });

    markerCluster.addLayers(markersToAdd);
    document.getElementById('count-macro').innerText = counts.Macro;
    document.getElementById('count-mini').innerText = counts.Minimacro;
    document.getElementById('count-inbuilding').innerText = counts.Inbuilding;
}

// --- EVENT LISTENERS ---
document.getElementById('search-input').addEventListener('keyup', applyFilters);
document.getElementById('filter-type').addEventListener('change', applyFilters);
document.getElementById('filter-vendor').addEventListener('change', applyFilters);
document.getElementById('filter-kota').addEventListener('change', applyFilters);

document.getElementById('filter-provinsi').addEventListener('change', () => {
    updateKotaDropdown();
    applyFilters();
});