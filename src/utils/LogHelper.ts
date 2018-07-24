import * as winston from "winston";

export class LogHelper {
    public static log(level: LogLevel, message: string, ...meta: any[]): void {
        winston.log(`${LogLevel[level].toLowerCase()}`, message, meta);
    }

    public static error(message: string, ...meta: any[]): void {
        LogHelper.log(LogLevel.Error, message, meta);
    }
}

export enum LogLevel {
    Error,
    Warn,
    Info,
    Verbose,
    Debug
}
