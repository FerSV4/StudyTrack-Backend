import { IsString, IsNotEmpty, IsOptional, IsNumberString } from 'class-validator';

export class CreateSubjectDto {
  @IsNumberString()
  @IsNotEmpty()
  termId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  colorCode?: string;
}