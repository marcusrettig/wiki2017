const gulp = require('gulp');
const replace = require('gulp-replace');
const wrap = require('gulp-wrap');
const fs = require('fs');
const browserSync = require('browser-sync');
const less = require('gulp-less');
const del = require('del');

const config = {
  teamName: 'Lund',
};

const paths = {
  appDir: 'app',
  destDir: 'dist',
  pages: 'app/pages/**/*.html',
  assets: `app/assets/**/*`,
  less: 'less/**/*.less',
  templatesDir: 'app/templates',
  templates: 'app/templates/**/*.html',
  stylesDestDir: 'dist/pages/styles',
  scriptsDestDir: 'dist/pages/scripts',
};

const wrapper = `
<!DOCTYPE html>
<html>
<head>
  <title>iGEM Wiki</title>
</head>
<body>
<script src="/jquery.js"></script>
<%= contents %>
</body>
</html>
`;

// == Build Tasks
gulp.task('pages', () => {
  return gulp.src(paths.pages, { base: paths.appDir })
    .pipe(replace(/{{([^{}]+)}}/g, (match, name) => {
      const template = fs.readFileSync(`${paths.templatesDir}/${name}.html`)
      return template;
    }))
    .pipe(wrap(wrapper))
    .pipe(gulp.dest(paths.destDir));
});

gulp.task('assets', () => {
  return gulp.src(paths.assets, { base: paths.appDir })
    .pipe(gulp.dest(paths.destDir))
});

gulp.task('jquery', () => {
  return gulp.src('node_modules/jquery/dist/jquery.js')
    .pipe(gulp.dest(paths.destDir));
});

gulp.task('scripts', () => {
  return gulp.src('node_modules/bootstrap/dist/js/bootstrap.js')
    .pipe(gulp.dest(paths.scriptsDestDir));
});

gulp.task('less', function () {
  return gulp.src(paths.less)
    .pipe(less({
      paths: ['node_modules'],
    }))
    .pipe(gulp.dest(paths.stylesDestDir))
    .pipe(browserSync.stream());
});

gulp.task('clean', () => {
  del.sync(`${paths.destDir}/**/*`);
});

// == Serve Tasks
gulp.task('browser-sync', ['build'], () => {
  browserSync.init({
    startPath: `/Team:${config.teamName}`,
    server: {
      baseDir: paths.destDir,
      serveStaticOptions: {
        extensions: ["html"]
      },
      middleware: (req,res,next) => {
        // Reroute wiki url to directory in dist
        req.url = req.url.replace(/^\/Team:[^/]+/, '/pages');
        req.url = req.url.replace(/^\/File:/, `/assets/`);
        return next();
      },
    },
  });
});

// == Watch Tasks
gulp.task('sync-pages', ['pages'], (done) => {
  browserSync.reload();
  done();
});

gulp.task('sync-assets', ['assets'], (done) => {
  browserSync.reload();
  done();
});

gulp.task('watch', ['build', 'browser-sync'], () => {
  gulp.watch([paths.pages, paths.templates], ['sync-pages']);
  gulp.watch(paths.assets, ['sync-assets']);
  gulp.watch(paths.less, ['less']);
});

// == Main Tasks
gulp.task('build', ['clean', 'pages', 'assets', 'scripts', 'less', 'jquery']);
gulp.task('serve', ['build', 'browser-sync', 'watch']);
