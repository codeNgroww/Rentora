import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateCompanyDto, UpdateCompanyDto, UserRole } from '@rental-saas/contracts';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin/companies')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  async listCompanies() {
    const data = await this.superAdminService.listCompanies();
    return {
      success: true,
      data,
    };
  }

  @Post()
  async createCompany(@Body() dto: CreateCompanyDto) {
    const data = await this.superAdminService.createCompany(dto);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getCompany(@Param('id') id: string) {
    const data = await this.superAdminService.getCompany(id);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id')
  async updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    const data = await this.superAdminService.updateCompany(id, dto);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async deleteCompany(@Param('id') id: string) {
    const deleted = await this.superAdminService.deleteCompany(id);
    return {
      success: true,
      message: `Company "${deleted.name}" and associated records successfully deleted`,
    };
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string }
  ) {
    const { newPassword, company } = await this.superAdminService.resetPassword(id, body?.newPassword);
    return {
      success: true,
      message: `Password for ${company.pocName} (${company.pocEmail}) reset successfully`,
      newPassword,
    };
  }

  @Get(':id/users')
  async getCompanyUsers(@Param('id') companyId: string) {
    const data = await this.superAdminService.getCompanyUsers(companyId);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/users')
  async createCompanyUser(
    @Param('id') companyId: string,
    @Body() body: { userName: string; userEmail: string; role: UserRole; phone?: string; password?: string }
  ) {
    const data = await this.superAdminService.createCompanyUser(companyId, body);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id/users/:userId/role')
  async updateCompanyUserRole(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @Body() body: { role: UserRole }
  ) {
    const data = await this.superAdminService.updateCompanyUserRole(companyId, userId, body.role);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id/users/:userId')
  async deleteCompanyUser(
    @Param('id') companyId: string,
    @Param('userId') userId: string
  ) {
    const removed = await this.superAdminService.deleteCompanyUser(companyId, userId);
    return {
      success: true,
      message: `User ${removed.userName} role authorization revoked successfully`,
    };
  }
}
