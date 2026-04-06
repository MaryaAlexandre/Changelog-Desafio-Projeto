function validateForm(form) {
  var msg = "";

  var titulo = form.getValue("titulo");
  var descricao = form.getValue("descricao");
  var tagsSelecionadas = form.getValue("tagsSelecionadas");

  if (isEmpty(titulo)) {
    msg += "<li>Campo: <b>Titulo</b> nao pode estar vazio</li>";
  }

  if (isEmpty(descricao)) {
    msg += "<li>Campo: <b>Descricao</b> nao pode estar vazio</li>";
  }

  if (isEmpty(tagsSelecionadas)) {
    msg += "<li>Campo: <b>Tags</b> nao pode estar vazio</li>";
  }

  if (msg != "") {
    throw "<ul style='list-style-type:disc;padding-left:40px' class='alert alert-danger'>" + msg + "</ul>";
  }

  validarDuplicidadeSugestao(form);
}

function validarDuplicidadeSugestao(form) {
  var tituloAtual = normalizarTexto(form.getValue("titulo"));
  var tagsAtual = normalizarTexto(form.getValue("tagsSelecionadas"));
  var cardIdAtual = String(getValue("WKCardId") || "");

  var c1 = DatasetFactory.createConstraint("metadata#active", "true", "true", ConstraintType.MUST);
  var dataset = DatasetFactory.getDataset("ds_formchangelog_marya", null, [c1], null);

  if (dataset != null && dataset.rowsCount > 0) {
    for (var i = 0; i < dataset.rowsCount; i++) {
      var tituloExistente = normalizarTexto(dataset.getValue(i, "titulo"));
      var tagsExistente = normalizarTexto(dataset.getValue(i, "tagsSelecionadas"));
      var documentIdExistente = String(dataset.getValue(i, "documentid") || "");

      if (documentIdExistente != cardIdAtual) {
        if (tituloExistente == tituloAtual && tagsExistente == tagsAtual) {
          throw "<ul style='list-style-type:disc;padding-left:40px' class='alert alert-danger'>" +
                "<li>Ja existe uma sugestao cadastrada com o mesmo <b>titulo</b> e <b>tag(s)</b>.</li>" +
                "</ul>";
        }
      }
    }
  }
}

function normalizarTexto(valor) {
  if (valor == null) {
    return "";
  }

  var texto = String(valor).toLowerCase();
  texto = texto.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  return texto;
}

function isEmpty(valor) {
  return valor == null || valor == "" || typeof valor == "undefined" || valor == "null";
}