import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Cue } from '../entities/cue.entity';
import { ChangePasswordDto } from 'src/dto/user.dto';
import * as argon2 from 'argon2';

/**
 * Service responsible for user management operations.
 * 
 * Handles CRUD operations for users, including specialized operations
 * such as password changes and user profile updates.
 */
@Injectable()
export class UsersService {
  constructor(
  @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cue)
    private readonly cueRepository: Repository<Cue>,
  ) {}

  /**
   * Creates a new user in the system.
   * 
   * Automatically assigns the default cue (free cue with price=0)
   * to the newly created user.
   * 
   * @param createUserDto - The user data to create
   * @returns The newly created user entity
   */
  async create(createUserDto: Partial<User>): Promise<User> {
    
    // Find default cue (the one with price 0)
    const defaultCue = await this.cueRepository.findOne({
      where: { price: 0 },
      order: { name: 'ASC' }
    });

    // Create user with default cue
    const user = this.userRepository.create({
      ...createUserDto,
      equippedCueId: defaultCue?.id
    });
    
    return this.userRepository.save(user);
  }

  /**
   * Finds a user by their unique ID.
   * 
   * @param id - The UUID of the user to find
   * @returns The user with the related cue or null if not found
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['cue'],
    });
  }

  /**
   * Finds a user by their username.
   * 
   * @param username - The username to search for
   * @returns The user or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  /**
   * Finds a user by their Discord ID.
   * 
   * Used for OAuth authentication with Discord.
   * 
   * @param discordId - The Discord ID to search for
   * @returns The user or null if not found
   */
  async findByDiscordId(discordId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ discordId });
  }

  /**
   * Updates a user's information.
   * 
   * @param id - The UUID of the user to update
   * @param updateUserDto - The data to update on the user
   * @returns The updated user or null if user not found
   */
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

  /**
   * Changes a user's password.
   * 
   * Verifies the current password before making the change.
   * Only allows password changes for users who registered with username/password
   * (not for OAuth users).
   * 
   * @param id - The UUID of the user
   * @param data - DTO containing the current and new password
   * @throws BadRequestException if user not found, has Discord login, or password incorrect
   */
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

  /**
   * Removes a user from the system.
   * 
   * @param id - The UUID of the user to remove
   */
  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
