const gulp = require('gulp')
const download = require('gulp-download2')
const rename = require('gulp-rename')

gulp.task('bootstrap', () => {
    return gulp
        .src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ])
        .pipe(gulp.dest('src/dist/bootstrap'))
})

gulp.task('clipboard', () => {
    return gulp
        .src('node_modules/clipboard/dist/clipboard.min.js')
        .pipe(gulp.dest('src/dist/clipboard'))
})

gulp.task('coloris', () => {
    return gulp
        .src([
            'node_modules/@melloware/coloris/dist/coloris.min.css',
            'node_modules/@melloware/coloris/dist/umd/coloris.min.js',
        ])
        .pipe(gulp.dest('src/dist/coloris'))
})

gulp.task('fontawesome', () => {
    return gulp
        .src(
            [
                'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-*',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-*',
            ],
            {
                base: 'node_modules/@fortawesome/fontawesome-free',
                encoding: false,
            }
        )
        .pipe(gulp.dest('src/dist/fontawesome'))
})

gulp.task('jquery', () => {
    return gulp
        .src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('src/dist/jquery'))
})

gulp.task('qr-code-styling', () => {
    return download(['https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/+esm'])
        .pipe(rename('qr-code-styling.js'))
        .pipe(gulp.dest('src/dist/qr-code-styling'))
})

gulp.task(
    'default',
    gulp.parallel(
        'bootstrap',
        'clipboard',
        'coloris',
        'fontawesome',
        'jquery',
        'qr-code-styling'
    )
)
