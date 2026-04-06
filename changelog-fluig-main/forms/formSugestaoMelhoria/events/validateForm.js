function validateForm(form) {
    var activity = typeof getValue === "function" ? String(getValue("WKNumState")) : "0";
    var msg = [];

    var titulo = valor(form, "titulo");
    var descricao = valor(form, "descricao");
    var modulo = valor(form, "modulo");
    var tipo = valor(form, "tipo");

    var decisao = valor(form, "decisao");
    var justificativa = valor(form, "justificativaDecisao");
    var prioridade = valor(form, "prioridade");
    var responsavelArea = valor(form, "responsavelArea");

    if (!titulo) msg.push("Título é obrigatório");
    if (!descricao) msg.push("Descrição é obrigatória");
    if (!modulo) msg.push("Módulo é obrigatório");
    if (!tipo) msg.push("Tipo é obrigatório");

    var emGestao = (activity == "7" || activity == "8");

    if (emGestao) {
        if (!decisao) {
            msg.push("Decisão é obrigatória");
        }

        if (decisao && !justificativa) {
            msg.push("Justificativa da decisão é obrigatória");
        }

        if (decisao == "aprovar" || decisao == "backlog") {
            if (!prioridade) {
                msg.push("Prioridade é obrigatória");
            }

            if (!responsavelArea) {
                msg.push("Responsável por área é obrigatório");
            }
        }
    }

    if (msg.length > 0) {
        throw "\n" + msg.join("\n");
    }
}

function valor(form, campo) {
    try {
        var v = form.getValue(campo);
        return v ? String(v).trim() : "";
    } catch (e) {
        return "";
    }
}