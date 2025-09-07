// src/dtos/users/user.response.dto.ts
import { UserRole } from '../../../entities/user.entity';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}