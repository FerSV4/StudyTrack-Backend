import { Controller, Get, Post, Body, UseGuards, Req, Param, Delete } from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('terms')
@UseGuards(JwtAuthGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  create(@Req() req: any, @Body() createTermDto: CreateTermDto) {
    return this.termsService.create(req.user.userId, createTermDto);
  }

  @Get('active-tree')
  getActiveTree(@Req() req: any) {
    return this.termsService.getActiveTree(req.user.userId);
  }
  @Delete(':id')
    deleteTerm(@Req() req: any, @Param('id') id: string) {
  return this.termsService.delete(req.user.userId, id);
}
}