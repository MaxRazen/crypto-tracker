import express from 'express';
import { Express, json } from 'express';
import { homePageHandler } from './handlers';

export class WebServer {
    private server: Express;

    constructor(private port: string) {
        this.server = express();
    }

    public registerRoutes(): WebServer {
        this.server.get('/', homePageHandler);

        // this.server.get('/', (req: Request, res: Response) => {
        //     res.send('*** Server is working ***')
        // });

        // this.server.post('/rules', (req: Request, res: Response) => {
            // res.sendStatus(201);
        // })

        // server.listen(cfg.port, () => {
        //     console.log('App is now running on: :' + cfg.port)
        // });

        // todo

        return this;
    }

    // blocking call
    public start(): void {
        this.server.listen(this.port);
    }
}