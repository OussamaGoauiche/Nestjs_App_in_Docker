import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enums';
import { ROLES_KEY } from './decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    //const { user } = context.switchToHttp().getRequest();
    const user = {
      name: 'Marius',
      roles:[Role.User]
  }
  console.log(user);
  return requiredRoles.some((role) => user.roles.includes(role));
  //return true ;
}
}