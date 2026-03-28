import type { QuietHoursType } from "@server/db/schema";
import { QuietHoursRepository,quietHoursRepository } from "@server/repositories/QuietHoursRepository";
import { handleError } from "@server/utils/handleError";
import {isQuietHoursRequestValid} from "@shared/validators/isQuietHoursRequestValid"
//TODO:fix the bug
export class QuietHoursService {
   private quietHourRepo: QuietHoursRepository;

   constructor(){
    this.quietHourRepo=quietHoursRepository;
   }

   async createQuietHours(data: QuietHoursType){

       const result = isQuietHoursRequestValid(data);
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
      this.quietHourRepo.create(result.data);
       
      
   }
   async getQuietHoursById(id:string):Promise<QuietHoursType|null>{
      try{
         return await this.quietHourRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllQuietHours(){
      try{
      return await this.quietHourRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
   }

   async updateQuietHours(id:string,data:Partial<QuietHoursType>){
      try{
         return await this.quietHourRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async deleteQuietHours(id:string):Promise<boolean>{
      try{
         await this.quietHourRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
   }
}

export const quietHoursService=new QuietHoursService;