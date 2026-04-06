function createDataset(fields, constraints, sortFields) {
  var ds = DatasetBuilder.newDataset();

  ds.addColumn("documentid");
  ds.addColumn("createdBy");
  ds.addColumn("createdDate");
  ds.addColumn("titulo");
  ds.addColumn("descricao");
  ds.addColumn("modulo");
  ds.addColumn("tipo");
  ds.addColumn("impacto");
  ds.addColumn("beneficio");
  ds.addColumn("tagsSelecionadas");
  ds.addColumn("solicitanteSugestao");
  ds.addColumn("emailSolicitante");
  ds.addColumn("statusSugestao");
  ds.addColumn("dataAberturaSugestao");
  ds.addColumn("imagemId");
  ds.addColumn("imagemNome");
  ds.addColumn("imagemUrl");
  ds.addColumn("origem");

  var authConstraint = DatasetFactory.createConstraint(
    "userSecurityId",
    "admin",
    "admin",
    ConstraintType.MUST
  );

  var newConstraints = (constraints != null) ? constraints.slice() : [];
  newConstraints.push(authConstraint);

  var base = DatasetFactory.getDataset(
    "ds_formsugestaoMelhoria_marya",
    null,
    newConstraints,
    sortFields
  );

  if (!base || base.getRowsCount() == 0) {
    return ds;
  }

  for (var j = 0; j < base.getRowsCount(); j++) {
    var matricula = getSafeValue(base, j, "createdBy");
    var nomeUsuario = getSafeValue(base, j, "solicitanteSugestao");
    var emailUsuario = getSafeValue(base, j, "emailSolicitante");

    if (matricula != "") {
      try {
        var c1 = DatasetFactory.createConstraint(
          "colleaguePK.colleagueId",
          matricula,
          matricula,
          ConstraintType.MUST
        );

        var dsColleague = DatasetFactory.getDataset(
          "colleague",
          ["colleagueName", "mail"],
          [authConstraint, c1],
          null
        );

        if (dsColleague != null && dsColleague.getRowsCount() > 0) {
          var nomeColleague = dsColleague.getValue(0, "colleagueName");
          var mailColleague = dsColleague.getValue(0, "mail");

          if (nomeColleague != null && nomeColleague != "") {
            nomeUsuario = String(nomeColleague);
          }

          if (mailColleague != null && mailColleague != "") {
            emailUsuario = String(mailColleague);
          }
        }
      } catch (e) {
        log.info("erro ao consultar o colleague: " + e);
      }
    }

    var imagemId = getSafeValue(base, j, "imagemId");
    var imagemUrl = "";

    if (imagemId != "") {
      try {
        imagemUrl = fluigAPI.getDocumentService().getDownloadURL(parseInt(imagemId, 10));
      } catch (e2) {
        imagemUrl = "";
      }
    }

    ds.addRow([
      getSafeValue(base, j, "documentid") + "",
      matricula + "",
      getSafeValue(base, j, "createdDate") + "",
      getSafeValue(base, j, "titulo") + "",
      getSafeValue(base, j, "descricao") + "",
      getSafeValue(base, j, "modulo") + "",
      getSafeValue(base, j, "tipo") + "",
      getSafeValue(base, j, "impacto") + "",
      getSafeValue(base, j, "beneficio") + "",
      getSafeValue(base, j, "tagsSelecionadas") + "",
      nomeUsuario + "",
      emailUsuario + "",
      getSafeValue(base, j, "statusSugestao") + "",
      getSafeValue(base, j, "dataAberturaSugestao") + "",
      imagemId + "",
      getSafeValue(base, j, "imagemNome") + "", 
      imagemUrl + "",
      getSafeValue(base, j, "origem") + ""
    ]);
  }

  return ds;

  function getSafeValue(dataset, row, columnName) {
    try {
      var value = dataset.getValue(row, columnName);
      return value != null ? String(value) : "";
    } catch (e) {
      return "";
    }
  }
}