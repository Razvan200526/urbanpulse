import type { MessageType } from "@server/db/schema";
import { messageRepository, type MessageRepository } from "@server/repositories/MessageRepository";
import { handleError } from "@server/utils/handleError";
import {isMessageRequestValid} from "@shared/validators/isMessageValid";

export class MessageService{
    private messageRepo:MessageRepository;

    constructor(){
        this.messageRepo=messageRepository;
    }

    async createMessage(data:Partial<MessageType>){
        const result = isMessageRequestValid(data);
              try{
               
              if(result.error){
                 handleError(result.error);
                return null;}
               if (!result.success) return null;
              }
              catch (error){
                 handleError(error);
              }
              if(result.data==null) return null;
              this.messageRepo.create(result.data);
    }

    async getMessageById(id:string):Promise<MessageType|null>{
         try{
         return await this.messageRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllMessage(){
      try{
      return await this.messageRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
    }

    async updateMessage(id:string,data:Partial<MessageType>){
         try{
         return await this.messageRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
    }

    async deleteMessage(id:string):Promise<boolean>{
try{
         await this.messageRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
    }
}
export const messageService=new MessageService;