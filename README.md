# Top Dorama

MVP Android de teste do Top Dorama.

Recursos atuais:
- cadastro local de doramas;
- nota de 1 a 10;
- ranking automático Top 10;
- fila Quero Assistir;
- observações e data de conclusão;
- compartilhamento do ranking pelo WhatsApp;
- dados salvos localmente no aparelho;
- exportação e restauração de backup em JSON;
- busca de títulos com TVmaze e apoio em português via Wikidata;
- resumo e gráfico por semana, mês e ano.

Build de teste gerado automaticamente pelo GitHub Actions.

## Testes

As regras de datas, estatísticas, migração, duplicidades e backup são verificadas com:

```bash
node --test tests/*.test.js
```

## Assinatura

O arquivo `app/topdorama-debug.keystore` é uma chave fixa exclusiva dos APKs de teste, necessária para atualizar o app sem apagar os dados locais. A publicação deverá usar uma chave de produção separada e o Play App Signing.
