import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
declare const JWTStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JWTStrategy extends JWTStrategy_base {
    private readonly config;
    constructor(config: ConfigService);
    validate(payload: {
        id: string;
        email: string;
        name: string;
    }): {
        userId: string;
        email: string;
        name: string;
    };
}
export {};
