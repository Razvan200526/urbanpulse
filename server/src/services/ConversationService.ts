import type { ConversationType } from "@server/db/schema";
import { ConversationRepository, conversationRepository } from "@server/repositories/ConversationRepository";
import { handleError } from "@server/utils/handleError";
import {isConversationValid} from "@shared/validators/isConversationValid";

export class ConversationService{
    private conversationRepo:ConversationRepository;

    constructor(){
        this.conversationRepo=conversationRepository;
    }

    async createConversation(data:Partial<ConversationType>){
           const result = isConversationValid(data);
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
              this.conversationRepo.create(result.data);
               
    }

    async getConversationById(id:string):Promise<ConversationType|null>{
         try{
         return await this.conversationRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
    }

    async getAllConversation(){
          try{
      return await this.conversationRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
    }

    async updateConversation(id:string,data:Partial<ConversationType>){
            try{
         return await this.conversationRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
    }

    async deleteConversation(id:string):Promise<boolean>{
        try{
         await this.conversationRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
    }
}
export const conversationService= new ConversationService;