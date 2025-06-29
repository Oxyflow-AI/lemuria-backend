import { BaseAstrologyChatController } from './base/BaseAstrologyChatController';
import { vedicChatService } from '../services/VedicChatService';

export class VedicChatController extends BaseAstrologyChatController {
  constructor() {
    super(vedicChatService, 'VEDIC');
  }
}

export const vedicChatController = new VedicChatController();