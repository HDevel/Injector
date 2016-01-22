$(document).ready(function () {
    inject();
});
function inject() {
    var notInjectList = $('inject:not([inject=""])');
    var injectList = $('inject[inject=""]');
    if (notInjectList.length == 0) {
        return
    }
    $('body').bind('DOMSubtreeModified', inject);
    var head = ['style', 'script'];
    head.forEach(function (v) {
        inject[v] = {};
        if (!$('#inject_' + v).length) {
            $('head').append('<' + v + ' id="inject_' + v + '"></' + v + '>')
        }
    });
    notInjectList.each(function (index, value) {
        var techs = ['.html', '.css', '.js'],
            curInject = $(value),
            name = curInject.attr('inject'),
            url = name + '/' + name;
        if (name == '') {
            return;
        }
        var mod = curInject.attr('mod');
        if(mod){
            mod = mod.split(' ');
            mod.forEach(function(cls){
                for(var i = 1; i < 3; i++){
                    techs.push('_' + cls + techs[i]);
                }
            });
        }
        var complete = ' ';
        var techId = 0;
        loadTech(techs);
        function loadTech(techs){
            var tech = techs[techId];
            var nameTech = '_' + name + tech;
            var texExt = tech.split('.').pop();
            if (curInject.attr(texExt) == undefined) {
                techId++
                if(techId < techs.length){
                    loadTech(techs);
                } else {
                    console.log(
                        'Injected - %c ' + name + ' %c in technology: %c' + complete,
                        'background: #222; color: #bada55',
                        '',
                        'background: #222; color: #bada55'
                    );
                }
                return;
            }
            complete += tech + ' ';
            $.get('blocks/' + url + tech + '?' + Math.random(), function (data) {
                switch (texExt) {
                    case 'html':
                        var content = data.match(/{{[^}]+}}/g);
                        if(content){
                            content.forEach(function(v){
                                var replace = curInject.attr(v.slice(2).slice(0,-2));
                                data = data.replace(v, replace ? replace : '');
                            });
                        }
                        var replace = $(data);
                        if (!replace.attr('class')) {
                            console.log('%c' + name + ' - have no class','background: red; color: white');
                            return;
                        }
                        var baseClass = replace.attr('class').split(' ')[0];
                        if(mod){
                            mod.forEach(function(cls){
                                replace.addClass(baseClass + '_' + cls)
                            })
                        }
                        curInject.replaceWith(replace);
                        break;
                    case 'css':
                        if(!inject.style[nameTech]){
                            inject.style[nameTech] = true;
                            data = data.replace(/url\('/g, 'url(\'blocks/' + url + '/');
                            $('#inject_style').append('/* ' + nameTech + ' */\n' + data);
                        }
                        break;
                    case 'js':
                        if(!inject.script[nameTech]){
                            inject.script[nameTech] = true;
                            $('#inject_script').append('// ' + name + '\n' + data);
                        }
                        break
                }
                techId++;
                if(techId < techs.length){
                    loadTech(techs);
                }
            });
        }
        curInject.attr('inject', '');
    });
};
