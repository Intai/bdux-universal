'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    ignoreSass = require('ignore-styles'),
    babel = require('babel-core/register'),
    isparta = require('isparta'),
    srcFiles = './src/**/!(*.spec).js',
    sassFiles = './src/**/*.scss',
    testFiles = './src/**/*.spec.js';

gulp.task('clean', function () {
  require('del').sync('lib');
});

gulp.task('instrument', function(cb) {
  gulp.src(srcFiles)
    .pipe($.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    .pipe($.istanbul.hookRequire())
    .on('finish', cb)
})

gulp.task('cover', ['instrument'], function() {
  return gulp.src(testFiles, { read: false })
    .pipe($.mocha())
    .pipe($.istanbul.writeReports({
      dir: './coverage',
      reportOpts: { dir: './coverage' },
      reporters: ['html']
    }));
});

gulp.task('test', function() {
  return gulp.src(testFiles, { read: false })
    .pipe($.mocha());
});

gulp.task('lint', function () {
  return gulp.src(srcFiles)
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

gulp.task('babel', function() {
  return gulp.src(srcFiles)
    .pipe($.babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('sass', function() {
  return gulp.src(sassFiles)
    .pipe(gulp.dest('lib'));
});

gulp.task('watch', function() {
  gulp.watch([srcFiles, testFiles], ['test']);
});

gulp.task('build', [
  'clean',
  'babel',
  'sass'
]);

gulp.task('default', [
  'lint',
  'test',
  'watch'
]);
