/* =========================================================
   COMPARACIÓN DE ESCUELAS
   ========================================================= */

function initializeComparison() {
    ensureComparisonModal();
}


function addSchoolComparison(school) {
    if (!school) return;

    const alreadyAdded = SIGPE.comparison.some(
        item => item.cct === school.cct
    );

    if (alreadyAdded) {
        openComparisonModal();
        return;
    }

    if (SIGPE.comparison.length >= 3) {
        alert(
            "Solo puedes comparar hasta tres escuelas."
        );

        return;
    }

    SIGPE.comparison.push(school);

    renderComparison();
    openComparisonModal();
}


function removeSchoolComparison(cct) {
    SIGPE.comparison = SIGPE.comparison.filter(
        school => school.cct !== cct
    );

    renderComparison();

    if (SIGPE.comparison.length === 0) {
        closeComparisonModal();
    }
}


function ensureComparisonModal() {
    if (byId("comparisonModal")) return;

    const modal = document.createElement("div");

    modal.id = "comparisonModal";
    modal.className = "comparison-modal";

    modal.innerHTML = `
        <div class="comparison-dialog">
            <div class="comparison-header">
                <div>
                    <h2>Comparación de escuelas</h2>
                    <p>Hasta tres escuelas</p>
                </div>

                <button
                    type="button"
                    class="icon-button"
                    onclick="closeComparisonModal()"
                    aria-label="Cerrar comparación"
                >
                    ✕
                </button>
            </div>

            <div id="comparisonSchools"></div>

            <div class="comparison-chart-wrapper">
                <canvas id="comparisonChart"></canvas>
            </div>

            <div id="comparisonTable"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeComparisonModal();
        }
    });
}


function openComparisonModal() {
    ensureComparisonModal();

    byId("comparisonModal")?.classList.add("open");
}


function closeComparisonModal() {
    byId("comparisonModal")?.classList.remove("open");
}


function renderComparison() {
    ensureComparisonModal();

    const schoolsContainer = byId("comparisonSchools");
    const tableContainer = byId("comparisonTable");

    if (!schoolsContainer || !tableContainer) return;

    schoolsContainer.innerHTML = SIGPE.comparison
        .map(school => `
            <div class="comparison-school-chip">
                <span>
                    <strong>${escapeHTML(school.nombre)}</strong>
                    <small>${escapeHTML(school.cct)}</small>
                </span>

                <button
                    type="button"
                    onclick="removeSchoolComparison('${escapeAttribute(
                        school.cct
                    )}')"
                    aria-label="Quitar escuela"
                >
                    ✕
                </button>
            </div>
        `)
        .join("");

    const rows = SIGPE.years
        .map(year => `
            <tr>
                <td>${year.label}</td>

                ${SIGPE.comparison
                    .map(school => `
                        <td>
                            ${formatNumber(school[year.field])}
                        </td>
                    `)
                    .join("")}
            </tr>
        `)
        .join("");

    tableContainer.innerHTML = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Ciclo</th>

                    ${SIGPE.comparison
                        .map(school => `
                            <th>${escapeHTML(school.cct)}</th>
                        `)
                        .join("")}
                </tr>
            </thead>

            <tbody>${rows}</tbody>
        </table>
    `;

    renderComparisonChart();
}