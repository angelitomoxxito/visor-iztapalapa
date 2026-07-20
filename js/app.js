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

    years: Array.from({ length: 12 }, (_, index) => {
        const year = 2024 + index;

        return {
            year,
            label: `${year}-${year + 1}`,
            field: `mat_${year}_${year + 1}`
        };
    }),

    currentYearIndex: 0,
    currentLevel: "Todos",
    currentAlcaldia: "Todos",
    selectedSchool: null,
    comparison: []
};

window.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log("Iniciando SIGPE-CDMX v3.0");

        initializeMap();
        await loadData();

        populateYearSelector();
        enrichAlcaldias();

        drawAlcaldias();
        drawAGEB();

        initializeFilters();
        initializeSearch();
        initializeLayerControls();
        initializeFullscreen();

        refreshMap();

        console.log("SIGPE-CDMX cargado correctamente");
    } catch (error) {
        console.error("Error al iniciar SIGPE-CDMX:", error);

        alert(
            "No se pudieron cargar los datos. " +
            "Revisa los nombres de los archivos dentro de la carpeta data."
        );
    }
});