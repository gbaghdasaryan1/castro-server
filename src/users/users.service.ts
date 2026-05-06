import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const existing = await this.findByEmail(data.email!);
    if (existing) throw new ConflictException('Email already in use');
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<UserEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findOrCreateByGoogle(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    let user = await this.repo.findOne({
      where: { googleId: profile.googleId },
    });
    if (user) return user;

    user = await this.repo.findOne({ where: { email: profile.email } });
    if (user) {
      await this.repo.update(user.id, {
        googleId: profile.googleId,
        isVerified: true,
      });
      const updated = await this.repo.findOne({ where: { id: user.id } });
      return updated!;
    }

    return this.repo.save(this.repo.create({ ...profile, isVerified: true }));
  }
}
