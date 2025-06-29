import { BaseAstrologyChatController } from './base/BaseAstrologyChatController';
import { westernChatService } from '../services/WesternChatService';

export class WesternChatController extends BaseAstrologyChatController {
  constructor() {
    super(westernChatService, 'WESTERN');
  }
}

export const westernChatController = new WesternChatController();