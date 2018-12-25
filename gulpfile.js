'use strict';

/**
 * Use --production flag to get production builds.
 * Use --vendor flag to re-bundle vendor libraries on non-production builds.
 */

var gulp = require('gulp');
var gutil = require('gulp-util');
var chalk = require('chalk');
var prettyTime = require('pretty-hrtime');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babel = require('gulp-babel');
var argv = require('yargs').argv;
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify-es').default;
var htmlmin = require('gulp-htmlmin');
var gulpWatch = require('gulp-watch');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var sort = require('gulp-sort');
var del = require('del');
var os = require('os');

var paths = {
    src: {
        js: ['./src/js/**/*.js'],
        html: ['./src/**/*.html'],
        copyFiles: ['./src/img/**/*', './src/icons/**/*', './src/css/**/*.css']
    },
    cleanDir: './public/**/*',
    dest: {
        js: './public/js',
        jsFileNameApp: 'app.bundle.js',
        jsFileNameVendor: 'vendor.bundle.js',
        copyFiles: ['./public/img', './public/icons', './public/css'],
        html: './public'
    }
};

function logStart(e) {
    gutil.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
};

function logDone(e) {
    var time = prettyTime(e.duration);
    gutil.log(
        'Finished', '\'' + chalk.cyan(e.task) + '\'',
        'after', chalk.magenta(time)
    );
};

function onError(watch, next, err) {
    console.error(err.codeFrame ? err.message + '\n' + err.codeFrame : err);

    if (!watch && next && next.call)
        next(err);
};

function compileJS(isVendor, next) {
    var watch = shouldWatch();

    function rebundle() {
        console.log('-> compiling JS...');
        var startTime = process.hrtime();
        var e = {
            task: 'writing ' + (isVendor ? 'vendor' : 'app') + ' js',
        };

        logStart(e);

        //TODO: split this to generate seperate vendor and app bundles
        gulp.src(paths.src.js)
            .pipe(sourcemaps.init())
            .pipe(babel({
                presets: ['@babel/env'],
                plugins: ['fast-async']
            }))
            .pipe(buffer())
            .pipe(gulpif(argv.production, uglify()
                .on('error', onError.bind(null, watch, next))))
            .pipe(gulpif(!argv.production, sourcemaps.write()))
            .pipe(gulp.dest(paths.dest.js).on('end', function() {
                logDone({
                    task: 'writing ' + (isVendor ? 'vendor' : 'app') + ' js',
                    duration: process.hrtime(startTime)
                });

                if (!watch && next && next.call)
                    next();
            }));
    }

    if (watch)
        gulpWatch(paths.src.js, rebundle);

    rebundle();
};

function compileAppJS(next) {
    compileJS(false, next);
};

function compileVendorJS(next) {
    compileJS(true, next);
};

function compileHTML(assetTS, next) {
    var watch = shouldWatch();

    function rebundle() {
        console.log('-> bundling HTML...');
        var startTime = process.hrtime();
        var e = {
            task: 'html',
        };

        logStart(e);

        gulp.src(paths.src.html)
            //.pipe(replace('bundle', 'bundle_' + assetTS))
            .pipe(gulpif(argv.production, htmlmin({
                collapseWhitespace: true
            })))
            .pipe(gulp.dest(paths.dest.html)
                .on('error', onError.bind(null, watch, next))
                .on('end', function() {
                    logDone({
                        task: 'writing html',
                        duration: process.hrtime(startTime)
                    });

                    if (!watch && next && next.call)
                        next();
                }));
    };

    if (watch)
        gulpWatch(paths.src.html, rebundle);

    rebundle();
};

function copyFiles(name, src, dest, next) {
    var watch = shouldWatch();

    function rebundle() {
        console.log('-> copying static ' + name + ' files...');
        var startTime = process.hrtime();
        var e = {
            task: 'copy ' + name,
        };

        logStart(e);

        gulp.src(src)
            .pipe(gulp.dest(dest)
                .on('error', onError.bind(null, watch, next))
                .on('end', function() {
                    logDone({
                        task: 'copying ' + name + ' files',
                        duration: process.hrtime(startTime)
                    });

                    if (!watch && next && next.call)
                        next();
                }));
    };

    if (watch)
        gulpWatch(src, rebundle);

    rebundle();
};

function compileCSS(next) {
    var watch = shouldWatch();

    function rebundle() {
        console.log('-> bundling CSS...');
        var startTime = process.hrtime();
        var e = {
            task: 'css',
        };

        logStart(e);

        gulp.src(paths.src.css)
            .pipe(sort({
                comparator: function(file1, file2) {
                    if (file1.path.indexOf('/css/theme.css') > -1)
                        return 1;
                    if (file2.path.indexOf('/css/theme.css') > -1)
                        return -1;

                    return 0;
                }
            }))
            .pipe(sourcemaps.init())
            .pipe(concat(paths.dest.cssFileName))
            .pipe(gulpif(argv.production, cssnano()))
            .pipe(gulpif(!argv.production, sourcemaps.write()))
            .pipe(gulp.dest(paths.dest.css)
                .on('error', onError.bind(null, watch, next))
                .on('end', function() {
                    logDone({
                        task: 'writing css',
                        duration: process.hrtime(startTime)
                    });

                    if (!watch && next && next.call)
                        next();
                }));
    };

    if (watch)
        gulpWatch(paths.src.css, rebundle);

    rebundle();
};

function compile(next) {
    var assetTS = Date.now();
    //paths.dest.jsFileNameApp = paths.dest.jsFileNameApp.replace('bundle', 'bundle_' + assetTS);
    //paths.dest.jsFileNameVendor = paths.dest.jsFileNameVendor.replace('bundle', 'bundle_' + assetTS);
    //paths.dest.cssFileName = paths.dest.cssFileName.replace('bundle', 'bundle_' + assetTS);

    var startTime = process.hrtime();
    var e = {
        task: 'compile',
    };

    logStart(e);

    var watch = shouldWatch();

    var parallelTasks = [];

    //if (argv.production || argv.vendor)
    //parallelTasks.push(compileVendorJS.bind(null));

    parallelTasks.push(compileAppJS.bind(null));
    parallelTasks.push(compileHTML.bind(null, assetTS));
    //parallelTasks.push(compileCSS.bind(null));

    paths.src.copyFiles.forEach(function(path, i) {
        parallelTasks.push(copyFiles.bind(null, path, path, paths.dest.copyFiles[i]));
    });

    (gulp.series([gulp.parallel(parallelTasks),
        function postCompile(next) {
            logDone({
                task: 'compile',
                duration: process.hrtime(startTime)
            });

            if (!watch) {
                if (next && next.call)
                    next();

                setTimeout(function() {
                    process.exit(0);
                }, 300);
            }
        }
    ]))(next);
};

function clean(next) {
    del([paths.cleanDir]).then(function() {
        next.bind(null, null)();
    }).catch(function() {
        console.log(arguments)
    });
};

function shouldWatch() {
    return !argv.production;
};

gulp.task(compileCSS);
gulp.task(compileHTML);
gulp.task(compileAppJS);
gulp.task(compileVendorJS);

gulp.task('clean', clean);
gulp.task('default', gulp.series(clean, compile));
