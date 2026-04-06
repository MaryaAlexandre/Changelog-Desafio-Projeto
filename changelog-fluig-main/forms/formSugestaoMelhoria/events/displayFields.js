function displayFields(form, customHTML) {
  var usuario = typeof getValue === "function" ? String(getValue("WKUser")) : "";
  var activity = typeof getValue === "function" ? String(getValue("WKNumState")) : "0";
  var mode = form.getFormMode ? form.getFormMode() : "ADD";

  var hoje = new Date();
  var dataFormatada =
    pad(hoje.getDate()) + "/" +
    pad(hoje.getMonth() + 1) + "/" +
    hoje.getFullYear();

  if (mode == "ADD") {
    if (!form.getValue("createdBy")) {
      form.setValue("createdBy", usuario);
    }

    if (!form.getValue("createdDate")) {
      form.setValue("createdDate", dataFormatada);
    }

    if (!form.getValue("dataAberturaSugestao")) {
      form.setValue("dataAberturaSugestao", dataFormatada);
    }

    if (!form.getValue("statusSugestao")) {
      form.setValue("statusSugestao", "Aberto");
    }

    if (!form.getValue("origem")) {
      form.setValue("origem", "widget");
    }

    if (!form.getValue("solicitanteSugestao")) {
      form.setValue("solicitanteSugestao", usuario);
    }
  }

  form.setShowDisabledFields(true);

  definirStatusPorActivity(form, activity);
  definirPrazoPorActivity(form, activity);
  definirDataFechamentoPorActivity(form, activity);
  definirMotivoEncerramento(form, activity);
  controlarSecoes(form, activity);
  controlarCamposGestao(form, activity);
  bloquearTudoNoEncerramento(form, activity);
}

function definirStatusPorActivity(form, activity) {
  if (activity == "13") {
    form.setValue("statusSugestao", "Aberto");
  } else if (activity == "7") {
    form.setValue("statusSugestao", "Validação");
  } else if (activity == "8") {
    form.setValue("statusSugestao", "Revisão");
  } else if (activity == "43") {
    form.setValue("statusSugestao", "Complementação");
  } else if (activity == "31") {
    form.setValue("statusSugestao", "Backlog");
  } else if (activity == "41") {
    form.setValue("statusSugestao", "Aprovado");
  } else if (activity == "12") {
    form.setValue("statusSugestao", "Encerrado");
  }
}

function controlarSecoes(form, activity) {
  var mostrarGestao = (
    activity == "7"  ||
    activity == "8"  ||
    activity == "31" ||
    activity == "41" ||
    activity == "12"
  );

  try {
    form.setVisibleById("secao-gestao", mostrarGestao);
  } catch (e) {
    log.warn("Erro ao controlar secao-gestao: " + e);
  }
}

function controlarCamposGestao(form, activity) {
  var emGestao = (activity == "7" || activity == "8");
  var decisao = valorCampo(form, "decisao");
  var exigeAprovacao = (decisao == "aprovar" || decisao == "backlog");

  setCampoEditavel(form, "decisao", emGestao);
  setCampoEditavel(form, "justificativaDecisao", emGestao && decisao != "");
  setCampoEditavel(form, "prioridade", emGestao && exigeAprovacao);
  setCampoEditavel(form, "responsavelArea", emGestao && exigeAprovacao);
  setCampoEditavel(form, "prazoSugerido", emGestao && exigeAprovacao);
  setCampoEditavel(form, "linkItemInterno", emGestao && exigeAprovacao);
  setCampoEditavel(form, "categoria", emGestao);
  setCampoEditavel(form, "duplicadoDe", emGestao);
}

function definirPrazoPorActivity(form, activity) {
  try {
    if (activity == "13" && !form.getValue("prazoSugerido")) {
      form.setValue("prazoSugerido", "");
    }
  } catch (e) {
    log.warn("Erro ao definir prazo: " + e);
  }
}

function definirDataFechamentoPorActivity(form, activity) {
  try {
    if (activity == "12" && !form.getValue("dataFechamento")) {
      var hoje = new Date();
      var dataFormatada =
        pad(hoje.getDate()) + "/" +
        pad(hoje.getMonth() + 1) + "/" +
        hoje.getFullYear();

      form.setValue("dataFechamento", dataFormatada);
    }
  } catch (e) {
    log.warn("Erro ao definir data de fechamento: " + e);
  }
}

function definirMotivoEncerramento(form, activity) {
  try {
    if (activity == "12" && !form.getValue("motivoEncerramento")) {
      var decisao = valorCampo(form, "decisao");

      if (decisao == "aprovar") {
        form.setValue("motivoEncerramento", "Sugestão aprovada e encaminhada.");
      } else if (decisao == "backlog") {
        form.setValue("motivoEncerramento", "Sugestão registrada em backlog.");
      } else if (decisao == "reprovar") {
        form.setValue("motivoEncerramento", "Sugestão reprovada.");
      } else {
        form.setValue("motivoEncerramento", "Solicitação encerrada.");
      }
    }
  } catch (e) {
    log.warn("Erro ao definir motivo de encerramento: " + e);
  }
}

function bloquearTudoNoEncerramento(form, activity) {
  if (activity != "12") return;

  var campos = [
    "titulo",
    "descricao",
    "modulo",
    "tipo",
    "impacto",
    "beneficio",
    "categoria",
    "duplicadoDe",
    "prioridade",
    "decisao",
    "responsavelArea",
    "justificativaDecisao",
    "prazoSugerido",
    "linkItemInterno"
  ];

  for (var i = 0; i < campos.length; i++) {
    setCampoEditavel(form, campos[i], false);
  }
}

function setCampoEditavel(form, nomeCampo, editavel) {
  try {
    form.setEnabled(nomeCampo, editavel);
  } catch (e) {
    log.warn("Erro ao alterar campo " + nomeCampo + ": " + e);
  }
}

function valorCampo(form, nomeCampo) {
  try {
    var valor = form.getValue(nomeCampo);
    return valor ? String(valor) : "";
  } catch (e) {
    return "";
  }
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}