import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateTaskStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: any;
}