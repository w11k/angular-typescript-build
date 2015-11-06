'use strict';

var fs = require('fs');
var del = require('del');
var mkdirp = require('mkdirp');
var merge = require('merge2');
var assign = require('lodash.assign');
var series = require('stream-series');
var sequence = require('run-sequence');

var path = require("path");
var Builder = require('systemjs-builder');

var gulp = require('gulp');
var debug = require('gulp-debug');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var htmlmin = require('gulp-htmlmin');
var browsersync = require('browser-sync');
var cache = require('gulp-cached');
var addsrc = require('gulp-add-src');

var sass = require('gulp-sass');
var cssRebase = require('gulp-css-url-rebase');
var cssMin = require('gulp-minify-css');

var inject = require('gulp-inject');
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var plumber = require('gulp-plumber');

var Config = require('./gulpfile.config');
var config = new Config();

var developmentMode = false;


var onError = function (err) {
    gutil.log(
        gutil.colors.red.bold('[ERROR:' + err.plugin + ']:'),
        gutil.colors.bgRed(err.message),
        gutil.colors.red.bold('in:' + err.fileName)
    );
    this.emit('end');
};

// ------------------------------------------------------------------
// clean
// ------------------------------------------------------------------
gulp.task('clean', function () {
    try {
        del.sync([config.target]);
    } catch (e) {
        if (developmentMode) {
            console.log(e);
        }
        else {
            throw e;
        }
    }
});

// ------------------------------------------------------------------
// Build Libraries
// ------------------------------------------------------------------

gulp.task('build:vendor', [], function () {
    var js = [];
    var css = [];
    config.vendor.forEach(function (elem) {
        if (elem.substr(-3) === ".js") {
            js.push(elem);
        } else if (elem.substr(-4) === ".css") {
            css.push(elem);
        } else {
            // TODO Warning 'unkown type'
        }
    });
    var streamJs = gulp.src(js)
        //.pipe(debug({title: "Including vendor JS:"}))
        .pipe(concat("vendor.js"))
        .pipe(gulp.dest(config.targetApp + "/vendor"));

    var streamCss = gulp.src(css)
        //.pipe(debug({title: "Including vendor CSS:"}))
        .pipe(concat("vendor.css"))
        .pipe(gulp.dest(config.targetApp + "/vendor"));

    var streamSystemJs = gulp.src(
        ["system-polyfills.js", "system.js"],
        {cwd: "node_modules/systemjs/dist"})
        .pipe(gulp.dest(config.targetApp + "/systemjs"));

    if (developmentMode) {
        var entryGenerated = "";
        entryGenerated += "if (!window.DISABLE_APP) {";
        entryGenerated += "System.config(";
        entryGenerated += JSON.stringify(config.systemJSConfig);
        entryGenerated += ");\n";
        entryGenerated += "System.import('" + config.systemImportMain + "');";
        entryGenerated += "}";
        mkdirp(config.targetApp + "/systemjs", function () {
            fs.writeFileSync(config.targetApp + "/systemjs/entry-generated.js", entryGenerated);
        });
    }

    return merge(streamJs, streamCss, streamSystemJs);
});

// ------------------------------------------------------------------
// Build HTML
// ------------------------------------------------------------------

gulp.task('build:html', [], function () {
    var s = gulp.src(config.htmlFiles, {cwd: "src"});
    s = s.pipe(cache("html"));
    //s = s.pipe(debug({title: "HTML:"}));
    s = s.pipe(gulp.dest(config.targetApp));
    s = s.pipe(inject(series(
        gulp.src(
            ["vendor/**/*.js", "vendor/**/*.css"],
            {read: false, cwd: config.targetApp}),

        gulp.src(
            ["systemjs/system.js", "systemjs/system-polyfills.js", "systemjs/entry-generated.js"],
            {read: false, cwd: config.targetApp}),

        gulp.src(
            ['**/*.css', "!vendor/**", "!systemjs/**"],
            {read: false, cwd: config.targetApp})
    ), {relative: true, quiet: true}));
    s = s.pipe(htmlmin({
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: true
    }));
    s = s.on('error', onError);
    s = s.pipe(gulp.dest(config.targetApp));
    s = s.pipe(browsersync.stream());

    return s;
});


// ------------------------------------------------------------------
// Build Copy files
// ------------------------------------------------------------------

gulp.task('build:copy', function () {
    var copyStreams = [];
    for (var i = 0; i < config.copyFiles.length; i++) {
        var source = config.copyFiles[i][0];
        var dest = config.copyFiles[i][1];
        copyStreams.push(
            gulp.src(source)
                .pipe(cache("copy" + i))
                //.pipe(debug({title: "Copy:"}))
                .pipe(gulp.dest(config.targetApp + "/" + dest)));
    }
    return merge(copyStreams);
});

// ------------------------------------------------------------------
// Build CSS
// ------------------------------------------------------------------

function buildCss(useCache) {
    var scss = gulp.src(config.scssFiles, {nosort: true, cwd: "src"});
    scss = useCache ? scss.pipe(cache("scss")) : scss;
    scss = scss.pipe(debug({title: "SCSS:"}));
    scss = developmentMode ? scss.pipe(sourcemaps.init()) : scss;
    scss = scss.pipe(sass().on('error', sass.logError));
    scss = developmentMode ? scss.pipe(sourcemaps.write()) : scss;
    scss = developmentMode ? scss.pipe(gulp.dest(config.targetApp)) : scss;

    var css = gulp.src(config.cssFiles, {nosort: true, cwd: "src"});
    css = css.pipe(debug({title: "CSS:"}));
    css = css.pipe(cache("css"));

    var both = merge(scss, css);
    both = !developmentMode ? both.pipe(cssRebase()) : both;
    both = !developmentMode ? both.pipe(cssMin()) : both;
    both = !developmentMode ? both.pipe(concat("___.css")) : both;
    both = both.pipe(gulp.dest(config.targetApp));

    both = both.pipe(browsersync.stream());

    return both;
}

gulp.task('build:css', function () {
    return buildCss(true);
});

gulp.task('build:cssNoCache', function () {
    return buildCss(false);
});

// ------------------------------------------------------------------
// Build JavaScript
// ------------------------------------------------------------------

gulp.task('build:js', function () {
    var s = gulp.src(config.javaScriptFiles, {nosort: true, cwd: "src"});
    s = s.pipe(cache("js"));
    s = developmentMode ? s.pipe(sourcemaps.init()) : s;
    s = s.pipe(ngAnnotate());
    s = s.pipe(uglify());
    s = developmentMode ? s.pipe(sourcemaps.write()) : s;
    //s = s.pipe(debug({title: "JavaScript:"}));
    s = s.pipe(gulp.dest(config.targetJs));
    s = s.pipe(browsersync.stream());
    return s;
});


// ------------------------------------------------------------------
// Build TypeScript
// ------------------------------------------------------------------

var tsProject = ts.createProject('tsconfig.json');

gulp.task('build:ts', function () {
    if (developmentMode) {
        gulp.src(config.typeScriptLintFiles, {cwd: "src"})
            .pipe(cache("lint:ts"))
            .pipe(tslint()).pipe(tslint.report('prose', {emitError: false}));
    }

    var tsResult = gulp.src(config.typeScriptFiles, {cwd: "src"});

    tsResult = tsResult.pipe(addsrc(config.typeScriptDefinitions));
    tsResult = developmentMode ? tsResult.pipe(sourcemaps.init()) : tsResult;
    tsResult = tsResult.pipe(ts(tsProject, undefined, ts.reporter.longReporter()));

    var tsResultJs = tsResult.js;
    tsResultJs = tsResultJs.pipe(cache("ts"));
    tsResultJs = tsResultJs.pipe(debug({title: "TypeScript:"}));
    tsResultJs = tsResultJs.pipe(ngAnnotate());
    tsResultJs = tsResultJs.pipe(uglify());
    tsResultJs = tsResultJs.pipe(browsersync.stream());

    if (developmentMode) {
        tsResultJs = tsResultJs.pipe(sourcemaps.write());
    }

    return merge([
        tsResult.dts.pipe(gulp.dest(config.target + "/dts")),
        tsResultJs.pipe(gulp.dest(config.targetJs + "/"))
    ]);
});


// ------------------------------------------------------------------
// Build Bundle
// ------------------------------------------------------------------

gulp.task('bundle', [], function (done) {

    config.systemJSConfig.baseURL = config.targetJs + "/" + config.systemJSConfig.baseURL;

    new Builder(config.systemJSConfig)
        .buildSFX(config.systemImportMain, config.targetApp + "/systemjs/entry-generated.js", {minify: true})
        .then(function () {
            done();
        })
        .catch(function (err) {
            console.log('Build error');
            console.log(err);
        });
});


// ------------------------------------------------------------------
// BrowserSync
// ------------------------------------------------------------------

gulp.task('browsersync', ["dev"], function () {
    return browsersync(config.browserSyncOptions);
});

// ------------------------------------------------------------------
// Start Tasks
// ------------------------------------------------------------------

gulp.task('watch', ["browsersync"], function () {
    developmentMode = true;
    gulp.watch(config.typeScriptFiles, {cwd: "src"}, ["build:ts"]);
    gulp.watch(config.javaScriptFiles, {cwd: "src"}, ["build:js"]);
    gulp.watch(config.htmlFiles, {cwd: "src"}, ["build:html"]);
    gulp.watch(config.scssFiles, {cwd: "src"}, ["build:css"]);
    gulp.watch(config.scssRebuildAllFiles, {cwd: "src"}, ["build:cssNoCache"]);

    for (var i = 0; i < config.copyFiles.length; i++) {
        var source = config.copyFiles[i][0];
        gulp.watch(source, {cwd: "."}, ["build:copy"]);
    }
});

gulp.task('dev', function (callback) {

    config.targetJs = config.targetApp;

    developmentMode = true;
    sequence(
        "clean",
        ["build:vendor", "build:copy", "build:js", "build:ts", "build:css"],
        "build:html",
        callback);
});

gulp.task('dist', function (callback) {

    config.targetJs = config.target + "/tmpJs";

    sequence(
        "clean",
        ["build:vendor", "build:copy", "build:js", "build:ts", "build:css"],
        "bundle",
        "build:html",
        callback);
});

gulp.task('default', ["watch"]);
