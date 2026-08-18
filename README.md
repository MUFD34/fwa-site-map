# 🛰️ Dashboard-RAN: FWA Site Map Visualization

An interactive, web-based geographical dashboard designed for Radio Access Network (RAN) infrastructure visualization and optimization. This tool allows RF Engineers and Network Planners to dynamically map, filter, and analyze telecommunication site data (Macro, Minimacro, and Inbuilding) directly from raw Excel reports.

## ✨ Core Features
*   **Drag & Drop Data Ingestion:** Upload `.xlsx` or `.csv` files seamlessly. The data is processed entirely on the client-side (frontend) using SheetJS, ensuring zero latency and high data privacy.
*   **High-Performance Rendering:** Capable of rendering thousands of site coordinates smoothly using `Leaflet.markercluster` with dynamic bounds/coverage estimation visualization.
*   **Cascading Geospatial Filters:** Intelligent dropdowns that adapt based on the dataset (e.g., selecting a Province automatically filters the available Cities), alongside specific filters for Vendor and Site Type.
*   **Real-time Search:** Instantly locate specific infrastructures using Tower ID or EMR Project ID.
*   **Dual-Map Mode (Layer Control):** Seamlessly toggle between standard Street View and High-Resolution Google Satellite Imagery for accurate geographical and clutter analysis.
*   **Neumorphism UI:** A modern, clean, and intuitive user interface optimized for desktop network monitoring.

## 🛠️ Tech Stack
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Mapping Engine:** [Leaflet.js](https://leafletjs.com/)
*   **Data Processing:** [SheetJS (xlsx)](https://sheetjs.com/)
*   **Clustering:** Leaflet.markercluster

## 🚀 How to Use
1. Clone this repository or open the live deployment link.
2. Drag and drop your FWA Site Report (`.xlsx`) into the designated upload zone.
   *(Note: Ensure the Excel file contains columns for `Tower ID`, `Site Type`, `Latitude`, `Longitude`, `Kab/Kota`, `Provinsi`, and `Vendor`).*
3. Use the sidebar to filter by region, site type, or vendor.
4. Toggle the map layer button (top left) to switch to Satellite view for detailed geographical context.

## 🗺️ Future Roadmap & Planned Features
As part of continuous improvement for network planning efficiency, the following features are planned for future releases:
- [ ] **Export to CSV:** A one-click button to download the currently filtered site data for integration with RF simulation tools (e.g., Atoll, LinkPlanner).
- [ ] **RF Coverage Simulation:** Adding visual transparency radius circles (e.g., 500m for Macro, 100m for Minimacro) to estimate RF footprint and identify potential blank spots.
- [ ] **Measurement Tool (Inter-Site Distance):** An interactive ruler to measure the exact distance between two overlapping sites to analyze potential interference.
- [ ] **Data Visualization Dashboard:** Integration with `Chart.js` to display pie charts of Vendor distribution and Site Type ratios dynamically based on the active filter.
- [ ] **Geolocation Tool:** "Jump to My Location" feature to assist field technicians during Drive Test or site maintenance routing.

## 👨‍💻 Author
**Muhammad Taqi Mufid**
*Undergraduate Student in Broadband Multimedia* 
*Politeknik Negeri Jakarta*
