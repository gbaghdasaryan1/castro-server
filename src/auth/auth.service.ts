import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { OtpEntity } from './entities/otp.entity';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OtpEntity)
    private readonly otpRepo: Repository<OtpEntity>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    try {
      await this.sendOtp(user.email, 'email_verification');
    } catch {
      await this.usersService.delete(user.id);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    return { message: 'Verification code sent to your email' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    let otp: OtpEntity;
    try {
      otp = await this.validateOtp(dto.email, dto.code, 'email_verification');
    } catch (e) {
      void this.notifySecurityAlert(dto.email, 'incorrect_otp');
      throw e;
    }

    await this.otpRepo.update(otp.id, { used: true });
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    await this.usersService.update(user.id, { isVerified: true });
    return { accessToken: this.issueToken(user.id, user.email) };
  }

  async signin(dto: SigninDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      void this.notifySecurityAlert(dto.email, 'failed_login');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) throw new UnauthorizedException('Email not verified');
    return { accessToken: this.issueToken(user.id, user.email) };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Always return the same message to prevent email enumeration
    if (user) await this.sendOtp(dto.email, 'password_reset');
    return { message: 'If this email exists, a reset code was sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let otp: OtpEntity;
    try {
      otp = await this.validateOtp(dto.email, dto.code, 'password_reset');
    } catch (e) {
      void this.notifySecurityAlert(dto.email, 'incorrect_otp');
      throw e;
    }

    await this.otpRepo.update(otp.id, { used: true });
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.update(user.id, { password: hashed });
    return { message: 'Password updated successfully' };
  }

  async getCurrentUser(user: any) {
    const found = await this.usersService.findById(user.sub);
    if (!found) throw new NotFoundException('User not found');
    return {
      id: found.id,
      email: found.email,
      firstName: found.firstName,
      lastName: found.lastName,
    };
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const user = await this.usersService.findOrCreateByGoogle(googleUser);
    return { accessToken: this.issueToken(user.id, user.email) };
  }

  private async sendOtp(
    email: string,
    type: 'email_verification' | 'password_reset',
  ) {
    await this.otpRepo
      .createQueryBuilder()
      .update(OtpEntity)
      .set({ used: true })
      .where('email = :email AND type = :type AND used = false', {
        email,
        type,
      })
      .execute();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.otpRepo.save(
      this.otpRepo.create({ email, code, type, expiresAt }),
    );
    await this.mailService.sendOtp(email, code, type);
  }

  private async notifySecurityAlert(
    email: string,
    type: 'incorrect_otp' | 'failed_login',
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Don't send to non-existent emails
    await this.mailService.sendSecurityAlert(email, type).catch(() => {});
  }

  private async validateOtp(
    email: string,
    code: string,
    type: 'email_verification' | 'password_reset',
  ): Promise<OtpEntity> {
    const otp = await this.otpRepo.findOne({
      where: { email, code, type, used: false },
      order: { createdAt: 'DESC' },
    });
    if (!otp) throw new BadRequestException('Invalid or expired code');
    if (new Date() > otp.expiresAt) {
      await this.otpRepo.update(otp.id, { used: true });
      throw new BadRequestException('Code has expired');
    }
    return otp;
  }

  private issueToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
