import { Controller, Get, UseFilters } from '@nestjs/common';

import {
  CustomError,
  CustomExceptionFilter,
} from './filters/connection-exception.filter';

@Controller()
export class AppController {
  @UseFilters(new CustomExceptionFilter())
  @Get('/custom_error')
  async test() {
    throw new CustomError();
  }
}
