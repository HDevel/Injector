var config = require('./injector.conf.json');
fs = require('fs');

var injector = {};
var pages = {};
var styles = {};
var style = '';
var updateInWork = false;
var writeTimeout;

injector.init = function () {
    injector.watchFiles([config.pages, config.blocks]);
    injector.fileChanged();
};

injector.watchFiles = function (array) {
    array.forEach(function (path) {
        fs.watch(path, {recursive: true}, function () {
            injector.fileChanged();
        });
    });
};


injector.fileChanged = function () {
    //if(!updateInWork){
    updateInWork = true;
    pages = {};
    styles = {};
    style = '';
    fs.readdir(config.pages, function (err, array) {
        array.forEach(function (name) {
            injector.loadPage(name);
        });
    })
    //}
};

injector.loadPage = function (name) {
    var html = fs.readFileSync(config.pages + name, 'utf8')
    pages[name] = html;
    injector.parseInject(name);
};

injector.injectFile = function (pageName, inject, replaceString) {
    inject.techs.forEach(function (tech) {
        if (tech.indexOf('.') == -1) {
            tech = '.' + tech;
        }
        var fileName = config.blocks + inject.name + '/' + inject.name + tech;
        if(!fs.existsSync(fileName)){
            return
        }
        var newInject = fs.readFileSync(fileName, 'utf8')
        switch (tech.split('.').pop()) {
            case 'html':
                var content = newInject.match(/{{[^}]+}}/g);
                if (content) {
                    content.forEach(function (v) {
                        var replace = inject.attrs[v.slice(2, -2)];
                        newInject = newInject.replace(v, replace ? replace : '');
                    });
                }
                if (inject.attrs.mod) {
                    var injClassReplace = newInject.match(/class=("[^"]+"|'[^']+')/g).shift();
                    var injClass = injClassReplace.replace(/^class=[/'"]/g, '').slice(0, -1);
                    var newClass = [injClass]
                    inject.attrs.mod.split(' ').forEach(function (mod) {
                        newClass.push(injClass + '_' + mod);
                    });
                    newInject = newInject.replace(injClassReplace, 'class="' + newClass.join(' ') + '"')
                }
                pages[pageName] = pages[pageName].replace(replaceString, newInject);
                break;
            case 'css':
                var id = inject.name + tech;
                if (!styles[id]) {
                    styles[id] = true;
                    style += newInject.trim() + '\n\n';
                }
                break;
        }
    });
    injector.parseInject(pageName);
};

injector.writePage = function (pageName, content) {
    fs.writeFile(config.build + pageName, content, function () {
        console.log('done ' + pageName);
        updateInWork = false;
    });
};

injector.parseInject = function (pageName) {
    var injects = pages[pageName].match(/<inject(?:(?!inject>)[\s\S])*inject>/g);
    if (!injects) {
        clearTimeout(writeTimeout);
        writeTimeout = setTimeout(function () {
            console.log('--- New Update ---');
            for(page in pages){
                injector.writePage(page, pages[page]);
            }
            injector.writePage(config.styleName, style);
        }, 10);
        return
    }
    var inject = {
        string: injects[0],
        attrs: {}
    };
    inject.string.replace(/ +/g, ' ').match(/[a-zA-Z0-9]+=('[^']+'|"[^"]+")/g).forEach(function (attr) {
        var attrName = attr.trim().match(/^.+=/g).pop().slice(0, -1).toLowerCase();
        var attrValue = attr.match(/".+"|'.+'/g).pop().slice(1, -1);

        inject.attrs[attrName] = attrValue;
    });
    inject.techs = inject.attrs.inject.split(' ');
    if (inject.attrs.mod) {
        inject.attrs.mod.split(' ').forEach(function (v) {
            inject.techs.push('_' + v + '.css');
        });
    }
    inject.name = inject.techs.shift();
    var replaceID = Math.random() + '' + inject.name;
    pages[pageName] = pages[pageName].replace(inject.string, replaceID);
    injector.injectFile(pageName, inject, replaceID);
};

module.exports = injector;
