/* =========================================================
   GRÁFICAS
   ========================================================= */

let schoolChart = null;
let comparisonChart = null;


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