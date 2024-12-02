const API_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
const provinceSelect = document.getElementById('province-select');
const municipalitySelect = document.getElementById('municipality-select');
const fuelTypeSelect = document.getElementById('fuel-type');
const openNowCheck = document.getElementById('open-now-check');
const searchBtn = document.getElementById('search-btn');
const stationsList = document.getElementById('stations-list');

// Function to make API requests
async function request(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Request error:', error.message);
  }
}

// Load provinces on startup
async function loadProvinces() {
  try {
    const data = await request(API_URL);

    // Extract unique provinces without using ...
    const provinceSet = {};
    data.ListaEESSPrecio.forEach(station => {
      provinceSet[station.Provincia] = true;
    });

    // Convert the keys of the object to an array
    const provinces = Object.keys(provinceSet);

    provinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province;
      option.textContent = province;
      provinceSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading provinces:', error);
  }
}


// Load municipalities when a province is selected
provinceSelect.addEventListener('change', async () => {
  municipalitySelect.innerHTML = '<option value="">Selecciona Municipio</option>';
  municipalitySelect.disabled = false;

  try {
    const data = await request(API_URL);

    // Extract municipalities for the selected province
    const municipalitySet = {};
    data.ListaEESSPrecio.filter(station => station.Provincia === provinceSelect.value).forEach(station => {
        municipalitySet[station.Municipio] = true;
      });

    // Convert the keys of the object to an array
    const uniqueMunicipalities = Object.keys(municipalitySet);

    uniqueMunicipalities.forEach(municipality => {
      const option = document.createElement('option');
      option.value = municipality;
      option.textContent = municipality;
      municipalitySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading municipalities:', error);
  }
});


// Search for gas stations
searchBtn.addEventListener('click', async () => {
  const province = provinceSelect.value;
  const municipality = municipalitySelect.value;
  const fuelType = fuelTypeSelect.value;
  const onlyOpenNow = openNowCheck.checked;

  try {
    const data = await request(API_URL);

    let filteredStations = data.ListaEESSPrecio
      .filter(station =>
        (!province || station.Provincia === province) &&
        (!municipality || station.Municipio === municipality)
      );

     // Filter by fuel type
    if (fuelType) {
      filteredStations = filteredStations.filter(station =>
        station[fuelType] !== ''
      );
    }



    stationsList.innerHTML = '';
    filteredStations.forEach(station => {
      const stationCard = document.createElement('div');
      stationCard.classList.add('station-card');
      stationCard.innerHTML = `
        <h3>${station.Rótulo}</h3>
        <p>Address: ${station.Dirección}</p>
        <p>Town: ${station.Localidad}</p>
        <p>Province: ${station.Provincia}</p>
        <p>Schedule: ${station.Horario}</p>
        ${fuelType ? `<p>Price  ${fuelTypeSelect.options[fuelTypeSelect.selectedIndex].text}: ${station[fuelType]} €/l</p>` : ''}
      `;
      stationsList.appendChild(stationCard);
    });
  } catch (error) {
    console.error('Error searching for gas stations:', error);
  }
});

// Load provinces on startup
loadProvinces();
