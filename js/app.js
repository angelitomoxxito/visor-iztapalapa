const SIGPE = {
    map: null,

    data: {
        ageb: null,
        alcaldias: null,
        escuelas: [],
        conapo: [],
        analisis: []
    },

    layers: {
        ageb: null,
        alcaldias: null
    },

    years: Array.from(
        { length: 12 },
        (_, index) => {
            const year = 2024 + index;

            return {
                year,
                label: `${year}-${year + 1}`,
                field: `mat_${year}_${year + 1}`
            };
        }
    ),

    currentYearIndex: 0,
    currentLevel: "Todos",
    currentAlcaldia: "Todos",
    currentVariable: "total",

    selectedSchool: null,
    comparison: [],
    initialBoundsApplied: false
};


window.addEventListener(
    "DOMContentLoaded",
    async () => {
        try {
            initializeMap();

            await loadData();

            populateYearSelector();
            enrichAlcaldias();

            drawAlcaldias();
            drawAGEB();

            initializeFilters();
            initializeSearch();
            initializeSidebar();
            initializeComparison();
            initializeLayerControls();
            initializeFullscreen();

            refreshMap();

            // Leaflet necesita recalcular el tamaño después de que el grid
            // y los paneles hayan terminado de ocupar su espacio definitivo.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    SIGPE.map?.invalidateSize(true);
                });
            });

            window.addEventListener("resize", debounce(() => {
                SIGPE.map?.invalidateSize(false);
            }, 120));

            console.log(
                "SIGPE-CDMX v3.0 cargado correctamente",
                {
                    ageb:
                        SIGPE.data.ageb.features.length,

                    alcaldias:
                        SIGPE.data.alcaldias.features.length,

                    escuelas:
                        SIGPE.data.escuelas.length
                }
            );
        } catch (error) {
            console.error(
                "No se pudo iniciar SIGPE-CDMX:",
                error
            );

            alert(
                "No se pudieron cargar los datos. " +
                "Abre la consola con F12 para ver " +
                "qué archivo está fallando."
            );
        }
    }
);