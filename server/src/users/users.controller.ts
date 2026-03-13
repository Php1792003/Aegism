import {
    Controller, Get, Post, Body, Patch, Param, Delete,
    UseGuards, Request, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    getProfile(@Request() req) {
        const userId = req.user?.sub || req.user?.id || req.user?.userId;
        if (!userId) throw new Error('User ID not found in token payload');
        return this.usersService.getProfile(userId);
    }

    @Post('avatar')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: './uploads/avatars',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, 'avatar-' + uniqueSuffix + extname(file.originalname));
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new Error('Chỉ chấp nhận file ảnh!'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
        const userId = req.user?.sub || req.user?.id || req.user?.userId;
        const avatarUrl = `/uploads/avatars/${file.filename}`;
        await this.usersService.updateAvatar(userId, avatarUrl);
        return { avatarUrl };
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto, @Request() req) {
        return this.usersService.create(createUserDto, req.user.tenantId);
    }

    @Get()
    findAll(@Request() req) {
        return this.usersService.findAll(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.usersService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
        return this.usersService.update(id, updateUserDto, req.user.tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.usersService.remove(id, req.user.tenantId);
    }
}
