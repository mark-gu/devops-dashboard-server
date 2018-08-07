import * as request from 'request-promise-native';
import * as cheerio from 'cheerio';
import { parseString } from 'xml2js';
import { LogHelper, LogLevel } from "./LogHelper";

export class RequestHelper {
    public static get<T>(uri: string, headers: any): Promise<T | null> {
        const contentType = headers['Content-Type'];

        return request.get({
            headers: headers,
            uri: uri
        }).then(body => {
            let result: T | null;

            const content = (body || {}).trim();
            try {
                if (content.startsWith('<?xml') || contentType.endsWith('/xml')) {
                    result = RequestHelper._parseXml(content);
                } else if (content.startsWith('<!DOCTYPE html>') || contentType.endsWith('/html')) {
                    result = RequestHelper._parseHtml(content);
                } else {
                    result = RequestHelper._parseJson(content);
                }
            } catch (e) {
                LogHelper.log(LogLevel.Error, e);
                result = null;
            }

            return <T>result;
        }).catch(reason => {
            LogHelper.log(LogLevel.Error, reason.error, reason);
            return null;
        });
    }

    private static _parseXml(content: string): any {
        let result: any;

        parseString(content, {
            explicitArray: false
        }, (err, obj) => {
            if (err) {
                throw new Error(`Unable to parse XML content: ${err}`);
            }

            result = obj;
        });

        return result;
    }

    private static _parseHtml(content: string): any {
        return cheerio.load(content);
    }

    private static _parseJson(content: string): any {
        return JSON.parse(content);
    }
}

export class ResponseHelper {
    public static json(response: any, data: any): void {
        response.setHeader('Content-Type', 'application/json');
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.send(data || {});
    }
}
