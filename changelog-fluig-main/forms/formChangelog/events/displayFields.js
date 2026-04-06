function displayFields(form, customHTML) {
  var usuario = typeof getValue === "function" ? getValue("WKUser") : "admin";
  var activity = typeof getValue === "function" ? String(getValue("WKNumState")) : "0";
  var mode = form.getFormMode ? form.getFormMode() : "ADD";

  if (mode == "ADD") {
    var hoje = new Date();
    var dataFormatada =
      pad(hoje.getDate()) + "/" +
      pad(hoje.getMonth() + 1) + "/" +
      hoje.getFullYear();

    form.setValue("createdBy", usuario);
    form.setValue("createdDate", dataFormatada);
    form.setValue("dataAberturaSugestao", dataFormatada);

    if (!form.getValue("statusSugestao")) {
      form.setValue("statusSugestao", "Aberto");
    }

    if (!form.getValue("origem")) {
      form.setValue("origem", "widget");
    }

    if (!form.getValue("solicitanteSugestao")){
      form.setValue("solicitanteSugestao", usuario);
    }
  }

  if (!form.getValue("emailSolicitante")) {
    var email = buscarEmailUsuario(usuario);
    if (email) {
      form.setValue("emailSolicitante", email);
    }
  }

  definirPrazoPorActivity(form, activity);

  customHTML.append("<script>");
  customHTML.append("document.addEventListener('DOMContentLoaded', function(){");
  customHTML.append("  var secao = document.getElementById('secao-complementacao');");
  customHTML.append("  if (secao) {");
  customHTML.append("    secao.style.display = " + (activity == "12" ? "'block'" : "'none'") + ";");
  customHTML.append("  }");
  customHTML.append("});");
  customHTML.append("</script>");
}

function buscarEmailUsuario(login){
  try {
    var c1 = DatasetFactory.createConstraint(
    "colleaguePK.colleagueId",
    String(login),
    String(login),
    ConstraintType.MUST
    );

    var ds = DatasetFactory.getDataset("colleague", null, [c1], null);
    if (ds && ds.rowsCount > 0){
      var email = ds.getValue(0, "mail");
      return email ? String(email) : "";   }
  
} catch (e){
  log.error("Erro ao buscar email do usuário" + login + ":" + e);
}
return "";
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}