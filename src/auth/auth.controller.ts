import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user and send OTP to email' })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: 'Verify email with 6-digit OTP code' })
  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @ApiOperation({ summary: 'Sign in and receive a JWT access token' })
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiOperation({ summary: 'Send a password reset OTP to email' })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password using OTP code' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'Get current user information' })
  @Get('me')
  me(@Req() req: any) {
    return this.authService.getCurrentUser(req.user);
  }

  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google — no body needed
  }

  @ApiOperation({ summary: 'Google OAuth callback — returns JWT' })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken } = await this.authService.googleLogin(req.user);
    console.log(accessToken);

    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const redirectUrl = new URL('/auth/google/callback', frontendBaseUrl);
    redirectUrl.searchParams.set('token', accessToken);

    return res.redirect(redirectUrl.toString());
  }
}
