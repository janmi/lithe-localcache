/**
    lithe-localcache
    @author  [zeromike]
    @fileoverview a javascript common loader
    @vserion 0.1.0
 **/
define("lithe-localcache", function(require) {
    if (!window.localStorage) {
        return;
    }
    try {
        localStorage.setItem("lithe~Storage","gomeplusStorage");
        localStorage.removeItem("lithe~Storage");
    }catch(e){
        return;
    }

    var fetching = {},
        callbacks = {},
        fetched = {},
        defaultSyntax = ['??', ','],
        data = lithe.getConfig(),
        remoteManifest = (data.manifest) || {},
        remotePublicManifest = data.publicdeps || {},
        remotePublicPath = data.publicpath || "",
        EXPIRES = remoteManifest.expires,
        LCPREFIX = "lithe~",
        MANIFEST = "manifest",
        basepath = data.basepath,
        remotePrefix = remoteManifest["prefix"],
        remoteKeys = Object.keys(remoteManifest),
        publicDepsKeyValue = {};

    for (var i in remotePublicManifest) {
        if (remotePublicManifest.hasOwnProperty(i)) {
            publicDepsKeyValue[i] = Object.keys(remotePublicManifest[i])[0];
        }
    };

    var storage = {
        _maxRetry: 1,
        _retry: true,
        get: function (key, parse) {
            var val;
            try {
                val = localStorage.getItem(key);
            } catch (e) {
                return undefined;
            }
            if (val) {
                return parse ? JSON.parse(val) : val;
            } else {
                return undefined;
            }
        },
        set: function (key, val, retry) {
            retry = ( typeof retry == 'undefined' ) ? this._retry : retry;
            try {
                localStorage.setItem(key, val);
            } catch (e) {
                if (retry) {
                    var max = this._maxRetry;
                    while (max > 0) {
                        max--;
                        this.removeAll();
                        this.set(key, val, false);
                    }
                }
            }
        },
        remove: function (url) {
            try {
                localStorage.removeItem(url);
            } catch (e) {
            }
        },
        removeAll: function () {
            for (var i = localStorage.length - 1; i >= 0; i--) {
                var key = localStorage.key(i);
                if (/^lithe~.+/g.test(key)) {
                    localStorage.removeItem(key);
                }
            }
        }
    };

    var localManifest = storage.get(LCPREFIX + MANIFEST, true) || {};

    var isNeedUpdate = !localManifest["version"] ||
                        localManifest["version"] !== remoteManifest["version"];

    if (!remoteManifest) {
        //failed to fetch latest version and local version is broken.
        return;
    }

    if (!storage.get(LCPREFIX + "_expires_")) {
        storage.set(LCPREFIX + "_expires_", new Date().getTime() + EXPIRES);
    }else {
        var expireTime = storage.get(LCPREFIX + "_expires_");
        if (expireTime < new Date().getTime()) {
            storage.removeAll();
            storage.set(LCPREFIX + "_expires_", new Date().getTime() + EXPIRES);
        }
    }

    var LocalCache = {
        /**
         * 检查code是否存在
         * @param url
         * @param code
         * @return {Boolean}
         */
        validate: function (url, code) {
            if (!code || !url) {
                return false;
            } else {
                return true;
            }
        },
        /***
         * 获取js的文本内容
         * @param url
         * @param callback
         */
        fetchAjax: function (url, callback) {
            var xhr = new window.XMLHttpRequest();
            var timer = setTimeout(function () {
                xhr.abort();
                callback(null);
            }, 30000);
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    clearTimeout(timer);
                    if (xhr.status === 200 || xhr.status === 302) {
                        callback(xhr.responseText);
                    } else {
                        callback(null);
                    }
                }
            };
            xhr.send(null);
        },
        /**
         * 执行JS内容
         * @param url
         * @param code
         */
        use: function (url, code) {
            /*if (code){
                console.time("codeInnerhtml");
                var node = document.createElement("script");
                var header = document.getElementsByTagName('head')[0];
                node.innerHTML = code;
                header.appendChild(node);
                console.log(url);
                console.timeEnd("codeInnerhtml");
                return true;
            }else {
                return false;
            }*/
            if (code) {
                //console.time("codeEval");
                try {
                    (window.execScript || function (data) {
                        window['eval'].call(window, data);
                    })(code);
                } catch (e) {
                    return false;
                }
                //console.timeEnd("codeEval");
            }
            return true;
        },
        /***
         * 执行回调
         * fetchModel
         * @param url
         */
        onLoad: function (url) {
            fetched[url] = true;
            delete fetching[url];
            var fns = callbacks[url];
            if (fns) {
                delete callbacks[url];
                fns.forEach(function(fn) {
                    fn();
                });
            }
        },
        /***
         * 判断是否远端存在此url,返回此url版本号或版本路径
         * @param url
         * @param isPublic
         * @returns {undefined}
         */
        getRemoteUrl: function(url, isPublic) {
            var remoteMod,
                remoteVersion = [];
            if (!isPublic) {

                remoteVersion = remoteKeys.filter(function(current) {
                    if (basepath + remotePrefix + current === url) {
                        return remoteManifest[current];
                    }
                });

                return remoteVersion.length ? {
                    remoteVersion: remoteManifest[remoteVersion[0]],
                    remoteMod: remoteVersion[0]
                } : undefined;
            }else {

                for (var i in publicDepsKeyValue) {
                    if (remotePublicPath + publicDepsKeyValue[i] === url) {
                        remoteVersion.push(publicDepsKeyValue[i]);
                        remoteMod = i;
                        break;
                    }
                }

                return remoteVersion.length ? {
                    remoteVersion: remoteVersion[0],
                    remoteMod: remoteMod
                } : undefined;
            }

        },
        /***
         * 获取Model并保存到localStorage里
         * @param url
         * @param cb
         */
        doFetchModel: function(url, cb) {
            this.fetchAjax(url + '?v=' + Math.random().toString(), function (resp) {
                if (!resp) {
                    LocalCache.doFetchModel(url, cb);
                    return;
                }
                if (!LocalCache.use(url, resp)) {
                    LocalCache.doFetchModel(url, cb);
                    return;
                }
                if (cb) {
                    cb.apply(null, [url, resp]);
                }
                LocalCache.onLoad(url);
            });
        },
        /**
         * 是否combo
         * @param url
         * @returns {boolean}
         */
        isCombo: function(url){
            var sign = defaultSyntax[0];
            return url.indexOf(sign) >= 0;
        },
        /***
         * 截取combo路径的js文件名
         * @param url
         * @returns {*}
         */
        splitComboUrl: function(url){
            var syntax = defaultSyntax;
            var arr = url.split(syntax[0]);
            if(arr.length != 2) {
                return url;
            }
            var host = arr[0];
            var urls = arr[1].split(syntax[1]);
            var result = {};
            result.host = host;
            result.files = [];
            for(var i = 0,len = urls.length; i < len; i++) {
                result.files.push(urls[i]);
            }
            return result;
        }
    };

    if (lithe.events.map["fetch"]) {
        delete lithe.events.map["fetch"];
        lithe.events.on("fetch", function (url, cb) {
            if (!(/\.css$/).test(url)) {
                var isCombo = LocalCache.isCombo(url);
                if (fetched[url]) {
                    cb();
                    return;
                }
                if (fetching[url]) {
                    callbacks[url].push(cb);
                    return;
                }
                fetching[url] = true;
                callbacks[url] = [cb];

                var singleRemoteUrl = LocalCache.getRemoteUrl(url);

                if (!isCombo && singleRemoteUrl) { // 判断是否存在此url

                    var cached = storage.get(LCPREFIX + singleRemoteUrl.remoteMod);
                    var cachedValidated = LocalCache.validate(url, cached);

                    var _singleCB = function(url, resp) {
                        var remoteUrl = LocalCache.getRemoteUrl(url);
                        if (remoteUrl) {
                            localManifest[remoteUrl.remoteMod] = remoteUrl.remoteVersion; //版本号即可

                            if (!localManifest["version"] ||
                                localManifest["version"] !== remoteManifest["version"]) {
                                localManifest["version"] = remoteManifest["version"];
                            }

                            storage.set(LCPREFIX + MANIFEST, JSON.stringify(localManifest)); //update one by one
                            storage.set(LCPREFIX + remoteUrl.remoteMod, resp);
                        }
                    };

                    if (isNeedUpdate) {
                        LocalCache.doFetchModel(url, _singleCB);
                    }else {

                        // 比较是否相同
                        if (singleRemoteUrl.remoteVersion === localManifest[singleRemoteUrl.remoteMod] &&
                            cachedValidated) {
                            //cached version is ready to go
                            if (LocalCache.use(url, cached)){
                                LocalCache.onLoad(url);
                            }else {
                                LocalCache.doFetchModel(url, _singleCB);
                            }
                        } else {
                            //从服务器获取最新js文件
                            LocalCache.doFetchModel(url, _singleCB);
                        }
                    }
                } else if (isCombo) { // combo
                    var splited = LocalCache.splitComboUrl(url),
                        needFetchAjax = false;

                    for(var i = splited.files.length - 1; i >= 0; i--) {
                        var file = splited.host + splited.files[i];
                        var cached = storage.get(LCPREFIX + splited.files[i]);
                        var cachedValidated = LocalCache.validate(file, cached);
                        var publicRemoteUrl = LocalCache.getRemoteUrl(file, true);
                        if(publicRemoteUrl){
                            needFetchAjax = true;
                            if(publicRemoteUrl.remoteVersion === localManifest[publicRemoteUrl.remoteMod] &&
                                cachedValidated) {
                                if (LocalCache.use(file, cached)){
                                    splited.files.splice(i, 1);  //从combo中删除此文件
                                }
                            }
                        }
                    }

                    if(splited.files.length == 0){
                        LocalCache.onLoad(url);  //所有文件都cache住了
                        return;
                    }

                    var comboUrl = splited.host + defaultSyntax[0] + splited.files.join(defaultSyntax[1]);

                    var _comboCB = function () {
                        lithe.events.on("end",function(){
                            var splitedFiles = this.files;
                            for(var i = 0, len = splitedFiles.length; i < len; i++) {
                                var file = splited.host + splitedFiles[i];
                                var remoteUrl = LocalCache.getRemoteUrl(file, true);
                                if (remoteUrl) {
                                    localManifest[remoteUrl.remoteMod] = remoteUrl.remoteVersion;

                                    storage.set(LCPREFIX + splitedFiles[i], "define('" +
                                        remoteUrl.remoteMod + "'," +
                                        lithe.cache[remotePublicPath +
                                        remoteUrl.remoteMod].factory.toString() + ");");
                                }
                            }
                            storage.set(LCPREFIX + MANIFEST, JSON.stringify(localManifest));
                        }, splited);
                    };

                    LocalCache.doFetchModel(comboUrl, _comboCB);
                }// isCombo
            } // js文件
        }); // on fetch
    } // 是否存在fetch事件的注册
});