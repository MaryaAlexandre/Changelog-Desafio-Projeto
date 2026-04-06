function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    definirPrazoPorProximaAtividade(nextSequenceId);
    validarDuplicidadeNumeroVersao();
}

function definirPrazoPorProximaAtividade(nextSequenceId) {
    var atividadeDestino = String(nextSequenceId || "");

    if (
        atividadeDestino == "13" ||
        atividadeDestino == "7"  ||
        atividadeDestino == "8"  ||
        atividadeDestino == "11"
    ) {
        hAPI.setCardValue("prazoSugerido", "16:00"); // 2 dias uteis se expediente for 8h/dia
        return;
    }

    if (atividadeDestino == "12") {
        hAPI.setCardValue("prazoSugerido", "24:00"); // 3 dias uteis
        return;
    }

    if (
        atividadeDestino == "31" ||
        atividadeDestino == "37" ||
        atividadeDestino == "39" ||
        atividadeDestino == "41" ||
        atividadeDestino == "43" ||
        atividadeDestino == "45"
    ) {
        hAPI.setCardValue("prazoSugerido", "40:00"); // 5 dias uteis
        return;
    }

    hAPI.setCardValue("prazoSugerido", "");
}