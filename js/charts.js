let schoolChart;

function createChart(labels,data){

const ctx=document
.getElementById("chartMatricula")
.getContext("2d");

if(schoolChart){

schoolChart.destroy();

}

schoolChart=new Chart(ctx,{

type:"line",

data:{

labels,

datasets:[{

label:"Matrícula",

data,

borderWidth:3,

tension:.25,

fill:false

}]

},

options:{

responsive:true,

plugins:{

legend:{

display:false

}

}

}

});

}