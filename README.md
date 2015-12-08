
# Gulp Build for Angular and TypeScript Projects

[![Join the chat at https://gitter.im/w11k/angular-typescript-build](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/w11k/angular-typescript-build?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## 2015-12-08

### Breaking Change

We had to revert the last breaking change. The SASS plugin created wrong absolute paths when the `cwd` was not set. Now you must not prefix your JavaScript, TypeScript, CSS and HTML file GLOBs in your `gulpfile.config.js`. They are always relative to the `src` directory. For example, valid entries are

```
this.htmlFiles = [
    "**/*.html"
];

this.cssFiles = [
    "**/*.css"
];

this.scssFiles = [
    "!**/_*.scss",
    "**/*.scss"
];

this.scssRebuildAllFiles = [
    "**/_*.scss"
];


this.typeScriptFiles = [
    "**/*.ts"
];

this.typeScriptLintFiles = [
    "**/*.ts"
];

this.javaScriptFiles = [
    "**/*.js"
];

```

However, the TypeScript definitions, copyFiles and vendor entries are still relative to the root directory:


```

this.vendor = [
	"bower_components/font-awesome/css/font-awesome.min.css",
	...
];

this.typeScriptDefinitions = [
    "typings/tsd.d.ts"
];

this.copyFiles = [
    ["bower_components/bootstrap/dist/fonts/**/*", "fonts"],
    ["bower_components/font-awesome/fonts/*.woff", "fonts"]
];

```


## 2015-11-18 - 2

### Breaking Change

Source paths in gulpfile.config.js must include all parent directories. Until now, the paths for JavaScript, TypeScript, CSS and HTML files were relative to the `src` directory. The motivation for this is to allow a more flexible project directory layout.

Migration guide:

Change all lines like these

```
this.htmlFiles = [
    "**/*.html"
];
```

to

```
this.htmlFiles = [
    "src/**/*.html"
];
```


## 2015-11-18

### New Features

- Support for revisions via https://github.com/smysnk/gulp-rev-all

### Breaking Change

- New config parameter

```
this.revAllOptions = {
    dontRenameFile: ["index.html"]
};
```

See [gulp-rev-all options](https://github.com/smysnk/gulp-rev-all#options) for a detailed explanation.

