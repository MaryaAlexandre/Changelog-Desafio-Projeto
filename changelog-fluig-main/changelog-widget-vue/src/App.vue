<template>
  <div class="widget-marya-scope">
    <div class="mw-wrap">
      <div class="mw-card">
        <div class="mw-header">
          <div class="mw-header-top">
            <div>
              <h1 class="mw-title">{{ tituloTexto }}</h1>
              <p class="mw-subtitle">
                Acompanhe todas as atualizações e melhorias do sistema
              </p>
            </div>

            <button
              type="button"
              class="mw-suggest-btn"
              @click="abrirModalSugestao"
            >
              Sugerir melhoria
            </button>
          </div>
        </div>

        <div class="mw-toolbar">
          <div class="mw-search">
            <input
              v-model="textoBusca"
              type="text"
              class="mw-input"
              placeholder="Buscar (ex.: login, relatório)"
            />
          </div>

          <select v-model="categoriaSelecionada" class="mw-select">
            <option value="">Categoria (todas)</option>
            <option
              v-for="categoria in categoriasDisponiveis"
              :key="categoria"
              :value="categoria"
            >
              {{ categoria }}
            </option>
          </select>

          <select v-model="tagSelecionada" class="mw-select">
            <option value="">Tag (todas)</option>
            <option
              v-for="tag in tagsDisponiveis"
              :key="tag"
              :value="tag"
            >
              {{ tag }}
            </option>
          </select>
        </div>

        <div v-if="carregando" class="mw-state">
          Carregando changelog...
        </div>

        <div v-else-if="erro" class="mw-state mw-state--error">
          {{ erro }}
        </div>

        <div v-else class="mw-content">
          <div v-if="versoesOrdenadas.length" class="mw-timeline">
            <ChangelogItem
              v-for="item in versoesVisiveis"
              :key="item.numeroVersao + '-' + item.releaseDate"
              :item="item"
              :is-open="estaExpandido(item.numeroVersao)"
              @toggle="alternarVersao(item.numeroVersao)"
            />
          </div>

          <div v-else class="mw-empty">
            <div class="mw-empty-icon">⌕</div>
            <div class="mw-empty-title">Nenhum resultado encontrado</div>
            <div class="mw-empty-text">
              Tente ajustar os filtros ou termo de busca.
            </div>
          </div>

          <div
            v-if="versoesVisiveis.length < versoesOrdenadas.length"
            class="mw-load-more"
          >
            <button
              type="button"
              class="mw-load-more-btn"
              @click="verMaisVersoes"
            >
              Ver mais versões
            </button>
          </div>

          <div class="mw-footer">
            <span>
              {{ versoesOrdenadas.length }}
              {{ versoesOrdenadas.length === 1 ? 'versão encontrada' : 'versões encontradas' }}
            </span>

            <span>
              Última atualização:
              {{ ultimaAtualizacao }}
            </span>
          </div>
        </div>
      </div>
    </div>

   <SuggestionModal
  v-if="mostrarModalSugestao"
  :nome-usuario-logado="nomeUsuarioLogado"
  :matricula-usuario-logado="matriculaUsuarioLogado"
  :email-usuario-logado="emailUsuarioLogado"
  @close="fecharModalSugestao"
  @success="tratarSucessoSugestao"
/>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import ChangelogItem from './components/changelogItem.vue';
import SuggestionModal from './components/SuggestionModal.vue';
import { buscarVersoesChangelog } from './services/changelogService';

const props = defineProps({
  tituloTexto: {
    type: String,
    default: 'Changelog'
  },
  nomeDataset: {
    type: String,
    default: 'ds_changelogg_marya'
  }
});

const carregando = ref(true);
const erro = ref('');
const versoes = ref([]);

const textoBusca = ref('');
const categoriaSelecionada = ref('');
const tagSelecionada = ref('');
const versoesExpandidas = ref([]);
const mostrarModalSugestao = ref(false);
const nomeUsuarioLogado = ref('');
const matriculaUsuarioLogado = ref('');
const emailUsuarioLogado = ref('');

const quantidadePorPagina = ref(5);
const paginaAtual = ref(1);

const categoriasDisponiveis = computed(function () {
  var mapa = {};

  versoes.value.forEach(function (entrada) {
    (entrada.categories || []).forEach(function (categoria) {
      if (categoria) mapa[categoria] = true;
    });

    (entrada.changes || []).forEach(function (mudanca) {
      if (mudanca.type) mapa[mudanca.type] = true;
    });
  });

  return Object.keys(mapa);
});

const tagsDisponiveis = computed(function () {
  var mapa = {};

  versoes.value.forEach(function (entrada) {
    (entrada.tags || []).forEach(function (tag) {
      if (tag) mapa[tag] = true;
    });
  });

  return Object.keys(mapa);
});

const versoesFiltradas = computed(function () {
  var termo = String(textoBusca.value || '').trim().toLowerCase();

  return versoes.value.filter(function (entrada) {
    var correspondeBusca =
      !termo ||
      String(entrada.summary || '').toLowerCase().indexOf(termo) >= 0 ||
      String(entrada.numeroVersao || '').toLowerCase().indexOf(termo) >= 0 ||
      String(entrada.description || '').toLowerCase().indexOf(termo) >= 0 ||
      (entrada.changes || []).some(function (mudanca) {
        return (
          String(mudanca.title || '').toLowerCase().indexOf(termo) >= 0 ||
          String(mudanca.details || '').toLowerCase().indexOf(termo) >= 0 ||
          String(mudanca.module || '').toLowerCase().indexOf(termo) >= 0
        );
      });

    var correspondeTag =
      !tagSelecionada.value ||
      (entrada.tags || []).indexOf(tagSelecionada.value) >= 0;

    var correspondeCategoria =
      !categoriaSelecionada.value ||
      (entrada.categories || []).indexOf(categoriaSelecionada.value) >= 0 ||
      (entrada.changes || []).some(function (mudanca) {
        return mudanca.type === categoriaSelecionada.value;
      });

    return correspondeBusca && correspondeTag && correspondeCategoria;
  });
});

const versoesOrdenadas = computed(function () {
  return versoesFiltradas.value.slice().sort(compararVersoesDesc);
});

const versoesVisiveis = computed(function () {
  return versoesOrdenadas.value.slice(
    0,
    paginaAtual.value * quantidadePorPagina.value
  );
});

const ultimaAtualizacao = computed(function () {
  if (!versoesOrdenadas.value.length) return '—';

  var primeira = versoesOrdenadas.value[0];
  return formatarData(primeira.releaseDate);
});

watch([textoBusca, categoriaSelecionada, tagSelecionada], function () {
  paginaAtual.value = 1;
});

function quebrarVersao(versao) {
  if (!versao) return [0, 0, 0];

  return String(versao)
    .replace(/^v/i, '')
    .split('.')
    .map(function (parte) {
      return parseInt(parte, 10) || 0;
    });
}

function compararVersoesDesc(a, b) {
  var versaoA = quebrarVersao(a.numeroVersao);
  var versaoB = quebrarVersao(b.numeroVersao);

  var maximo = Math.max(versaoA.length, versaoB.length);

  for (var i = 0; i < maximo; i++) {
    var numeroA = versaoA[i] || 0;
    var numeroB = versaoB[i] || 0;

    if (numeroB !== numeroA) {
      return numeroB - numeroA;
    }
  }

  return 0;
}

function formatarData(dataTexto) {
  if (!dataTexto) return '—';

  var data = new Date(dataTexto);
  if (isNaN(data.getTime())) return dataTexto;

  return data.toLocaleDateString('pt-BR');
}

function estaExpandido(versao) {
  return versoesExpandidas.value.indexOf(versao) >= 0;
}

function alternarVersao(versao) {
  var indice = versoesExpandidas.value.indexOf(versao);

  if (indice >= 0) {
    versoesExpandidas.value.splice(indice, 1);
  } else {
    versoesExpandidas.value.push(versao);
  }
}

function textoSeguro(valor) {
  if (valor == null) return '';
  return String(valor).trim();
}

function lerValorGlobal(caminho) {
  try {
    var partes = caminho.split('.');
    var alvo = window;

    for (var i = 0; i < partes.length; i++) {
      if (!alvo || typeof alvo[partes[i]] === 'undefined' || alvo[partes[i]] === null) {
        return '';
      }
      alvo = alvo[partes[i]];
    }

    return textoSeguro(alvo);
  } catch (e) {
    return '';
  }
}

function detectarUsuarioLogadoNoFluig() {
  var nome =
    lerValorGlobal('WCMAPI.user') ||
    lerValorGlobal('parent.WCMAPI.user') ||
    lerValorGlobal('top.WCMAPI.user');

  var matricula =
    lerValorGlobal('WCMAPI.userCode') ||
    lerValorGlobal('parent.WCMAPI.userCode') ||
    lerValorGlobal('top.WCMAPI.userCode');

  var email =
    lerValorGlobal('WCMAPI.userEmail') ||
    lerValorGlobal('parent.WCMAPI.userEmail') ||
    lerValorGlobal('top.WCMAPI.userEmail');

  nomeUsuarioLogado.value = nome;
  matriculaUsuarioLogado.value = matricula;
  emailUsuarioLogado.value = email;

  console.log('[Changelog] nome detectado:', nomeUsuarioLogado.value);
  console.log('[Changelog] matrícula detectada:', matriculaUsuarioLogado.value);
  console.log('[Changelog] email detectado:', emailUsuarioLogado.value);
}

function abrirModalSugestao() {
  detectarUsuarioLogadoNoFluig();

  if (!matriculaUsuarioLogado.value) {
    alert('Não foi possível identificar a matrícula/login do usuário logado no Fluig.');
    return;
  }

  if (!nomeUsuarioLogado.value) {
    alert('Não foi possível identificar o nome do usuário logado no Fluig.');
    return;
  }

  mostrarModalSugestao.value = true;
}
function fecharModalSugestao() {
  mostrarModalSugestao.value = false;
}

function tratarSucessoSugestao(resultado) {
  mostrarModalSugestao.value = false;

  var protocolo = resultado && (resultado.protocolo || resultado.processInstanceId || resultado.id || 'gerado');
  alert('Sugestão enviada com sucesso. Protocolo: ' + protocolo);
}

function verMaisVersoes() {
  paginaAtual.value++;
}

async function carregarVersoes() {
  carregando.value = true;
  erro.value = '';

  try {
    versoes.value = await buscarVersoesChangelog({
      datasetName: props.nomeDataset
    });
  } catch (err) {
    erro.value = err && err.message
      ? err.message
      : 'Erro ao carregar o changelog.';
  } finally {
    carregando.value = false;
  }
}

onMounted(function () {
  detectarUsuarioLogadoNoFluig();
  carregarVersoes();
});
</script>

<style scoped>
.widget-marya-scope {
  width: 100%;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
  color: #4f3d46;
  background: #fff8fb;
}

.widget-marya-scope *,
.widget-marya-scope *::before,
.widget-marya-scope *::after {
  box-sizing: border-box;
}

.mw-wrap {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 20px;
}

.mw-card {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  background: #fffdfd;
  border: 1px solid #ead7df;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(124, 84, 100, 0.08);
}

.mw-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0e2e8;
  background: linear-gradient(180deg, #fff4f8 0%, #fffdfd 100%);
}

.mw-header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.mw-title {
  margin: 0 0 6px;
  font-size: 28px;
  line-height: 1.2;
  color: #5b3f4b;
}

.mw-subtitle {
  margin: 0;
  font-size: 14px;
  color: #8a6f7c;
}

.mw-suggest-btn {
  border: 1px solid #c78fa6;
  background: #c78fa6;
  color: #ffffff;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.mw-suggest-btn:hover {
  background: #b77a93;
  border-color: #b77a93;
}

.mw-toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-bottom: 1px solid #f0e2e8;
  background: #fff8fb;
}

.mw-search {
  flex: 1 1 320px;
}

.mw-input,
.mw-select {
  width: 100%;
  min-height: 42px;
  border: 1px solid #dcc5cf;
  border-radius: 10px;
  background: #fffdfd;
  padding: 10px 14px;
  font-size: 14px;
  color: #4f3d46;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mw-input:focus,
.mw-select:focus {
  border-color: #c78fa6;
  box-shadow: 0 0 0 3px rgba(199, 143, 166, 0.16);
}

.mw-select {
  flex: 0 0 220px;
}

.mw-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 24px;
}

.mw-timeline {
  width: 100%;
  margin: 0 auto;
  padding-left: 0;
}

.mw-state {
  padding: 28px 24px;
  color: #7f6571;
  font-size: 14px;
}

.mw-state--error {
  color: #a94442;
}

.mw-empty {
  text-align: center;
  padding: 42px 16px;
}

.mw-empty-icon {
  width: 62px;
  height: 62px;
  margin: 0 auto 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7e9ef;
  color: #9b7486;
  font-size: 24px;
}

.mw-empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #5b3f4b;
  margin-bottom: 4px;
}

.mw-empty-text {
  font-size: 14px;
  color: #8a6f7c;
}

.mw-load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.mw-load-more-btn {
  border: 1px solid #c78fa6;
  background: #fff;
  color: #815d6d;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.mw-load-more-btn:hover {
  background: #fdf2f7;
  border-color: #b77a93;
  color: #6f4f5d;
}

.mw-footer {
  margin-top: 10px;
  padding-top: 18px;
  border-top: 1px solid #f0e2e8;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #8a6f7c;
}

@media (max-width: 768px) {
  .mw-wrap {
    padding: 12px;
  }

  .mw-card,
  .mw-content {
    max-width: 100%;
  }

  .mw-header,
  .mw-toolbar,
  .mw-content {
    padding-left: 14px;
    padding-right: 14px;
  }

  .mw-title {
    font-size: 22px;
  }

  .mw-select {
    flex: 1 1 100%;
  }

  .mw-suggest-btn {
    width: 100%;
  }
}
</style>