'use strict';

var _ = require("lodash");
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
var gulpDebug = require('gulp-debug');
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
var RevAll = require('gulp-rev-all');

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
var targetApp = undefined;


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
            throw "Unknown file type (must be .js or .css): " + elem;
        }
    });
    var streamJs = gulp.src(js)
            .pipe(debug({title: "Vendor JavaScript:"}))
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(concat("vendor.js"))
            .pipe(sourcemaps.write('/'))
            .pipe(gulp.dest(config.targetApp + "/vendor"));

    var streamCss = gulp.src(css)
            .pipe(debug({title: "Vendor CSS:"}))
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
// nodeModules copy
// ------------------------------------------------------------------

gulp.task('build:nodeModulesCopy', [], function () {
    var copyStreams = [];
    for (var i = 0; i < config.nodeModulesCopy.length; i++) {
        var module = config.nodeModulesCopy[i];
        var sources = [
            module + "/**/*.js"
        ];
        copyStreams.push(
                gulp.src(sources, {cwd: "node_modules"})
                        .pipe(gulp.dest(config.targetJs + "/" + module)));
    }
    return merge(copyStreams);
});

// ------------------------------------------------------------------
// Build HTML
// ------------------------------------------------------------------

gulp.task('build:html', [], function () {
    var s = gulp.src(config.htmlFiles, {nosort: true});
    s = s.pipe(cache("html"));
    s = s.pipe(debug({title: "HTML:"}));
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
                        .pipe(debug({title: "Copy (-> " + dest + "):"}))
                        .pipe(gulp.dest(config.targetApp + "/" + dest)));
    }
    return merge(copyStreams);
});

// ------------------------------------------------------------------
// Build CSS
// ------------------------------------------------------------------

function buildCss(useCache) {
    var scss = gulp.src(config.scssFiles, {nosort: true});
    scss = useCache ? scss.pipe(cache("scss")) : scss;
    scss = scss.pipe(debug({title: "SCSS:"}));
    scss = developmentMode ? scss.pipe(sourcemaps.init()) : scss;
    scss = scss.pipe(sass().on('error', sass.logError));
    scss = developmentMode ? scss.pipe(sourcemaps.write()) : scss;
    scss = developmentMode ? scss.pipe(gulp.dest(config.targetApp)) : scss;

    var css = gulp.src(config.cssFiles, {nosort: true});
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
// Build TypeScript
// ------------------------------------------------------------------

var tsProject = ts.createProject('src/tsconfig.json');

gulp.task('build:ts', function () {
    if (developmentMode) {
        gulp.src(config.typeScriptLintFiles)
                .pipe(cache("lint:ts"))
                .pipe(tslint()).pipe(tslint.report({
            formatter: "verbose",
            emitError: false
        }));
    }

    var tsResult = gulp.src(config.typeScriptFiles);

    // tsResult = tsResult.pipe(addsrc(config.typeScriptDefinitions));
    tsResult = developmentMode ? tsResult.pipe(sourcemaps.init()) : tsResult;
    tsResult = tsResult.pipe(ts(tsProject, undefined, ts.reporter.longReporter()));

    var tsResultJs = tsResult.js;
    tsResultJs = tsResultJs.pipe(cache("ts"));
    tsResultJs = tsResultJs.pipe(debug({title: "TypeScript:"}));
    tsResultJs = tsResultJs.pipe(ngAnnotate());
    tsResultJs = tsResultJs.pipe(uglify());
    tsResultJs = tsResultJs.pipe(browsersync.stream());

    if (developmentMode) {
        tsResultJs = tsResultJs.pipe(sourcemaps.write(".", {includeContent: true, sourceRoot: "/"}));
        // tsResultJs = tsResultJs.pipe(sourcemaps.write());
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
                throw err;
            });
});


// ------------------------------------------------------------------
// Revision
// ------------------------------------------------------------------

gulp.task('revision', [], function () {
    config.targetApp = targetApp;
    var revAll = new RevAll(config.revAllOptions);
    return gulp.src(config.target + "/tmp/**")
            .pipe(debug({title: "Revision:"}))
            .pipe(revAll.revision())
            .pipe(gulp.dest(config.targetApp))
            .pipe(revAll.versionFile())
            .pipe(gulp.dest(config.targetApp));
});

// ------------------------------------------------------------------
// Dist Cleanup
// ------------------------------------------------------------------

gulp.task('dist:cleanup', [], function () {
    del.sync([config.targetJs]);
    del.sync([config.target + "/tmp"]);
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
    gulp.watch(config.typeScriptFiles, {}, ["build:ts"]);
    gulp.watch(config.htmlFiles, {}, ["build:html"]);
    gulp.watch(config.scssFiles, {}, ["build:css"]);
    gulp.watch(config.scssRebuildAllFiles, {}, ["build:cssNoCache"]);

    for (var i = 0; i < config.copyFiles.length; i++) {
        var source = config.copyFiles[i][0];
        gulp.watch(source, {cwd: "."}, ["build:copy"]);
    }
});

gulp.task('dev', function (callback) {

    config.targetJs = config.targetApp;

    developmentMode = true;
    sequence(
            ["build:vendor", "build:copy", "build:nodeModulesCopy"],
            ["build:ts", "build:css"],
            "build:html",
            callback);
});

gulp.task('dist', function (callback) {
    config.targetJs = config.target + "/tmpJs";
    targetApp = config.targetApp;
    config.targetApp = config.target + "/tmp";

    sequence(
            "clean",
            ["build:vendor", "build:copy", "build:nodeModulesCopy"],
            ["build:ts", "build:css"],
            "bundle",
            "build:html",
            "revision",
            "dist:cleanup",
            callback);
});

gulp.task('default', ["watch"]);


// ------------------------------------------------------------------
// utils
// ------------------------------------------------------------------

var onError = function (err) {
    gutil.log(
            gutil.colors.red.bold('[ERROR:' + err.plugin + ']:'),
            gutil.colors.bgRed(err.message),
            gutil.colors.red.bold('in:' + err.fileName)
    );
    this.emit('end');
};

function debug(config) {
    if (developmentMode) {
        return gutil.noop();
    } else {
        return gulpDebug(config);
    }
}
