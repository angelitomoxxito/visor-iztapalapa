/* =========================================================
   PANEL DERECHO Y FICHA DE ESCUELA
   ========================================================= */

function setDetailMode(mode) {
    const schoolMode = mode === "school";
    const alcaldiaMode = mode === "alcaldia";
    const title = byId("detailsTitle");
    if (title) title.textContent = schoolMode
        ? "Información de la escuela"
        : alcaldiaMode
            ? "Información de la alcaldía"
            : "Información del AGEB";

    byId("schoolChartSection")?.classList.toggle("is-hidden", !schoolMode);
    byId("projectionSection")?.classList.toggle("is-hidden", !(schoolMode || alcaldiaMode));
    byId("similarSection")?.classList.toggle("is-hidden", !schoolMode);
    byId("schoolActionsSection")?.classList.toggle("is-hidden", !schoolMode);
    byId("conapoSection")?.classList.toggle("is-hidden", false);
}


function initializeSidebar() {
    const closeButton = firstExistingElement(
        "closePanel",
        "closeDetails",
        "closeSidebar"
    );

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeSchoolDetails
        );
    }

    const compareButton = firstExistingElement(
        "compareSchoolBtn",
        "addComparisonBtn",
        "compareBtn"
    );

    if (compareButton) {
        compareButton.addEventListener("click", () => {
            if (SIGPE.selectedSchool) {
                addSchoolComparison(SIGPE.selectedSchool);
            }
        });
    }

    const csvButton = firstExistingElement(
        "downloadSchoolCsv",
        "exportSchoolCsv"
    );

    if (csvButton) {
        csvButton.addEventListener("click", () => {
            if (SIGPE.selectedSchool) {
                downloadSchoolCSV(SIGPE.selectedSchool);
            }
        });
    }
}


function openSidebar() {
    const panel = byId("detailsPanel");

    if (!panel) return;

    panel.classList.remove("closed");
    panel.classList.add("open");
    document.querySelector(".app-layout")?.classList.remove("details-closed");

    setTimeout(() => {
        SIGPE.map?.invalidateSize();
    }, 250);
}


function closeSchoolDetails() {
    SIGPE.selectedSchool = null;
    SIGPE.selectedTerritoryFeature = null;
    SIGPE.selectedTerritoryType = null;

    const panel = byId("detailsPanel");

    if (panel) {
        panel.classList.remove("open");
        panel.classList.add("closed");
    }

    document.querySelector(".app-layout")?.classList.add("details-closed");
    destroySchoolChart();
    destroyConapoChart();
    setTimeout(() => SIGPE.map?.invalidateSize(false), 80);
}


function selectSchool(school) {
    if (!school) return;

    setDetailMode("school");

    SIGPE.selectedSchool = school;
    SIGPE.selectedTerritoryFeature = null;
    SIGPE.selectedTerritoryType = null;

    renderSchoolInformation(school);
    renderProjectionTable(school);
    renderSchoolChart(school);
    renderSimilarSchools(school);
    renderConapoComparison(school.mun);

    openSidebar();
}


function renderSchoolInformation(school) {
    const container = byId("schoolInfo");

    if (!container) return;

    const currentYear = getCurrentYear();
    const currentValue =
        Number(school[currentYear.field]) || 0;

    const baseValue =
        Number(school.mat_2024_2025) || 0;

    const totalChange = percent(
        currentValue,
        baseValue
    );

    const annualGrowth = calculateAverageAnnualGrowth(school);

    container.innerHTML = `
        <div class="school-detail-header">
            <span class="school-detail-icon">🏫</span>

            <div>
                <h2>${escapeHTML(school.nombre)}</h2>

                <p>
                    ${escapeHTML(school.nivel)} ·
                    ${escapeHTML(school.alcaldia)}
                </p>
            </div>
        </div>

        <div class="school-information-grid">
            <span>CCT</span>
            <strong>${escapeHTML(school.cct)}</strong>

            <span>Fuente</span>
            <strong>
                ${escapeHTML(
                    school.fuente || "Estadística 911"
                )}
            </strong>

            <span>Ciclo mostrado</span>
            <strong>${currentYear.label}</strong>

            <span>Matrícula base</span>
            <strong>${formatNumber(baseValue)}</strong>

            <span>Matrícula proyectada</span>
            <strong>${formatNumber(currentValue)}</strong>

            <span>Cambio acumulado</span>
            <strong class="${
                totalChange < 0
                    ? "negative-value"
                    : "positive-value"
            }">
                ${formatPercentage(totalChange)}
            </strong>

            <span>Crecimiento anual promedio</span>
            <strong>
                ${formatPercentage(annualGrowth)}
            </strong>

            <span>Clave AGEB</span>
            <strong>
                ${escapeHTML(school.cvegeo || "Sin información")}
            </strong>
        </div>
    `;
}


function renderProjectionTable(school) {
    const container = byId("projectionTable");

    if (!container) return;

    const rows = SIGPE.years
        .map((year, index) => {
            const value = Number(school[year.field]) || 0;

            const previousValue =
                index === 0
                    ? value
                    : Number(
                        school[SIGPE.years[index - 1].field]
                    ) || 0;

            const annualChange =
                index === 0
                    ? null
                    : percent(value, previousValue);

            return `
                <tr>
                    <td>${year.label}</td>
                    <td>${formatNumber(value)}</td>
                    <td>${formatPercentage(annualChange)}</td>
                </tr>
            `;
        })
        .join("");

    container.innerHTML = `
        <table class="projection-table">
            <thead>
                <tr>
                    <th>Ciclo</th>
                    <th>Matrícula</th>
                    <th>Cambio anual</th>
                </tr>
            </thead>

            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}


function renderSimilarSchools(school) {
    const container = byId("similarSchools");

    if (!container) return;

    const currentField = getCurrentYearField();

    const candidates = SIGPE.data.escuelas
        .filter(candidate =>
            candidate.cct !== school.cct &&
            normalizeString(candidate.nivel) ===
                normalizeString(school.nivel) &&
            normalizeString(candidate.alcaldia) ===
                normalizeString(school.alcaldia)
        )
        .map(candidate => ({
            ...candidate,

            difference: Math.abs(
                (Number(candidate[currentField]) || 0) -
                (Number(school[currentField]) || 0)
            )
        }))
        .sort((a, b) => a.difference - b.difference)
        .slice(0, 5);

    if (candidates.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No se encontraron escuelas similares.
            </p>
        `;

        return;
    }

    container.innerHTML = candidates
        .map(candidate => `
            <button
                type="button"
                class="similar-school-card"
                onclick="selectSchoolById('${escapeAttribute(
                    candidate.id || candidate.cct
                )}')"
            >
                <strong>${escapeHTML(candidate.nombre)}</strong>

                <span>${escapeHTML(candidate.cct)}</span>

                <span>
                    ${formatNumber(candidate[currentField])}
                    estudiantes
                </span>
            </button>
        `)
        .join("");
}


function calculateAverageAnnualGrowth(school) {
    const firstValue =
        Number(school[SIGPE.years[0].field]) || 0;

    const lastValue =
        Number(
            school[
                SIGPE.years[SIGPE.years.length - 1].field
            ]
        ) || 0;

    const periods = SIGPE.years.length - 1;

    if (!firstValue || !lastValue || periods <= 0) {
        return null;
    }

    return (
        (Math.pow(lastValue / firstValue, 1 / periods) - 1) *
        100
    );
}


function downloadSchoolCSV(school) {
    const headers = [
        "CCT",
        "Escuela",
        "Nivel",
        "Alcaldía",
        "Ciclo",
        "Matrícula"
    ];

    const rows = SIGPE.years.map(year => [
        school.cct,
        school.nombre,
        school.nivel,
        school.alcaldia,
        year.label,
        Number(school[year.field]) || 0
    ]);

    const csv =
        "\uFEFF" +
        [
            headers,
            ...rows
        ]
            .map(row =>
                row
                    .map(value =>
                        `"${String(value).replaceAll('"', '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

    downloadTextFile(
        csv,
        `proyeccion_${school.cct}.csv`,
        "text/csv;charset=utf-8"
    );
}