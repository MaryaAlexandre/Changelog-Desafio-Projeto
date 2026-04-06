<template>
  <div class="sm-overlay" @click.self="fecharModal">
    <div class="sm-modal" @click.stop>
      <div class="sm-header">
        <h3>Sugerir melhoria</h3>
        <button type="button" class="sm-close" @click.stop="fecharModal">×</button>
      </div>

      <form class="sm-form" @submit.prevent="enviarFormulario">
        <div class="sm-field">
          <label for="titulo">Título *</label>
          <input id="titulo" v-model.trim="formulario.titulo" type="text" />
        </div>

        <div class="sm-field">
          <label for="descricao">Descrição *</label>
          <textarea
            id="descricao"
            v-model.trim="formulario.descricao"
            rows="5"
          ></textarea>
        </div>

        <div class="sm-grid">
          <div class="sm-field">
            <label for="modulo">Área / Módulo *</label>
            <select id="modulo" v-model="formulario.modulo">
              <option value="">Selecione</option>
              <option value="Portal">Portal</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Integracao">Integracao</option>
              <option value="Mobile">Mobile</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div class="sm-field">
            <label for="tipo">Tipo *</label>
            <select id="tipo" v-model="formulario.tipo">
              <option value="">Selecione</option>
              <option value="melhoria">Melhoria</option>
              <option value="correcao">Correcao</option>
              <option value="funcionalidade">Nova funcionalidade</option>
            </select>
          </div>

          <div class="sm-field">
            <label for="impacto">Impacto esperado</label>
            <select id="impacto" v-model="formulario.impacto">
              <option value="">Selecione</option>
              <option value="baixo">Baixo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
        </div>

        <div class="sm-field">
          <label for="tags">TAGS *</label>
          <input
            id="tags"
            v-model.trim="formulario.tagsSelecionadas"
            type="text"
            placeholder="login, financeiro, mobile etc"
          />
        </div>

        <div class="sm-field">
          <label for="beneficio">Benefício / ganho esperado</label>
          <textarea
            id="beneficio"
            v-model.trim="formulario.beneficio"
            rows="3"
            placeholder="Explique qual ganho essa melhoria traz"
          ></textarea>
        </div>

        <div class="sm-field">
          <label for="imagem">Anexo / imagem</label>
          <input
            id="imagem"
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
            @change="selecionarArquivo"
          />

          <small v-if="carregandoArquivo">Enviando arquivo...</small>
          <small v-else-if="formulario.imagemNome">
            Arquivo enviado: {{ formulario.imagemNome }}
          </small>
        </div>

        <div v-if="erro" class="sm-error">
          {{ erro }}
        </div>

        <div class="sm-actions">
          <button
            type="button"
            class="sm-btn sm-btn-secondary"
            @click.stop="fecharModal"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="sm-btn sm-btn-primary"
            :disabled="carregando || carregandoArquivo"
          >
            {{ carregando ? 'Enviando...' : 'Enviar sugestão' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { submeterSugestao, uploadArquivoSugestao } from '../services/suggestionService';

const props = defineProps({
  nomeUsuarioLogado: {
    type: String,
    default: ''
  },
  matriculaUsuarioLogado: {
    type: String,
    default: ''
  },
  emailUsuarioLogado: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'success']);

function fecharModal() {
  emit('close');
}

const formulario = reactive({
  titulo: '',
  descricao: '',
  modulo: '',
  tipo: '',
  impacto: '',
  beneficio: '',
  origem: 'widget',
  imagemId: '',
  imagemNome: '',
  tagsSelecionadas: ''
});

const carregando = ref(false);
const carregandoArquivo = ref(false);
const erro = ref('');

function validarFormulario() {
  if (!formulario.titulo) return 'Informe o título.';
  if (!formulario.descricao) return 'Informe a descrição.';
  if (!formulario.modulo) return 'Informe a área/módulo.';
  if (!formulario.tipo) return 'Informe o tipo.';
  if (!formulario.tagsSelecionadas) return 'Informe a tag.';
  return '';
}

function validarUsuarioAutomatico() {
  var nome = String(props.nomeUsuarioLogado || '').trim();
  var matricula = String(props.matriculaUsuarioLogado || '').trim();
  var email = String(props.emailUsuarioLogado || '').trim();

  if (!nome) {
    return 'Não foi possível identificar o nome do usuário logado.';
  }

  if (!matricula) {
    return 'Não foi possível identificar a matrícula/login do usuário logado.';
  }

  if (!email) {
    return 'Não foi possível identificar o e-mail do usuário logado.';
  }

  return '';
}

async function selecionarArquivo(event) {
  erro.value = '';

  var file = event.target.files && event.target.files[0];
  if (!file) return;

  carregandoArquivo.value = true;

  try {
    var resultadoUpload = await uploadArquivoSugestao(file);
    formulario.imagemId = resultadoUpload.documentId || '';
    formulario.imagemNome = resultadoUpload.fileName || file.name;
  } catch (err) {
    erro.value =
      err && err.message
        ? err.message
        : 'Erro ao enviar arquivo.';
  } finally {
    carregandoArquivo.value = false;
  }
}

async function enviarFormulario() {
  erro.value = '';

  var erroValidacao = validarFormulario();
  if (erroValidacao) {
    erro.value = erroValidacao;
    return;
  }

  var erroUsuario = validarUsuarioAutomatico();
  if (erroUsuario) {
    erro.value = erroUsuario;
    return;
  }

  carregando.value = true;

  try {
  var resultado = await submeterSugestao({
  titulo: formulario.titulo,
  descricao: formulario.descricao,
  modulo: formulario.modulo,
  tipo: formulario.tipo,
  impacto: formulario.impacto,
  beneficio: formulario.beneficio,
  origem: formulario.origem,
  imagemId: formulario.imagemId,
  imagemNome: formulario.imagemNome,
  tagsSelecionadas: formulario.tagsSelecionadas,
  solicitanteSugestao: String(props.nomeUsuarioLogado || '').trim(),
  emailSolicitante: String(props.emailUsuarioLogado || '').trim(),
  createdBy: String(props.matriculaUsuarioLogado || '').trim(),
  usuarioLogado: String(props.nomeUsuarioLogado || '').trim(),
  matriculaUsuarioLogado: String(props.matriculaUsuarioLogado || '').trim()
});

    emit('success', resultado);
    fecharModal();
  } catch (err) {
    erro.value =
      err && err.message
        ? err.message
        : 'Erro ao enviar sugestão.';
  } finally {
    carregando.value = false;
  }
}
</script>

<style scoped>
.sm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30, 22, 27, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 9999;
}

.sm-modal {
  width: 100%;
  max-width: 720px;
  background: #fffdfd;
  border: 1px solid #ead7df;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.sm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0e2e8;
}

.sm-header h3 {
  margin: 0;
  font-size: 20px;
  color: #5b3f4b;
}

.sm-close {
  border: none;
  background: transparent;
  color: #8a6f7c;
  font-size: 24px;
  cursor: pointer;
}

.sm-form {
  padding: 20px;
}

.sm-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.sm-field label {
  font-size: 13px;
  font-weight: 700;
  color: #7a606d;
}

.sm-field input,
.sm-field textarea,
.sm-field select {
  width: 100%;
  border: 1px solid #dcc5cf;
  border-radius: 10px;
  background: #fffdfd;
  padding: 10px 12px;
  font-size: 14px;
  color: #4f3d46;
  outline: none;
}

.sm-field input:focus,
.sm-field textarea:focus,
.sm-field select:focus {
  border-color: #c78fa6;
  box-shadow: 0 0 0 3px rgba(199, 143, 166, 0.16);
}

.sm-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.sm-error {
  margin-top: 8px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fdecef;
  color: #a54c61;
  font-size: 13px;
  border: 1px solid #f4ccd8;
}

.sm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.sm-btn {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.sm-btn-secondary {
  background: #fff;
  border: 1px solid #dcc5cf;
  color: #6d5561;
}

.sm-btn-primary {
  background: #c78fa6;
  border: 1px solid #c78fa6;
  color: #fff;
}

.sm-btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .sm-grid {
    grid-template-columns: 1fr;
  }

  .sm-actions {
    flex-direction: column;
  }

  .sm-btn {
    width: 100%;
  }
}
</style>