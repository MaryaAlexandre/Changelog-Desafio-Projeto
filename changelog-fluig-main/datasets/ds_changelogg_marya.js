function createDataset(fields, constraints, sortFields) {
  var ds = DatasetBuilder.newDataset();

  ds.addColumn("documentid");
  ds.addColumn("metadata#parent_id");

  ds.addColumn("numeroVersao");
  ds.addColumn("versaoNormalizada");
  ds.addColumn("dataPublicacao");
  ds.addColumn("statusVersao");

  ds.addColumn("titulo");
  ds.addColumn("descricao");
  ds.addColumn("tagsSelecionadas");

  ds.addColumn("imagemId");
  ds.addColumn("imagemNome");
  ds.addColumn("imagemUrl");

  ds.addColumn("modulo");
  ds.addColumn("tipo");
  ds.addColumn("impacto");

  var base = DatasetFactory.getDataset("ds_formchangelog_marya", null, constraints, sortFields);

  if (!base || base.rowsCount === 0) {
    log.info("ds_changelogg_marya: dataset base vazio");
    return ds;
  }

  for (var i = 0; i < base.rowsCount; i++) {
    var docIdAnexo = base.getValue(i, "imagemId");
    var imagemNome = base.getValue(i, "imagemNome");
    var numeroVersao = getSafeValue(base, i, "numeroVersao");
    var versaoNormalizada = normalizarVersao(numeroVersao);
    var urlDownload = "";

    if (docIdAnexo && String(docIdAnexo).trim() !== "") {
      try {
        var documentId = parseInt(docIdAnexo, 10);

        if (!isNaN(documentId)) {
          urlDownload = getDownloadURLFromDocumentId(documentId);
        }
      } catch (e) {
        log.error("Erro ao gerar imagemUrl para documentId " + docIdAnexo + ": " + e);
        urlDownload = "";
      }
    }

    log.info(
      "VERSAO=" + numeroVersao +
      " | VERSAO_NORMALIZADA=" + versaoNormalizada +
      " | imagemId=" + docIdAnexo +
      " | imagemNome=" + imagemNome +
      " | imagemUrl=" + urlDownload
    );

    ds.addRow([
      getSafeValue(base, i, "documentid"),
      getSafeValue(base, i, "metadata#parent_id"),

      numeroVersao,
      versaoNormalizada,
      getSafeValue(base, i, "dataPublicacao"),
      getSafeValue(base, i, "statusVersao"),

      getSafeValue(base, i, "titulo"),
      getSafeValue(base, i, "descricao"),
      getSafeValue(base, i, "tagsSelecionadas"),

      docIdAnexo,
      imagemNome,
      urlDownload,

      getSafeValue(base, i, "modulo"),
      getSafeValue(base, i, "tipo"),
      getSafeValue(base, i, "impacto")
    ]);
  }

  return ds;
}

function normalizarVersao(valor) {
  if (valor == null) return "";

  var v = String(valor).toLowerCase();
  v = v.replace(/\s+/g, "");
  v = v.replace(/^v[\.\-]?/, "");
  return v;
}

function getSafeValue(dataset, row, columnName) {
  try {
    var value = dataset.getValue(row, columnName);
    return value != null ? value : "";
  } catch (e) {
    return "";
  }
}

function getDownloadURLFromDocumentId(documentId) {
  var url = "";

  try {
    url = String(fluigAPI.getDocumentService().getDownloadURL(documentId));
    if (url && String(url).trim() !== "") {
      return url;
    }
  } catch (e1) {
    log.warn("getDownloadURL falhou para documentId " + documentId + ": " + e1);
  }

  try {
    var docDataset = DatasetFactory.getDataset(
      "document",
      null,
      [
        DatasetFactory.createConstraint(
          "documentPK.documentId",
          String(documentId),
          String(documentId),
          ConstraintType.MUST
        )
      ],
      null
    );

    if (docDataset && docDataset.rowsCount > 0) {
      var phisicalFile = docDataset.getValue(0, "phisicalFile");
      if (phisicalFile && String(phisicalFile).trim() !== "") {
        return String(phisicalFile);
      }
    }
  } catch (e2) {
    log.warn("Dataset document falhou para documentId " + documentId + ": " + e2);
  }

  try {
    var serverURL = getServerURLSafe();
    if (serverURL) {
      return serverURL + "/ecm_documentview/documentView.ftl?documentId=" + documentId;
    }
  } catch (e3) {
    log.warn("Fallback documentView falhou para documentId " + documentId + ": " + e3);
  }

  return "";
}

function getServerURLSafe() {
  try {
    if (fluigAPI && fluigAPI.getPageService) {
      var pageService = fluigAPI.getPageService();
      if (pageService) {
        var serverURL = pageService.getServerURL();
        if (serverURL) {
          return String(serverURL);
        }
      }
    }
  } catch (e) {
    log.warn("Nao foi possivel obter serverURL: " + e);
  }

  return "";
}