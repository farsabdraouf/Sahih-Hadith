const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const docs = require('./docs');
const hadithSearchRouter = require('./routes/hadithSearch.routes');
const sharhSearchRouter = require('./routes/sharhSearch.routes');
const mohdithSearchRouter = require('./routes/mohdithSearch.routes');
const bookSearchRouter = require('./routes/bookSearch.routes');
const dataRouter = require('./routes/data.routes');
const config = require('./config/config');
const path = require('path');

const app = express();
app.use(cors());
app.use(
  rateLimit({
    windowMs: config.rateLimitEach,
    max: config.rateLimitMax,
    message: 'Rate limit exceeded. Please try again later.',
    handler: (req, res, next, option) => {
      res.status(429).json({
        status: 'error',
        message: option.message,
      });
    },
  }),
);

// التغيير هنا: استخدام متغير البيئة PORT أو القيمة الافتراضية 3000
const port = process.env.PORT || 3000;

// Middleware لخدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// to delete elements from hadith text or not
// including this `<span class="search-keys">...</span>`
app.use((req, res, next) => {
  req.isRemoveHTML = req.query.removehtml || true;
  req.isRemoveHTML =
    req.query.removehtml?.toLowerCase() === 'false' ? false : true;
  next();
});

// specialist value can be true or false
app.use((req, res, next) => {
  req.isForSpecialist = req.query.specialist || false;
  req.isForSpecialist =
    req.query.specialist?.toLowerCase() === 'true' ? true : false;

  // tab use in dorar site search
  req.tab = req.isForSpecialist ? 'specialist' : 'home';
  next();
});

// set default page
app.use((req, res, next) => {
  req.query.page ||= 1;
  req.query.page = +req.query.page;
  next();
});

app.get('/', (req, res, next) => {
  res.status(302).redirect('/docs');
});
app.get('/docs', docs);

app.use('/v1', hadithSearchRouter);
app.use('/v1', sharhSearchRouter);
app.use('/v1', mohdithSearchRouter);
app.use('/v1', bookSearchRouter);
app.use('/v1', dataRouter);

app.get('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'There is no router for this url, Please check /docs',
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({
    status: 'error',
    message: err.message,
  });
});

// التغيير هنا: استخدام app.listen بدون تحديد عنوان IP
app.listen(port, () =>
  console.log(`Server is running on port ${port}`),
);