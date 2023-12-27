# Introdução

O diretório de fontes aparecem primeiro no arquivo, as outras tabelas que compõem a fonte podem estar em qualquer ordem.

## Tipos de dados

Além dos tipos de dados inteiros padrão, o formato de fonte TrueType usa o seguinte:

|Tipos de dados | Descrição |
|---------------|:---------:|
|shortFrac      | Fração assinada de 16 bits |
|Fixed          | Número de ponto fixo assinado de 16.16 bits |
|FWord          | Inteiro assinado de 16 bits que descreve uma quantidade em FUnits, a menor distância mensurável no espaço "em" |
|uFWord         | Inteiro não assinado de 16 bits que descreve uma quantidade em FUnits, a menor distância mensurável no espaço "em" |
|F2Dot14        | Número fixo assinado de 16 bits com os 14 bits inferiores representando a fração |
|longDateTime   | O formato interno longo de uma data em segundos desde 12h00 da meia-noite de 1º de janeiro de 1904. É representado como um número inteiro assinado de 64 bits |

## Arquivos de fonte TrueType: uma visão geral

Um arquivo de fonte TrueType consiste em tabelas concatenadas. Uma tabela é um grupo de palavras. Cada tabela deve ser alinhada longamente e preenchida com zeros, se necessário.

A primeira tabela é o diretório de fontes, ela facilita o acesso às demais tabelas. O diretório é seguido por tabelas contendo os dados da fonte. Essas tabelas podem aparecer em qualquer ordem. Certas tabelas são necessárias para todas fontes. Outras são opcionais dependendo da funcionalidade da fonte.

As tabelas possuem nomes conhecidos como tags. As tags têm o tipo **uint32**. Os nomes de tags consistem em quatro caracteres. Nomes de tags com três ou menos caracteres possuem espaços à direita. Quando os nomes das tags são mostrados no texto, eles são colocados entre aspas retas.

As tabelas obrigatórias devem aparecer em todos arquivos TrueType válido. As tabelas necessárias e seus nomes de tags são mostrados na Tabela a seguir.

|Tag   | Table                              |
|------|------------------------------------|
|'cmap'| mapeamento de caractere para glifo |
|'glyf'| dados de glifo 					|
|'head'| cabeçalho da fonte 				|
|'hhea'| cabeçalho horizontal 				|
|'hmtx'| métricas horizontais				|
|'loca'| índice para localização			|
|'maxp'| perfil máximo 						|
|'name'| nomeando 							|
|'post'| postScript 						|

Existem tabelas adicionais para suportar outras plataformas, como OpenType. As tags destas tabelas devem ser cadastradas. Entre em contato com o suporte técnico do desenvolvedor Apple para obter informações sobre o processo de registro. Os nomes das tags que consistem apenas em letras minúsculas são reservados para uso da Apple. As tabelas opcionais:

|Name  |Descrição                            |
|------|-------------------------------------|
|'cvt '|valor de controle                    |
|'fpgm'|programa de fontes                   |
|'hdmx'|métricas de dispositivos horizontais |
|'kern'|kerning                              |
|'OS/2'|SO/2                                 |
|'prep'|programa de valor de controle        |

## O diretório de fontes

O diretório de fontes (primeira tabela) é um guia para o conteúdo do arquivo. Ele fornece informações para acessar os dados em outras tabelas. O diretório consiste em duas partes: a subtabela de deslocamento e o diretório da tabela. A subtabela de deslocamento registra o número de tabelas na fonte e fornece informações de deslocamento, permitindo acesso rápido às tabelas do diretório. O diretório de tabelas consiste em uma sequência de entradas, uma para cada tabela na fonte.

### A subtabela de deslocamento

A subtabela de deslocamento, começa com o tipo de escalonamento da fonte. O próprio diretório da tabela e quaisquer subtabelas não estão incluídos nesta contagem. As entradas para searchRange, entrySelector e rangeShift são usadas para facilitar pesquisas binárias rápidas no diretório da tabela. A menos que uma fonte tenha um grande número de tabelas, uma pesquisa sequencial é suficiente.

Se for necessária uma pesquisa mais rápida, uma pesquisa binária será feita mais facilmente em um número de entradas que seja uma potência de dois. Isso torna possível reduzir pela metade o número de itens a serem pesquisados por meio de deslocamento. As entradas restantes da subtabela de deslocamento devem ser definidas da seguinte forma:

* **searchRange** é a maior potência de dois menor ou igual ao número de itens na tabela, ou seja, o maior número de itens que podem ser facilmente pesquisados.

* **rangeShift** é o número de itens menos searchRange; ou seja, o número de itens que não serão examinados se você observar apenas os itens do searchRange.
Antes do início do loop de pesquisa, compare o item de destino com o item com número rangeShift. Se o item de destino for menor que rangeShift, pesquise desde o início da tabela. Se for maior, pesquise iniciando pelo item com número rangeShift.

* **entrySelector** é o log 2 (searchRange). Diz quantas iterações do loop de pesquisa são necessárias. (ou seja, quantas vezes cortar o intervalo pela metade) Observe que searchRange, entrySelector e rangeShift são todos multiplicados por 16, o que representa o tamanho de uma entrada de diretório.

A subtabela de deslocamento
|Tipo|Nome|Descrição|
|----|----|---------|
|uint32|scaler type|Uma tag para indicar o escalonador OFA a ser usado para rasterizar esta fonte|
|uint16|numTables|número de tabelas|
|uint16|searchRange|(potência máxima de 2 <= numTables)\*16|
|uint16|entrySelector|log 2 (potência máxima de 2 <= numTables)|
|uint16|rangeShift|numTables\*16-searchRange|

O tipo de escalador é usado pelo OS X e iOS para determinar qual escalador usar para esta fonte, ou seja, para determinar como extrair dados de glifo da fonte. Diferentes escalonadores de fontes envolvem diferentes formatos de fonte na estrutura básica de uma fonte TrueType.

Os valores 'true'(0x74727565) e (0x00010000) são reconhecidos pelo OS X e iOS como referentes a fontes TrueType. O valor 'typ1'(0x74797031) é reconhecido como referindo-se ao antigo estilo de fonte PostScript. O valor 'OTTO'(0x4F54544F) indica uma fonte OpenType com contornos PostScript.

Fontes com contornos TrueType produzidas apenas para OS X ou iOS são incentivadas a usar 'true'(0x74727565) para o valor do tipo de escalonador. As fontes para produtos Windows ou Adobe devem usar 0x00010000.

### O diretório da tabela

O diretório da tabela suscede a subtabela de deslocamento. As entradas no diretório da tabela devem ser classificadas em ordem crescente por tag. Cada tabela no arquivo de fonte deve ter sua própria entrada de diretório de tabela. O diretório da tabela:

|Tipo  |Nome    |Descrição                                                          |
|------|--------|-------------------------------------------------------------------|
|uint32|tag     |Identificador de 4 bytes                                           |
|uint32|checkSum|soma de verificação para esta tabela                               |
|uint32|offset  |deslocamento do início do 'sfnt'                                   |
|uint32|length  |comprimento desta tabela em bytes (comprimento real não preenchido)|

O diretório da tabela inclui **checkSum**, um número que pode ser usado para verificar a integridade dos dados da tabela. Os checkSum's são a soma não assinada dos comprimentos em uma tabela.