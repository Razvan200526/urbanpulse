import type { PetMatchType } from "@server/db/schema";
import { petMatchRepository, type PetMatchRepository } from "@server/repositories/PetMatchRepository";
import { handleError } from "@server/utils/handleError";
import {isPetMatchRequestValid} from "@shared/validators/isPetMatchValid"
export class PetMatchService{

    private petMatchRepo:PetMatchRepository;

    constructor(){
        this.petMatchRepo=petMatchRepository;
    }

    async createPatMatch(data:Partial<PetMatchType>){
         const result = isPetMatchRequestValid(data);
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
              this.petMatchRepo.create(result.data);
    }

    async getPetMatchById(id:string):Promise<PetMatchType|null>{
        try{
         return await this.petMatchRepo.getOne(id);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }
   async getAllPetMatch(){
      try{
      return await this.petMatchRepo.getAll();
   }
   catch(error){
      handleError(error);
      return null;
   }
   }

   async updatePetMatch(id:string,data:Partial<PetMatchType>){
    try{
         return await this.petMatchRepo.update(id,data);
      }
      catch(error){
         handleError(error);
         return null;
      }
   }

   async deletePetMatch(id:string):Promise<boolean>{
    try{
         await this.petMatchRepo.delete(id);
         return true;
      }
      catch(error){
         handleError(error);
         return false;
      }
   }
}

export const petMatchService=new PetMatchService;