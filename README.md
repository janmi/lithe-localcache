# lithe-localcache

0. 配置示例
```
preload: [
"lithe-localcache.js"
],
manifest:{
expires: 1000 * 60 * 10,
version: "0.1.46",
prefix: "",
"conf/Home/index.js": "sdfsdfs"
}
```

1.缓存开关  

开：在preload中配置"lithe-localcache.js"即可  
关：在preload中"lithe-localcache.js"注释掉即可或者不配置内容  

2.缓存机制  

当开启缓存机制后，第一次加载页面后，会将当前页面中请求的js文件内容缓存到localStorage中，这样再刷新页面或者进入其他页面时，请求的js会先从缓存中请求，如果命中，那么直接使用，如果没有命中，那么则向服务器请求该js，然后再缓存进localStorage中。  
异常情况：如果客户端不支持localStorage或者localStorage存储区域满了或者读写异常等，会向服务器请求js文件  

3.manifest说明  

expires（缓存过期时间 ） :  
设定10分钟过期，意思是如果页面第一次请求后，将js文件内容缓存到客户端，之后的十分钟之内会先尝试缓存命中，十分钟之后会重新请求服务器端，然后清空之前的缓存，将新请求的js文件内容缓存到客户端  

version(文件缓存大版本号)：  
此处要求设置version和外面的timestamp内容一致。
如果version更新，那么缓存在客户端的js文件内容会全量更新  

prefix（前缀）：
目前为空即可
业务module：
key是定义的业务module名称，value是当前module的MD5
例如：
"conf/Home/index.js": "sdfdsdsfd"  

注意：大版本号更新，那么在客户端缓存全部更新，但是业务module的版本号不更新（客户端缓存内容为最新）；
如果只更新业务module的版本号，那在客户端请求该module时，则只会更新客户端该文件缓存内容和其版本号，其他缓存文件内容不变
这里需要将所有定义使用module配置进来（define的module）  

4.客户端缓存内容格式  

客户端缓存是以lithe~开头的内容  
lithe~_expires_缓存过期时间，new Date().getTime() + 十分钟(毫秒)  
lithe~manifest缓存配置，配置业务module和public Module的版本信息  
lithe~moduleName 缓存module的文件内容  
