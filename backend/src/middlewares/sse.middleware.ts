import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export let subscribers: any[] = [];

const topic = ['init-connection', 'message'];

// Middleware for GET /events endpoint
export function eventsHandler(req: Request, res: Response, next: NextFunction) {
    // Mandatory headers and http status to keep connection open
    const headers = {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    // After client opens connection send uuid (process Id)
    const processId = uuidv4().substring(0, 8);
    const initSubscribeData = {
        processId,
        startProcessAt: Date.now(),
        type: topic[0]
    };
    // ! Important: \n\n is so important for send data
    const data = `data: ${JSON.stringify(initSubscribeData)}\n\n`;
    res.write(data);

    // Generate subscriber data bind process id with HTTP response object
    const newSubscriber = {
        processId,
        res
    };
    subscribers.push(newSubscriber);

    // When process closes connection we update the subscriber list
    // avoiding the disconnected one
    req.on('close', () => {
        console.log(`${processId} connection closed`);
        subscribers = subscribers.filter(s => s.processId !== processId);
    });
}

export async function sendEventToSubscriber(req: Request, res: Response, next: NextFunction) {
    const { message, isAllPublish } = req.body;
    if (!message) {
        res.status(400).json({ status: 400, message: 'Message is required' });
    }

    // Create message to send data.
    const event = {
        message,
        type: topic[1]
    };

    const { processId } = req.body;
    // If Process Id not found, Then check is isAllPublish flag
    if (!processId) {
        if (!isAllPublish) {
            res.status(400).json({
                status: 400,
                message: `Can't send data. some fields are required.`
            });
        } else {
            return sendEventToAllSubscriber(event);
        }

    }

    //Find the subcriber. If not will make Not found response
    const processSubscriber = subscribers.find(s => s.processId === processId);
    if (!processSubscriber) {
        res.status(404).send({ status: 404, message: 'Process not found' });
    }

    const { res: subscriberResponse } = processSubscriber;
    // Send to subscriber who match processId
    // ! Important: \n\n is so important for send data
    subscriberResponse.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function sendEventToAllSubscriber(event: any) {
    // ! Important: \n\n is so important for send data
    subscribers.forEach(s => s.res.write(`data: ${JSON.stringify(event)}\n\n`));
}

export async function closeConnection(req: Request, res: Response) {
    const { id: processId } = req.params;
    if (!processId) {
        res.status(400).send({ status: 400, message: 'Process Id is required' });
    }
    const processSubscriber = subscribers.find(s => s.processId === processId);
    if (!processSubscriber) {
        res.status(404).send({ status: 404, message: 'Process not found' });
    }
    console.log(`${processId} connection closed`);
    subscribers = subscribers.filter(s => s.processId !== processId);
    res.status(200).json({
        status: 200,
        message: `Close connection on process id : ${processId} success`
    });
}
