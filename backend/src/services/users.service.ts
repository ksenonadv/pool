import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ChangePasswordDto } from 'src/dto/user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async findByDiscordId(discordId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ discordId });
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User | null> {
    
    const user = await this.userRepository.findOneBy({ 
      id 
    });

    if (!user) {
      return null;
    }

    Object.assign(
      user, 
      updateUserDto
    );

    return this.userRepository.save(
      user
    );
  }

  public async changePassword(id: string, data: ChangePasswordDto): Promise<void> {
    
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new BadRequestException(
        'User not found'
      );
    }

    if (user.discordId) {
      throw new BadRequestException(
        'You cannot change your password.'
      );
    }

    const passwordMatches = await argon2.verify(
      user.password, 
      data.currentPassword
    );

    if (!passwordMatches) {
      throw new BadRequestException(
        'Current password is incorrect'
      );
    }

    const hash = await argon2.hash(
      data.password
    );

    user.password = hash;
    await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
