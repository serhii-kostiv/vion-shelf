"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_service_1 = require("../../core/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const argon2 = __importStar(require("argon2"));
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    prismaService;
    usersService;
    jwtService;
    constructor(prismaService, usersService, jwtService) {
        this.prismaService = prismaService;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async hashPassword(password) {
        return await argon2.hash(password);
    }
    async verifyPassword(password, hash) {
        return await argon2.verify(hash, password);
    }
    async register(dto) {
        const usernameExists = await this.prismaService.user.findUnique({
            where: {
                username: dto.username,
            },
        });
        if (usernameExists) {
            throw new common_1.ConflictException('Username already exists');
        }
        const emailExists = await this.prismaService.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        if (emailExists) {
            throw new common_1.ConflictException('Email already exists');
        }
        const passwordHash = await this.hashPassword(dto.password);
        const user = await this.prismaService.user.create({
            data: {
                username: dto.username,
                name: dto.name,
                email: dto.email,
                password: passwordHash,
            },
        });
        return user;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findOne(email);
        if (user) {
            const isPasswordValid = await this.verifyPassword(password, user.password);
            if (isPasswordValid) {
                return user;
            }
        }
        return null;
    }
    login(user) {
        const payload = { id: user.id, name: user.name, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map