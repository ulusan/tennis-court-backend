import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profileImageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Reservation, reservation => reservation.user)
  reservations: Reservation[];

  // Helper methods
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isManager(): boolean {
    return this.role === UserRole.MANAGER || this.role === UserRole.ADMIN;
  }
}
