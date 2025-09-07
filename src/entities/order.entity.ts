// src/entities/order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ nullable: true })
  stripeSessionId?: string;

  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  // Inside your Order class

  @Column({ nullable: true })
  shippingFirstName?: string;

  @Column({ nullable: true })
  shippingLastName?: string;

  @Column({ nullable: true })
  shippingEmail?: string;

  @Column({ nullable: true })
  shippingPhone?: string;

@Column({ nullable: true })
shippingAddress?: string;

@Column({ nullable: true })
shippingCity?: string;

@Column({ nullable: true })
shippingState?: string;

@Column({ nullable: true })
shippingZipCode?: string;

@Column({ nullable: true })
shippingCountry?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}