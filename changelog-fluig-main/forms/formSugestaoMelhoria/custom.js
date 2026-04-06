function toggleCamposDecisao(){
    var decisao = document.getElementById("decisao");
    if (!decisao) return;

    var valor = decisao.value || "";
    var exigeAprovacao = (valor == "aprovar" || valor == "backlog");


    setCampoTela("justificativaDecisao", valor !== "");
    setCampoTela("prioridade", exigeAprovacao);
    setCampoTela("responsavelArea", exigeAprovacao);
    setCampoTela("prazoSugerido", exigeAprovacao);
    setCampoTela("linkItemInterno", exigeAprovacao);
}

function setCampoTela (id, habilitado){
    var campo = document.getElementById(id);
    if(!campo) return;

    campo.readOnly = !habilitado;
    campo.disabled = !habilitado;

}

document.addEventListener("DOMContentLoaded", function(){
    toggleCamposDecisao();

    var decisao = document.getElementById("decisao");
    if(decisao){
        decisao.addEventListener("change", toggleCamposDecisao);
    }
});