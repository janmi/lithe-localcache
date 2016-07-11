/**
 * @author zeromike
 * @fileoverview 配置文件，nodejs和web公用
 **/

(function(global, undef) {
  var isBrowser = !!(typeof window !== undef && global.navigator && global.document);
  var debug;
  var basepath,
      publicpath;
  if (isBrowser) {
    debug = (/debug/).test(location.search);
     // basepath = 'http://m.gomeplus.com/';
     var maps = {
       'your website url': 'your js cdn url'
     };
     basepath = location.href.match(/^(http[s]?):\/\/(?:[^\/]*)\/.*$/)[1] + '://' + maps[location.host] + "/m";
     publicpath = location.href.match(/^(http[s]?):\/\/(?:[^\/]*)\/.*$/)[1]+'://'+maps[location.host]+'/m/public';
  }
  // alert(basepath);
  var mod = {
    basepath: debug ? basepath + '/src/js/' : basepath + '/dist/js/',
    alias: {
      '$': 'vendors/zepto.js',
      'vue': 'vendors/vue.js',
      'FastClick': 'vendors/fastclick.js',
      'TouchSlide': 'vendors/TouchSlide.js',
      'DropLoad': 'vendors/dropload.js'
    },
    publicpath : debug ? publicpath + "/publicJS/src/" : publicpath + '/publicJS/dist/', //combo文件路径
    publicdeps : {
      "vendors/zepto.js" : {
        "vendors/zepto/v1/zepto.js" : []
      },
      "vendors/zepto-fx.js" : {
        "vendors/zepto-fx/v1/zepto-fx.js" : []
      },
      "vendors/vue.js" : {
        "vendors/vue/v3/vue.js" : []
      }
    },
    localcache:true, //开启缓存
    preload: [],
    manifest:{},
    timestamp: '0.1.50'
  };
  if (global.define && isBrowser) {
    define('config', function() {
      return mod;
    });
  } else {
    module.exports = mod;
  }
  if (isBrowser) {
    (/debug/).test(location.search) && (window.onerror = function(msg, url, line) {
      alert('异常信息：' + msg + '\n' + '错误文件：' + url + '\n' + '错误行数：' + line);
    });
  }
})(this);
