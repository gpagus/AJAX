const provinceDropdown = document.getElementById("province");
const municipalityDropdown = document.getElementById("municipality");
const fuelTypeDropdown = document.getElementById("fuel-type");
const openNowCheckbox = document.getElementById("open");
const findButton = document.getElementById("search");
const stationsContainer = document.getElementById("gas-stations-list");

// API endpoint root URL
const API_ROOT = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes";

// Initialize data when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    fetchProvinceData();
    setupFuelOptions();
});

// Get and display all available provinces
async function fetchProvinceData() {
    const provinces = await fetchData(`${API_ROOT}/Listados/Provincias/`);
    populateSelect(provinceDropdown, provinces, "IDPovincia", "Provincia");
}

// Set up the fuel type dropdown with preset options
function setupFuelOptions() {
    const fuelTypes = [
        { IDProduct: "Precio Gasolina 95 E5", ProductName: "Gasoline 95 E5" },
        { IDProduct: "Precio Gasolina 98 E5", ProductName: "Gasoline 98 E5" },
        { IDProduct: "Precio Gasoleo A", ProductName: "Diesel A" },
        { IDProduct: "Precio Gasoleo Premium", ProductName: "Diesel Premium" }
    ];
    populateSelect(fuelTypeDropdown, fuelTypes, "IDProduct", "ProductName");
}

// Update municipality options when province selection changes
provinceDropdown.addEventListener("change", async () => {
    const provinceId = provinceDropdown.value;
    await fetchMunicipalityData(provinceId);
});

// Retrieve municipalities for the selected province
async function fetchMunicipalityData(provinceId) {
    const municipalities = await fetchData(`${API_ROOT}/Listados/MunicipiosPorProvincia/${provinceId}`);
    populateSelect(municipalityDropdown, municipalities, "IDMunicipio", "Municipio");
}

// Trigger the search operation when button is clicked
findButton.addEventListener("click", async () => {
    await findGasStations();
});

// Main search function to find and display gas stations
async function findGasStations() {
    const provinceId = provinceDropdown.value;
    const municipalityId = municipalityDropdown.value;
    const fuelTypeId = fuelTypeDropdown.value;
    const onlyOpenStations = openNowCheckbox.checked;

    // Make sure user has selected a province
    if (!provinceId) {
        alert("Please select a province.");
        return;
    }

    // Create appropriate search URL and fetch results
    let url = createSearchUrl(provinceId, municipalityId);
    const response = await fetchData(url);

    if (!response.ListaEESSPrecio || response.ListaEESSPrecio.length === 0) {
        displayEmptyResults();
        return;
    }

    // Process and filter the station data
    const stations = response.ListaEESSPrecio;
    const filteredStations = filterStationResults(stations, fuelTypeId, onlyOpenStations);
    renderStationsList(filteredStations, fuelTypeId);
}

// Generate the correct endpoint URL based on selected filters
function createSearchUrl(provinceId, municipalityId) {
    if (municipalityId) {
        return `${API_ROOT}/EstacionesTerrestres/FiltroMunicipio/${municipalityId}`;
    }
    return `${API_ROOT}/EstacionesTerrestres/FiltroProvincia/${provinceId}`;
}

// Show message when no stations are found
function displayEmptyResults() {
    stationsContainer.innerHTML = "<p>No se han encontrado resultados.</p>";
}

// Apply filters to narrow down station results
function filterStationResults(stations, fuelTypeId, onlyOpenStations) {
    return stations.filter((station) => {
        const hasFuelType = fuelTypeId ? station[fuelTypeId] && station[fuelTypeId] !== "" : true;
        const isStationOpenNow = onlyOpenStations ? checkStationAvailability(station.Horario) : true;
        return hasFuelType && isStationOpenNow;
    });
}

// Check if station is currently open based on schedule
function checkStationAvailability(schedule) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (schedule.includes("L-D: 24H")) return true;

    const daysMap = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 };
    const hours = schedule.split(";");

    for (const hour of hours) {
        const [days, timeRange] = hour.split(": ");
        const [startDay, endDay] = days.split("-").map((d) => daysMap[d.trim()]);
        const [start, end] = timeRange
            .split("-")
            .map((t) => t.split(":").reduce((h, m) => h * 60 + Number(m)));

        if (
            ((currentDay >= startDay && currentDay <= endDay) ||
                (endDay < startDay &&
                    (currentDay >= startDay || currentDay <= endDay))) &&
            ((currentTime >= start && currentTime <= end) ||
                (end < start && (currentTime >= start || currentTime <= end)))
        ) {
            return true;
        }
    }
    return false;
}

// Render the list of stations that match search criteria
function renderStationsList(stations, fuelTypeId) {
    stationsContainer.innerHTML = "";

    if (stations.length === 0) {
        displayEmptyResults();
        return;
    }

    stations.forEach((station) => {
        const stationElement = buildStationCard(station, fuelTypeId);
        stationsContainer.appendChild(stationElement);
    });
}

// Create HTML for an individual station card
function buildStationCard(station, fuelTypeId) {
    const stationElement = document.createElement("div");
    stationElement.classList.add("station");

    stationElement.innerHTML = `
        <h3>${station["Rótulo"]}</h3>
        <p><strong>Dirección:</strong> ${station["Dirección"]}, ${station["Municipio"]}, ${station["Provincia"]}</p>
        <p><strong>Precio (${fuelTypeDropdown.options[fuelTypeDropdown.selectedIndex]?.text}):</strong> <span class="price">${station[fuelTypeId] || "N/A"}€</span></p>
        <p><strong>Horario:</strong> ${station["Horario"]}</p>
    `;

    return stationElement;
}

// Handle API request and response processing
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return {};
    }
}

// Fill dropdown elements with available options
function populateSelect(selectElement, items, valueKey, textKey) {
    selectElement.innerHTML = `<option selected disabled>Selecciona una opción</option>`;
    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
}