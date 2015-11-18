
# Gulp Build for Angular and TypeScript Projects


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

