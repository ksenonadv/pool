import { Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { MainProcessMessageType, WorkerProcessMessage } from 'src/game/ipc.types';
import { ShootEventData } from '@shared/socket.types';

/**
 * Injectable service that manages the physics simulation
 */
@Injectable()
export class PhysicsService {
  private worker: Worker;
  private messageHandler: (message: WorkerProcessMessage) => void;
  
  /**
   * Initialize the physics worker
   */
  public initialize(messageHandler: (message: WorkerProcessMessage) => void): void {
    
    this.messageHandler = messageHandler;
    
    this.worker = new Worker(join(__dirname, 'worker', 'index.js'));
    this.worker.on('message', this.messageHandler);
    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
    });
    
    this.worker.postMessage({
      type: MainProcessMessageType.INIT
    });
  }
  
  /**
   * Sends a shoot event to the physics worker
   */
  public shoot(payload: ShootEventData): void {
    
    if (!this.worker) 
      return;
    
    this.worker.postMessage({
      type: MainProcessMessageType.SHOOT,
      payload
    });
  }
  
  /**
   * Calls the worker compute guide line function
   * @param mouseX mouse X position
   * @param mouseY mouse Y position
   */
  public computeGuideLine(mouseX: number, mouseY: number): void {
    
    if (!this.worker) 
      return;
    
    this.worker.postMessage({
      type: MainProcessMessageType.COMPUTE_GUIDE_LINE,
      payload: {
        mouseX,
        mouseY
      }
    });
  }

  /**
   * Cleans up the worker thread
   */
  public cleanup(): void {
    if (!this.worker) 
      return;
      
    this.worker.postMessage({ 
      type: MainProcessMessageType.STOP
    });
    
    this.worker.terminate();
    this.worker = null;
  }
}
