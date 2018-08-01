import { safeLoad } from 'js-yaml';

export class Converter {
    public static toJson(obj: any): string {
        if (obj) {
            return JSON.stringify(obj);
        }

        return '{}';
    }

    public static fromJson(text: string): any {
        if (text) {
            return JSON.parse(text);
        }

        return null;
    }

    public static fromYml(text: string): any {
        if (text) {
            return safeLoad(text);
        }

        return null;
    }
}