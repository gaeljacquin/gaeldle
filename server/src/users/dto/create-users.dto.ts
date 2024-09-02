import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateUsersDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  password: string;

  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}
