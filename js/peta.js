// Inisialisasi Peta
var map = L.map('map').setView([-7.5666, 112.2384], 8);

// Tambahkan Tile Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">BAPPENAS</a> - Direktorat Regional I'
}).addTo(map);

// Fungsi untuk menentukan warna berdasarkan tingkat stunting
const getColor = (rate) => {
    return rate > 30 ? 'red':
            rate > 20 ? 'orange':
            'green';
}; 

// Fungsi untuk menampilkan gaya poligon berdasarkan data GeoJSON
function style(feature) {
    return {
        fillColor: getColor(feature.properties.stunting_rate), // Ambil nilai stunting dari properti
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

let kabupatenData = []; // Menyimpan data untuk pencarian

fetch('data/coba.geojson')
    .then(response => response.json())
    .then(data => {
        kabupatenData = data.features.map(feature => {
            // Hitung centroid menggunakan Turf.js
            let centroid;
            if (feature.properties.WADMKK === "Gresik") {
                centroid = [112.565, -7.155];  // Perbaikan: Longitude dulu baru Latitude
            } else if (feature.properties.WADMKK === "Situbondo") {
                centroid = [114.009, -7.706];  // Koordinat manual untuk pusat Situbondo
            } else if (feature.properties.WADMKK === "Sumenep") {
                centroid = [113.875, -7.000];  // Koordinat manual untuk pusat Sumenep
            } else {
                centroid = turf.pointOnFeature(feature).geometry.coordinates;
            }
            let coords = [centroid[1], centroid[0]];  // Pastikan tetap swap jika library butuh lat-lng

            return {
                name: feature.properties.WADMKK,
                province: feature.properties.WADMPR,
                stunting_rate: feature.properties.stunting_rate,
                main_commodity: feature.properties.main_commodity,
                icon_image: feature.properties.icon_image,
                coords: coords,
                categories: feature.properties.categories || {}
            };
        });

        // L.geoJson(data, {
        //     style: style,
        //     onEachFeature: function (feature, layer) {
        //         if (feature.properties) {
        //             const popupContent = `
        //                 <div style="text-align: center;">
        //                     <img src="${feature.properties.icon_image}" style="width:100px; height:100px; border-radius:5px; margin-bottom:10px;"><br>
        //                     <b>${feature.properties.WADMKK}</b><br>
        //                     <b>Provinsi:</b> ${feature.properties.WADMPR}<br>
        //                     <b>Tingkat Stunting:</b> ${feature.properties.stunting_rate}%<br>
        //                     <b>Komoditas Utama:</b> ${feature.properties.main_commodity}
        //                 </div>
        //             `;

        //             layer.bindPopup(popupContent);
        //         }
        //     }
        // }).addTo(map);
    })
    .catch(error => console.error('Error memuat GeoJSON:', error));

// Load GeoJSON dari URL (sesuaikan path)
fetch('data/coba.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJson(data, {
            style: style, 
            onEachFeature: onEachFeature
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Event Klik Wilayah
function onEachFeature(feature, layer) {
    layer.on('click', function () {
        showLayerPanel(feature.properties);
    });
    // Bagian bindPopup (tooltip popup saat klik polygon)
    if (feature.properties) {
        const popupContent = `
            <div style="text-align: center;">
                <img src="${feature.properties.icon_image}" style="width:100px; height:100px; border-radius:5px; margin-bottom:10px;"><br>
                <b style="font-size: 17px;">${feature.properties.WADMKK}</b><br>
                <b>Provinsi:</b> ${feature.properties.WADMPR}<br>
                <b>Tingkat Stunting:</b> ${feature.properties.stunting_rate}%<br>
                <b>Komoditas Utama:</b> ${feature.properties.main_commodity}
            </div>
        `;
        layer.bindPopup(popupContent);
    }
}

// Tampilkan Panel Kategori dan Komoditas
function showLayerPanel(properties) {
    const panel = document.getElementById('layerPanel');
    const content = document.getElementById('layerContent');

    panel.style.display = 'block';
    const namaKabupaten = properties.name || properties.WADMKK || 'Tidak Diketahui';
    content.innerHTML = `<h3>${namaKabupaten}</h3><p><strong>Komoditas Utama</strong></p>`;

    // Hapus tombol close sebelumnya agar tidak dobel
    const oldCloseBtn = panel.querySelector('.close-btn');
    if (oldCloseBtn) oldCloseBtn.remove();

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'close-btn';
    closeButton.onclick = function () {
        panel.style.display = 'none';
    };
    panel.appendChild(closeButton);

    const categories = properties.categories || {};

    if (Object.keys(categories).length === 0) {
        content.innerHTML += `<p><em>Tidak ada data kategori.</em></p>`;
    } else {
        for (const [category, items] of Object.entries(categories)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category');

            // Tambahkan tombol plus tanpa kotak
            const categoryToggle = document.createElement('span');
            categoryToggle.innerHTML = '+';
            categoryToggle.classList.add('toggle-button');
            categoryToggle.setAttribute('data-category', category);

            const categoryLabel = document.createElement('span');
            categoryLabel.innerHTML = `<strong>${category}</strong>`;
            categoryLabel.classList.add('category-label');

            categoryDiv.appendChild(categoryToggle);
            categoryDiv.appendChild(categoryLabel);

            const itemsDiv = document.createElement('div');
            itemsDiv.classList.add('items');
            itemsDiv.style.display = 'none';

            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.innerText = ` ${item.name} (${item.value})`; //-tanda min
                itemDiv.classList.add(`item-${category}`);
                itemsDiv.appendChild(itemDiv);
            });

            categoryDiv.appendChild(itemsDiv);
            content.appendChild(categoryDiv);

            // Event listener untuk expand/collapse saat tombol plus diklik
            categoryToggle.addEventListener('click', function () {
                const isExpanded = itemsDiv.style.display === 'block';
                itemsDiv.style.display = isExpanded ? 'none' : 'block';
                this.innerHTML = isExpanded ? '+' : '−';  // Ganti jadi minus saat terbuka
            });
        }
    }

    // Tambahkan grafik ke dalam panel dengan judul "Grafik Stunting"
    let chartContainer = document.getElementById('chartContainer');
    if (!chartContainer) {
        chartContainer = document.createElement('div');
        chartContainer.id = 'chartContainer';
        chartContainer.innerHTML = `<p><strong>Grafik Stunting</strong></p>
                                    <canvas id="stuntingChart"></canvas>`;
        chartContainer.style = 'margin-top: 15px; width: 90%; height: 300px; background: white; padding: 10px; border-radius: 5px;';
        content.appendChild(chartContainer);
    }

    // Update data grafik dengan warna sesuai kategori stunting_rate
    updateChart([{ name: namaKabupaten, stunting_rate: properties.stunting_rate }]);
}

let stuntingChart = null;

function updateChart(data) {
    const ctx = document.getElementById('stuntingChart').getContext('2d');

    if (stuntingChart) {
        stuntingChart.destroy();
    }

    stuntingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Rata-Rata Jatim', ...data.map(d => d.name)],
            datasets: [{
                label: 'Tingkat Stunting (%)',
                data: [19.13, ...data.map(d => d.stunting_rate)],
                backgroundColor: [
                    'rgba(0, 0, 255, 0.7)', // Biru untuk rata-rata
                    ...data.map(d => {
                    if (d.stunting_rate > 30) return 'rgba(255, 0, 0, 0.7)'; // Merah
                    else if (d.stunting_rate > 20) return 'rgba(255, 165, 0, 0.7)'; // Oranye
                    else return 'rgba(0, 128, 0, 0.7)'; // Hijau
                })],
                borderColor: [
                    'rgba(0, 0, 255, 1)', // Biru untuk rata-rata
                    ...data.map(d => {
                    if (d.stunting_rate > 30) return 'rgba(255, 0, 0, 1)';
                    else if (d.stunting_rate > 20) return 'rgba(255, 165, 0, 1)';
                    else return 'rgba(0, 128, 0, 1)';
                })],
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false // Menghilangkan legenda
                }
            },
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 40
                }
            }
        }
    });
}

// Event listener untuk checkbox tampil/sembunyikan komoditas

// Fungsi Pencarian Kustom
const searchContainer = document.createElement('div');
searchContainer.style = 'position: fixed; top: 85px; right: 20px; z-index: 1000; width: 330px;display: flex; align-items: center;';

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.placeholder = 'Cari Kabupaten/Kota Jawa Timur...';
searchInput.style = 'width: 100%; padding: 10px;';

// Tombol Hapus (Silang "×")
const clearButton = document.createElement('span');
clearButton.innerHTML = '&times;';
clearButton.style = 'position: absolute; right: 25px; top: 50%; transform: translateY(-50%); cursor: pointer; font-size: 18px; display: none; color: gray;';

// Container hasil pencarian
const resultContainer = document.createElement('ul');
resultContainer.className = 'search-results';
resultContainer.style = 'position: fixed; top: 125px; right: 20px; z-index: 1000; width: 330px; background: white; list-style: none; padding: 0; margin: 0;';

// Menambahkan elemen ke dalam container
searchContainer.appendChild(searchInput);
searchContainer.appendChild(clearButton);
document.body.appendChild(searchContainer);
document.body.appendChild(resultContainer);

// Event untuk menampilkan daftar hasil pencarian dan tombol hapus
searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    resultContainer.innerHTML = '';
    clearButton.style.display = query ? 'block' : 'none'; // Menampilkan tombol silang jika ada input

    if (query && kabupatenData.length > 0) {
        kabupatenData.forEach(kabupaten => {
            if (kabupaten.name.toLowerCase().includes(query)) {
                const li = document.createElement('li');
                li.textContent = kabupaten.name;
                li.style = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;';
                
                li.addEventListener('click', () => {
                    map.setView(kabupaten.coords, 10);

                    let imgSrc = kabupaten.icon_image ? kabupaten.icon_image : "image/default.jpg";
                    let commodity = kabupaten.main_commodity !== "-" ? kabupaten.main_commodity : "Tidak ada data";

                    const popupContent = `
                        <div style="text-align: center;">
                            <img src="${imgSrc}" style="width:100px; height:100px; border-radius:5px; margin-bottom:10px;"><br>
                            <b style="font-size: 17px;">${kabupaten.name}</b><br>
                            <b>Provinsi:</b> ${kabupaten.province}<br>
                            <b>Tingkat Stunting:</b> ${kabupaten.stunting_rate}%<br>
                            <b>Komoditas Utama:</b> ${commodity}
                        </div>
                    `;

                    L.popup()
                        .setLatLng(kabupaten.coords)
                        .setContent(popupContent)
                        .openOn(map);

                    showLayerPanel({
                        name: kabupaten.name,
                        province: kabupaten.province,
                        stunting_rate: kabupaten.stunting_rate,
                        main_commodity: kabupaten.main_commodity,
                        icon_image: kabupaten.icon_image,
                        categories: kabupaten.categories || {}
                    });

                    resultContainer.innerHTML = '';
                    searchInput.value = kabupaten.name;
                    clearButton.style.display = 'block';
                });

                resultContainer.appendChild(li);
            }
        });
    }
});

// Event untuk menghapus teks input saat tombol silang ditekan
clearButton.addEventListener('click', function () {
    searchInput.value = '';
    resultContainer.innerHTML = '';
    clearButton.style.display = 'none';
    searchInput.focus();
});

// function showLayerPanelWithCategories(properties) {
//     // console.log('Properties diterima:', properties);  // <-- Ini wajib untuk debugging

//     const panel = document.getElementById('layerPanel');
//     const content = document.getElementById('layerContent');

//     // Tampilkan panel
//     panel.style.display = 'block';
//     const namaKabupaten = properties.name || properties.WADMKK || 'Tidak Diketahui';
//     content.innerHTML = `<h3>${namaKabupaten}</h3><p><strong>Komoditas Utama</strong></p>`;

//     // Bersihkan tombol close sebelumnya biar gak dobel
//     const oldCloseBtn = panel.querySelector('.close-btn');
//     if (oldCloseBtn) oldCloseBtn.remove();

//     // Buat tombol close (X)
//     const closeButton = document.createElement('button');
//     closeButton.innerHTML = '&times;';
//     closeButton.className = 'close-btn';

//     closeButton.style.position = 'absolute';
//     closeButton.style.top = '5px';
//     closeButton.style.right = '5px';
//     closeButton.style.background = 'transparent';
//     closeButton.style.border = 'none';
//     closeButton.style.fontSize = '20px';
//     closeButton.style.cursor = 'pointer';

//     closeButton.onclick = function() {
//         panel.style.display = 'none';
//     };

//     panel.appendChild(closeButton);

//     const categories = properties.categories || {};

//     // Kalau tidak ada kategori, tampilkan pesan
//     if (Object.keys(categories).length === 0) {
//         content.innerHTML = `<p><em>Tidak ada data kategori.</em></p>`;
//         return;
//     }

//     // Loop kategori dan tampilkan checkbox + sub-item
//     for (const [category, items] of Object.entries(categories)) {
//         const categoryDiv = document.createElement('div');
//         categoryDiv.classList.add('category');

//         // Checkbox kategori
//         const categoryLabel = document.createElement('label');
//         categoryLabel.innerHTML = `<input type="checkbox" class="category-checkbox" data-category="${category}"> <strong>${category}</strong>`;
//         categoryDiv.appendChild(categoryLabel);

//         // Tempat sub-item (hidden by default)
//         const itemsDiv = document.createElement('div');
//         itemsDiv.classList.add('items');
//         itemsDiv.style.display = 'none';

//         items.forEach(item => {
//             const itemDiv = document.createElement('div');
//             itemDiv.innerText = `- ${item.name} (${item.value})`;
//             itemDiv.classList.add(`item-${category}`);
//             itemsDiv.appendChild(itemDiv);
//         });

//         categoryDiv.appendChild(itemsDiv);
//         content.appendChild(categoryDiv);
//     }

//     // Event listener untuk expand/collapse saat checkbox diklik
//     document.querySelectorAll('.category-checkbox').forEach(checkbox => {
//         checkbox.addEventListener('change', function () {
//             const category = this.getAttribute('data-category');
//             const itemsDiv = document.querySelectorAll(`.item-${category}`);
//             itemsDiv.forEach(itemDiv => {
//                 itemDiv.style.display = this.checked ? 'block' : 'none';
//             });
//         });
//     });
// }

// // Custom Zoom Control
// const customZoomControl = L.control({ position: 'bottomright' });
// customZoomControl.onAdd = function () {
//     const container = L.DomUtil.create('div', 'custom-zoom');
//     const zoomInButton = L.DomUtil.create('button', '', container);
//     zoomInButton.innerHTML = '+';
//     const zoomOutButton = L.DomUtil.create('button', '', container);
//     zoomOutButton.innerHTML = '-';

//     zoomInButton.onclick = function () {
//         map.zoomIn();
//     };
//     zoomOutButton.onclick = function () {
//         map.zoomOut();
//     };

//     return container;
// };
// customZoomControl.addTo(map);
