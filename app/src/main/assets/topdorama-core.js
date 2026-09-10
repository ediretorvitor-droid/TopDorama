(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TopDoramaCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_VERSION = 2;
  const VALID_STATUSES = ['done', 'watching', 'paused', 'dropped', 'queue'];
  const STATUS_ALIASES = {
    completed: 'done', concluido: 'done', concluído: 'done', assistido: 'done', watched: 'done',
    watching: 'watching', assistindo: 'watching',
    paused: 'paused', pausado: 'paused',
    dropped: 'dropped', abandonado: 'dropped', abandonei: 'dropped',
    queue: 'queue', fila: 'queue', 'quero assistir': 'queue'
  };

  function norm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function todayLocal(now) {
    const date = now instanceof Date ? now : new Date();
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseLocalDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    return date;
  }

  function startOfWeek(now) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    return start;
  }

  function dateInPeriod(value, period, now) {
    const date = parseLocalDate(value);
    const current = now instanceof Date ? now : new Date();
    if (!date) return false;
    const today = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
    let start;
    if (period === 'week') start = startOfWeek(current);
    else if (period === 'year') start = new Date(current.getFullYear(), 0, 1);
    else start = new Date(current.getFullYear(), current.getMonth(), 1);
    return date >= start && date <= today;
  }

  function chartData(items, period, now) {
    const current = now instanceof Date ? now : new Date();
    const endOfToday = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
    const dates = (Array.isArray(items) ? items : [])
      .filter(item => item && item.status === 'done')
      .map(item => parseLocalDate(item.finishDate))
      .filter(date => date && date <= endOfToday);
    const bins = [];
    const labels = [];

    if (period === 'week') {
      const start = startOfWeek(current);
      const weekLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      for (let index = 0; index < 7; index++) {
        const day = new Date(start);
        day.setDate(start.getDate() + index);
        bins.push(dates.filter(date => todayLocal(date) === todayLocal(day)).length);
        labels.push(weekLabels[index]);
      }
    } else if (period === 'year') {
      const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      for (let month = 0; month < 12; month++) {
        bins.push(dates.filter(date => date.getFullYear() === current.getFullYear() && date.getMonth() === month).length);
        labels.push(monthLabels[month]);
      }
    } else {
      const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      for (let first = 1; first <= lastDay; first += 7) {
        const last = Math.min(first + 6, lastDay);
        bins.push(dates.filter(date => date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth() && date.getDate() >= first && date.getDate() <= last).length);
        labels.push(`${first}–${last}`);
      }
    }
    return { bins, labels };
  }

  function cleanText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function cleanDate(value) {
    return parseLocalDate(value) ? String(value) : '';
  }

  function normalizeStatus(value) {
    const raw = cleanText(value).toLowerCase();
    const normalized = STATUS_ALIASES[raw] || raw;
    return VALID_STATUSES.includes(normalized) ? normalized : 'done';
  }

  function normalizeItem(source, index) {
    if (!source || typeof source !== 'object') return null;
    const name = cleanText(source.name || source.title || source.ptTitle);
    if (!name) return null;
    const status = normalizeStatus(source.status);
    const parsedRating = Number(source.rating);
    const rating = Number.isFinite(parsedRating) && parsedRating >= 1 && parsedRating <= 10 ? parsedRating : null;
    const originalId = source.id === 0 || source.id ? source.id : `legacy-${index + 1}-${norm(name).replace(/ /g, '-')}`;
    const safeId = String(originalId).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120) || `legacy-${index + 1}`;
    return {
      id: safeId,
      name,
      status,
      rating,
      finishDate: status === 'done' ? cleanDate(source.finishDate || source.completedAt) : '',
      notes: cleanText(source.notes),
      createdAt: cleanDate(source.createdAt),
      tvmazeId: source.tvmazeId === 0 || source.tvmazeId ? source.tvmazeId : null,
      image: cleanText(source.image),
      premiered: cleanText(source.premiered),
      country: cleanText(source.country),
      originalName: cleanText(source.originalName),
      ptTitle: cleanText(source.ptTitle),
      wikidataId: cleanText(source.wikidataId)
    };
  }

  function normalizeStore(raw) {
    const source = Array.isArray(raw) ? raw : raw && Array.isArray(raw.items) ? raw.items : [];
    const usedIds = new Set();
    return source.map(normalizeItem).filter(Boolean).map((item, index) => {
      let id = item.id;
      while (usedIds.has(String(id))) id = `${item.id}-${index + 1}`;
      usedIds.add(String(id));
      return { ...item, id };
    });
  }

  function sameId(left, right) {
    return String(left) === String(right);
  }

  function displayName(item) {
    return cleanText(item && (item.ptTitle || item.name));
  }

  function findDuplicate(items, candidate, ignoredId) {
    const candidateTitle = norm(displayName(candidate));
    const candidateTvmaze = candidate && candidate.tvmazeId !== null && candidate.tvmazeId !== undefined ? String(candidate.tvmazeId) : '';
    return (Array.isArray(items) ? items : []).find(item => {
      if (!item || (ignoredId !== null && ignoredId !== undefined && sameId(item.id, ignoredId))) return false;
      if (candidateTvmaze && item.tvmazeId !== null && item.tvmazeId !== undefined && String(item.tvmazeId) === candidateTvmaze) return true;
      return candidateTitle && norm(displayName(item)) === candidateTitle;
    }) || null;
  }

  function backupPayload(items, now) {
    return {
      app: 'Top Dorama',
      version: STORAGE_VERSION,
      exportedAt: (now instanceof Date ? now : new Date()).toISOString(),
      items: normalizeStore(items)
    };
  }

  return {
    STORAGE_VERSION,
    norm,
    todayLocal,
    parseLocalDate,
    dateInPeriod,
    chartData,
    normalizeStore,
    findDuplicate,
    backupPayload
  };
});
