import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('otps')
export class OtpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'email_verification' | 'password_reset'

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @Column({ type: 'varchar', nullable: true })
  pendingFirstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  pendingLastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  pendingHashedPassword: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  pendingRole: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
