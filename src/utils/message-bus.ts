import { EventEmitter } from 'events';
import {
  AgentMessage,
  MessageType,
  MessagePriority,
  AgentType,
  MessageHandler,
  MessageFilter,
  MessageRoute,
  MessageStats
} from '../types/workflow-orchestrator-types';

export class MessageBus extends EventEmitter {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private routes: Map<string, MessageRoute> = new Map();
  private messageQueue: AgentMessage[] = [];
  private processing = false;
  private stats: MessageStats = {
    totalMessages: 0,
    processedMessages: 0,
    failedMessages: 0,
    averageProcessingTime: 0,
    messagesByType: new Map(),
    messagesByPriority: new Map(),
    messagesByAgent: new Map()
  };

  constructor() {
    super();
    this.startMessageProcessing();
  }

  registerHandler(
    agentType: AgentType | 'orchestrator',
    messageType: MessageType,
    handler: MessageHandler
  ): void {
    const key = `${agentType}:${messageType}`;
    const handlers = this.handlers.get(key) || [];
    handlers.push(handler);
    this.handlers.set(key, handlers);
    this.emit('handler:registered', { agentType, messageType });
  }

  unregisterHandler(
    agentType: AgentType | 'orchestrator',
    messageType: MessageType,
    handler: MessageHandler
  ): void {
    const key = `${agentType}:${messageType}`;
    const handlers = this.handlers.get(key) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      if (handlers.length === 0) {
        this.handlers.delete(key);
      } else {
        this.handlers.set(key, handlers);
      }
      this.emit('handler:unregistered', { agentType, messageType });
    }
  }

  addRoute(route: MessageRoute): void {
    this.routes.set(route.id, route);
    this.emit('route:added', route);
  }

  removeRoute(routeId: string): void {
    this.routes.delete(routeId);
    this.emit('route:removed', routeId);
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    // Validate message
    if (!this.validateMessage(message)) {
      throw new Error(`Invalid message: ${message.id}`);
    }

    // Check TTL
    if (message.ttl && this.isMessageExpired(message)) {
      this.stats.failedMessages++;
      throw new Error(`Message expired: ${message.id}`);
    }

    // Apply routing rules
    const routedMessage = this.applyRouting(message);
    
    // Add to queue with priority ordering
    this.insertMessageByPriority(routedMessage);
    this.updateStats(routedMessage, 'queued');
    
    this.emit('message:queued', routedMessage);
  }

  async sendRequest(
    from: AgentType | 'orchestrator',
    to: AgentType | 'orchestrator',
    payload: any,
    timeout: number = 30000
  ): Promise<any> {
    const message: AgentMessage = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      from,
      to,
      type: MessageType.TASK_REQUEST,
      payload,
      priority: MessagePriority.HIGH,
      ttl: timeout
    };

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout: ${message.id}`));
      }, timeout);

      const responseHandler = (response: AgentMessage) => {
        if (response.replyTo === message.id) {
          clearTimeout(timeoutId);
          if (response.type === MessageType.TASK_RESPONSE) {
            resolve(response.payload);
          } else if (response.type === MessageType.ERROR) {
            reject(new Error(response.payload.message || 'Task failed'));
          }
        }
      };

      this.once('message:processed', responseHandler);
      this.sendMessage(message);
    });
  }

  async broadcastMessage(
    from: AgentType | 'orchestrator',
    messageType: MessageType,
    payload: any,
    targets?: (AgentType | 'orchestrator')[]
  ): Promise<void> {
    const recipients = targets || [
      AgentType.MOBILE_ANALYSIS,
      AgentType.COMPONENT_GENERATOR,
      AgentType.PERFORMANCE_OPTIMIZER,
      AgentType.TESTING,
      'orchestrator'
    ];

    const promises = recipients
      .filter(target => target !== from)
      .map(target => {
        const message: AgentMessage = {
          id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          from,
          to: target,
          type: messageType,
          payload,
          priority: MessagePriority.MEDIUM
        };
        return this.sendMessage(message);
      });

    await Promise.all(promises);
  }

  filterMessages(filter: MessageFilter): AgentMessage[] {
    return this.messageQueue.filter(message => {
      if (filter.agentType && message.from !== filter.agentType && message.to !== filter.agentType) {
        return false;
      }
      if (filter.messageType && message.type !== filter.messageType) {
        return false;
      }
      if (filter.priority && message.priority !== filter.priority) {
        return false;
      }
      if (filter.timeRange) {
        const messageTime = message.timestamp.getTime();
        if (messageTime < filter.timeRange.start.getTime() || 
            messageTime > filter.timeRange.end.getTime()) {
          return false;
        }
      }
      return true;
    });
  }

  getMessageStats(): MessageStats {
    return { ...this.stats };
  }

  clearMessageQueue(): void {
    const clearedCount = this.messageQueue.length;
    this.messageQueue = [];
    this.emit('queue:cleared', clearedCount);
  }

  pauseProcessing(): void {
    this.processing = false;
    this.emit('processing:paused');
  }

  resumeProcessing(): void {
    this.processing = true;
    this.emit('processing:resumed');
    this.processNextMessage();
  }

  private startMessageProcessing(): void {
    this.processing = true;
    this.processNextMessage();
  }

  private async processNextMessage(): Promise<void> {
    if (!this.processing || this.messageQueue.length === 0) {
      return;
    }

    const message = this.messageQueue.shift();
    if (!message) {
      return;
    }

    const startTime = Date.now();
    
    try {
      await this.processMessage(message);
      this.updateStats(message, 'processed');
      this.emit('message:processed', message);
    } catch (error) {
      this.updateStats(message, 'failed');
      this.emit('message:failed', { message, error });
      
      // Send error response if this was a request
      if (message.type === MessageType.TASK_REQUEST && message.replyTo) {
        const errorResponse: AgentMessage = {
          id: `error_${Date.now()}`,
          timestamp: new Date(),
          from: message.to,
          to: message.from,
          type: MessageType.ERROR,
          payload: { error: (error as Error).message },
          priority: MessagePriority.HIGH,
          replyTo: message.id
        };
        this.insertMessageByPriority(errorResponse);
      }
    }

    const processingTime = Date.now() - startTime;
    this.updateProcessingTime(processingTime);

    // Schedule next message processing
    process.nextTick(() => this.processNextMessage());
  }

  private async processMessage(message: AgentMessage): Promise<void> {
    const key = `${message.to}:${message.type}`;
    const handlers = this.handlers.get(key) || [];

    if (handlers.length === 0) {
      throw new Error(`No handlers registered for ${key}`);
    }

    // Execute all handlers for this message
    const results = await Promise.allSettled(
      handlers.map(handler => handler(message))
    );

    // Check if any handler failed
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Handler failures: ${failures.map(f => (f as PromiseRejectedResult).reason).join(', ')}`);
    }

    // If this was a request, send responses back
    if (message.type === MessageType.TASK_REQUEST) {
      const responses = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value)
        .filter(value => value !== undefined);

      if (responses.length > 0) {
        const response: AgentMessage = {
          id: `resp_${Date.now()}`,
          timestamp: new Date(),
          from: message.to,
          to: message.from,
          type: MessageType.TASK_RESPONSE,
          payload: responses.length === 1 ? responses[0] : responses,
          priority: MessagePriority.MEDIUM,
          replyTo: message.id
        };
        this.insertMessageByPriority(response);
      }
    }
  }

  private validateMessage(message: AgentMessage): boolean {
    return !!(
      message.id &&
      message.timestamp &&
      message.from &&
      message.to &&
      message.type &&
      message.priority &&
      message.payload !== undefined
    );
  }

  private isMessageExpired(message: AgentMessage): boolean {
    if (!message.ttl) return false;
    return Date.now() - message.timestamp.getTime() > message.ttl;
  }

  private applyRouting(message: AgentMessage): AgentMessage {
    for (const route of this.routes.values()) {
      if (this.matchesRoute(message, route)) {
        return {
          ...message,
          to: route.targetAgent,
          priority: route.priority || message.priority
        };
      }
    }
    return message;
  }

  private matchesRoute(message: AgentMessage, route: MessageRoute): boolean {
    if (route.sourceAgent && message.from !== route.sourceAgent) {
      return false;
    }
    if (route.messageType && message.type !== route.messageType) {
      return false;
    }
    if (route.condition && !route.condition(message)) {
      return false;
    }
    return true;
  }

  private insertMessageByPriority(message: AgentMessage): void {
    const priorityOrder = {
      [MessagePriority.CRITICAL]: 0,
      [MessagePriority.HIGH]: 1,
      [MessagePriority.MEDIUM]: 2,
      [MessagePriority.LOW]: 3
    };

    let insertIndex = 0;
    for (let i = 0; i < this.messageQueue.length; i++) {
      if (priorityOrder[message.priority] <= priorityOrder[this.messageQueue[i].priority]) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.messageQueue.splice(insertIndex, 0, message);
  }

  private updateStats(message: AgentMessage, action: 'queued' | 'processed' | 'failed'): void {
    if (action === 'queued') {
      this.stats.totalMessages++;
    } else if (action === 'processed') {
      this.stats.processedMessages++;
    } else if (action === 'failed') {
      this.stats.failedMessages++;
    }

    // Update message type stats
    const typeCount = this.stats.messagesByType.get(message.type) || 0;
    this.stats.messagesByType.set(message.type, typeCount + 1);

    // Update priority stats
    const priorityCount = this.stats.messagesByPriority.get(message.priority) || 0;
    this.stats.messagesByPriority.set(message.priority, priorityCount + 1);

    // Update agent stats
    const agentCount = this.stats.messagesByAgent.get(message.from) || 0;
    this.stats.messagesByAgent.set(message.from, agentCount + 1);
  }

  private updateProcessingTime(processingTime: number): void {
    if (this.stats.processedMessages === 1) {
      this.stats.averageProcessingTime = processingTime;
    } else {
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (this.stats.processedMessages - 1) + processingTime) / 
        this.stats.processedMessages;
    }
  }
}

export const messageBus = new MessageBus();