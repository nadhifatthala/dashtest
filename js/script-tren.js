// Function to handle scrolling
function scrollToSection(id) {
  console.log("Scrolling to:", id); // For debugging - check console
  const section = document.getElementById(id);
  if (section) {
      section.scrollIntoView({
          behavior: "smooth", // Enable smooth scrolling
          block: "start"      // Align the top of the section with the top of the viewport
      });
  } else {
      console.warn("Element with ID '" + id + "' not found!"); // Warning if target doesn't exist
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const locationSelector = document.getElementById('location-selector');
  const chartCanvases = {
      gizi: document.getElementById('chart-gizi'),
      stunting: document.getElementById('chart-stunting'),
      harapan: document.getElementById('chart-harapan'),
      'indeks-gini': document.getElementById('chart-indeks-gini'), 
      'penduduk-miskin': document.getElementById('chart-penduduk-miskin'),
      kelasifikasi: document.getElementById('chart-kelasifikasi'),
  };
  const chartTitles = {
      gizi: document.getElementById('title-gizi'),
      stunting: document.getElementById('title-stunting'),
      harapan: document.getElementById('title-harapan'),
      'indeks-gini': document.getElementById('title-indeks-gini'),
      'penduduk-miskin': document.getElementById('title-penduduk-miskin'),
      kelasifikasi: document.getElementById('title-kelasifikasi'),
  };

  let allData = null; // To store the fetched data
  let chartInstances = {}; // To store Chart.js instances for updates/destruction

  // Function to render or update a chart
  function renderChart(canvasId, indicatorKey, selectedLocation) {
      if (!allData || !canvasId || !indicatorKey || !selectedLocation) {
          console.error("Missing data for rendering chart:", canvasId, indicatorKey, selectedLocation);
          return;
      }

      const indicatorData = allData.indicators[indicatorKey];
      if (!indicatorData) {
          console.error(`Indicator data not found for key: ${indicatorKey}`);
          return;
      }

      const locationValues = indicatorData.data[selectedLocation];
      if (!locationValues) {
          console.warn(`Data not found for location "${selectedLocation}" in indicator "${indicatorKey}". Displaying empty chart.`);
          // Optionally clear the chart or show a message
          if (chartInstances[canvasId]) {
              chartInstances[canvasId].destroy();
              delete chartInstances[canvasId];
          }
           // Update title even if data is missing
           if(chartTitles[indicatorKey]) {
              chartTitles[indicatorKey].innerHTML = `${indicatorData.name} - ${selectedLocation} <span>(${indicatorData.unit})</span>`;
          }
          return; // Stop if no data for this location
      }

      const ctx = chartCanvases[indicatorKey]?.getContext('2d');
      if (!ctx) {
          console.error(`Canvas context not found for ID: ${canvasId}`);
          return;
      }

      // Destroy previous chart instance if it exists
      if (chartInstances[canvasId]) {
          chartInstances[canvasId].destroy();
      }

       // Update chart title
      if(chartTitles[indicatorKey]) {
           chartTitles[indicatorKey].innerHTML = `${indicatorData.name} - ${selectedLocation} <span>(${indicatorData.unit})</span>`;
      }


      // Create new chart
      chartInstances[canvasId] = new Chart(ctx, {
          type: 'line',
          data: {
              labels: indicatorData.labels, // Use labels from the specific indicator
              datasets: [{
                  label: selectedLocation, // Use location name for dataset label (optional)
                  data: locationValues,
                  fill: false,
                  borderColor: '#5a83b7', // Example color
                  backgroundColor: '#5a83b7',
                  tension: 0.3,
                  pointRadius: 5,
                  pointHoverRadius: 7
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: true, // Adjust as needed
              plugins: {
                  legend: { display: false }, // Usually hide legend for single dataset
                  tooltip: {
                      callbacks: {
                          // Use the unit from the indicator data
                          label: context => `${context.dataset.label}: ${context.formattedValue} ${indicatorData.unit || ''}`
                      }
                  }
              },
              scales: {
                  y: {
                      beginAtZero: false, // Adjust based on indicator (stunting/gizi maybe true, harapan false)
                       title: {
                          display: true,
                          text: indicatorData.unit || '' // Display unit on Y-axis
                      }
                      // Add specific grid line styling if needed (like your original code)
                  },
                  x: {
                      grid: { color: "#e6e6e6" },
                       title: {
                          display: true,
                          text: 'Tahun' // Year label
                      }
                  }
              }
          }
      });
  }

  // Function to update all charts based on selected location
  function updateAllCharts(selectedLocation) {
      if (!allData) return;
      renderChart('chart-gizi', 'gizi', selectedLocation);
      renderChart('chart-stunting', 'stunting', selectedLocation);
      renderChart('chart-harapan', 'harapan', selectedLocation);
      renderChart('chart-indeks-gini', 'indeks-gini', selectedLocation); 
      renderChart('chart-penduduk-miskin', 'penduduk-miskin', selectedLocation); 
      renderChart('chart-kelasifikasi', 'kelasifikasi', selectedLocation);
      // Add calls for other charts if you have more indicators
  }

  // Function to populate the location dropdown
  function populateDropdown(locations) {
      locationSelector.innerHTML = ''; // Clear loading message
      locations.forEach(location => {
          const option = document.createElement('option');
          option.value = location;
          option.textContent = location;
          locationSelector.appendChild(option);
      });
  }

  // Fetch data and initialize
  fetch('data/data-tren.json')
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          allData = data; // Store data globally

          // Check if indicators for the new sections exist in the data
          if (!allData.indicators['indeks-gini'] || !allData.indicators['penduduk-miskin'] || !allData.indicators['kelasifikasi']) {
            console.warn("Warning: Data for Gini Index, Poverty Ratio, or Income Classification might be missing in data-tren.json");
        }

          // Determine locations - use provided list or derive from data keys
          const locations = data.locations || Object.keys(data.indicators.gizi.data); // Fallback if locations array is missing

          if (!locations || locations.length === 0) {
              console.error("No locations found in data.");
               locationSelector.innerHTML = '<option value="">Tidak ada data wilayah</option>';
              return;
          }

          populateDropdown(locations);

          // Set initial chart display (e.g., first location)
          const initialLocation = locations[0];
          locationSelector.value = initialLocation; // Set dropdown value
          updateAllCharts(initialLocation);

          // Add event listener for dropdown changes
          locationSelector.addEventListener('change', (event) => {
              updateAllCharts(event.target.value);
          });
      })
      .catch(error => {
          console.error('Error fetching or processing data:', error);
          locationSelector.innerHTML = '<option value="">Gagal memuat data</option>';
          // Optionally display an error message to the user on the page
      });
});
