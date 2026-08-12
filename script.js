// 1. Inisialisasi Peta
const map = L.map('map', { zoomControl: false }).setView([-6.220, 106.825], 13);
L.control.zoom({ position: 'bottomright' }).addTo(map);
map.attributionControl.setPrefix('🇮🇩 <a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

// 2. Data Dummy Site 
const sitesData = [
    { name: "Site Sudirman 01", type: "Macro", status: "Active", lat: -6.225, lng: 106.811, rsrp: "-85 dBm", capacity: "95%" },
    { name: "Site Kuningan 04", type: "Macro", status: "Maintenance", lat: -6.229, lng: 106.829, rsrp: "-110 dBm", capacity: "12%" },
    { name: "Mini Thamrin 02", type: "Minimacro", status: "Active", lat: -6.195, lng: 106.821, rsrp: "-75 dBm", capacity: "80%" },
    { name: "Mini Setiabudi", type: "Minimacro", status: "Active", lat: -6.211, lng: 106.828, rsrp: "-80 dBm", capacity: "65%" },
    { name: "Site Gatot Subroto", type: "Macro", status: "Active", lat: -6.235, lng: 106.820, rsrp: "-88 dBm", capacity: "78%" }
];

// FITUR BARU: Layer Group untuk menampung marker agar mudah dihapus/digambar ulang
const markerLayer = L.layerGroup().addTo(map);

// 3. Fungsi Render dengan Parameter Filter & Perhitungan Otomatis
function renderMarkers(filterType = "All") {
    markerLayer.clearLayers();

    // Variabel untuk menghitung jumlah site yang tampil
    let countMacro = 0;
    let countMini = 0;

    sitesData.forEach(site => {
        // Logika Filter
        if (filterType !== "All") {
            if (filterType === "Maintenance" && site.status !== "Maintenance") return;
            if (filterType === "Macro" && (site.type !== "Macro" || site.status === "Maintenance")) return;
            if (filterType === "Minimacro" && (site.type !== "Minimacro" || site.status === "Maintenance")) return;
        }

        // Kalkulasi jumlah
        if (site.type === "Macro") countMacro++;
        if (site.type === "Minimacro") countMini++;

        let markerColor = "#2d98da"; 
        let radiusSize = 12; 

        if (site.status === "Maintenance") {
            markerColor = "#fed330"; 
        } else if (site.type === "Minimacro") {
            markerColor = "#fc5c65"; 
            radiusSize = 8; 
        }

        const marker = L.circleMarker([site.lat, site.lng], {
            color: markerColor,
            fillColor: markerColor,
            fillOpacity: 0.8,
            radius: radiusSize,
            weight: 2
        }).addTo(markerLayer);

        marker.on('mouseover', function () {
            this.setStyle({ weight: 4, fillOpacity: 1, radius: radiusSize + 4 });
            this.bindTooltip(`<b>${site.name}</b> (${site.type})`, { direction: 'top' }).openTooltip();
        });

        marker.on('mouseout', function () {
            this.setStyle({ weight: 2, fillOpacity: 0.8, radius: radiusSize });
        });

        const popupContent = `
            <div style="font-family: 'Segoe UI', sans-serif; min-width: 150px; padding: 2px;">
                <h4 style="margin: 0 0 6px 0; color: #333; border-bottom: 2px solid ${markerColor}; padding-bottom: 4px;">${site.name}</h4>
                <p style="margin: 3px 0; font-size: 13px;"><b>Tipe:</b> ${site.type}</p>
                <p style="margin: 3px 0; font-size: 13px;"><b>Status:</b> <span style="color:${site.status === 'Active' ? '#27ae60' : '#e67e22'}; font-weight:bold;">${site.status}</span></p>
                <p style="margin: 3px 0; font-size: 13px;"><b>RSRP Avg:</b> ${site.rsrp}</p>
                <p style="margin: 3px 0; font-size: 13px;"><b>Kapasitas:</b> ${site.capacity}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });

    // Mengubah angka di HTML secara dinamis
    document.getElementById('count-macro').innerText = countMacro;
    document.getElementById('count-mini').innerText = countMini;
}

// Gambar titik untuk pertama kali (tampilkan semua)
renderMarkers();

// FITUR BARU: Logika Interaktif Tombol Filter
document.querySelectorAll('.neu-btn').forEach(button => {
    button.addEventListener('click', function() {
        // 1. Hapus efek "aktif" dari semua tombol
        document.querySelectorAll('.neu-btn').forEach(btn => btn.classList.remove('active'));
        
        // 2. Berikan efek "aktif" ke tombol yang sedang diklik (tenggelam)
        this.classList.add('active');
        
        // 3. Ambil data kategori dan saring petanya
        const filterValue = this.getAttribute('data-filter');
        renderMarkers(filterValue);
    });
});