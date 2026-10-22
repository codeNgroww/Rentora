import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    const data = await this.authService.login(body);
    return {
      success: true,
      data,
    };
  }

  @Get('me')
  async getCurrentUser(@CompanyId() companyId: string) {
    const data = this.authService.getCurrentUser(companyId);
    return {
      success: true,
      data,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
