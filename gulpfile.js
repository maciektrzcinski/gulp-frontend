var async = require('async');

var gulp = require('gulp');
var sass = require('gulp-sass');
var concatCss = require('gulp-concat-css');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var notify = require("gulp-notify");
var plumber = require('gulp-plumber');
var imagemin = require('gulp-imagemin');
/* sprite */
var buffer = require('vinyl-buffer');
var csso = require('gulp-csso');
var imagemin = require('gulp-imagemin');
var merge = require('merge-stream');
var spritesmith = require('gulp.spritesmith');
/* gulp-responsive */
var responsive = require('gulp-responsive');

/* SVG to fonts */
var iconfont = require('gulp-iconfont');
var consolidate = require('gulp-consolidate');

/* Jade */
var jade = require('gulp-jade');

/* BrowserSync */
var browserSync = require('browser-sync').create();

/* Localhost */
var webserver = require('gulp-webserver');

gulp.task('styles', function() {
    var onError = function(err) {
        notify.onError({
                    title:    "SCSS to CSS Error",
                    message:  "line: <%= error.line %>, column: <%= error.column %>\nfile: <%= error.relativePath %>",
                    sound:    "Beep"
          })(err);
        this.emit('end');
    };
    gulp.src('core/assets/**/*.scss')
          .pipe(plumber({errorHandler: onError}))
          .pipe(sass({ style: 'expanded' }))
          .pipe(autoprefixer({
        			browsers: ['last 5 versions'],
        			cascade: false
        	}))
          .pipe(gulp.dest('core/assets/css/'))
          .pipe(notify({
               title: 'SCSS to CSS',
               message: 'success',
               sound: "Pop"
           }));
});
gulp.task('concat-css',['styles'], function () {
  return gulp.src('core/assets/**/*.css')
    .pipe(concatCss("core/css/main.css"))
    .pipe(cssmin())
		.pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('out/'));
});

/*
  scripts

  Command: gulp scripts
*/

gulp.task('scripts', function() {
  var onError = function(err) {
      notify.onError({
                  title:    "Compile JS - Error",
                  message:  "line: <%= error.lineNumber %>, <%= error.fileName %>",
                  sound:    "Beep"
        })(err);
      this.emit('end');
  };
  return gulp.src('core/assets/**/*.js')
    .pipe(plumber({errorHandler: onError}))
    .pipe(concat('core/js/main.js'))
    .pipe(uglify())
    .pipe(gulp.dest('out/'))
    .pipe(notify({
         title: 'Compile JS',
         message: 'success',
         sound: "Pop"
     }));
});

/*
  Imagemin

  @Command: gulp minimg
*/

gulp.task('minimg',['img-size'] ,function() {
	gulp.src('core/assets/images/*')
		.pipe(imagemin())
		.pipe(gulp.dest('out/core/images'))
    .pipe(notify({
         title: 'Min IMG',
         message: 'success',
         sound: "Pop"
     }));
});


/*
  Gerate sprites from PNG

  @Command: gulp sprite
  @Info:
  sprite css class:
  .icon-filename

*/
gulp.task('sprite', function () {
  var spriteData = gulp.src('core/assets/sprites/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: 'sprite.css'
  }));
  var imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest('out/core/css/'));

  var cssStream = spriteData.css
    .pipe(csso())
    .pipe(gulp.dest('core/assets/css/'));

  return merge(imgStream, cssStream).pipe(notify({
       title: 'Sprites',
       message: 'success',
       sound: "Pop"
   }));
});


/*

  img-size
  Lib: https://github.com/mahnunchik/gulp-responsive
  brew install homebrew/science/vips --with-webp --with-graphicsmagick
*/
gulp.task('img-size', function () {
  return gulp.src('core/assets/images/*.{png,jpg}')
    .pipe(responsive({
      'background-*.jpg': {
        width: 1920,
        quality: 60
      },
      '*.jpg': {
        quality: 60
      },
      'logo.png': [
        {
          width: 200
        },{
          width: 200 * 2,
          rename: 'logo@2x.png'
        }
      ]
    }))
    .pipe(gulp.dest('out/core/images'));
});


/* SVG to Font
https://github.com/nfroidure/gulp-iconfont
*/

gulp.task('iconfont', function(done){
  var iconStream = gulp.src(['core/assets/icons/*.svg'])
    .pipe(iconfont({ fontName: 'myfont' }));

  async.parallel([
    function handleGlyphs (cb) {
      iconStream.on('glyphs', function(glyphs, options) {
        gulp.src('core/assets/css/webfont.css')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: 'myfont',
            fontPath: '../fonts/',
            className: 's'
          }))
          .pipe(gulp.dest('core/assets/css/'))
          .on('finish', cb);
      });
    },
    function handleFonts (cb) {
      iconStream
        .pipe(gulp.dest('out/core/fonts/'))
        .on('finish', cb);
    }
  ], done);
});

/*
  Jade compile
*/

gulp.task('jade', function() {
  var YOUR_LOCALS = {};

  gulp.src('core/jade/*.jade')
    .pipe(jade({
      locals: YOUR_LOCALS
    }))
    .pipe(gulp.dest('out/'))
});


/*
  PageSpeed:
  https://github.com/addyosmani/psi

  psi --help

  Usage
    $ psi <url>

  Example
    $ psi todomvc.com --strategy=mobile

  Options
    --key        Google API Key. By default the free tier is used.
    --strategy   Strategy to use when analyzing the page: mobile|desktop
    --format     Output format: cli|json|tap
    --locale     Locale results should be generated in.
    --threshold  Threshold score to pass the PageSpeed test.
    --optimized  Get the URL of optimized resources.
    --download   Download optimized resources.
*/

/*
  https://www.npmjs.com/package/gulp-webserver
*/
gulp.task('webserver', function() {
  gulp.src('out')
    .pipe(webserver({
      livereload: true,
      directoryListing: true,
      open: true,
      path: 'out',
    }));
});


/*
  https://www.browsersync.io/docs/gulp/
*/
gulp.task('serve-watch-css',['concat-css'], function() {
    browserSync.reload();
});
gulp.task('serve-watch-js',['scripts'], function() {
    browserSync.reload();
});
gulp.task('serve-watch-jade',['jade'], function() {
    browserSync.reload();
});

gulp.task('serve',['concat-css','scripts','sprite','jade'], function () {

    // Serve files from the root of this project
    browserSync.init({
        server: {
            baseDir: "./out/"
        }
    });
    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    gulp.watch("core/assets/**/*.scss", ['serve-watch-css']);
    gulp.watch("core/assets/**/*.js", ['serve-watch-js']);
    gulp.watch("core/jade/*.jade", ['serve-watch-jade']);
});

/* tasks */
gulp.task('css',function() {
  gulp.watch("core/assets/**/*.scss", ['concat-css']);
}
gulp.task('js',function() {
  gulp.watch("core/assets/**/*.js", ['scripts']);
}
gulp.task('js-css',function() {
  gulp.watch("core/assets/**/*.scss", ['concat-css']);
  gulp.watch("core/assets/**/*.js", ['scripts']);
}
gulp.task('js-css-jade',function() {
  gulp.watch("core/assets/**/*.scss", ['concat-css']);
  gulp.watch("core/assets/**/*.js", ['scripts']);
  gulp.watch("core/jade/*.jade", ['jade']);
}
gulp.task('js-css-jade-sprite',function() {
  gulp.watch("core/assets/**/*.scss", ['concat-css']);
  gulp.watch("core/assets/**/*.js", ['scripts']);
  gulp.watch("core/jade/*.jade", ['jade']);
  gulp.watch("core/assets/sprites/*.png", ['sprite']);
}
gulp.task('js-css-jade-sprite-minimg',function() {
  gulp.watch("core/assets/**/*.scss", ['concat-css']);
  gulp.watch("core/assets/**/*.js", ['scripts']);
  gulp.watch("core/jade/*.jade", ['jade']);
  gulp.watch("core/assets/sprites/*.png", ['sprite']);
  gulp.watch("core/assets/images/*", ['minimg']);
}
