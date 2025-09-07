// src/entities/address.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  export enum AddressType {
    SHIPPING = 'shipping',
    BILLING = 'billing',
  }
  
  @Entity('addresses')
  export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'enum', enum: AddressType, default: AddressType.SHIPPING })
    type: AddressType;
  
    @Column()
    firstName: string;
  
    @Column()
    lastName: string;
  
    @Column({ nullable: true })
    company?: string;
  
    @Column()
    address: string;
  
    @Column({ nullable: true })
    address2?: string;
  
    @Column()
    city: string;
  
    @Column()
    state: string;
  
    @Column()
    zipCode: string;
  
    @Column()
    country: string;
  
    @Column({ default: false })
    isDefault: boolean;
  
    @Column()
    userId: string;
  
    @ManyToOne(() => User, user => user.addresses)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    // Helper method to get full name
    getFullName(): string {
      return `${this.firstName} ${this.lastName}`;
    }
  
    // Helper method to get full address
    getFullAddress(): string {
      let fullAddress = this.address;
      if (this.address2) {
        fullAddress += `, ${this.address2}`;
      }
      fullAddress += `, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
      return fullAddress;
    }
  }