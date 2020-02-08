import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

// Server-Sent Events middlewares
import { eventsHandler, sendEventToSubscriber, subscribers, closeConnection } from './middlewares/sse.middleware';

const app = express();
const PORT = 8000;

// Setup middlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Define endpoints
app.get('/events', eventsHandler);
app.get('/status', (req: Request, res: Response) => res.json({ clients: subscribers.length }));
app.post('/publishs', sendEventToSubscriber);
app.delete('/closes/:id', closeConnection)


app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
