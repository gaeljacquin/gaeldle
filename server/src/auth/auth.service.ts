import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (user && isPasswordValid) {
      const { password, ...result } = user;
      void password;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.username,
      userId: user.userId,
      roleId: user.roleId,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
