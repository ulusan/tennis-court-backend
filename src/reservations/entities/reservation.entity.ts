import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Court } from '../../courts/entities/court.entity';

export enum ReservationStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  courtId: string;

  @ManyToOne(() => User, user => user.reservations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Court, court => court.reservations)
  @JoinColumn({ name: 'courtId' })
  court: Court;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  get isCancelled(): boolean {
    return this.status === ReservationStatus.CANCELLED;
  }

  get duration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  get durationInMinutes(): number {
    return Math.floor(this.duration / (1000 * 60));
  }

  get durationInHours(): number {
    return Math.floor(this.duration / (1000 * 60 * 60));
  }
}
