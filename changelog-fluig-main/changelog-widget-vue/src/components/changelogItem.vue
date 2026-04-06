<template>
  <div class="cl-item">
    <div class="cl-card-wrap">
      <div class="cl-card" :class="{ 'is-open': isOpen }">
        <div class="cl-header" @click="$emit('toggle')">
          <div class="cl-header-main">
            <div class="cl-meta-row">
              <span class="cl-version">v{{ item.numeroVersao }}</span>

              <span class="cl-date">
                {{ formatDate(item.releaseDate) }}
              </span>

              <span
                v-if="item.status === 'publicado'"
                class="cl-status cl-status--published"
              >
                Publicado
              </span>

              <span
                v-else-if="item.status === 'ativo'"
                class="cl-status cl-status--active"
              >
                Ativo
              </span>

              <span
                v-else-if="item.status === 'rascunho'"
                class="cl-status cl-status--draft"
              >
                Rascunho
              </span>
            </div>

            <h3 class="cl-title">{{ item.summary }}</h3>

            <div v-if="item.tags && item.tags.length" class="cl-tags">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="cl-tag"
                :class="tagClass(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <button
            v-if="hasDetails"
            type="button"
            class="cl-toggle"
            :aria-label="isOpen ? 'Ocultar detalhes' : 'Ver detalhes'"
          >
            {{ isOpen ? '−' : '+' }}
          </button>
        </div>

        <div v-if="isOpen && hasDetails" class="cl-body">
          <p v-if="item.description" class="cl-description">
            {{ item.description }}
          </p>

          <div v-if="item.imageUrl" class="cl-image-box">
            <div class="cl-image-header">Imagem anexada</div>

            <img
              :src="item.imageUrl"
              :alt="'Imagem da versão ' + item.numeroVersao"
              class="cl-image"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>

          <div v-if="item.changes && item.changes.length" class="cl-changes">
            <h4 class="cl-section-title">Itens de mudança</h4>

            <div
              v-for="(change, index) in item.changes"
              :key="index"
              class="cl-change"
            >
              <div class="cl-change-badge" :class="changeTypeClass(change.type)">
                {{ change.type || 'Item' }}
              </div>

              <div class="cl-change-content">
                <div v-if="change.title" class="cl-change-title">
                  {{ change.title }}
                </div>

                <div v-if="change.details" class="cl-change-details">
                  {{ change.details }}
                </div>

                <div
                  v-if="change.module || change.impact"
                  class="cl-change-meta"
                >
                  <span v-if="change.module">Módulo: {{ change.module }}</span>
                  <span v-if="change.impact">Impacto: {{ change.impact }}</span>
                </div>
              </div>
            </div>
          </div>

          <p
            v-if="!item.changes || item.changes.length === 0"
            class="cl-empty"
          >
            Sem detalhes adicionais.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle']);

const hasDetails = computed(function () {
  return (
    !!props.item.description ||
    !!props.item.imageUrl ||
    (props.item.changes && props.item.changes.length > 0)
  );
});

function formatDate(dateString) {
  if (!dateString) return '—';

  var texto = String(dateString).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    var partes = texto.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(texto)) {
    var dataParte = texto.split('T')[0].split('-');
    return dataParte[2] + '/' + dataParte[1] + '/' + dataParte[0];
  }

  return texto;
}

function tagClass(tag) {
  var normalized = String(tag || '').toLowerCase();

  if (normalized === 'portal') return 'tag-portal';
  if (normalized === 'integracao' || normalized === 'integração') return 'tag-integracao';
  if (normalized === 'seguranca' || normalized === 'segurança') return 'tag-seguranca';
  if (normalized === 'mobile') return 'tag-mobile';

  return 'tag-default';
}

function changeTypeClass(type) {
  var normalized = String(type || '').toLowerCase();

  if (normalized === 'novo' || normalized === 'novidade') return 'type-new';
  if (normalized === 'melhoria') return 'type-improvement';
  if (normalized === 'correção' || normalized === 'correcao') return 'type-fix';
  if (normalized === 'segurança' || normalized === 'seguranca') return 'type-security';
  if (normalized === 'remoção' || normalized === 'remocao') return 'type-removal';

  return 'type-default';
}

function onImageLoad() {
  console.log('Imagem carregada com sucesso:', props.item.imageUrl);
}

function onImageError(event) {
  console.error('Erro ao carregar imagem:', props.item.imageUrl, event);
}
</script>

<style scoped>
.cl-item {
  width: 100%;
}

.cl-card-wrap {
  position: relative;
  padding-left: 28px;
  margin-bottom: 18px;
}

.cl-card-wrap::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 0;
  bottom: -18px;
  width: 2px;
  background: #efdce4;
}

.cl-card-wrap::after {
  content: '';
  position: absolute;
  left: 0;
  top: 28px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #c78fa6;
  border: 4px solid #fff8fb;
  box-shadow: 0 0 0 1px #e7cfd9;
}

.cl-item:last-child .cl-card-wrap::before {
  bottom: 28px;
}

.cl-card {
  background: #ffffff;
  border: 1px solid #ead7df;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(124, 84, 100, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.cl-card:hover {
  border-color: #dcb7c6;
  box-shadow: 0 10px 24px rgba(124, 84, 100, 0.12);
}

.cl-card.is-open {
  border-color: #d3a6b8;
  box-shadow: 0 12px 28px rgba(124, 84, 100, 0.14);
}

.cl-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  background: linear-gradient(180deg, #fffdfd 0%, #fff8fb 100%);
}

.cl-header-main {
  flex: 1;
  min-width: 0;
}

.cl-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.cl-version {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f5e7ee;
  color: #7d5969;
  font-size: 12px;
  font-weight: 700;
}

.cl-date {
  font-size: 13px;
  color: #8a6f7c;
}

.cl-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.cl-status--published {
  background: #e9f7ef;
  color: #357a50;
}

.cl-status--active {
  background: #eef4ff;
  color: #4668a8;
}

.cl-status--draft {
  background: #f5edf1;
  color: #8a6f7c;
}

.cl-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.3;
  font-weight: 800;
  color: #433640;
  word-break: break-word;
}

.cl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.cl-tag {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.tag-portal {
  background: #f8ebf1;
  color: #8f6174;
  border-color: #ead0db;
}

.tag-integracao {
  background: #efeefe;
  color: #655fb0;
  border-color: #dddbfb;
}

.tag-seguranca {
  background: #edf8f0;
  color: #3f7d58;
  border-color: #d7eedf;
}

.tag-mobile {
  background: #eef6ff;
  color: #446e9b;
  border-color: #d6e7f8;
}

.tag-default {
  background: #f4f0f2;
  color: #73616a;
  border-color: #e5d9de;
}

.cl-toggle {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border: 1px solid #d9beca;
  border-radius: 12px;
  background: #fff;
  color: #7d5969;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: 0.2s ease;
}

.cl-toggle:hover {
  background: #fdf2f7;
  border-color: #c78fa6;
  color: #6f4f5d;
}

.cl-body {
  padding: 0 20px 20px;
  border-top: 1px solid #f1e3e9;
  background: #fffdfd;
}

.cl-description {
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: #5f4a55;
}

.cl-image-box {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #eddde5;
  border-radius: 14px;
  background: #fff8fb;
}

.cl-image-header {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #7d5969;
}

.cl-image {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #ead7df;
  background: #ffffff;
}

.cl-changes {
  margin-top: 20px;
}

.cl-section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #5b3f4b;
}

.cl-change {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #eddde5;
  border-radius: 14px;
  background: #fff9fc;
}

.cl-change-badge {
  flex: 0 0 auto;
  min-width: 92px;
  height: fit-content;
  padding: 7px 10px;
  border-radius: 999px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
}

.type-new {
  background: #eef6ff;
  color: #446e9b;
  border-color: #d6e7f8;
}

.type-improvement {
  background: #f8ebf1;
  color: #8f6174;
  border-color: #ead0db;
}

.type-fix {
  background: #fff4e8;
  color: #a06a2d;
  border-color: #f1dcc2;
}

.type-security {
  background: #edf8f0;
  color: #3f7d58;
  border-color: #d7eedf;
}

.type-removal {
  background: #f5edf1;
  color: #8a6f7c;
  border-color: #e7d9df;
}

.type-default {
  background: #f4f0f2;
  color: #73616a;
  border-color: #e5d9de;
}

.cl-change-content {
  flex: 1;
  min-width: 0;
}

.cl-change-title {
  font-size: 14px;
  font-weight: 700;
  color: #493a44;
  margin-bottom: 6px;
}

.cl-change-details {
  font-size: 14px;
  line-height: 1.6;
  color: #5f4a55;
}

.cl-change-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #8a6f7c;
}

.cl-empty {
  margin: 18px 0 0;
  font-size: 14px;
  color: #8a6f7c;
}

@media (max-width: 768px) {
  .cl-card-wrap {
    padding-left: 22px;
  }

  .cl-card-wrap::before {
    left: 7px;
  }

  .cl-card-wrap::after {
    left: 0;
    width: 16px;
    height: 16px;
    top: 24px;
  }

  .cl-header {
    padding: 16px;
  }

  .cl-title {
    font-size: 22px;
  }

  .cl-body {
    padding: 0 16px 16px;
  }

  .cl-change {
    flex-direction: column;
  }

  .cl-change-badge {
    min-width: 0;
    width: fit-content;
  }

  .cl-toggle {
    width: 38px;
    height: 38px;
  }
}
</style>