function openSidebar(){

byId("detailsPanel").style.display="flex";

}

function closeSidebar(){

byId("detailsPanel").style.display="none";

}

byId("closePanel")
.addEventListener("click",closeSidebar);
function selectSchool(escuela){

    SIGPE.selectedSchool=escuela;

    openSidebar();

    byId("schoolInfo").innerHTML=`

    <h2>${escuela.inmueble}</h2>

    <br>

    <b>CCT:</b> ${escuela.cct}

    <br><br>

    <b>Nivel:</b>

    ${escuela.nivel}

    <br><br>

    <b>Alcaldía:</b>

    ${escuela.alcaldia}

    <br><br>

    <b>Matrícula base:</b>

    ${formatNumber(escuela["2025"])}

    `;

}