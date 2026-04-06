function servicetask15(attempt, message) {
    try {
        var ids = (hAPI.getCardValue("imagemId") || "") + "";
        var docIdArray = ids.split(",");

        for (var i = 0; i < docIdArray.length; i++) {
            var docId = (docIdArray[i] || "").trim();

            if (docId && /^\d+$/.test(docId)) {
                hAPI.attachDocument(docId);
            }
        }

        var user = getValue("WKUser");
        var processo = getValue("WKNumProces");
        var documentId = getValue("WKCardId");

        var c1 = DatasetFactory.createConstraint("DOCID", documentId, documentId, ConstraintType.MUST);
        var constraints = new Array(c1);

        var dataset = DatasetFactory.getDataset("ds_sugestaomelhoria_marya", null, constraints, null);

        var mensagem = "Anexo da sugestão vinculado ao processo.";

        if (dataset != null && dataset.rowsCount > 0) {
            var titulo = dataset.getValue(0, "titulo");
            var solicitante = dataset.getValue(0, "solicitanteSugestao");

            mensagem = "Sugestão ";
            if (titulo) {
                mensagem += "\"" + titulo + "\" ";
            }
            mensagem += "vinculada com anexo ao processo";
            if (solicitante) {
                mensagem += ". Solicitante: " + solicitante;
            }
            mensagem += ".";
        }

        hAPI.setTaskComments(user, processo, 0, mensagem);
        return true;

    } catch (e) {
        log.error("[SugestaoMelhoria] Erro ao anexar documento na service task: " + e);
        throw e;
    }
}