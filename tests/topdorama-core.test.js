const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../app/src/main/assets/topdorama-core.js');

test('gera a data do calendário local sem conversão para UTC', () => {
  assert.equal(core.todayLocal(new Date(2026, 8, 9, 23, 30)), '2026-09-09');
});

test('filtra corretamente semana, mês e ano correntes', () => {
  const now = new Date(2026, 8, 9, 12);
  assert.equal(core.dateInPeriod('2026-09-07', 'week', now), true);
  assert.equal(core.dateInPeriod('2026-09-06', 'week', now), false);
  assert.equal(core.dateInPeriod('2026-09-01', 'month', now), true);
  assert.equal(core.dateInPeriod('2026-08-31', 'month', now), false);
  assert.equal(core.dateInPeriod('2026-01-01', 'year', now), true);
  assert.equal(core.dateInPeriod('2027-01-01', 'year', now), false);
});

test('gráfico semanal começa na segunda e usa sete dias', () => {
  const result = core.chartData([
    { status: 'done', finishDate: '2026-09-07' },
    { status: 'done', finishDate: '2026-09-08' },
    { status: 'done', finishDate: '2026-09-09' },
    { status: 'done', finishDate: '2026-09-06' }
  ], 'week', new Date(2026, 8, 9, 12));
  assert.deepEqual(result.labels, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
  assert.deepEqual(result.bins, [1, 1, 1, 0, 0, 0, 0]);
});

test('gráfico mensal cobre todos os dias do mês', () => {
  const result = core.chartData([
    { status: 'done', finishDate: '2026-09-01' },
    { status: 'done', finishDate: '2026-09-29' }
  ], 'month', new Date(2026, 8, 30, 12));
  assert.deepEqual(result.labels, ['1–7', '8–14', '15–21', '22–28', '29–30']);
  assert.deepEqual(result.bins, [1, 0, 0, 0, 1]);
});

test('migra lista antiga, descarta registros inválidos e mantém campos úteis', () => {
  const items = core.normalizeStore([
    { id: 1, name: 'Rainha das Lágrimas', status: 'concluído', rating: '9.5', finishDate: '2026-09-08' },
    { id: 2, name: '', status: 'queue' }
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].status, 'done');
  assert.equal(items[0].rating, 9.5);
});

test('detecta duplicidade por título ou identificador do TVmaze', () => {
  const items = [{ id: 1, name: 'Uma Advogada Extraordinária', status: 'done', tvmazeId: 123 }];
  assert.equal(core.findDuplicate(items, { name: 'uma advogada extraordinaria' }, null).id, 1);
  assert.equal(core.findDuplicate(items, { name: 'Outro título', tvmazeId: 123 }, null).id, 1);
  assert.equal(core.findDuplicate(items, { name: 'Uma Advogada Extraordinária' }, 1), null);
});

test('backup tem versão e pode ser restaurado', () => {
  const payload = core.backupPayload([{ id: 1, name: 'Dorama', status: 'queue' }], new Date('2026-09-09T12:00:00Z'));
  assert.equal(payload.version, 2);
  assert.equal(core.normalizeStore(payload).length, 1);
});
