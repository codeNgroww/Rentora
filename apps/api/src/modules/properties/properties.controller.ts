import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { Property, Unit } from '@rental-saas/contracts';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CreateUnitDto } from './dto/create-unit.dto';

@Controller()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('properties')
  async listProperties(
    @CompanyId() companyId: string,
    @Query('search') search?: string,
    @Query('emirate') emirate?: string
  ) {
    const data = await this.propertiesService.listProperties(companyId, search, emirate);
    return {
      success: true,
      data,
    };
  }

  @Post('properties')
  async createProperty(
    @CompanyId() companyId: string,
    @Body() dto: CreatePropertyDto
  ) {
    const data = await this.propertiesService.createProperty(dto, companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('properties/:id')
  async getProperty(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.propertiesService.getProperty(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('properties/:id')
  async updateProperty(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Property>
  ) {
    const data = await this.propertiesService.updateProperty(id, body, companyId);
    return {
      success: true,
      data,
    };
  }

  @Delete('properties/:id')
  async deleteProperty(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.propertiesService.deleteProperty(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('properties/:id/units')
  async listUnitsForProperty(
    @Param('id') propId: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.propertiesService.listUnitsForProperty(propId, companyId);
    return {
      success: true,
      data,
    };
  }

  @Post('properties/:id/units')
  async createUnit(
    @Param('id') propId: string,
    @CompanyId() companyId: string,
    @Body() dto: CreateUnitDto
  ) {
    const data = await this.propertiesService.createUnit(propId, dto, companyId);
    return {
      success: true,
      data,
    };
  }

  @Get('units')
  async listAllUnits(
    @CompanyId() companyId: string,
    @Query('propertyId') propId?: string
  ) {
    const data = await this.propertiesService.listAllUnits(companyId, propId);
    return {
      success: true,
      data,
    };
  }

  @Get('units/:id')
  async getUnit(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.propertiesService.getUnit(id, companyId);
    return {
      success: true,
      data,
    };
  }

  @Patch('units/:id')
  async updateUnit(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Body() body: Partial<Unit>
  ) {
    const data = await this.propertiesService.updateUnit(id, body, companyId);
    return {
      success: true,
      data,
    };
  }

  @Delete('units/:id')
  async deleteUnit(
    @Param('id') id: string,
    @CompanyId() companyId: string
  ) {
    const data = await this.propertiesService.deleteUnit(id, companyId);
    return {
      success: true,
      data,
    };
  }
}
