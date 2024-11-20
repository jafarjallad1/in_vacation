import express from 'express';
import 'dotenv/config';
import initapp from './src/initapp.js';

const app = express();

initapp(app,express);

const PORT = process.env.PORT // 3000 ;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

