// js/peta.js

// Inisialisasi Peta dan Basemap Utama
var map = L.map('map').setView([-7.5666, 112.2384], 8);

// Simpan referensi ke basemap utama Anda dan tambahkan ke peta
var osmBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - BAPPENAS Pembangunan Indonesia Barat'
}).addTo(map);

// Variabel Global
var stuntingLayer, peternakanLayer, pertanianLayer, perkebunanLayer, perikananLayer;
var geojsonData;
let kabupatenDataForSearch = [];
let legends;
let currentBasemapLayer = osmBasemap; // Basemap OSM adalah yang aktif saat ini
let stuntingChart = null; // Deklarasi tunggal di scope global

// --- Definisi Tile Layers Tambahan ---
const additionalTileLayers = {
    esriImagery: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'contributors - BAPPENAS Pembangunan Indonesia Barat'
    })
};

// Fungsi untuk mengatur basemap aktif
function setBasemap(basemapType) {
    let newLayerToSet;
    let activeBasemapTypeForGallery;

    if (basemapType === 'osmStandard') {
        newLayerToSet = osmBasemap;
        activeBasemapTypeForGallery = 'osmStandard';
    } else if (basemapType === 'esriImagery' && additionalTileLayers.esriImagery) {
        newLayerToSet = additionalTileLayers.esriImagery;
        activeBasemapTypeForGallery = 'esriImagery';
    } else {
        console.error("Basemap type not recognized or not defined:", basemapType);
        return;
    }

    if (currentBasemapLayer && map.hasLayer(currentBasemapLayer) && currentBasemapLayer !== newLayerToSet) {
        map.removeLayer(currentBasemapLayer);
    }

    if (!map.hasLayer(newLayerToSet)) {
        newLayerToSet.addTo(map);
    }
    currentBasemapLayer = newLayerToSet;

    document.querySelectorAll('.basemap-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.basemapType === activeBasemapTypeForGallery) {
            item.classList.add('active');
        }
    });
}


// --- Fungsi-fungsi lain (createPopupContent, getColorStunting, dll.) ---
function createPopupContent(properties) {
    let content = `
        <div style="text-align: left; max-height: 300px; overflow-y: auto; padding-right:10px;">
            <div style="text-align: center;">
                <img src="${properties.icon_image || 'image/default.jpg'}" style="width:100px; height:100px; border-radius:5px; margin-bottom:10px;"><br>
                <b style="font-size: 17px;">${properties.WADMKK}</b><br>
                Provinsi: ${properties.WADMPR}<br>
            </div>`;
    let dataAdded = false;
    if (stuntingLayer && map.hasLayer(stuntingLayer) && typeof properties.stunting_rate !== 'undefined') {
        content += `<hr style="margin: 8px 0;">
                    <strong>Tingkat Stunting:</strong> <strong>${properties.stunting_rate}%</strong><br>
                    Komoditas Utama Umum: ${properties.main_commodity || '-'}`;
        dataAdded = true;
    }
    const categoriesToShow = {
        'Peternakan': { layer: peternakanLayer, key: 'Peternakan' },
        'Pertanian': { layer: pertanianLayer, key: 'Pertanian' },
        'Perkebunan': { layer: perkebunanLayer, key: 'Perkebunan' },
        'Perikanan': { layer: perikananLayer, key: 'Perikanan' }
    };
    for (const categoryName in categoriesToShow) {
        const catInfo = categoriesToShow[categoryName];
        if (catInfo.layer && map.hasLayer(catInfo.layer)) {
            content += `<hr style="margin: 8px 0;">`;
            if (properties.categories && properties.categories[catInfo.key] && properties.categories[catInfo.key].length > 0) {
                content += `<strong>Komoditas ${categoryName}:</strong><ul style="padding-left: 20px;">`;
                properties.categories[catInfo.key].forEach(item => {
                    content += `<li>${item.name}: ${item.value}</li>`;
                });
                content += `</ul>`;
            } else {
                content += `<strong>Komoditas ${categoryName}:</strong><br><em>Tidak ada data</em>`;
            }
            dataAdded = true;
        }
    }
    if (!dataAdded && (!stuntingLayer || !map.hasLayer(stuntingLayer))) {
        content += `<p style="margin-top:10px; text-align:center;"><em>Pilih layer data untuk menampilkan informasi.</em></p>`;
    }
    content += `</div>`;
    return content;
}
const getColorStunting = (rate) => {
    if (rate === null || typeof rate === 'undefined') return '#CCCCCC';
    return rate > 30 ? 'red' : rate > 20 ? 'orange' : 'green';
};
function styleStunting(feature) {
    return { fillColor: getColorStunting(feature.properties.stunting_rate), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7 };
}

// MODIFIKASI DI SINI untuk menambahkan label wilayah
// Di dalam file js/peta.js

// ... (kode Anda yang lain tetap sama) ...

// Di dalam file js/peta.js

// ... (kode Anda yang lain tetap sama) ...

// Di dalam file js/peta.js

// ... (kode Anda yang lain tetap sama) ...

// Di dalam file js/peta.js

// ... (kode Anda yang lain tetap sama) ...

// Di dalam file js/peta.js

// ... (kode Anda yang lain tetap sama) ...

function onEachFeatureDefault(feature, layer) {
    // Handler klik yang sudah ada untuk popup dan panel info
    layer.on('click', function (e) {
        showLayerPanel(feature.properties);
        const popupContentHtml = createPopupContent(feature.properties);
        L.popup({ maxWidth: 350 })
            .setLatLng(e.latlng)
            .setContent(popupContentHtml)
            .openOn(map);
    });

    // Tambahkan label wilayah menggunakan L.Marker dengan L.DivIcon
    if (feature.properties && feature.properties.WADMKK && typeof turf !== 'undefined') {
        const namaWilayah = feature.properties.WADMKK;

        // Kondisi untuk menampilkan label (kecuali "Kota " selain Surabaya dan Batu)
        if (namaWilayah === "Kota Surabaya" || namaWilayah === "Kota Batu" || !namaWilayah.startsWith("Kota ")) {
            
            let centerLatLng;

            // PENANGANAN KHUSUS UNTUK SUMENEP
            if (namaWilayah === "Sumenep") {
                // Tentukan koordinat manual untuk label Sumenep
                // Anda perlu mencari koordinat yang pas di atas salah satu pulau Sumenep.
                // Format: L.latLng(latitude, longitude)
                // Contoh (INI HANYA PERKIRAAN, ANDA HARUS MENCARI KOORDINAT YANG TEPAT):
                centerLatLng = L.latLng(-7.0100, 113.8600); // Ganti dengan koordinat yang Anda inginkan untuk Sumenep
            } else {
                // Untuk wilayah lain, hitung seperti biasa
                try {
                    const pointOnFeature = turf.pointOnFeature(feature.geometry);
                    if (pointOnFeature && pointOnFeature.geometry && pointOnFeature.geometry.coordinates) {
                        centerLatLng = L.latLng(pointOnFeature.geometry.coordinates[1], pointOnFeature.geometry.coordinates[0]);
                    } else {
                        console.warn("turf.pointOnFeature gagal untuk:", namaWilayah, "Menggunakan bounds center.");
                        if (layer.getBounds && layer.getBounds().isValid()) { // Tambah pengecekan isValid()
                             centerLatLng = layer.getBounds().getCenter();
                        } else {
                            console.warn("Tidak bisa mendapatkan bounds yang valid untuk:", namaWilayah);
                            return; 
                        }
                    }
                } catch (e) {
                    console.error("Error menghitung centroid untuk " + namaWilayah + ": ", e, "Menggunakan bounds center.");
                    if (layer.getBounds && layer.getBounds().isValid()) { // Tambah pengecekan isValid()
                        centerLatLng = layer.getBounds().getCenter();
                    } else {
                        console.warn("Tidak bisa mendapatkan bounds yang valid setelah error Turf.js untuk:", namaWilayah);
                       return; 
                    }
                }
            }
            
            if (!centerLatLng) {
                console.warn("Tidak bisa menentukan centerLatLng untuk label:", namaWilayah);
                return; // Lewati jika tidak bisa mendapatkan koordinat pusat
            }

            const labelIcon = L.divIcon({
                className: 'region-map-label-divicon',
                html: `<span>${namaWilayah}</span>`,
                iconSize: null,
                iconAnchor: [0, 0]
            });

            L.marker(centerLatLng, {
                icon: labelIcon,
                interactive: false,
            }).addTo(map);
        }
    }
}

// ... (sisa kode Anda tetap sama) ...

// ... (sisa kode Anda tetap sama) ...
// ... (sisa kode Anda tetap sama) ...

// ... (sisa kode Anda tetap sama) ...

// ... (sisa kode Anda tetap sama) ...
// AKHIR MODIFIKASI

function getColorPeternakan(featureProperties) {
    const data = featureProperties.categories && featureProperties.categories.Peternakan;
    if (!data || data.length === 0) return '#E0E0E0';
    const utama = data[0].name.toLowerCase();
    if (utama.includes('itik') || utama.includes('ayam')) return 'yellow';
    else if (utama.includes('sapi') || utama.includes('kerbau') || utama.includes('kambing')) return 'brown';
    return 'lightpink';
}
function stylePeternakan(feature) {
    return { fillColor: getColorPeternakan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7 };
}
function getColorPertanian(featureProperties) {
    const data = featureProperties.categories && featureProperties.categories.Pertanian;
    if (!data || data.length === 0) return '#E0E0E0';
    return '#90EE90';
}
function stylePertanian(feature) {
    return { fillColor: getColorPertanian(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
}
function getColorPerkebunan(featureProperties) {
    const data = featureProperties.categories && featureProperties.categories.Perkebunan;
    if (!data || data.length === 0) return '#E0E0E0';
    return '#8B4513';
}
function stylePerkebunan(feature) {
    return { fillColor: getColorPerkebunan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
}
function getColorPerikanan(featureProperties) {
    const data = featureProperties.categories && featureProperties.categories.Perikanan;
    if (!data || data.length === 0) return '#E0E0E0';
    return 'blue';
}
function stylePerikanan(feature) {
    return { fillColor: getColorPerikanan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
}
function updateVisibleLegends() {
    if (!legends) { console.warn("Objek 'legends' belum ada saat updateVisibleLegends."); return; }
     const layerDisplayStatus = {
        stunting: stuntingLayer && map.hasLayer(stuntingLayer),
        peternakan: peternakanLayer && map.hasLayer(peternakanLayer),
        pertanian: pertanianLayer && map.hasLayer(pertanianLayer),
        perkebunan: perkebunanLayer && map.hasLayer(perkebunanLayer),
        perikanan: perikananLayer && map.hasLayer(perikananLayer)
    };
    for (const key in legends) {
        if (legends[key]) {
            legends[key].style.display = layerDisplayStatus[key] ? 'block' : 'none';
        }
    }
}
function showLayerPanel(properties) {
    const panel = document.getElementById('layerPanel');
    const contentDiv = document.getElementById('layerContent');
    if (!panel || !contentDiv) {
        console.error("Elemen panel atau contentDiv tidak ditemukan!");
        return;
    }
    panel.style.display = 'block';
    const namaKabupaten = properties.WADMKK || 'Tidak Diketahui';
    let panelHtml = `<h3>${namaKabupaten}</h3>
                     <p>Provinsi: ${properties.WADMPR || '-'}</p>`;
    let dataDisplayedInPanel = false;
    const categoriesToShowInPanel = {
        'Peternakan': { layer: peternakanLayer, key: 'Peternakan' },
        'Pertanian': { layer: pertanianLayer, key: 'Pertanian' },
        'Perkebunan': { layer: perkebunanLayer, key: 'Perkebunan' },
        'Perikanan': { layer: perikananLayer, key: 'Perikanan' }
    };
    for (const categoryName in categoriesToShowInPanel) {
        const catInfo = categoriesToShowInPanel[categoryName];
        if (catInfo.layer && map.hasLayer(catInfo.layer)) {
            panelHtml += `<hr><div><strong>Komoditas ${categoryName}:</strong>`;
            if (properties.categories && properties.categories[catInfo.key] && properties.categories[catInfo.key].length > 0) {
                panelHtml += '<ul style="padding-left: 20px;">';
                properties.categories[catInfo.key].forEach(item => {
                    panelHtml += `<li>${item.name}: ${item.value}</li>`;
                });
                panelHtml += '</ul>';
            } else {
                panelHtml += '<br><em>Tidak ada data</em>';
            }
            panelHtml += '</div>';
            dataDisplayedInPanel = true;
        }
    }
    if (!dataDisplayedInPanel && (!stuntingLayer || !map.hasLayer(stuntingLayer))) {
         panelHtml += '<p style="margin-top:10px;"><em>Pilih layer data untuk menampilkan informasi.</em></p>';
    } else if (!dataDisplayedInPanel && stuntingLayer && map.hasLayer(stuntingLayer) && typeof properties.stunting_rate === 'undefined') {
        panelHtml += '<p style="margin-top:10px;"><em>Data komoditas lain tidak aktif.</em></p>';
    }
    contentDiv.innerHTML = panelHtml;
    const oldCloseBtn = panel.querySelector('.close-btn');
    if (oldCloseBtn) oldCloseBtn.remove();
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'close-btn';
    closeButton.onclick = function () { panel.style.display = 'none'; };
    panel.appendChild(closeButton);
    let chartContainer = panel.querySelector('#chartContainer');
    if (stuntingLayer && map.hasLayer(stuntingLayer)) {
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'chartContainer';
            chartContainer.innerHTML = `<p style="margin-top: -10px; margin-bottom: 6px;"><strong>Grafik Stunting</strong></p><canvas id="stuntingChart"></canvas>`;
            chartContainer.style = 'margin-top: -1px; width: 90%; height: 250px; background: white; padding: 10px; border-radius: 5px;';
            contentDiv.appendChild(chartContainer);
        }
        chartContainer.style.display = 'block';
        const stuntingRateForChart = parseFloat(properties.stunting_rate);
        if (properties.stunting_rate !== undefined && !isNaN(stuntingRateForChart)) {
             updateChart([{ name: namaKabupaten, stunting_rate: stuntingRateForChart }]);
        } else {
            const chartCanvas = document.getElementById('stuntingChart');
            if(chartCanvas) {
                const ctxChart = chartCanvas.getContext('2d');
                if (stuntingChart) stuntingChart.destroy();
                stuntingChart = null;
                ctxChart.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
                ctxChart.font = "14px Arial";
                ctxChart.textAlign = "center";
                ctxChart.fillText("Data stunting tidak tersedia untuk grafik", chartCanvas.width / 2, 50);
            }
        }
    } else {
        if (chartContainer) chartContainer.style.display = 'none';
        if (stuntingChart) {
            stuntingChart.destroy();
            stuntingChart = null;
        }
    }
}
function updateChart(data) {
    const chartCanvas = document.getElementById('stuntingChart');
    if (!chartCanvas) { console.error("Canvas stuntingChart tidak ditemukan!"); return; }
    const ctx = chartCanvas.getContext('2d');
    if (stuntingChart) stuntingChart.destroy();
    stuntingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Rata-Rata Jatim', ...data.map(d => d.name)],
            datasets: [{
                label: 'Tingkat Stunting (%)',
                data: [19.13, ...data.map(d => parseFloat(d.stunting_rate) || 0)],
                backgroundColor: ['rgba(0, 0, 255, 0.7)', ...data.map(d => getColorStunting(d.stunting_rate))],
                borderColor: ['rgba(0, 0, 255, 1)', ...data.map(d => {
                    const color = getColorStunting(d.stunting_rate);
                    if (color === 'red') return 'rgba(255,0,0,1)';
                    if (color === 'orange') return 'rgba(255,165,0,1)';
                    if (color === 'green') return 'rgba(0,128,0,1)';
                    if (color === '#CCCCCC') return 'rgba(204, 204, 204, 1)';
                    if (typeof color === 'string' && color.startsWith('rgba')) {
                        return color.replace(/,(\s*\d?\.?\d+)\)/, ', 1)');
                    }
                    return color;
                })],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false, plugins: { legend: { display: false } },
            responsive: true, scales: { y: { beginAtZero: true, max: 40 } }
        }
    });
}


// Fungsi utama yang akan dipanggil setelah DOM siap atau setelah data GeoJSON dimuat
function initializeApplication() {
    // --- PENGECEKAN ELEMEN DOM UTAMA ---
    const mapDiv = document.getElementById('map');
    const customLayerControlPanel = document.getElementById('customLayerControl');
    const toggleLayerControlButton = document.getElementById('toggleLayerControlButton');
    const basemapGalleryPanel = document.getElementById('basemapGalleryPanel');
    const toggleBasemapGalleryButton = document.getElementById('toggleBasemapGalleryButton');
    const closeCustomLayerControlButton = document.getElementById('closeCustomLayerControl');
    const closeBasemapGalleryButton = document.getElementById('closeBasemapGalleryButton');
    let domError = false;
    if (!mapDiv) { console.error("Elemen #map tidak ditemukan!"); domError = true; }
    if (!customLayerControlPanel) { console.error("Elemen #customLayerControl tidak ditemukan!"); domError = true; }
    if (!toggleLayerControlButton) { console.error("Elemen #toggleLayerControlButton tidak ditemukan!"); domError = true; }
    if (!basemapGalleryPanel) { console.error("Elemen #basemapGalleryPanel tidak ditemukan!"); domError = true; }
    if (!toggleBasemapGalleryButton) { console.error("Elemen #toggleBasemapGalleryButton tidak ditemukan!"); domError = true; }
    if (!closeCustomLayerControlButton) { console.error("Elemen #closeCustomLayerControl tidak ditemukan!"); domError = true; }
    if (!closeBasemapGalleryButton) { console.error("Elemen #closeBasemapGalleryButton tidak ditemukan!"); domError = true; }
    if (domError) {
        if (mapDiv) mapDiv.innerHTML = '<p style="text-align:center; padding-top:50px; color:red;">Error: Elemen DOM penting tidak ditemukan. Periksa ID di HTML.</p>';
        return;
    }

   // Di dalam fungsi initializeApplication()

    // --- LOGIKA KONTROL LAYER (DENGAN CHECKBOX MASTER KOMODITAS) ---
    const layerMapping = {
        'stunting': stuntingLayer, 'peternakan': peternakanLayer, 'pertanian': pertanianLayer,
        'perkebunan': perkebunanLayer, 'perikanan': perikananLayer
    };

    const allIndividualLayerCheckboxes = document.querySelectorAll('#customLayerControl .layer-label-text input[type="checkbox"]:not([data-is-master="true"])');
    const komoditasMasterCheckbox = document.getElementById('komoditasMasterCheckbox');
    const komoditasChildCheckboxes = document.querySelectorAll('.komoditas-child-checkbox');
    const stuntingCheckbox = document.querySelector('input[data-layer-name="stunting"]');

    let masterActionInProgress = false; 

    function updateMapAndLegendsFromCheckboxes() {
        allIndividualLayerCheckboxes.forEach(cb => {
            const layerName = cb.dataset.layerName;
            if (!layerName) return; 
            const layer = layerMapping[layerName];
            if (layer) {
                if (cb.checked) {
                    if (!map.hasLayer(layer)) map.addLayer(layer);
                } else {
                    if (map.hasLayer(layer)) map.removeLayer(layer);
                }
            }
        });
        updateVisibleLegends();
        if (!masterActionInProgress) {
            syncKomoditasMasterCheckboxState();
        }
    }

    function syncKomoditasMasterCheckboxState() {
        if (!komoditasMasterCheckbox) return;
        let anyChildChecked = false;
        komoditasChildCheckboxes.forEach(childCb => {
            if (childCb.checked) {
                anyChildChecked = true;
            }
        });
        const stuntingIsChecked = stuntingCheckbox ? stuntingCheckbox.checked : false;
        komoditasMasterCheckbox.checked = anyChildChecked && !stuntingIsChecked;
    }

    if (komoditasMasterCheckbox) {
        komoditasMasterCheckbox.addEventListener('change', function() {
            const isMasterNowChecked = this.checked;
            masterActionInProgress = true; 

            if (isMasterNowChecked) {
                if (stuntingCheckbox) stuntingCheckbox.checked = false;
                komoditasChildCheckboxes.forEach(childCb => {
                    childCb.checked = true;
                });
                if (komoditasChildCheckboxes.length === 0) {
                    this.checked = false; 
                }
            } else {
                komoditasChildCheckboxes.forEach(childCb => {
                    childCb.checked = false;
                });
            }
            updateMapAndLegendsFromCheckboxes(); 
            masterActionInProgress = false; 
        });
    }

    allIndividualLayerCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (masterActionInProgress) {
                return;
            }
            if (this.checked) {
                if (this === stuntingCheckbox) {
                    if (komoditasMasterCheckbox) komoditasMasterCheckbox.checked = false;
                    komoditasChildCheckboxes.forEach(childCb => childCb.checked = false);
                } else if (Array.from(komoditasChildCheckboxes).includes(this)) {
                    if (stuntingCheckbox) stuntingCheckbox.checked = false;
                    komoditasChildCheckboxes.forEach(otherChildCb => {
                        if (otherChildCb !== this) {
                            otherChildCb.checked = false;
                        }
                    });
                }
            }
            updateMapAndLegendsFromCheckboxes();
        });
    });

    masterActionInProgress = true; 
    if (stuntingCheckbox) {
        stuntingCheckbox.checked = (stuntingLayer && map.hasLayer(stuntingLayer));
    }
    komoditasChildCheckboxes.forEach(cb => cb.checked = false);
    updateMapAndLegendsFromCheckboxes(); 
    masterActionInProgress = false; 

    // --- Tombol Tutup dan Toggle Panel Layer ---
    if (closeCustomLayerControlButton && customLayerControlPanel) {
        closeCustomLayerControlButton.addEventListener('click', () => customLayerControlPanel.style.display = 'none');
    }
    if (toggleLayerControlButton && customLayerControlPanel) {
        toggleLayerControlButton.addEventListener('click', () => {
            const isHidden = customLayerControlPanel.style.display === 'none' || customLayerControlPanel.style.display === '';
            customLayerControlPanel.style.display = isHidden ? 'block' : 'none';
            if (basemapGalleryPanel && isHidden && basemapGalleryPanel.style.display !== 'none') {
                basemapGalleryPanel.style.display = 'none';
            }
        });
    }

    // --- LOGIKA DROPDOWN LEGENDA (UNTUK SETIAP LAYER ITEM) ---
    const layerItemsWithLegend = document.querySelectorAll('.custom-layer-control-body .layer-item-with-legend');
    function updateArrowIcon(toggleBtn, legendContentPanel) {
        if (!toggleBtn) return;
        const arrowSpan = toggleBtn.querySelector('.toggle-arrow');
        if (!arrowSpan) return;
        if (!legendContentPanel) {
            arrowSpan.textContent = '▸';
            return;
        }
        const isLegendaExpanded = legendContentPanel.style.display === 'block';
        arrowSpan.textContent = isLegendaExpanded ? '▾' : '▸';
    }

    layerItemsWithLegend.forEach(item => {
        const toggleBtn = item.querySelector('.legend-toggle-btn');
        const legendContentPanel = item.querySelector('.legend-content-panel');
        const checkbox = item.querySelector('input[type="checkbox"]'); 

        if (!toggleBtn || !checkbox) return;
        
        if (legendContentPanel) {
            const legendGroupId = checkbox.dataset.legendGroupId;
            if (!legendGroupId) { 
                toggleBtn.style.visibility = 'hidden';
                legendContentPanel.style.display = 'none';
                return;
            }

            updateArrowIcon(toggleBtn, legendContentPanel);
            const sourceLegendGroup = document.getElementById(legendGroupId);
            if (sourceLegendGroup) {
                legendContentPanel.innerHTML = sourceLegendGroup.innerHTML;
            } else {
                toggleBtn.style.visibility = 'hidden';
                legendContentPanel.style.display = 'none';
            }

            toggleBtn.addEventListener('click', () => {
                const isExpanded = legendContentPanel.style.display === 'block';
                legendContentPanel.style.display = isExpanded ? 'none' : 'block';
                toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
                updateArrowIcon(toggleBtn, legendContentPanel);
            });
        } else {
            toggleBtn.style.visibility = 'hidden';
        }
    });

    // --- LOGIKA GRUP LAYER KOMODITAS (Toggle Expand/Collapse) ---
    const groupToggleButtons = document.querySelectorAll('.group-toggle-btn');
    groupToggleButtons.forEach(button => {
        const groupContentId = button.getAttribute('aria-controls');
        const groupContentPanel = document.getElementById(groupContentId);
        const arrowSpan = button.querySelector('.toggle-arrow');

        if (groupContentPanel && arrowSpan) {
            function updateGroupArrowIcon() {
                const isExpanded = groupContentPanel.style.display === 'block';
                arrowSpan.textContent = isExpanded ? '▾' : '▸';
            }
            updateGroupArrowIcon();

            const groupHeader = button.closest('.layer-group-header');
            if (groupHeader) {
                groupHeader.addEventListener('click', (event) => {
                    const masterLabel = groupHeader.querySelector('.group-master-label');
                    if (masterLabel && masterLabel.contains(event.target)) {
                        return;
                    }
                    if (event.target === button || button.contains(event.target) || !masterLabel || !masterLabel.contains(event.target)) {
                        const isExpanded = groupContentPanel.style.display === 'block';
                        groupContentPanel.style.display = isExpanded ? 'none' : 'block';
                        button.setAttribute('aria-expanded', String(!isExpanded));
                        updateGroupArrowIcon();
                    }
                });
            }
        } else {
            if (!groupContentPanel) console.error(`Group content panel with ID '${groupContentId}' not found.`);
            if (!arrowSpan) console.error(`Arrow span not found in group toggle button for '${groupContentId}'.`);
        }
    });

    // --- LOGIKA GALERI BASEMAP ---
    if (toggleBasemapGalleryButton && basemapGalleryPanel && closeBasemapGalleryButton) {
        toggleBasemapGalleryButton.addEventListener('click', () => {
            const isPanelHidden = basemapGalleryPanel.style.display === 'none' || basemapGalleryPanel.style.display === '';
            basemapGalleryPanel.style.display = isPanelHidden ? 'block' : 'none';
            if (isPanelHidden) {
                const galleryContent = basemapGalleryPanel.querySelector('.basemap-gallery-content');
                if (galleryContent) galleryContent.style.display = 'flex';
            }
            if (customLayerControlPanel && isPanelHidden && customLayerControlPanel.style.display !== 'none') {
                customLayerControlPanel.style.display = 'none';
            }
        });
        closeBasemapGalleryButton.addEventListener('click', () => {
            basemapGalleryPanel.style.display = 'none';
        });
        const basemapItems = document.querySelectorAll('#basemapGalleryPanel .basemap-item');
        if (basemapItems.length > 0) {
            basemapItems.forEach(item => {
                item.addEventListener('click', function() {
                    const selectedBasemapType = this.dataset.basemapType;
                    if (selectedBasemapType) setBasemap(selectedBasemapType);
                });
            });
        } else {
             console.warn("Tidak ada .basemap-item yang ditemukan.");
        }
    } else {
        console.error("Satu atau lebih elemen untuk galeri basemap tidak ditemukan!");
    }

    const defaultActiveBasemapItem = document.querySelector('.basemap-item[data-basemap-type="osmStandard"]');
    if (defaultActiveBasemapItem) defaultActiveBasemapItem.classList.add('active');
}


// --- Memuat Data GeoJSON dan Membuat Layer ---
fetch('data/coba.geojson')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} untuk ${response.url}`);
        return response.json();
    })
    .then(data => {
        console.log("GeoJSON data loaded successfully");
        geojsonData = data;
        kabupatenDataForSearch = geojsonData.features.map(feature => {
            let centroid;
            try {
                if (feature.properties.WADMKK === "Gresik") centroid = [-7.155, 112.565];
                else if (feature.properties.WADMKK === "Situbondo") centroid = [-7.706, 114.009];
                else if (feature.properties.WADMKK === "Sumenep") centroid = [-7.000, 113.875];
                else if (feature.geometry && typeof turf !== 'undefined' && turf.pointOnFeature) {
                    const point = turf.pointOnFeature(feature);
                    centroid = [point.geometry.coordinates[1], point.geometry.coordinates[0]];
                } else if (feature.geometry) {
                    if (feature.geometry.type === "Point") centroid = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                    else if (feature.geometry.type === "MultiPolygon" && feature.geometry.coordinates[0][0][0]) centroid = [feature.geometry.coordinates[0][0][0][1], feature.geometry.coordinates[0][0][0][0]];
                    else if (feature.geometry.type === "Polygon" && feature.geometry.coordinates[0][0]) centroid = [feature.geometry.coordinates[0][0][1],feature.geometry.coordinates[0][0][0]];
                    else { centroid = [-7.5, 111.5]; console.warn("Fallback centroid for:", feature.properties.WADMKK); }
                } else {
                    centroid = [-7.5, 111.5]; console.warn("No geometry for:", feature.properties.WADMKK);
                }
            } catch(e) {
                console.error("Error calculating centroid for " + feature.properties.WADMKK + ": ", e);
                centroid = [-7.5, 111.5];
            }
            return {
                name: feature.properties.WADMKK, province: feature.properties.WADMPR,
                stunting_rate: feature.properties.stunting_rate, main_commodity: feature.properties.main_commodity,
                icon_image: feature.properties.icon_image, coords: centroid,
                categories: feature.properties.categories || {}
            };
        });

        stuntingLayer = L.geoJson(geojsonData, { style: styleStunting, onEachFeature: onEachFeatureDefault });
        peternakanLayer = L.geoJson(geojsonData, { style: stylePeternakan, onEachFeature: onEachFeatureDefault });
        pertanianLayer = L.geoJson(geojsonData, { style: stylePertanian, onEachFeature: onEachFeatureDefault });
        perkebunanLayer = L.geoJson(geojsonData, { style: stylePerkebunan, onEachFeature: onEachFeatureDefault });
        perikananLayer = L.geoJson(geojsonData, { style: stylePerikanan, onEachFeature: onEachFeatureDefault });

        if (stuntingLayer) stuntingLayer.addTo(map); // Default layer

        legends = {
            stunting: document.getElementById('legendaGroupStunting'),
            peternakan: document.getElementById('legendaGroupPeternakan'),
            pertanian: document.getElementById('legendaGroupPertanian'),
            perkebunan: document.getElementById('legendaGroupPerkebunan'),
            perikanan: document.getElementById('legendaGroupPerikanan')
        };

        initializeApplication();
    })
    .catch(error => {
        console.error('GAGAL MEMUAT GEOJSON atau ADA ERROR SETELAHNYA:', error);
        const mapDiv = document.getElementById('map');
        if (mapDiv) mapDiv.innerHTML = '<p style="text-align:center; padding-top:50px; color:red;">Gagal memuat data peta.</p>';
        if (map && (!map.getCenter() || map.getZoom() === undefined )) map.setView([-7.5666, 112.2384], 8);
    });

// --- Fungsi Panel Informasi, Update Chart, Pencarian Kustom ---
const searchContainer = document.createElement('div');
searchContainer.style = 'position: fixed; top: 85px; right: 20px; z-index: 1000; width: 330px;display: flex; flex-direction: column; align-items: center;';
const searchInputGroup = document.createElement('div');
searchInputGroup.style = 'position: relative; width: 100%;';
const searchInput = document.createElement('input');
searchInput.type = 'text'; searchInput.placeholder = 'Cari Kabupaten/Kota Jawa Timur...';
searchInput.style = 'width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;';
const clearButton = document.createElement('span');
clearButton.innerHTML = '×';
clearButton.style = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 20px; display: none; color: gray;';
const resultContainer = document.createElement('ul');
resultContainer.className = 'search-results';
resultContainer.style = 'width: 100%; background: white; list-style: none; padding: 0; margin: 0; border: 1px solid #ccc; border-top: none; max-height: 200px; overflow-y: auto; border-radius: 0 0 4px 4px; display:none; box-sizing: border-box;';
searchInputGroup.appendChild(searchInput); searchInputGroup.appendChild(clearButton);
searchContainer.appendChild(searchInputGroup); searchContainer.appendChild(resultContainer);
document.body.appendChild(searchContainer);
searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase(); resultContainer.innerHTML = '';
    clearButton.style.display = query ? 'block' : 'none';
    resultContainer.style.display = query ? 'block' : 'none';
    if (query && kabupatenDataForSearch.length > 0) {
        const filteredKab = kabupatenDataForSearch.filter(kabupaten => kabupaten.name.toLowerCase().includes(query));
        if (filteredKab.length > 0) {
            filteredKab.forEach(kabupaten => {
                const li = document.createElement('li'); li.textContent = kabupaten.name;
                li.style = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;';
                li.onmouseover = function() { this.style.backgroundColor = '#f0f0f0'; };
                li.onmouseout = function() { this.style.backgroundColor = 'white'; };
                li.addEventListener('click', () => {
                    if (!kabupaten.coords || typeof kabupaten.coords[0] === 'undefined' || typeof kabupaten.coords[1] === 'undefined') {
                        console.error("Koordinat tidak valid untuk:", kabupaten.name, kabupaten.coords);
                        return;
                    }
                    map.setView(kabupaten.coords, 10);
                    const originalFeatureProperties = geojsonData.features.find(f => f.properties.WADMKK === kabupaten.name)?.properties;
                    if (originalFeatureProperties) {
                        const popupContentHtml = createPopupContent(originalFeatureProperties);
                        L.popup({ maxWidth: 350 })
                        .setLatLng(kabupaten.coords)
                        .setContent(popupContentHtml)
                        .openOn(map);
                        showLayerPanel(originalFeatureProperties);
                    }
                    resultContainer.style.display = 'none'; searchInput.value = kabupaten.name; clearButton.style.display = 'block';
                });
                resultContainer.appendChild(li);
            });
        } else {
            const noResultLi = document.createElement('li'); noResultLi.textContent = 'Tidak ada hasil ditemukan';
            noResultLi.style = 'padding: 10px; color: grey; text-align: center;'; resultContainer.appendChild(noResultLi);
        }
    } else if (!query) {
        resultContainer.style.display = 'none';
    }
});
clearButton.addEventListener('click', function () {
    searchInput.value = ''; resultContainer.innerHTML = '';
    resultContainer.style.display = 'none'; clearButton.style.display = 'none'; searchInput.focus();
});
document.addEventListener('click', function(event) {
    if (searchContainer && !searchContainer.contains(event.target) && resultContainer) {
        resultContainer.style.display = 'none';
    }
});
searchInput.addEventListener('focus', function() {
    if (this.value && resultContainer && resultContainer.childNodes.length > 0) {
        resultContainer.style.display = 'block';
    }
});