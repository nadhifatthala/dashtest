    // js/peta.js

    // Inisialisasi Peta
    var map = L.map('map').setView([-7.5666, 112.2384], 8);

    // Tambahkan Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">BAPPENAS</a> - Direktorat Regional I'
    }).addTo(map);

    // --- Variabel Global untuk Layer dan Data ---
    var stuntingLayer, peternakanLayer, pertanianLayer, perkebunanLayer, perikananLayer;
    var geojsonData;
    let kabupatenDataForSearch = []; // Untuk pencarian kustom
    let legends; // Definisikan di scope yang lebih luas

    // --- Fungsi Styling dan Popup Umum ---
    function createPopupContent(properties) {
        // ... (Kode fungsi createPopupContent Anda tetap sama)
        let content = `
            <div style="text-align: left; max-height: 300px; overflow-y: auto; padding-right:10px;">
                <div style="text-align: center;">
                    <img src="${properties.icon_image || 'image/default.jpg'}" style="width:100px; height:100px; border-radius:5px; margin-bottom:10px;"><br>
                    <b style="font-size: 17px;">${properties.WADMKK}</b><br>
                    Provinsi: ${properties.WADMPR}<br>
                </div>`;
        let dataAdded = false;
        if (map.hasLayer(stuntingLayer) && typeof properties.stunting_rate !== 'undefined') {
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
            if (map.hasLayer(catInfo.layer)) {
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
        if (!dataAdded && !map.hasLayer(stuntingLayer)) {
            content += `<p style="margin-top:10px; text-align:center;"><em>Pilih layer data untuk menampilkan informasi.</em></p>`;
        }
        content += `</div>`;
        return content;
    }

    // --- STUNTING ---
    const getColorStunting = (rate) => {
        // ... (Kode fungsi getColorStunting Anda tetap sama)
        if (rate === null || typeof rate === 'undefined') return '#CCCCCC';
        return rate > 30 ? 'red' : rate > 20 ? 'orange' : 'green';
    };
    function styleStunting(feature) {
        // ... (Kode fungsi styleStunting Anda tetap sama)
        return { fillColor: getColorStunting(feature.properties.stunting_rate), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7 };
    }

    function onEachFeatureDefault(feature, layer) {
        // ... (Kode fungsi onEachFeatureDefault Anda tetap sama)
        layer.on('click', function (e) {
            showLayerPanel(feature.properties);
            const popupContentHtml = createPopupContent(feature.properties);
            L.popup({ maxWidth: 350 })
                .setLatLng(e.latlng)
                .setContent(popupContentHtml)
                .openOn(map);
        });
    }

    // --- PETERNAKAN ---
    function getColorPeternakan(featureProperties) {
        // ... (Kode fungsi getColorPeternakan Anda tetap sama)
        const data = featureProperties.categories && featureProperties.categories.Peternakan;
        if (!data || data.length === 0) return '#E0E0E0';
        const utama = data[0].name.toLowerCase();
        if (utama.includes('itik') || utama.includes('ayam')) return 'yellow';
        else if (utama.includes('sapi') || utama.includes('kerbau') || utama.includes('kambing')) return 'brown';
        return 'lightpink';
    }
    function stylePeternakan(feature) {
        // ... (Kode fungsi stylePeternakan Anda tetap sama)
        return { fillColor: getColorPeternakan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7 };
    }

    // --- PERTANIAN ---
    function getColorPertanian(featureProperties) {
        // ... (Kode fungsi getColorPertanian Anda tetap sama)
        const data = featureProperties.categories && featureProperties.categories.Pertanian;
        if (!data || data.length === 0) return '#E0E0E0';
        return '#90EE90';
    }
    function stylePertanian(feature) {
        // ... (Kode fungsi stylePertanian Anda tetap sama)
        return { fillColor: getColorPertanian(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
    }

    // --- PERKEBUNAN ---
    function getColorPerkebunan(featureProperties) {
        // ... (Kode fungsi getColorPerkebunan Anda tetap sama)
        const data = featureProperties.categories && featureProperties.categories.Perkebunan;
        if (!data || data.length === 0) return '#E0E0E0';
        return '#8B4513';
    }
    function stylePerkebunan(feature) {
        // ... (Kode fungsi stylePerkebunan Anda tetap sama)
        return { fillColor: getColorPerkebunan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
    }

    // --- PERIKANAN ---
    function getColorPerikanan(featureProperties) {
        // ... (Kode fungsi getColorPerikanan Anda tetap sama)
        const data = featureProperties.categories && featureProperties.categories.Perikanan;
        if (!data || data.length === 0) return '#E0E0E0';
        return 'blue';
    }
    function stylePerikanan(feature) {
        // ... (Kode fungsi stylePerikanan Anda tetap sama)
        return { fillColor: getColorPerikanan(feature.properties), weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.5 };
    }

    // --- FUNGSI UNTUK MENGATUR VISIBILITAS LEGENDA ---
    function updateVisibleLegends() {
        if (!legends) { // Pastikan legends sudah diinisialisasi
            console.warn("Objek 'legends' belum diinisialisasi saat updateVisibleLegends dipanggil.");
            return;
        }

        const layerDisplayStatus = {
            stunting: map.hasLayer(stuntingLayer),
            peternakan: map.hasLayer(peternakanLayer),
            pertanian: map.hasLayer(pertanianLayer),
            perkebunan: map.hasLayer(perkebunanLayer),
            perikanan: map.hasLayer(perikananLayer)
        };

        for (const key in legends) {
            if (legends[key]) { // Pastikan elemen legenda ada
                if (layerDisplayStatus[key]) {
                    legends[key].style.display = 'block';
                } else {
                    legends[key].style.display = 'none';
                }
            }
        }
    }


    // --- Memuat Data GeoJSON dan Membuat Layer ---
    fetch('data/coba.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} untuk ${response.url}`);
            }
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

            // Layer default yang aktif
            stuntingLayer.addTo(map); 

            // HAPUS KONTROL LAYER LEAFLET DEFAULT
            // var overlayMaps = { ... };
            // L.control.layers(null, overlayMaps, ...).addTo(map);

            // Inisialisasi objek legends
            legends = {
                stunting: document.getElementById('legendaGroupStunting'),
                peternakan: document.getElementById('legendaGroupPeternakan'),
                pertanian: document.getElementById('legendaGroupPertanian'),
                perkebunan: document.getElementById('legendaGroupPerkebunan'),
                perikanan: document.getElementById('legendaGroupPerikanan')
            };

            // --- LOGIKA UNTUK KONTROL LAYER KUSTOM ---
        const customLayerControlPanel = document.getElementById('customLayerControl');
        const customLayerControlCheckboxes = document.querySelectorAll('#customLayerControl input[type="checkbox"]');
        const closeCustomLayerControlButton = document.getElementById('closeCustomLayerControl');
        const toggleLayerControlButton = document.getElementById('toggleLayerControlButton');

        const layerMapping = {
            'stunting': stuntingLayer,
            'peternakan': peternakanLayer,
            'pertanian': pertanianLayer,
            'perkebunan': perkebunanLayer,
            'perikanan': perikananLayer
        };

        // Fungsi untuk menambah/menghapus layer dan mengupdate legenda
        function updateMapLayersAndLegends() {
            customLayerControlCheckboxes.forEach(cb => {
                const layerName = cb.dataset.layerName;
                const layer = layerMapping[layerName];
                if (layer) {
                    if (cb.checked) {
                        if (!map.hasLayer(layer)) {
                            map.addLayer(layer);
                        }
                    } else {
                        if (map.hasLayer(layer)) {
                            map.removeLayer(layer);
                        }
                    }
                }
            });
            updateVisibleLegends(); // Panggil fungsi update legenda
        }


        // Modifikasi event listener untuk checkbox
        customLayerControlCheckboxes.forEach(checkbox => {
            // Inisialisasi status centang awal (hanya satu yang aktif, misal stunting)
            const layerName = checkbox.dataset.layerName;
            const layer = layerMapping[layerName];
            // Awalnya hanya stuntingLayer yang aktif dan tercentang
            if (layerName === 'stunting' && layer && map.hasLayer(layer)) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
                // Pastikan layer lain tidak ada di peta jika tidak tercentang
                if (layer && map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            }

            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Jika checkbox ini dicentang, uncheck semua checkbox lain
                    customLayerControlCheckboxes.forEach(otherCb => {
                        if (otherCb !== this) {
                            otherCb.checked = false;
                        }
                    });
                }
                // Setelah status checkbox diatur, perbarui layer di peta dan legenda
                updateMapLayersAndLegends();
            });
        });

        // Panggil updateMapLayersAndLegends sekali di awal untuk sinkronisasi
        updateMapLayersAndLegends();


        if (closeCustomLayerControlButton && customLayerControlPanel) {
            // ... (logika tombol close tetap sama) ...
            closeCustomLayerControlButton.addEventListener('click', function() {
                customLayerControlPanel.style.display = 'none';
            });
        }
        
        if (toggleLayerControlButton && customLayerControlPanel) {
            // ... (logika tombol toggle panel tetap sama) ...
            toggleLayerControlButton.addEventListener('click', function() {
                if (customLayerControlPanel.style.display === 'none' || customLayerControlPanel.style.display === '') {
                    customLayerControlPanel.style.display = 'block';
                } else {
                    customLayerControlPanel.style.display = 'none';
                }
            });
        } else {
            console.warn("Tombol toggleLayerControlButton atau customLayerControlPanel tidak ditemukan.");
        }
            updateVisibleLegends(); // Panggil untuk state awal legenda

            // HAPUS event listener map.on('overlayadd'/'overlayremove') yang lama untuk legenda
            // karena sekarang dikontrol oleh checkbox kustom dan updateVisibleLegends()
            // map.on('overlayadd', function(e) { ... }); // HAPUS
            // map.on('overlayremove', function(e) { ... }); // HAPUS
            // HAPUS fungsi hideAllDataLegends() jika ada

        })
        .catch(error => {
            console.error('GAGAL MEMUAT GEOJSON atau ADA ERROR SETELAHNYA:', error);
            const mapDiv = document.getElementById('map');
            if (mapDiv) {
                mapDiv.innerHTML = '<p style="text-align:center; padding-top:50px; color:red;">Gagal memuat data peta. Silakan periksa konsol (F12) untuk detail.</p>';
            }
        });

  // js/peta.js
// ... (kode Anda yang lain) ...

// --- Fungsi Panel Informasi (MODIFIED: Hapus teks info stunting, grafik tetap) ---
function showLayerPanel(properties) {
    const panel = document.getElementById('layerPanel');
    const contentDiv = document.getElementById('layerContent'); // Pastikan variabel ini 'contentDiv'
    if (!panel || !contentDiv) {
        console.error("Elemen panel atau contentDiv tidak ditemukan!");
        return;
    }
    panel.style.display = 'block';
    const namaKabupaten = properties.WADMKK || 'Tidak Diketahui';

    // Bangun HTML dasar untuk panel (Nama Kabupaten, Provinsi)
    let panelHtml = `<h3>${namaKabupaten}</h3>
                     <p>Provinsi: ${properties.WADMPR || '-'}</p>`;

    let dataDisplayedInPanel = false; // Untuk melacak apakah ada data kategori yang ditampilkan

    // --- HAPUS BAGIAN INI UNTUK INFO TEKS STUNTING ---
    /*
    if (map.hasLayer(stuntingLayer) && typeof properties.stunting_rate !== 'undefined') {
        panelHtml += `<hr><div><strong>Tingkat Stunting:</strong> ${properties.stunting_rate}%`;
        if (properties.main_commodity) {
            panelHtml += `<br>Komoditas Utama Umum: ${properties.main_commodity}`;
        }
        panelHtml += `</div>`;
        // dataDisplayedInPanel = true; // Jangan set true di sini agar pesan "Tidak ada data" muncul jika hanya stunting aktif
    }
    */
    // --- AKHIR BAGIAN YANG DIHAPUS ---


    // Daftar kategori untuk panel (Peternakan, Pertanian, dll.)
    const categoriesToShowInPanel = {
        'Peternakan': { layer: peternakanLayer, key: 'Peternakan' },
        'Pertanian': { layer: pertanianLayer, key: 'Pertanian' },
        'Perkebunan': { layer: perkebunanLayer, key: 'Perkebunan' },
        'Perikanan': { layer: perikananLayer, key: 'Perikanan' }
    };

    for (const categoryName in categoriesToShowInPanel) {
        const catInfo = categoriesToShowInPanel[categoryName];
        if (map.hasLayer(catInfo.layer)) { // Cek jika layer aktif
            panelHtml += `<hr><div><strong>Komoditas ${categoryName}:</strong>`;
            if (properties.categories && properties.categories[catInfo.key] && properties.categories[catInfo.key].length > 0) {
                panelHtml += '<ul style="padding-left: 20px;">'; // Anda sudah punya ini untuk indentasi
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
    
    // Pesan jika tidak ada data dari layer kategori aktif
    // dan layer stunting juga tidak aktif (karena grafik stunting akan tetap muncul jika layer stunting aktif)
    if (!dataDisplayedInPanel && !map.hasLayer(stuntingLayer)) { 
         panelHtml += '<p style="margin-top:10px;"><em>Tidak ada data dari layer aktif untuk ditampilkan di panel ini.</em></p>';
    } else if (!dataDisplayedInPanel && map.hasLayer(stuntingLayer) && typeof properties.stunting_rate === 'undefined') {
        // Jika hanya layer stunting aktif tapi tidak ada data stunting rate untuk grafik
        panelHtml += '<p style="margin-top:10px;"><em>Data komoditas lain tidak aktif.</em></p>';
    }


    contentDiv.innerHTML = panelHtml; // Set HTML utama panel

    // Tombol Close (tetap ada)
    const oldCloseBtn = panel.querySelector('.close-btn');
    if (oldCloseBtn) oldCloseBtn.remove();
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'close-btn';
    closeButton.onclick = function () { panel.style.display = 'none'; };
    panel.appendChild(closeButton); // Tambahkan ke panel, bukan contentDiv

    // Logika Chart Stunting (TETAP ADA dan SELALU DITAMPILKAN JIKA LAYER STUNTING AKTIF)
    let chartContainer = panel.querySelector('#chartContainer');
    if (map.hasLayer(stuntingLayer)) { // Hanya tampilkan/update chart jika layer stunting aktif
        // Di dalam showLayerPanel, modifikasi pembuatan chartContainer:

        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'chartContainer';
            // Kurangi margin-top pada <p> atau hilangkan jika tidak perlu spasi ekstra di atas judul
            chartContainer.innerHTML = `<p style="margin-top: -10px; margin-bottom: 6px;"><strong>Grafik Stunting</strong></p><canvas id="stuntingChart"></canvas>`; // Kurangi margin-top di sini
            // Kurangi margin-top pada style chartContainer
            chartContainer.style = 'margin-top: -1px; width: 90%; height: 250px; background: white; padding: 10px; border-radius: 5px;'; // Kurangi margin-top di sini juga
            contentDiv.appendChild(chartContainer); 
        }
        chartContainer.style.display = 'block'; // Pastikan ini ada untuk menampilkan kembali jika sebelumnya disembunyikan

        // ... (sisa logika chart)

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
        // Jika layer stunting tidak aktif, sembunyikan chart dan hancurkan instance
        if (chartContainer) chartContainer.style.display = 'none';
        if (stuntingChart) {
            stuntingChart.destroy();
            stuntingChart = null;
        }
    }
}

// ... (sisa kode Anda, termasuk fungsi updateChart, createPopupContent, dll., tetap sama) ...
    // --- Fungsi updateChart ---
    let stuntingChart = null; // Sudah didefinisikan di atas, ini redundan
    function updateChart(data) {
        // ... (Kode fungsi updateChart Anda tetap sama)
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
                    data: [19.13, ...data.map(d => d.stunting_rate)],
                    backgroundColor: ['rgba(0, 0, 255, 0.7)', ...data.map(d => getColorStunting(d.stunting_rate))],
                    borderColor: ['rgba(0, 0, 255, 1)', ...data.map(d => {
                        const color = getColorStunting(d.stunting_rate);
                        if (color === 'red') return 'rgba(255,0,0,1)';
                        if (color === 'orange') return 'rgba(255,165,0,1)';
                        if (color === 'green') return 'rgba(0,128,0,1)';
                        return color.replace('0.7', '1');
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

    // --- Fungsi Pencarian Kustom ---
    // ... (Kode fungsi pencarian kustom Anda tetap sama)
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
        if (searchContainer && !searchContainer.contains(event.target)) {
            if(resultContainer) resultContainer.style.display = 'none';
        }
    });
    searchInput.addEventListener('focus', function() {
        if (this.value && resultContainer && resultContainer.childNodes.length > 0) {
            resultContainer.style.display = 'block';
        }
    });

