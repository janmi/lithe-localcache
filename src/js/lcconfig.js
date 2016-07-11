/**
 * Created by zhangmike on 16/6/16.
 */
var lcconfig = {
	tmpPath: '../../../temp/js/', //临时目录
	configFile: 'config.js',  //配置文件名
	MD5File:'.jsUglifyPre.json', //md5文件
	preload: [
		"lithe-localcache.js"
	],
	manifest:{
		prefix: "",
		expires: 1000 * 60 * 10   //过期时间
	}
};

module.exports = lcconfig;