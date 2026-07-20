/* =========================================================
   FILTROS Y ESTADÍSTICAS
   ========================================================= */

function initializeFilters() {
    populateLevelFilter();
    populateAlcaldiaFilter();
    connectYearFilter();
    connectVariableFilter();
    connectLevelFilter();
    connectAlcaldiaFilter();
    connectClearFiltersButton();
}


/* =========================================================
   FILTRO DE CICLO
   ========================================================= */

function connectYearFilter() {
    const selector = firstExistingElement(
        "yearSelect",
        "yearFilter",
        "filtroAnio"
    );

    const slider = firstExistingElement(
        "yearSlider",
        "yearRange"
    );

    if (selector) {
        selector.value = String(SIGPE.currentYearIndex);

        selector.addEventListener("change", event => {
            SIGPE.currentYearIndex = Number(event.target.value) || 0;

            if (slider) {
                slider.value = String(SIGPE.currentYearIndex);
            }

            refreshMap();

            if (SIGPE.selectedSchool) {
                selectSchool(SIGPE.selectedSchool);
            }
        });
    }

    if (slider) {
        slider.min = "0";
        slider.max = String(SIGPE.years.length - 1);
        slider.value = String(SIGPE.currentYearIndex);

        slider.addEventListener("input", event => {
            SIGPE.currentYearIndex = Number(event.target.value) || 0;

            if (selector) {
                selector.value = String(SIGPE.currentYearIndex);
            }

            refreshMap();

            if (SIGPE.selectedSchool) {
                selectSchool(SIGPE.selectedSchool);
            }
        });
    }
}


/* =========================================================
   VARIABLE DEL MAPA
   ========================================================= */

function connectVariableFilter() {
    const selector = byId("variableSelect");
    if (!selector) return;

    selector.value = SIGPE.currentVariable;
    selector.addEventListener("change", event => {
        SIGPE.currentVariable = event.target.value === "percentage"
            ? "percentage"
            : "total";
        refreshMap();
    });
}


/* =========================================================
   FILTRO DE NIVEL
   ========================================================= */

function populateLevelFilter() {
    const selector = firstExistingElement(
        "levelFilter",
        "nivelFilter",
        "filterLevel",
        "filtroNivel"
    );

    if (!selector) {
        console.warn(
            "No se encontró el selector de nivel. " +
            "Debe tener id levelFilter o nivelFilter."
        );

        return;
    }

    const preferredOrder = [
        "Inicial",
        "Especial",
        "Preescolar",
        "Primaria",
        "Secundaria",
        "Adultos"
    ];

    const availableLevels = [
        ...new Set(
            SIGPE.data.escuelas
                .map(school => String(school.nivel || "").trim())
                .filter(Boolean)
        )
    ];

    const orderedLevels = preferredOrder.filter(preferred =>
        availableLevels.some(
            available =>
                normalizeString(available) ===
                normalizeString(preferred)
        )
    );

    availableLevels.forEach(level => {
        const alreadyIncluded = orderedLevels.some(
            included =>
                normalizeString(included) ===
                normalizeString(level)
        );

        if (!alreadyIncluded) {
            orderedLevels.push(level);
        }
    });

    selector.innerHTML = `
        <option value="Todos">Todos los niveles</option>
        ${orderedLevels
            .map(level => `
                <option value="${escapeHTML(level)}">
                    ${escapeHTML(level)}
                </option>
            `)
            .join("")}
    `;

    selector.value = SIGPE.currentLevel;
}


function connectLevelFilter() {
    const selector = firstExistingElement(
        "levelFilter",
        "nivelFilter",
        "filterLevel",
        "filtroNivel"
    );

    if (!selector) return;

    selector.addEventListener("change", event => {
        SIGPE.currentLevel = event.target.value || "Todos";

        closeSchoolDetails();
        refreshMap();
    });
}


/* =========================================================
   FILTRO DE ALCALDÍA
   ========================================================= */

function populateAlcaldiaFilter() {
    const selector = firstExistingElement(
        "alcaldiaFilter",
        "boroughFilter",
        "filterAlcaldia",
        "filtroAlcaldia"
    );

    if (!selector) {
        console.warn(
            "No se encontró el selector de alcaldía. " +
            "Debe tener id alcaldiaFilter."
        );

        return;
    }

    const municipalities = new Map();

    SIGPE.data.escuelas.forEach(school => {
        if (!school.alcaldia) return;

        const municipalCode = String(school.mun || "")
            .padStart(3, "0");

        municipalities.set(
            normalizeString(school.alcaldia),
            {
                name: school.alcaldia,
                code: municipalCode
            }
        );
    });

    const sortedMunicipalities = [...municipalities.values()]
        .sort((a, b) =>
            a.name.localeCompare(b.name, "es")
        );

    selector.innerHTML = `
        <option value="Todos">Todas las alcaldías</option>
        ${sortedMunicipalities
            .map(item => `
                <option value="${escapeHTML(item.code)}">
                    ${escapeHTML(item.name)}
                </option>
            `)
            .join("")}
    `;

    selector.value = SIGPE.currentAlcaldia;
}


function connectAlcaldiaFilter() {
    const selector = firstExistingElement(
        "alcaldiaFilter",
        "boroughFilter",
        "filterAlcaldia",
        "filtroAlcaldia"
    );

    if (!selector) return;

    selector.addEventListener("change", event => {
        SIGPE.currentAlcaldia =
            event.target.value || "Todos";

        closeSchoolDetails();
        refreshMap();
        zoomToSelectedAlcaldia();
    });
}


/* =========================================================
   LIMPIAR FILTROS
   ========================================================= */

function connectClearFiltersButton() {
    const button = firstExistingElement(
        "clearFilters",
        "clearFiltersBtn",
        "limpiarFiltros"
    );

    if (!button) return;

    button.addEventListener("click", () => {
        SIGPE.currentYearIndex = 0;
        SIGPE.currentLevel = "Todos";
        SIGPE.currentAlcaldia = "Todos";
        SIGPE.currentVariable = "total";

        const yearSelector = firstExistingElement(
            "yearSelect",
            "yearFilter",
            "filtroAnio"
        );

        const yearSlider = firstExistingElement(
            "yearSlider",
            "yearRange"
        );

        const levelSelector = firstExistingElement(
            "levelFilter",
            "nivelFilter",
            "filterLevel",
            "filtroNivel"
        );

        const alcaldiaSelector = firstExistingElement(
            "alcaldiaFilter",
            "boroughFilter",
            "filterAlcaldia",
            "filtroAlcaldia"
        );

        if (yearSelector) yearSelector.value = "0";
        if (yearSlider) yearSlider.value = "0";
        if (levelSelector) levelSelector.value = "Todos";
        if (alcaldiaSelector) alcaldiaSelector.value = "Todos";

        const variableSelector = byId("variableSelect");
        if (variableSelector) variableSelector.value = "total";

        const searchInput = byId("searchInput");

        if (searchInput) {
            searchInput.value = "";
        }

        hideSearchResults();
        closeSchoolDetails();
        refreshMap();

        const bounds = L.geoJSON(SIGPE.data.ageb).getBounds();

        if (bounds.isValid()) {
            SIGPE.map.fitBounds(bounds, {
                padding: [20, 20]
            });
        }
    });
}


/* =========================================================
   ZOOM A ALCALDÍA
   ========================================================= */

function zoomToSelectedAlcaldia() {
    if (SIGPE.currentAlcaldia === "Todos") {
        return;
    }

    const matchingFeature =
        SIGPE.data.alcaldias.features.find(feature => {
            const code = String(
                feature.properties.CVE_MUN || ""
            ).padStart(3, "0");

            return code === SIGPE.currentAlcaldia;
        });

    if (!matchingFeature) return;

    const bounds = L.geoJSON(matchingFeature).getBounds();

    if (bounds.isValid()) {
        SIGPE.map.fitBounds(bounds, {
            padding: [25, 25],
            maxZoom: 13
        });
    }
}


/* =========================================================
   ESTADÍSTICAS DINÁMICAS
   ========================================================= */

function updateDashboard() {
    if (!SIGPE.data.ageb) return;

    const features = getFilteredAGEB();
    const currentField = getCurrentYearField();

    const filteredSchools = SIGPE.data.escuelas.filter(school => {
        const matchesLevel =
            SIGPE.currentLevel === "Todos" ||
            normalizeString(school.nivel) ===
                normalizeString(SIGPE.currentLevel);

        const matchesAlcaldia =
            SIGPE.currentAlcaldia === "Todos" ||
            String(school.mun || "").padStart(3, "0") ===
                SIGPE.currentAlcaldia;

        return matchesLevel && matchesAlcaldia;
    });

    const currentEnrollment = filteredSchools.reduce(
        (sum, school) =>
            sum + (Number(school[currentField]) || 0),
        0
    );

    const baseEnrollment = filteredSchools.reduce(
        (sum, school) =>
            sum + (Number(school.mat_2024_2025) || 0),
        0
    );

    const totalSchools = filteredSchools.length;

    const totalAGEB = features.filter(feature =>
        getFeatureValue(feature) > 0
    ).length;

    const accumulatedChange = percent(
        currentEnrollment,
        baseEnrollment
    );

    setDashboardValue(
        ["totalEscuelas", "statSchools"],
        formatNumber(totalSchools)
    );

    setDashboardValue(
        ["totalMatricula", "statEnrollment"],
        formatNumber(currentEnrollment)
    );

    setDashboardValue(
        ["totalAGEB", "unitsCount", "statAGEB"],
        formatNumber(totalAGEB)
    );

    setDashboardValue(
        ["cambioTotal", "statChange"],
        formatPercentage(accumulatedChange)
    );

    const currentCycle = firstExistingElement(
        "currentCycle",
        "selectedYearLabel"
    );

    if (currentCycle) {
        currentCycle.textContent = getCurrentYear().label;
    }

    updateMapLegend(features);
}


function setDashboardValue(ids, value) {
    ids.forEach(id => {
        const element = byId(id);

        if (element) {
            element.textContent = value;
        }
    });
}


/* =========================================================
   LEYENDA
   ========================================================= */

function updateMapLegend(features) {
    const legend = byId("legend");
    if (!legend) return;

    if (SIGPE.currentVariable === "percentage") {
        const items = [
            ["Sin base", "#d1d5db"],
            ["Menor a -10%", "#7f0000"],
            ["-10% a -7%", "#b2182b"],
            ["-7% a -4%", "#d6604d"],
            ["-4% a -2%", "#f4a582"],
            ["-2% a +2%", "#f7f7f7"],
            ["+2% a +5%", "#d9f0d3"],
            ["+5% a +10%", "#7fbf7b"],
            ["+10% a +20%", "#1b7837"],
            ["Mayor a +20%", "#00441b"]
        ];

        legend.innerHTML = items.map(([label, color]) => `
            <div class="legend-item">
                <span class="legend-color" style="background:${color}"></span>
                <span>${label}</span>
            </div>
        `).join("");
        return;
    }

    const values = features
        .map(feature => getFeatureValue(feature))
        .filter(value => value > 0);

    const breaks = calculateQuantiles(values);
    const items = [
        { label: "Sin matrícula", color: "#e5e7eb" },
        { label: `1 – ${formatNumber(Math.round(breaks[0]))}`, color: getTotalColor(1, breaks) },
        { label: `${formatNumber(Math.round(breaks[0] + 1))} – ${formatNumber(Math.round(breaks[1]))}`, color: getTotalColor(breaks[0] + 1, breaks) },
        { label: `${formatNumber(Math.round(breaks[1] + 1))} – ${formatNumber(Math.round(breaks[2]))}`, color: getTotalColor(breaks[1] + 1, breaks) },
        { label: `${formatNumber(Math.round(breaks[2] + 1))} – ${formatNumber(Math.round(breaks[3]))}`, color: getTotalColor(breaks[2] + 1, breaks) },
        { label: `Más de ${formatNumber(Math.round(breaks[3]))}`, color: getTotalColor(breaks[3] + 1, breaks) }
    ];

    legend.innerHTML = items.map(item => `
        <div class="legend-item">
            <span class="legend-color" style="background:${item.color}"></span>
            <span>${item.label}</span>
        </div>
    `).join("");
}