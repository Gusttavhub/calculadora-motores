// ElektroSys — comportamento comum do cabeçalho/rodapé das ferramentas.
// Links com data-wa abrem o WhatsApp com mensagem pré-preenchida e editável;
// o assunto vem de data-wa-assunto no <body> (ex.: "um sistema fotovoltaico").
// Sem JavaScript os links continuam funcionando (href estático para wa.me).
(function () {
    var assunto = document.body.getAttribute('data-wa-assunto') || 'o meu caso';
    var msg = 'Olá, Gusttavo. Gostaria de solicitar uma análise inicial para ' + assunto + '.';
    var links = document.querySelectorAll('a[data-wa]');
    for (var i = 0; i < links.length; i++) {
        links[i].href = 'https://wa.me/5564984395286?text=' + encodeURIComponent(msg);
    }
    var anos = document.querySelectorAll('[data-year]');
    for (var j = 0; j < anos.length; j++) anos[j].textContent = new Date().getFullYear();
})();
