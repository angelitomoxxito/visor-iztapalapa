function initializeFilters(){

console.log("Filtros cargados");

}

function updateDashboard(){

    byId("totalEscuelas").textContent=

    formatNumber(SIGPE.escuelas.length);

}