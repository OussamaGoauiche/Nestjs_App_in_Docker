import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {CreateUserDto, LoginUserDto, UpdatePasswordDto} from "./user.dto";
import {compare, hash} from 'bcrypt'
import {PrismaService} from "../prisma.service"
import {User} from '@prisma/client'

interface FormatLogin extends Partial<User> {
    login: string
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name)
    constructor(
        private prisma: PrismaService,
    ) {
    }

    //use by user module to change user password
    async updatePassword(payload: UpdatePasswordDto, id: number): 
      Promise<User> {
        this.logger.log('password updated', payload);
        const user = await this.prisma.user.findUnique({
            where: {id}
        });
        if (!user) {
            throw new HttpException("invalid_credentials",  
                HttpStatus.UNAUTHORIZED);
        }
        // compare passwords
        const areEqual = await compare(payload.old_password,
                                  user.password);
        if (!areEqual) {
            throw new HttpException("invalid_credentials", 
               HttpStatus.UNAUTHORIZED);
        }
        return await this.prisma.user.update({
            where: {id},
            data: {password:  await hash(payload.new_password, 10)}
        });
    }
//use by auth module to register user in database
    async create(userDto: CreateUserDto): Promise<any> {

        this.logger.log('user created', userDto);

        // // check if the user exists in the db
        const userInDb = await this.prisma.user.findFirst({
            where: {login: userDto.login}
        });
        if (userInDb) {
            throw new HttpException("user_already_exist", 
               HttpStatus.CONFLICT);
        }
         return   await this.prisma.user.create({
      data: {
        ...userDto,
       password: await hash(userDto.password, 10),
      },
    });
    }
//use by auth module to login user
    async findByLogin({login, password}: LoginUserDto):  
                                   Promise<FormatLogin> {
         this.logger.log("Login");                               
        const user = await this.prisma.user.findFirst({
            where: {login}
        });

        if (!user) {
            throw new HttpException("invalid_credentials",  
                  HttpStatus.UNAUTHORIZED);
        }

        // compare passwords
        const areEqual = await compare(password, user.password);

        if (!areEqual) {
            throw new HttpException("invalid_credentials",
                HttpStatus.UNAUTHORIZED);
        }

        const {password: p, ...rest} = user;
        return rest;
    }

    //use by auth module to get user in database
    async findByPayload({login}: any): Promise<any> {
        this.logger.log("find by payload");
        return await this.prisma.user.findFirst({
            where: {login}
        });
    }

    async emailVerification(email : string): Promise<any> {
        this.logger.log("emailVerification");
    return await this.prisma.user.updateMany({
            where: {
                login : email
            },
            data: {
                EmailIsVerified : true
            },
        });
    }

}