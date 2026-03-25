import type { PulseResponseType, PulseType, SkillType } from "@server/db/schema";
import { SkillRepository,skillRepository } from "@server/repositories/SkillRepository";
import {isSkillRequestValid} from "@shared/validators/isSkillValid"
import { logger } from "@server/utils/Logger";
import { handleError } from "@server/utils/handleError";
import { Result } from "pg";
export class SkillService {
   private skillRepo: SkillRepository;

   constructor(){
    this.skillRepo=skillRepository;
   }

   async createSkill(data: Partial<SkillType>){

       const result = isSkillRequestValid(data);
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
      this.skillRepo.create(result.data);
       
      
   }
   async getSkillById(id:string):Promise<SkillType|null>{
      try{
         return await this.skillRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllSkill(){
      try{
      return await this.skillRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
   }

   async updateSkill(id:string,data:Partial<SkillType>){
      try{
         return await this.skillRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async deleteSkill(id:string):Promise<boolean>{
      try{
         await this.skillRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
   }
}

export const skillService=new SkillService;