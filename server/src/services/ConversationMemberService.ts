import { conversationMember, type ConversationMemberType } from "@server/db/schema";
import { conversationMemberRepository, type ConversationMemberRepository } from "@server/repositories/ConversationMemberRepository";
import { handleError } from "@server/utils/handleError";
import {isConversationMemberRequestValid} from "@shared/validators/isConversationMembersValid"

export class ConversationMemberService{

    private conversationMemberRepo:ConversationMemberRepository;

    constructor(){
        this.conversationMemberRepo=conversationMemberRepository;
    }

    async createConversationMember(data:Partial<ConversationMemberType>){

     const result = isConversationMemberRequestValid(data);
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
      this.conversationMemberRepo.create(result.data);
       
      
    }

    async getConversationMemberById(id:string):Promise<ConversationMemberType|null>{
        try{
         return await this.conversationMemberRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllConversationMember(){
      try{
      return await this.conversationMemberRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
   }

   async updateConversationMember(id:string,data:Partial<ConversationMemberType>){
    try{
         return await this.conversationMemberRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async deleteSkill(id:string):Promise<boolean>{
      try{
         await this.conversationMemberRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
   }
   }


