/* =========================================================
   GRÁFICAS
   ========================================================= */

let schoolChart = null;
let comparisonChart = null;
let conapoChart = null;


function renderSchoolChart(school) {
    const canvas = firstExistingElement(
        "chartMatricula",
        "schoolChart"
    );

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    destroySchoolChart();

    const labels = SIGPE.years.map(year => year.label);

    const values = SIGPE.years.map(
        year => Number(school[year.field]) || 0
    );

    schoolChart = new Chart(canvas.getContext("2d"), {
        type: "line",

        data: {
            labels,

            datasets: [
                {
                    label: school.nombre,
                    data: values,
                    borderWidth: 3,
                    tension: 0.25,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label(context) {
                            return (
                                `${formatNumber(context.raw)} ` +
                                "estudiantes"
                            );
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback(value) {
                            return formatNumber(value);
                        }
                    }
                }
            }
        }
    });
}


function destroySchoolChart() {
    if (schoolChart) {
        schoolChart.destroy();
        schoolChart = null;
    }
}


function destroyComparisonChart() {
    if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
    }
}

function renderConapoComparison(municipalityCode) {
    const canvas = byId("conapoChart");
    const summary = byId("conapoSummary");
    if (!canvas || !summary || typeof Chart === "undefined") return;

    const mun = String(municipalityCode || "").padStart(3, "0");
    const schools = SIGPE.data.escuelas.filter(school => school.mun === mun);
    const population = SIGPE.years.map(year => {
        const row = SIGPE.data.conapo.find(item =>
            String(item.mun || "").padStart(3, "0") === mun &&
            Number(item.anio) === year.year
        );
        return row ? Number(row.pob_00_14) || 0 : 0;
    });
    const enrollment = SIGPE.years.map(year =>
        schools.reduce((sum, school) => sum + (Number(school[year.field]) || 0), 0)
    );
    const analysis = SIGPE.data.analisis.find(item =>
        String(item.mun || "").padStart(3, "0") === mun
    );
    const alcaldia = schools[0]?.alcaldia || analysis?.alcaldia || "Alcaldía";

    summary.innerHTML = `
        <div class="popup-grid">
            <span>Alcaldía:</span><strong>${escapeHTML(alcaldia)}</strong>
            <span>Variación matrícula:</span><strong>${formatPercentage(analysis?.variacion_matricula_pct)}</strong>
            <span>Variación CONAPO:</span><strong>${formatPercentage(analysis?.variacion_conapo_pct)}</strong>
            <span>Correlación temporal:</span><strong>${analysis?.correlacion_pearson == null ? "Sin dato" : Number(analysis.correlacion_pearson).toFixed(2)}</strong>
        </div>`;

    if (conapoChart) conapoChart.destroy();
    conapoChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: SIGPE.years.map(year => year.label),
            datasets: [
                { label: "Matrícula", data: enrollment, borderWidth: 3, tension: .25, yAxisID: "y" },
                { label: "CONAPO 0–14", data: population, borderWidth: 3, tension: .25, yAxisID: "y1" }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
                y: { beginAtZero: true, position: "left", title: { display: true, text: "Matrícula" } },
                y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Población 0–14" } }
            }
        }
    });
}

function destroyConapoChart() {
    if (conapoChart) {
        conapoChart.destroy();
        conapoChart = null;
    }
}

function renderComparisonChart() {
    const canvas = byId("comparisonChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(
        canvas.getContext("2d"),
        {
            type: "line",

            data: {
                labels: SIGPE.years.map(year => year.label),

                datasets: SIGPE.comparison.map(school => ({
                    label: school.nombre,

                    data: SIGPE.years.map(
                        year =>
                            Number(school[year.field]) || 0
                    ),

                    borderWidth: 3,
                    tension: 0.25,
                    fill: false
                }))
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}