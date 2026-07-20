/* =========================================================
   SIGPE-CDMX
   MAPA, CAPAS Y CARGA DE DATOS
   ========================================================= */

function initializeMap() {
    SIGPE.map = L.map("map", {
        zoomControl: true,
        preferCanvas: true
    }).setView([19.36, -99.13], 10);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }
    ).addTo(SIGPE.map);
}


/* =========================================================
   CARGA DE LOS ARCHIVOS REALES
   ========================================================= */

async function loadData() {
    const files = {
        ageb: "data/ageb_proyecciones.json",
        alcaldias: "data/alcaldias.json",
        escuelas: "data/escuelas_proyecciones.json",
        conapo: "data/conapo_00_14.json",
        analisis: "data/analisis_alcaldias.json"
    };

    const responses = await Promise.all(
        Object.values(files).map(async url => {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `No se pudo cargar ${url}. Código ${response.status}`
                );
            }

            return response.json();
        })
    );

    [
        SIGPE.data.ageb,
        SIGPE.data.alcaldias,
        SIGPE.data.escuelas,
        SIGPE.data.conapo,
        SIGPE.data.analisis
    ] = responses;

    normalizeSchoolData();

    console.log({
        ageb: SIGPE.data.ageb.features.length,
        alcaldias: SIGPE.data.alcaldias.features.length,
        escuelas: SIGPE.data.escuelas.length,
        conapo: SIGPE.data.conapo.length,
        analisis: SIGPE.data.analisis.length
    });
}


/* =========================================================
   NORMALIZACIÓN DE ESCUELAS
   ========================================================= */

function normalizeSchoolData() {
    SIGPE.data.escuelas = SIGPE.data.escuelas.map(school => ({
        ...school,

        cvegeo: String(school.cvegeo || "").trim(),

        mun: String(school.mun || "")
            .trim()
            .padStart(3, "0"),

        nombre: school.nombre || "Escuela sin nombre",

        cct: school.cct || "Sin CCT",

        nivel: school.nivel || "Sin nivel",

        alcaldia: school.alcaldia || "Sin alcaldía"
    }));
}


/* =========================================================
   COMPLETAR INFORMACIÓN DE ALCALDÍAS
   ========================================================= */

function enrichAlcaldias() {
    const totals = {};

    SIGPE.data.ageb.features.forEach(feature => {
        const properties = feature.properties;

        const municipality = String(
            properties.CVE_MUN || ""
        ).padStart(3, "0");

        if (!totals[municipality]) {
            totals[municipality] = {
                num_escuelas: 0
            };

            SIGPE.years.forEach(year => {
                totals[municipality][year.field] = 0;
            });
        }

        totals[municipality].num_escuelas += numberValue(
            properties.num_escuelas
        );

        SIGPE.years.forEach(year => {
            totals[municipality][year.field] += numberValue(
                properties[year.field]
            );
        });
    });

    SIGPE.data.alcaldias.features.forEach(feature => {
        const municipality = String(
            feature.properties.CVE_MUN || ""
        ).padStart(3, "0");

        Object.assign(
            feature.properties,
            totals[municipality] || {
                num_escuelas: 0
            }
        );
    });
}


/* =========================================================
   SELECTOR DE CICLO
   ========================================================= */

function populateYearSelector() {
    const selector = byId("yearSelect");

    selector.innerHTML = "";

    SIGPE.years.forEach((year, index) => {
        const option = document.createElement("option");

        option.value = String(index);
        option.textContent = year.label;

        selector.appendChild(option);
    });

    selector.value = String(SIGPE.currentYearIndex);
}


/* =========================================================
   DIBUJAR LÍMITES DE ALCALDÍAS
   ========================================================= */

function drawAlcaldias() {
    if (SIGPE.layers.alcaldias) {
        SIGPE.map.removeLayer(SIGPE.layers.alcaldias);
    }

    SIGPE.layers.alcaldias = L.geoJSON(
        SIGPE.data.alcaldias,
        {
            style: {
                color: "#1e3a5f",
                weight: 2,
                opacity: 0.85,
                fillOpacity: 0
            },

            interactive: false
        }
    );

    SIGPE.layers.alcaldias.addTo(SIGPE.map);
}


/* =========================================================
   DIBUJAR AGEB
   ========================================================= */

function drawAGEB() {
    if (SIGPE.layers.ageb) {
        SIGPE.map.removeLayer(SIGPE.layers.ageb);
    }

    const features = getFilteredAGEB();

    const values = features
        .map(feature => getFeatureValue(feature))
        .filter(value => value > 0);

    const breaks = calculateQuantiles(values);

    SIGPE.layers.ageb = L.geoJSON(
        {
            type: "FeatureCollection",
            features
        },
        {
            style: feature => getAGEBStyle(feature, breaks),

            onEachFeature: (feature, layer) => {
                layer.on({
                    mouseover: event => {
                        event.target.setStyle({
                            weight: 2.5,
                            color: "#111827",
                            fillOpacity: 0.9
                        });

                        event.target.bringToFront();
                    },

                    mouseout: event => {
                        SIGPE.layers.ageb.resetStyle(event.target);
                    },

                    click: () => {
                        showAGEBInformation(feature);
                    }
                });
            }
        }
    );

    if (byId("chkAGEB")?.checked !== false) {
        SIGPE.layers.ageb.addTo(SIGPE.map);
    }

    if (!SIGPE.initialBoundsApplied && features.length > 0) {
        const bounds = SIGPE.layers.ageb.getBounds();

        if (bounds.isValid()) {
            SIGPE.map.fitBounds(bounds, {
                padding: [20, 20],
                maxZoom: 13
            });
            SIGPE.initialBoundsApplied = true;
        }
    }
}


/* =========================================================
   FILTRAR LOS AGEB
   ========================================================= */

function getFilteredAGEB() {
    return SIGPE.data.ageb.features.filter(feature => {
        const properties = feature.properties;

        const municipality = String(
            properties.CVE_MUN || ""
        ).padStart(3, "0");

        const schools = getSchoolsForAGEB(properties.CVEGEO);

        const matchesAlcaldia =
            SIGPE.currentAlcaldia === "Todos" ||
            municipality === SIGPE.currentAlcaldia;

        const matchesLevel =
            SIGPE.currentLevel === "Todos" ||
            schools.some(
                school => normalizeText(school.nivel) ===
                    normalizeText(SIGPE.currentLevel)
            );

        return matchesAlcaldia && matchesLevel;
    });
}


/* =========================================================
   VALOR Y ESTILO DEL AGEB
   ========================================================= */

function getFeatureValue(feature) {
    const field = SIGPE.years[SIGPE.currentYearIndex].field;

    if (SIGPE.currentLevel === "Todos") {
        return numberValue(feature.properties[field]);
    }

    return getSchoolsForAGEB(feature.properties.CVEGEO)
        .filter(
            school =>
                normalizeText(school.nivel) ===
                normalizeText(SIGPE.currentLevel)
        )
        .reduce(
            (total, school) =>
                total + numberValue(school[field]),
            0
        );
}


function getAGEBStyle(feature, breaks) {
    const value = getFeatureValue(feature);

    return {
        color: "#475569",
        weight: 0.65,
        fillColor: getTotalColor(value, breaks),
        fillOpacity: 0.78
    };
}


function calculateQuantiles(values) {
    const sorted = [...values].sort((a, b) => a - b);

    if (sorted.length === 0) {
        return [1, 2, 3, 4];
    }

    const quantile = proportion => {
        const position = Math.floor(
            (sorted.length - 1) * proportion
        );

        return sorted[position];
    };

    return [
        quantile(0.2),
        quantile(0.4),
        quantile(0.6),
        quantile(0.8)
    ];
}


function getTotalColor(value, breaks) {
    if (value <= 0) return "#e5e7eb";
    if (value <= breaks[0]) return "#eff3ff";
    if (value <= breaks[1]) return "#bdd7e7";
    if (value <= breaks[2]) return "#6baed6";
    if (value <= breaks[3]) return "#3182bd";

    return "#08519c";
}


/* =========================================================
   ESCUELAS ASOCIADAS
   ========================================================= */

function getSchoolsForAGEB(cvegeo) {
    const key = String(cvegeo || "").trim();

    return SIGPE.data.escuelas.filter(
        school => school.cvegeo === key
    );
}


function getFilteredSchoolsForAGEB(cvegeo) {
    return getSchoolsForAGEB(cvegeo).filter(school => {
        const matchesLevel =
            SIGPE.currentLevel === "Todos" ||
            normalizeText(school.nivel) ===
                normalizeText(SIGPE.currentLevel);

        const matchesAlcaldia =
            SIGPE.currentAlcaldia === "Todos" ||
            school.alcaldia === SIGPE.currentAlcaldia ||
            school.mun === SIGPE.currentAlcaldia;

        return matchesLevel && matchesAlcaldia;
    });
}


/* =========================================================
   MOSTRAR INFORMACIÓN DEL AGEB
   ========================================================= */

function showAGEBInformation(feature) {
    const properties = feature.properties;

    const schools = getFilteredSchoolsForAGEB(
        properties.CVEGEO
    );

    const currentYear =
        SIGPE.years[SIGPE.currentYearIndex];

    const currentField = currentYear.field;

    const totalEnrollment = schools.reduce(
        (total, school) =>
            total + numberValue(school[currentField]),
        0
    );

    const baseEnrollment = schools.reduce(
        (total, school) =>
            total + numberValue(school.mat_2024_2025),
        0
    );

    const change = calculatePercentChange(
        totalEnrollment,
        baseEnrollment
    );

    const showSchools = byId("chkEscuelas")?.checked !== false;

    const schoolsHTML = showSchools ? schools
        .sort(
            (a, b) =>
                numberValue(b[currentField]) -
                numberValue(a[currentField])
        )
        .map(school => {
            const schoolChange = calculatePercentChange(
                numberValue(school[currentField]),
                numberValue(school.mat_2024_2025)
            );

            return `
                <button
                    class="schoolCard"
                    type="button"
                    onclick="selectSchoolById('${escapeAttribute(
                        school.id || school.cct
                    )}')"
                >
                    <strong>${escapeHTML(school.nombre)}</strong>

                    <span>
                        ${escapeHTML(school.cct)} ·
                        ${escapeHTML(school.nivel)}
                    </span>

                    <span>
                        ${formatNumber(school[currentField])}
                        alumnos ·
                        ${formatPercent(schoolChange)}
                    </span>
                </button>
            `;
        })
        .join("") : "";

    byId("schoolInfo").innerHTML = `
        <section class="ageb-summary">
            <h2>AGEB ${escapeHTML(properties.CVE_AGEB || "")}</h2>

            <div class="popup-grid">
                <span>Clave:</span>
                <strong>${escapeHTML(properties.CVEGEO || "")}</strong>

                <span>Ciclo:</span>
                <strong>${currentYear.label}</strong>

                <span>Matrícula:</span>
                <strong>${formatNumber(totalEnrollment)}</strong>

                <span>Escuelas:</span>
                <strong>${formatNumber(schools.length)}</strong>

                <span>Cambio acumulado:</span>
                <strong>${formatPercent(change)}</strong>
            </div>
        </section>

        <section class="ageb-school-list">
            <h3>Escuelas en el AGEB</h3>

            ${
                !showSchools
                    ? "<p>La lista de escuelas está desactivada en el control de capas.</p>"
                    : schoolsHTML ||
                      "<p>No hay escuelas que coincidan con los filtros.</p>"
            }
        </section>
    `;

    byId("projectionTable").innerHTML = "";
    byId("similarSchools").innerHTML = "";

    openSidebar();
}


/* =========================================================
   SELECCIONAR ESCUELA DESDE EL AGEB
   ========================================================= */

function selectSchoolById(identifier) {
    const school = SIGPE.data.escuelas.find(item =>
        String(item.id || item.cct) === String(identifier)
    );

    if (!school) {
        console.warn("No se encontró la escuela:", identifier);
        return;
    }

    selectSchool(school);
}


/* =========================================================
   ACTUALIZAR MAPA
   ========================================================= */

function refreshMap() {
    drawAGEB();

    if (
        SIGPE.layers.alcaldias &&
        !SIGPE.map.hasLayer(SIGPE.layers.alcaldias) &&
        byId("chkAlcaldias")?.checked
    ) {
        SIGPE.layers.alcaldias.addTo(SIGPE.map);
    }

    updateDashboard();
}


/* =========================================================
   CONTROLES DE CAPAS
   ========================================================= */

function initializeLayerControls() {
    const agebCheckbox = byId("chkAGEB");
    const alcaldiasCheckbox = byId("chkAlcaldias");
    const schoolsCheckbox = byId("chkEscuelas");

    agebCheckbox?.addEventListener("change", event => {
        toggleLayer(
            SIGPE.layers.ageb,
            event.target.checked
        );
    });

    alcaldiasCheckbox?.addEventListener("change", event => {
        toggleLayer(
            SIGPE.layers.alcaldias,
            event.target.checked
        );
    });

    /*
     * La base actual no contiene coordenadas individuales
     * de las escuelas. Este control determina si las escuelas
     * aparecen dentro de la ficha del AGEB.
     */
    schoolsCheckbox?.addEventListener("change", () => {
        refreshMap();
    });
}


function toggleLayer(layer, visible) {
    if (!layer) return;

    if (visible) {
        if (!SIGPE.map.hasLayer(layer)) {
            layer.addTo(SIGPE.map);
        }
    } else if (SIGPE.map.hasLayer(layer)) {
        SIGPE.map.removeLayer(layer);
    }
}


/* =========================================================
   PANTALLA COMPLETA
   ========================================================= */

function initializeFullscreen() {
    const button = byId("fullscreenBtn");

    button?.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }

            setTimeout(() => {
                SIGPE.map.invalidateSize();
            }, 250);
        } catch (error) {
            console.error(
                "No se pudo activar pantalla completa:",
                error
            );
        }
    });
}


/* =========================================================
   UTILIDADES LOCALES
   ========================================================= */

function numberValue(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}


function calculatePercentChange(current, base) {
    if (!base) return null;

    return ((current - base) / base) * 100;
}


function formatPercent(value) {
    if (value === null || !Number.isFinite(value)) {
        return "Sin base";
    }

    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}


function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}