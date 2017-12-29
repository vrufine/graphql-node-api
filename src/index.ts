import app from './app';
import db from './models';
import * as http from 'http';
import { normalizePort, onListening, onError } from './utils/utils';

const server = http.createServer(app);
const port = normalizePort(process.env.PORT || 3000);

db.sequelize
  .sync()
  .then(() => {
    server.listen(port);
    server.on('error', onError(server));
    server.on('listening', onListening(server));
    console.log(`Detected NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Detected JWT_SECRET: ${process.env.JWT_SECRET}`);
  })
  .catch(err => console.log(err));
