var gulp = require('gulp');

var gulpLithe = require('gulp-lithe');
var cssImageLink = gulpLithe.precss;
var jsUglifyPre = gulpLithe.prejs;
var localcache = gulpLithe.localcache;
var path = require('path');
var minifycss = require('gulp-minify-css');
var gulpUtil = require('gulp-util');
var uglify = require('gulp-uglify');
var litheConfig = require('./js/config.js');  // lithe config
var localcacheConfig = require('./js/lcconfig.js');
var rename = require('gulp-rename');
litheConfig.basepath = path.resolve(__dirname,'./js/');
var importCss = require('gulp-cssimport');
var del = require('del');

gulp.task('litheconcat', function() {
    return gulp
        .src(['./js/conf/**/*.js'])  // entry file
        .pipe(gulpLithe({
            config:litheConfig  // lithe config
        }))
        .pipe(gulp.dest('../temp/js/conf'))
});

gulp.task('concat', function() {
    return gulp.src(['./js/lithe.js','./js/config.js', './js/lithe-localcache.js'])
        .pipe(gulp.dest('../dist/js/'));
});

gulp.task('moveimages', function() {
    return gulp.src('./images/**/*')
        .pipe(gulp.dest('../dist/images'));
});

gulp.task('styles',['moveimages'], function() {
    return gulp.src('./css/**/*.css')
        .pipe(importCss())
        .pipe(cssImageLink())
        .pipe(minifycss())
        .pipe(gulp.dest('../dist/css'));
});

/**
 * 压缩所有目标目录下的脚本文件 依赖于movefile任务
 */
gulp.task('uglify',['litheconcat','concat'], function() {
    return gulp.src(['../temp/js/**/*.js'])
        .pipe(jsUglifyPre())//丑化预处理，先判断合并后的文件与旧文件MD5是否有变化，若有，则丑化替换，若无，则不丑化，提高效率
        .pipe(uglify({
            mangle: {
                except: ['require','$']
            }
        }).on('error', gulpUtil.log))
        .pipe(gulp.dest('../dist/js/'));
});

gulp.task('localcache', ['uglify'], function() {
    return gulp.src('./js/conf/**/*')
        .pipe(localcache(litheConfig, localcacheConfig))
        .pipe(gulp.dest('../temp/dist/'));
});

gulp.task('uglifylithe',['litheconcat','concat'], function() {
    return gulp.src(['../dist/js/lithe.js', '../dist/js/lithe-localcache.js']).pipe(uglify({
        mangle: {
            except: ['require']
        }
    })).pipe(gulp.dest('../dist/js/'));
});

gulp.task('uglifyconfig',['litheconcat','concat','localcache'], function() {
    return gulp.src(['../temp/js/config.js']).pipe(uglify()).
    pipe(gulp.dest('../dist/js/'));
});

/**
 * 清空临时目录
 */
gulp.task('cleantemp',['uglify','uglifyconfig'], function(cb) {
    return del(['../temp'],{force:true});
});

gulp.on('error',gulpUtil.log);

gulp.task('default',['litheconcat','uglify','concat','moveimages','styles',
    'uglifyconfig','localcache','uglifylithe','cleantemp']);
