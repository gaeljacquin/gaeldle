import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsersDto } from './dto/create-users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsersDto) {
    const salt = await bcrypt.genSalt();
    const password = data.password;
    const hashedPassword = await bcrypt.hash(password, salt);
    data = { ...data, password: hashedPassword };

    const user = await this.prisma.users.create({ data });

    return user;
  }

  async findOne(username: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
    });

    return user;
  }
}
