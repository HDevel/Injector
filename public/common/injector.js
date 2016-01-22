window.onload = function(){
    injector.init.apply(injector)
};
var injector = {
    params: {
        baseUrl: 'blocks/',
        techs: ['html', 'css', 'js'],
        fileLoad: 0,
        style_id: 'inject_style',
        style_done: {},
        style: document.createElement('style')
    },
    init: function () {
        this.params.style.setAttribute('id', this.params.style_id);
        document.getElementsByTagName('head')[0].appendChild(this.params.style);
        document.body.style.display = 'none';
        this.buildInjector();
    },
    buildInjector: function () {
        var self = this;
        var injectors = this.seatchInjectors();
        injectors.forEach(function (node) {
            node.techs.forEach(function (tech) {
                switch (tech.split('.').pop()){
                    case 'html':
                        self.params.fileLoad++;
                        self.loadFile(node.url, tech, function (string) {
                            self.params.fileLoad--;
                            var content = string.match(/{{[^}]+}}/g);
                            if(content){
                                content.forEach(function(v){
                                    var replace = node.node.getAttribute(v.slice(2).slice(0,-2));
                                    string = string.replace(v, replace ? replace : '');
                                });
                            }
                            var div = document.createElement('div');
                            div.innerHTML = string.trim();
                            var newNode = div.firstChild;
                            var currentClass = newNode.getAttribute('class').split(' ');
                            if(node.mods){
                                node.mods.forEach(function (m) {
                                    newNode.className += ' ' + currentClass + '_' + m;
                                });
                            }

                            self.replaceInjectorWith(node.node, newNode);
                            self.buildInjector();
                        });
                        break
                    case 'css':
                        var id = node.name + tech;
                        if(!self.params.style_done[id]){
                            self.params.style_done[id] = true;
                            self.params.style.insertAdjacentHTML('beforeend', '@import url(' + node.url + tech + '?' + Math.random() + ');');
                        }
                        break
                }
            })
        });
        if(self.params.fileLoad == 0){
            document.body.style.display = '';
        }
    },
    seatchInjectors: function () {
        var self = this;
        var nodes = [];
        var injList = injector.getInjectorList();
        for (var i = 0; i < injList.length; i++) {
            if(!injList[i].getAttribute('injecting')){
                injList[i].setAttribute('injecting', '1');
                var name = injList[i].getAttribute('inject');
                var url = this.params.baseUrl + name + '/' + name;
                nodes.push(
                    {
                        node: injList[i],
                        techs: [],
                        name: name,
                        url: url
                    }
                );
            }
        }

        nodes.forEach(function (n) {
            self.params.techs.forEach(function (t) {
                if (n.node.getAttribute(t) != null) {
                    n.techs.push('.' + t);
                    var mods = n.node.getAttribute('mod');
                    if (mods != null && t != 'html') {
                        n.mods = mods.split(' ');
                        n.mods.forEach(function (m) {
                            n.techs.push('_' + m + '.' + t);
                        });

                    }
                }
            });
        });
        return nodes;
    },
    getInjectorList: function () {
        return document.getElementsByTagName('inject');
    },
    replaceInjectorWith: function (oldNode, newNode) {
        oldNode.parentNode.replaceChild(newNode, oldNode);
    },
    loadFile: function (url, tech, callback, error) {
        var url = url + tech + '?' + Math.random();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function (rsp) {
            callback(rsp.target.responseText);
        };
        xhr.send();
    }
};
