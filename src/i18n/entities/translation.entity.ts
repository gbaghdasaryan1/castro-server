// src/i18n/entities/translation.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('translations')
@Index(['key', 'lang'], { unique: true })
export class TranslationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  key: string; // e.g. "nav.home", "hero.title"

  @Column({ type: 'varchar', length: 10 })
  lang: string; // "hy" | "ru" | "en"

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  namespace: string; // "common", "auth", "profile"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
