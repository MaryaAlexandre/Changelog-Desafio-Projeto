function parseJsonSeguro(texto, valorPadrao) {
  try {
    return JSON.parse(texto);
  } catch (e) {
    return valorPadrao;
  }
}

function getBaseUrl() {
  var origem = window.location.origin || "";

  if (origem.indexOf("localhost") !== -1 || origem.indexOf("127.0.0.1") !== -1) {
    return "/fluigapi";
  }

  return "https://strategiconsultoria176588.fluig.cloudtotvs.com.br:2450";
}

function textoSeguro(valor) {
  if (valor == null) return "";
  return String(valor).trim();
}

function lerValorGlobal(caminho) {
  try {
    var partes = caminho.split(".");
    var alvo = window;

    for (var i = 0; i < partes.length; i++) {
      if (!alvo || typeof alvo[partes[i]] == "undefined" || alvo[partes[i]] == null) {
        return "";
      }
      alvo = alvo[partes[i]];
    }

    return textoSeguro(alvo);
  } catch (e) {
    return "";
  }
}

function getUsuarioAtualFluig() {
  try {
    var nome =
      lerValorGlobal("WCMAPI.user") ||
      lerValorGlobal("parent.WCMAPI.user") ||
      lerValorGlobal("top.WCMAPI.user");

    var matricula =
      lerValorGlobal("WCMAPI.userCode") ||
      lerValorGlobal("parent.WCMAPI.userCode") ||
      lerValorGlobal("top.WCMAPI.userCode");

    var email =
      lerValorGlobal("WCMAPI.userEmail") ||
      lerValorGlobal("parent.WCMAPI.userEmail") ||
      lerValorGlobal("top.WCMAPI.userEmail");

    var login = matricula || nome || email;

    return {
      nome: nome,
      matricula: matricula,
      login: login,
      email: email
    };
  } catch (e) {
    return {
      nome: "",
      matricula: "",
      login: "",
      email: ""
    };
  }
}

export async function uploadArquivoSugestao(file) {
  var baseUrl = getBaseUrl();
  var pathId = "1802";

  if (!file) {
    throw new Error("Nenhum arquivo informado para upload.");
  }

  var formData = new FormData();
  formData.append("file", file);
  formData.append("pathId", String(pathId));

  var agora = new Date();
  var dataArquivo = agora.toLocaleDateString("pt-BR").replace(/\//g, "-");
  var extensao = (file.name.split(".").pop() || "png").toLowerCase();
  var nomeFinal = "sugestao-" + dataArquivo + "." + extensao;

  formData.append("nameFile", nomeFinal);

  var url = baseUrl + "/fluighub/rest/service/execute/uploadfile";

  console.log("[Sugestao] URL upload:", url);

  var response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  var texto = await response.text();
  console.log("[Sugestao] Status upload:", response.status);
  console.log("[Sugestao] Resposta upload:", texto);

  if (!response.ok) {
    throw new Error("HTTP " + response.status + " - " + texto);
  }

  var res = parseJsonSeguro(texto, null);
  if (!res) {
    throw new Error("Resposta inválida no upload.");
  }

  if (res.code != null && Number(res.code) != 200) {
    throw new Error(res.message || "Erro ao enviar arquivo.");
  }

  var msg = typeof res.message == "string"
    ? parseJsonSeguro(res.message, {})
    : (res.message || {});

  var documentId = String(msg.documentId || msg.documentid || "");
  var fileName = msg.fileName || nomeFinal;
  var openUrl = documentId
    ? baseUrl + "/ecm_documentview/documentView.ftl?documentId=" + documentId
    : "";

  return {
    documentId: documentId,
    fileName: fileName,
    openUrl: openUrl
  };
}

export async function submeterSugestao(payload) {
  payload = payload || {};

  var titulo = textoSeguro(payload.titulo);
  var descricao = textoSeguro(payload.descricao);
  var modulo = textoSeguro(payload.modulo);
  var tipo = textoSeguro(payload.tipo);
  var impacto = textoSeguro(payload.impacto);
  var beneficio = textoSeguro(payload.beneficio);
  var origem = textoSeguro(payload.origem || "widget");
  var imagemId = textoSeguro(payload.imagemId);
  var imagemNome = textoSeguro(payload.imagemNome);
  var tagsSelecionadas = textoSeguro(payload.tagsSelecionadas);
  var statusSugestao = textoSeguro(payload.statusSugestao || "Aberto");

  if (!titulo || !descricao || !modulo || !tipo) {
    throw new Error("Preencha os campos obrigatórios.");
  }

  var usuarioAtual = getUsuarioAtualFluig();

  var nomeInformado = textoSeguro(payload.nomeUsuarioLogado);
  var matriculaInformada = textoSeguro(payload.matriculaUsuarioLogado);
  var emailInformado = textoSeguro(payload.emailUsuarioLogado);

  var usuarioInformado = textoSeguro(payload.usuarioLogado);
  var solicitanteInformado = textoSeguro(payload.solicitanteSugestao);
  var emailSolicitanteInformado = textoSeguro(payload.emailSolicitante);
  var createdByInformado = textoSeguro(payload.createdBy);

  var nomeFinal =
    solicitanteInformado ||
    nomeInformado ||
    usuarioAtual.nome ||
    usuarioInformado;

  var emailFinal =
    emailSolicitanteInformado ||
    emailInformado ||
    usuarioAtual.email;

  var createdByFinal =
    createdByInformado ||
    matriculaInformada ||
    usuarioAtual.matricula ||
    usuarioAtual.login;

  if (!nomeFinal) {
    throw new Error("Não foi possível identificar o nome do usuário logado.");
  }

  if (!emailFinal) {
    throw new Error("Não foi possível identificar o e-mail do usuário logado.");
  }

  if (!createdByFinal) {
    throw new Error("Não foi possível identificar a matrícula/login do usuário logado.");
  }

  var agora = new Date();
  var date = agora.toLocaleDateString("pt-BR");
  var time = agora.toLocaleTimeString("pt-BR");
  var baseUrl = getBaseUrl();

  var formFields = {
    titulo: titulo,
    descricao: descricao,
    modulo: modulo,
    tipo: tipo,
    impacto: impacto,
    beneficio: beneficio,
    tagsSelecionadas: tagsSelecionadas,
    imagemId: imagemId,
    imagemNome: imagemNome,
    createdBy: createdByFinal,
    solicitanteSugestao: nomeFinal,
    emailSolicitante: emailFinal,
    createdDate: date,
    dataAberturaSugestao: date,
    statusSugestao: statusSugestao,
    origem: origem
  };

  var params = {
    targetState: 0,
    targetAssignee: "",
    comment: "Solicitação aberta " + date + " " + time,
    formFields: formFields
  };

  var options = {
    endpoint: "start",
    method: "post",
    process: "IzikGJFGMfYpIwYSqRmO0Ekml2D/J2W4wviLGzFLIO0=",
    params: JSON.stringify(params)
  };

  var url = baseUrl + "/fluighub/rest/service/execute/movestart-process";

  console.log("[Sugestao] URL start-process:", url);
  console.log("[Sugestao] Payload recebido:", payload);
  console.log("[Sugestao] Usuário Fluig detectado:", usuarioAtual);
  console.log("[Sugestao] Nome final:", nomeFinal);
  console.log("[Sugestao] Email final:", emailFinal);
  console.log("[Sugestao] CreatedBy final:", createdByFinal);
  console.log("[Sugestao] FormFields enviados:", formFields);
  console.log("[Sugestao] Params enviados:", params);
  console.log("[Sugestao] Options enviados:", JSON.stringify(options, null, 2));

  var response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(options)
  });

  var texto = await response.text();
  console.log("[Sugestao] Status start-process:", response.status);
  console.log("[Sugestao] Resposta start-process:", texto);

  if (!response.ok) {
    throw new Error("HTTP " + response.status + " - " + texto);
  }

  var res = parseJsonSeguro(texto, null);
  if (!res) {
    throw new Error("Resposta inválida ao iniciar o processo.");
  }

  var data = typeof res.message == "string"
    ? parseJsonSeguro(res.message, {})
    : (res.message || {});

  if (res.code != null && Number(res.code) != 200) {
    throw new Error(res.message || "Erro ao iniciar o processo.");
  }

  return {
    sucesso: true,
    protocolo: data.processInstanceId || data.id || res.processInstanceId || ""
  };
}