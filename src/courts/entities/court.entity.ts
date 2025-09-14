import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Reservation, ReservationStatus } from '../../reservations/entities/reservation.entity';

@Entity('courts')
export class Court {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column()
  surface: string; // clay, hard, grass

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('text', { array: true, default: [] })
  amenities: string[];

  @Column({ default: 'available' })
  status: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 4.5 })
  rating: number;

  @Column({ default: 4 })
  capacity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Reservation, reservation => reservation.court)
  reservations: Reservation[];

  // Helper methods
  get isCurrentlyAvailable(): boolean {
    return this.isAvailable && this.status === 'available';
  }

  // Belirli bir tarih ve saat aralığında müsaitlik kontrolü
  isAvailableForTimeSlot(startTime: Date, endTime: Date, reservations: Reservation[]): boolean {
    if (!this.isCurrentlyAvailable) {
      return false;
    }

    // Aktif rezervasyonları kontrol et
    const activeReservations = reservations.filter(reservation => reservation.status === ReservationStatus.CONFIRMED);

    // Çakışma kontrolü
    return !activeReservations.some(reservation => {
      const reservationStart = new Date(reservation.startTime);
      const reservationEnd = new Date(reservation.endTime);

      return startTime < reservationEnd && endTime > reservationStart;
    });
  }
}
