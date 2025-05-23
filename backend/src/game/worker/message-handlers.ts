import { parentPort } from "worker_threads";
import { MainProcessMessageType, MainProcessMesssage } from "../ipc.types";
import "reflect-metadata";

// Symbol key for storing message type metadata
const MESSAGE_HANDLER_METADATA = Symbol("messageHandler");

// Interface for message handler metadata with generic payload type
interface MessageHandlerMetadata<T = any> {
  messageType: MainProcessMessageType;
  methodName: string | symbol;
  payloadType?: new () => T;
}

/**
 * The context object that handlers will be called with
 */
let handlerContext: any = null;

/**
 * Class decorator that registers a class as a message handler context
 * This automatically sets the context when the class is instantiated and
 * registers all message handlers using reflection
 */
export function SupportsMessages() {
  return function<T extends { new (...args: any[]): any }>(constructor: T) {
    // Create a new class that extends the original
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        handlerContext = this;
        
        // Get metadata for all message handlers in this class
        const prototype = constructor.prototype;
        const handlerMetadata: MessageHandlerMetadata[] = Reflect.getMetadata(
          MESSAGE_HANDLER_METADATA, 
          prototype
        ) || [];
        
        // Register handlers in the message registry
        for (const metadata of handlerMetadata) {
          const originalMethod = prototype[metadata.methodName];
          
          // Add the method to the handler registry with proper context binding
          registerMessageHandler(
            metadata.messageType, 
            originalMethod.bind(this)
          );
        }
      }
    };
  };
}

// Message handler registry - maps message types to handler functions
const messageHandlerRegistry = new Map<MainProcessMessageType, Function>();

/**
 * Register a message handler function for a specific message type
 */
function registerMessageHandler(messageType: MainProcessMessageType, handler: Function): void {
  messageHandlerRegistry.set(messageType, handler);
}

/**
 * Type-safe method decorator for registering message handlers with payload validation
 * Uses reflection to store metadata about the handler method and its parameter types
 */
export function MessageHandler<T = void>(messageType: MainProcessMessageType) {
  return function(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Get the parameter types from reflection metadata
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
    const payloadType = paramTypes.length > 0 ? paramTypes[0] : undefined;

    // Store metadata about this handler
    const existingMetadata: MessageHandlerMetadata[] = 
      Reflect.getMetadata(MESSAGE_HANDLER_METADATA, target) || [];
    
    // Add this handler's metadata with payload type information
    const newMetadata: MessageHandlerMetadata[] = [
      ...existingMetadata,
      { 
        messageType, 
        methodName: propertyKey,
        payloadType
      }
    ];
    
    // Store updated metadata on the class prototype
    Reflect.defineMetadata(
      MESSAGE_HANDLER_METADATA, 
      newMetadata, 
      target
    );
    
    return descriptor;
  };
}

parentPort.on('message', (message: MainProcessMesssage) => {
  
  const { type } = message;
  const handler = messageHandlerRegistry.get(type);
  
  if (handler) {
    try {                  
      handler((message as any).payload);
    } catch (error) {
      console.error(
        `Error handling message type ${type}:`, 
        error
      );
    }
  }
});
