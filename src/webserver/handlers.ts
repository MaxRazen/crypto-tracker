import { Request, Response} from 'express';

export function homePageHandler(req: Request, resp: Response): void {
    resp.send('this is home page');
}

export function createRule(req: Request, resp: Response): void {

}

export function listRules(req: Request, resp: Response): void {

}

export function getRule(req: Request, resp: Response): void {

}

export function updateRule(req: Request, resp: Response): void {

}

export function deleteRule(req: Request, resp: Response): void {

}
