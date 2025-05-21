import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cue } from '../entities/cue.entity';
import { PlayerStats } from '../entities/player-stats.entity';
import { User } from 'src/entities/user.entity';
import { CueShopResponse } from '@shared/cue.types';
import { DEFAULT_CUES, POINTS_PER_LOSS, POINTS_PER_WIN } from 'src/config/cues.config';

/**
 * Service responsible for managing cue-related operations in the pool game.
 * Handles cue shop data, cue unlocking, and cue equipping functionality.
 */
@Injectable()
export class CueService {
  
  /**
   * Creates an instance of the CueService.
   * Initializes default cues in the database if they don't exist.
   * 
   * @param cueRepository - Repository for cue entities
   * @param userRepository - Repository for user entities
   * @param playerStatsRepository - Repository for player statistics entities
   */
  constructor(
    @InjectRepository(Cue)
    private cueRepository: Repository<Cue>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlayerStats)
    private playerStatsRepository: Repository<PlayerStats>
  ) { 
    
    this.cueRepository.count().then((count) => {

      if (count)
        return;

      this.cueRepository.save(
        DEFAULT_CUES
      ).then((cues) => {
        this.userRepository.updateAll({
          equippedCueId: cues[0].id
        });
      });
      
    });

  }


  /**
   * Retrieves the cue shop data for a specific user.
   * Includes information about cues, their prices, unlock status,
   * equipped status, player points, and point rewards.
   * 
   * @param userId - ID of the user requesting the shop data
   * @returns CueShopResponse containing cues and player point information
   */
  async getCueShop(userId: string): Promise<CueShopResponse> {
    
    const [cues, user, playerStats] = await Promise.all([
      this.cueRepository.find({ order: { price: 'ASC' } }),
      this.userRepository.findOne({ where: { id: userId } }),
      this.playerStatsRepository.findOne({ where: { userId } })
    ]);

    return {
      cues: cues.map(cue => ({
        id: cue.id,
        name: cue.name,
        image: cue.image,
        price: cue.price,
        description: cue.description,
        isUnlocked: cue.price === 0 || playerStats && playerStats.points >= cue.price,
        isEquipped: cue.id === user.equippedCueId || user.equippedCueId === null && cue.price === 0
      })),
      playerPoints: playerStats ? playerStats.points : 0,
      pointsPerWin: POINTS_PER_WIN,
      pointsPerLoss: POINTS_PER_LOSS,
    };
  }

  /**
   * Equips a specific cue for a user if they have enough points to unlock it.
   * 
   * @param userId - ID of the user equipping the cue
   * @param cueId - ID of the cue to equip
   * @throws NotFoundException if the cue or player stats are not found
   * @throws BadRequestException if the user doesn't have enough points or if the cue is already equipped
   */
  async equipCue(userId: string, cueId: string): Promise<void> {
    
    const [cue, user, playerStats] = await Promise.all([
      this.cueRepository.findOne({ where: { id: cueId } }),
      this.userRepository.findOne({ where: { id: userId } }),
      this.playerStatsRepository.findOne({ where: { userId } })
    ]);

    if (!cue) {
      throw new NotFoundException(
        'Cue not found.'
      );
    }

    if (!playerStats) {
      throw new NotFoundException(
        'Player stats not found.'
      );
    }

    // Check if player has enough points
    if (playerStats.points < cue.price) {
      throw new BadRequestException(
        'Not enough points to unlock this cue.'
      );
    }

    if (user.equippedCueId === cueId) {
      throw new BadRequestException(
        'This cue is already equipped.'
      );
    }

    user.equippedCueId = cueId;
    this.userRepository.save(user);
  }
}
