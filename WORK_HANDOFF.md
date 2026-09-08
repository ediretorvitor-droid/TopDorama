# Top Dorama — Handoff para ChatGPT Work

## Estado atual
Projeto Android funcional em fase de MVP/testes, compilado via GitHub Actions.

Repositório: `ediretorvitor-droid/TopDorama`
Branch principal: `main`

## Objetivo do app
Aplicativo gratuito para fãs de doramas registrarem o que assistiram, darem notas de 1 a 10, montarem ranking automático Top 10, manterem fila de próximos doramas e acompanharem histórico/estatísticas. O app não transmite conteúdo audiovisual.

## Arquitetura atual
- Android nativo simples com `WebView`.
- Interface principal em `app/src/main/assets/index.html`.
- Código Android em `app/src/main/java/com/topdorama/app/MainActivity.java`.
- Dados pessoais e avaliações ficam localmente no aparelho via armazenamento local do WebView.
- Catálogo/busca usa TVmaze.
- Tradução/fallback de nomes em português foi adicionada para melhorar pesquisas.
- Compilação automática via `.github/workflows/build-apk.yml`.

## Funcionalidades já implementadas
- Tela Início com resumo e gráfico.
- Ranking automático Top 10.
- Compartilhamento do Top 10 por WhatsApp/share Android.
- Tela `Doramas` com cadastro e histórico.
- Status: Concluído, Assistindo, Pausado e Abandonado.
- Edição de doramas cadastrados.
- Alteração de nota, observação, data e status.
- Exclusão de doramas.
- Tela `Fila` para doramas que ainda serão assistidos.
- Ação para começar a assistir um item da fila.
- Ação para concluir e avaliar um item da fila.
- Busca de títulos via TVmaze.
- Busca em português e tentativa de busca parcial por título.
- Capas, ano e país quando disponíveis.
- Ícone customizado do Top Dorama.

## Requisitos de UX definidos pelo usuário
- Paleta rosa + amarelo claro.
- Visual feminino/moderno, criativo, com cards arredondados.
- Menu principal no topo, logo abaixo do cabeçalho, para não ficar próximo dos botões virtuais do Android.
- Menu atual desejado: `Início / Doramas / Fila`.
- Ranking sempre visível no Início e limitado ao Top 10.
- Resumo com filtros Semana / Mês / Ano e pequeno gráfico.
- Botão de compartilhamento abaixo do Top 10.

## Regras de dados
- Avaliações, notas, observações, fila e histórico devem ficar no próprio celular na versão inicial.
- Sem login obrigatório e sem servidor próprio neste MVP.
- Se futuramente houver sincronização entre aparelhos, considerar Firebase ou Supabase.

## Busca de doramas
- Fonte principal: TVmaze.
- Deve aceitar nome incompleto/parcial e variações em português.
- Exemplo importante: pesquisar `Advogada Extraordinária` deve encontrar `Uma Advogada Extraordinária`.
- Cadastro manual deve continuar disponível se a API não encontrar o título.

## Monetização planejada
- App gratuito na Google Play.
- Futuramente integrar Google AdMob.
- Evitar excesso de anúncios e preservar boa experiência de uso.

## Publicação
- Conta Play Console pessoal/CPF prevista.
- Taxa única do Google Play será paga pelo usuário.
- Não usar a chave/assinatura de teste atual em produção.
- Para Play Store, configurar assinatura de produção adequada e App Bundle (`.aab`).

## Próximos passos recomendados no Work
1. Revisar e consolidar a busca parcial em português para não depender apenas de aliases fixos.
2. Validar todos os fluxos de status e edição.
3. Melhorar persistência/migração local antes de usuários reais começarem a acumular dados.
4. Criar backup/exportação e restauração local.
5. Melhorar cards de compartilhamento do Top 10.
6. Preparar política de privacidade e créditos/licenças da TVmaze.
7. Integrar AdMob apenas após estabilizar o produto.
8. Preparar build de produção em AAB e checklist da Play Store.

## Observação sobre builds de teste
Foi criada uma assinatura fixa apenas para testes para permitir atualização do APK sem desinstalar e sem perder os dados locais. Isso é separado da futura assinatura de produção da Play Store.
