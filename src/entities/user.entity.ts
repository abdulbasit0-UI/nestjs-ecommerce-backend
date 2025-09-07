// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Order } from './order.entity';
import { Address } from './address.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

export interface UserPreferences {
  newsletter: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'json', nullable: true })
  preferences?: UserPreferences;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Address, address => address.user, { cascade: true })
  addresses: Address[];


  // Method to compare passwords
  async comparePassword(attempt: string): Promise<boolean> {
    const result = bcrypt.compareSync(attempt, this.password);
    return result;
  }

  // Helper methods
  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getDisplayName(): string {
    return this.name;
  }

  getAvatarUrl(): string {
    return this.avatar || '/default-avatar.png';
  }

  getPreferences(): UserPreferences {
    return this.preferences || {
      newsletter: true,
      smsNotifications: true,
      orderUpdates: true,
      promotionalEmails: true,
    };
  }
}