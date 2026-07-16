## Visão Geral

A notificação de atualização mantém sessões de leitura antigas em sincronia com o seu deploy mais recente.

Quando um novo build da documentação entra no ar, leitores que ainda têm uma sessão antiga aberta veem uma notificação flutuante no topo da página — *"Há conteúdo atualizado disponível. Atualize a página."* — com as ações **Atualizar** e **Dispensar**.

Funciona de fábrica em builds de produção. Nenhuma configuração é necessária.

## O Que os Leitores Percebem

- Um banner na cor do tema flutuando no topo central quando um deploy mais novo está no ar
- **Atualizar** recarrega a página já no build novo
- **Dispensar** esconde o banner para aquele deploy até a próxima sessão
- A navegação continua funcionando logo após um deploy, mesmo numa sessão antiga

## Como um Novo Deploy é Detectado

Todo build de produção grava um ID de build em dois lugares:

- embutido no próprio bundle JavaScript
- escrito em `version.json` na raiz do site, junto com uma regra `Cache-Control: no-cache` no arquivo `_headers` gerado, para que CDNs sempre revalidem o arquivo

Enquanto uma aba está aberta, o app compara os dois: uma vez logo após o carregamento, num intervalo fixo enquanto a aba está visível, e quando a aba recupera o foco. Assim que o ID publicado difere do ID em execução, o banner aparece.

No Cloudflare Pages o ID de build é o SHA do commit (`CF_PAGES_COMMIT_SHA`), então rebuildar o mesmo commit nunca notifica os leitores. Em outros hosts, defina `DOCSECTOR_BUILD_ID` no ambiente de build; sem ele, cada build usa um timestamp único.

## Recuperação de Navegação Obsoleta

Depois de um deploy, os arquivos de chunk com hash do build anterior deixam de existir no servidor. Um leitor rodando a sessão antiga que navega para uma página ainda não visitada encontraria um import quebrado — uma navegação que silenciosamente não leva a lugar nenhum.

O Docsector se recupera automaticamente: faz um reload completo da página direto para a rota que o leitor pediu, já no build novo. Uma proteção evita loops de reload — se a mesma navegação falhar de novo em seguida, o banner é mostrado em vez de recarregar para sempre.

## Desligando ou Ajustando

Tudo é controlado pela chave `updates` no `docsector.config.js`:

```js :toolbar="true";
export default {
  updates: false
}
```

Ou mantenha habilitado e ajuste o polling:

```js :toolbar="true";
export default {
  updates: {
    enabled: true,
    interval: 300000
  }
}
```

`interval` é o tempo entre checagens em milissegundos. O padrão é `300000` (5 minutos) e valores abaixo de `30000` são limitados a esse piso.

## Mudando os Textos

Os textos do banner vivem nas chaves i18n `system.update`. Sobrescreva nos seus próprios arquivos de idioma:

```text
system: {
  update: {
    message: 'Documentação nova no ar!',
    refresh: 'Recarregar',
    dismiss: 'Depois'
  }
}
```

## Notas

- As checagens rodam apenas em builds de produção — nunca durante o `docsector dev`.
- Se o `version.json` não existir (um deploy antigo, ou um host que remove o arquivo), o recurso simplesmente não faz nada.
- Dispensar lembra aquele deploy específico durante a sessão do navegador; um deploy mais novo notifica de novo.
- A checagem é uma requisição JSON minúscula na mesma origem; com `Cache-Control: no-cache` ela normalmente resolve como um `304 Not Modified` barato.
