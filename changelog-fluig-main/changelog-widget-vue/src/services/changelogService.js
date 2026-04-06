function parseJsonSeguro(texto, valorPadrao) {
  try {
    return JSON.parse(texto);
  } catch (e) {
    return valorPadrao;
  }
}

function textoSeguro(valor) {
  if (valor == null) return "";
  return String(valor).trim();
}

function separarLista(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map(function (item) {
        return textoSeguro(item);
      })
      .filter(function (item) {
        return item != "";
      });
  }

  var texto = textoSeguro(valor);
  if (!texto) return [];

  return texto
    .split(/[;,|]/)
    .map(function (item) {
      return textoSeguro(item);
    })
    .filter(function (item) {
      return item != "";
    });
}

function paraBooleano(valor) {
  var texto = String(valor == null ? "" : valor).trim().toLowerCase();
  return texto == "true" || texto == "1" || texto == "sim" || texto == "yes";
}

function normalizarStatus(valor) {
  var texto = String(valor == null ? "" : valor).trim().toLowerCase();
  if (!texto) return "";

  if (["publicado", "publicada", "published"].indexOf(texto) >= 0) return "publicado";
  if (["ativo", "ativa", "active"].indexOf(texto) >= 0) return "ativo";
  if (["rascunho", "draft"].indexOf(texto) >= 0) return "rascunho";

  return texto;
}

function normalizarImpacto(valor) {
  var texto = String(valor == null ? "" : valor).trim().toLowerCase();
  if (!texto) return "";

  if (["baixo", "baixa", "low"].indexOf(texto) >= 0) return "Baixo";
  if (["medio", "médio", "media", "média", "medium"].indexOf(texto) >= 0) return "Médio";
  if (["alto", "alta", "high"].indexOf(texto) >= 0) return "Alto";

  return valor || "";
}

function normalizarCategoria(valor) {
  var texto = String(valor == null ? "" : valor).trim().toLowerCase();
  if (!texto) return "";

  if (["novo", "nova", "novidade", "new"].indexOf(texto) >= 0) return "Novo";
  if (["melhoria", "improvement", "improve"].indexOf(texto) >= 0) return "Melhoria";
  if (["correcao", "correção", "fix", "bugfix"].indexOf(texto) >= 0) return "Correção";
  if (["seguranca", "segurança", "security"].indexOf(texto) >= 0) return "Segurança";
  if (["remocao", "remoção", "remove", "removed"].indexOf(texto) >= 0) return "Remoção";

  return valor || "";
}

function normalizarMudanca(mudanca) {
  mudanca = mudanca || {};

  return {
    type: normalizarCategoria(mudanca.type || mudanca.categoria || ""),
    title: mudanca.title || mudanca.titulo || "",
    module: mudanca.module || mudanca.modulo || "",
    details: mudanca.details || mudanca.descricao || "",
    impact: normalizarImpacto(mudanca.impact || mudanca.impacto || "")
  };
}

function normalizarLinhasPortugues(linhas) {
  return (linhas || []).map(function (linha) {
    var versao = textoSeguro(linha.numeroVersao || linha.version || "");
    var dataPublicacao = textoSeguro(linha.dataPublicacao || linha.releaseDate || "");
    var status = normalizarStatus(linha.statusVersao || linha.status || "");

    var resumo = textoSeguro(linha.titulo || linha.summary || "");
    var descricao = textoSeguro(linha.descricao || linha.description || "");

    var tags = separarLista(linha.tagsSelecionadas || linha.tags || "");
    var categorias = separarLista(linha.categoriasSelecionadas || linha.categories || "");

    var idDocumentoImagem = textoSeguro(linha.imagemId || linha.imageDocumentId || "");
    var nomeImagem = textoSeguro(linha.imagemNome || linha.imageName || "");
    var urlImagem = textoSeguro(linha.imagemUrl || linha.imageUrl || "");

    var fixado = paraBooleano(linha.pinned || false);

    var mudancasBrutas = Array.isArray(linha.changes)
      ? linha.changes
      : parseJsonSeguro(linha.changesJson || "[]", []);

    var mudancas = (mudancasBrutas || []).map(normalizarMudanca);

    return {
      documentId: linha.documentid || linha.documentId || linha["metadata#id"] || "",
      numeroVersao: versao,
      version: versao,
      releaseDate: dataPublicacao,
      status: status,
      summary: resumo,
      description: descricao,
      categories: categorias,
      tags: tags,
      pinned: fixado,
      imageDocumentId: idDocumentoImagem,
      imageName: nomeImagem,
      imageUrl: urlImagem || "",
      changes: mudancas
    };
  });
}

function getBaseUrl() {
  var origem = window.location.origin || "";

  if (origem.indexOf("localhost") != -1 || origem.indexOf("127.0.0.1") != -1) {
    return "/fluigapi";
  }

  return "https://strategiconsultoria176588.fluig.cloudtotvs.com.br:2450";
}

async function resolverUrlImagemPorDocumentId(documentId) {
  if (!documentId) return "";

  try {
    var baseUrl = getBaseUrl();
    var resposta = await fetch(
      baseUrl + "/api/public/2.0/documents/getDownloadURL/" + encodeURIComponent(documentId),
      {
        method: "GET",
        headers: {
          Accept: "application/json, text/plain, */*"
        },
        credentials: "include"
      }
    );

    if (!resposta.ok) {
      console.error("Falha ao resolver imagem do documentId " + documentId + ": HTTP " + resposta.status);
      return "";
    }

    var textoBruto = await resposta.text();
    if (!textoBruto) return "";

    var texto = String(textoBruto).trim();

    if (
      (texto.charAt(0) == '"' && texto.charAt(texto.length - 1) == '"') ||
      (texto.charAt(0) == "'" && texto.charAt(texto.length - 1) == "'")
    ) {
      texto = texto.substring(1, texto.length - 1);
    }

    if (texto.charAt(0) == "{" || texto.charAt(0) == "[") {
      var convertido = parseJsonSeguro(texto, null);

      if (convertido) {
        if (typeof convertido == "string") return convertido;
        if (convertido.content) return String(convertido.content);
        if (convertido.url) return String(convertido.url);
        if (convertido.downloadURL) return String(convertido.downloadURL);
        if (convertido.message && typeof convertido.message == "string") return convertido.message;
      }
    }

    return texto;
  } catch (e) {
    console.error("Erro ao resolver URL da imagem para documentId " + documentId + ":", e);
    return "";
  }
}

async function enriquecerLinhasComUrlImagemResolvida(itens) {
  var itensResolvidos = await Promise.all(
    (itens || []).map(async function (item) {
      if (item.imageUrl || !item.imageDocumentId) {
        return item;
      }

      var urlResolvida = await resolverUrlImagemPorDocumentId(item.imageDocumentId);

      return {
        documentId: item.documentId,
        numeroVersao: item.numeroVersao,
        version: item.version,
        releaseDate: item.releaseDate,
        status: item.status,
        summary: item.summary,
        description: item.description,
        categories: item.categories,
        tags: item.tags,
        pinned: item.pinned,
        imageDocumentId: item.imageDocumentId,
        imageName: item.imageName,
        imageUrl: urlResolvida || "",
        changes: item.changes
      };
    })
  );

  return itensResolvidos;
}

function extrairLinhasDatasearch(res) {
  if (!res) return [];

  var mensagem = res.message;

  if (!mensagem) {
    return [];
  }

  if (typeof mensagem == "string") {
    mensagem = parseJsonSeguro(mensagem, mensagem);
  }

  if (mensagem && mensagem.values && Array.isArray(mensagem.values)) {
    if (mensagem.values.length > 0 && mensagem.values[0] && mensagem.values[0].values) {
      var valoresInternos = mensagem.values[0].values;

      if (typeof valoresInternos == "string") {
        var convertido = parseJsonSeguro(valoresInternos, null);
        if (convertido) {
          if (Array.isArray(convertido)) return convertido;
          if (convertido.values && Array.isArray(convertido.values)) return convertido.values;
          if (convertido.content && convertido.content.values) return convertido.content.values;
        }
      }

      if (Array.isArray(valoresInternos)) {
        return valoresInternos;
      }
    }

    return mensagem.values;
  }

  if (mensagem && mensagem.content && Array.isArray(mensagem.content.values)) {
    return mensagem.content.values;
  }

  if (Array.isArray(mensagem)) {
    return mensagem;
  }

  return [];
}

function montarParamsDataset(nomeDataset, restricoes, ordenacao) {
  var partes = [];

  partes.push("datasetId=" + encodeURIComponent(nomeDataset || ""));

  if (restricoes && restricoes.length) {
    partes.push("constraints=" + encodeURIComponent(JSON.stringify(restricoes)));
  }

  if (ordenacao && ordenacao.length) {
    partes.push("order=" + encodeURIComponent(JSON.stringify(ordenacao)));
  }

  return partes.join("&");
}

function quebrarVersao(versao) {
  if (!versao) return [0, 0, 0];

  return String(versao)
    .replace(/^v/i, "")
    .split(".")
    .map(function (parte) {
      return parseInt(parte, 10) || 0;
    });
}

function compararVersaoDesc(a, b) {
  var versaoA = quebrarVersao(a.numeroVersao || a.version);
  var versaoB = quebrarVersao(b.numeroVersao || b.version);

  var maximo = Math.max(versaoA.length, versaoB.length);

  for (var i = 0; i < maximo; i++) {
    var numeroA = versaoA[i] || 0;
    var numeroB = versaoB[i] || 0;

    if (numeroB != numeroA) {
      return numeroB - numeroA;
    }
  }

  return 0;
}

export async function buscarVersoesChangelog(params) {
  params = params || {};

  var nomeDataset = params.datasetName || "ds_changelogg_marya";
  var restricoes = params.constraints || [];
  var ordenacao = params.order || [];
  var baseUrl = getBaseUrl();

  var options = {
    endpoint: "dataset",
    method: "get",
    params: montarParamsDataset(nomeDataset, restricoes, ordenacao)
  };

  var url = baseUrl + "/fluighub/rest/service/execute/datasearch";

  console.log("URL datasearch:", url);
  console.log("Options enviados:", options);

  var resposta = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(options)
  });

  if (!resposta.ok) {
    var textoErroHttp = await resposta.text();
    console.error("Erro HTTP bruto no datasearch:", textoErroHttp);
    throw new Error("Falha ao buscar dataset: HTTP " + resposta.status);
  }

  var res = await resposta.json();
  console.log("Resposta bruta do datasearch:", res);

  if (res.code != 200) {
    throw new Error(res.message || "Erro ao buscar dados do changelog");
  }

  var linhas = extrairLinhasDatasearch(res);

  console.log("Linhas brutas do datasearch:", linhas);

  var linhasNormalizadas = normalizarLinhasPortugues(linhas);
  var linhasComImagemResolvida = await enriquecerLinhasComUrlImagemResolvida(linhasNormalizadas);

  linhasComImagemResolvida.sort(function (a, b) {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    var comparacaoVersao = compararVersaoDesc(a, b);
    if (comparacaoVersao != 0) return comparacaoVersao;

    var dataA = new Date(a.releaseDate || 0).getTime();
    var dataB = new Date(b.releaseDate || 0).getTime();

    return dataB - dataA;
  });

  return linhasComImagemResolvida;
}