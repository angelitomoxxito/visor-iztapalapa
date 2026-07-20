function formatNumber(value){

return Number(value||0).toLocaleString("es-MX");

}

function percent(current,base){

if(base===0)return 0;

return ((current-base)/base)*100;

}

function byId(id){

return document.getElementById(id);

}